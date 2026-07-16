-- =============================================================================
-- Sprintal — hierarchical org RPCs (migration 004, spec sections 2 & 2.5)
--
-- Idempotent (create or replace). All server-only: EXECUTE revoked from the app
-- roles, granted to service_role, and invoked from /api/org routes.
-- =============================================================================

-- All descendants of a root (INCLUDING the root itself), as organization rows.
create or replace function public.get_org_descendants(root_id uuid)
returns setof public.organizations
language sql
stable
as $$
  with recursive tree as (
    select * from public.organizations where id = root_id
    union all
    select o.*
    from public.organizations o
    join tree t on o.parent_org_id = t.id
  )
  select * from tree;
$$;

-- All ancestors of an org (parent, grandparent, … up to the root), EXCLUDING
-- the org itself. Order is not guaranteed — callers sort by level.
create or replace function public.get_org_ancestors(p_org_id uuid)
returns setof public.organizations
language sql
stable
as $$
  with recursive chain as (
    select * from public.organizations where id = p_org_id
    union all
    select o.*
    from public.organizations o
    join chain c on o.id = c.parent_org_id
  )
  select * from chain where id <> p_org_id;
$$;

-- Atomically create a sub-org one level below its parent + the creator's owner
-- membership. Slug is derived from the name and made unique. The new row's
-- `plan` is left at the table default and is intentionally NEVER read — plan is
-- always resolved from the root L1 org (rule #3).
--
-- This function does NOT enforce plan limits; the /api/org/create-sub route
-- enforces DEPTH_LIMITS + SUBAREAS_LIMITS via getRootPlan() + count_sub_orgs
-- before calling here (per spec). The level 1-4 CHECK is the last-resort guard.
create or replace function public.create_sub_org(
  p_parent_id uuid,
  p_user_id uuid,
  p_name text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_parent public.organizations;
  v_base   text := public.slugify(p_name);
  v_slug   text := v_base;
  v_i      int  := 0;
  v_org    public.organizations;
begin
  if coalesce(trim(p_name), '') = '' then
    raise exception 'name_required';
  end if;

  select * into v_parent from public.organizations where id = p_parent_id;
  if not found then
    raise exception 'parent_not_found';
  end if;

  loop
    begin
      insert into public.organizations (name, slug, parent_org_id, level)
      values (trim(p_name), v_slug, v_parent.id, v_parent.level + 1)
      returning * into v_org;
      exit;
    exception when unique_violation then
      v_i := v_i + 1;
      v_slug := v_base || '-' || v_i;
      if v_i > 50 then
        raise exception 'could_not_generate_unique_slug';
      end if;
    end;
  end loop;

  insert into public.members (org_id, user_id, role)
  values (v_org.id, p_user_id, 'owner');

  return v_org.slug;
end;
$$;

-- Server-only.
revoke execute on function public.get_org_descendants(uuid) from public;
revoke execute on function public.get_org_ancestors(uuid) from public;
revoke execute on function public.create_sub_org(uuid, uuid, text) from public;
grant execute on function public.get_org_descendants(uuid) to service_role;
grant execute on function public.get_org_ancestors(uuid) to service_role;
grant execute on function public.create_sub_org(uuid, uuid, text) to service_role;
