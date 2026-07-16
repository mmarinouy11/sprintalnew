-- =============================================================================
-- Sprintal — auth transaction functions (migration 003)
--
-- Idempotent (create or replace). These encapsulate the multi-row writes that
-- the auth API routes need to perform ATOMICALLY. They are SECURITY DEFINER
-- and are called by API routes via serviceClient(); EXECUTE is revoked from the
-- app roles so they can never be invoked straight from the client.
-- =============================================================================

-- Turn a free-text name into a URL-safe slug base.
create or replace function public.slugify(txt text)
returns text
language sql
immutable
as $$
  select coalesce(
    nullif(trim(both '-' from regexp_replace(lower(coalesce(txt, '')), '[^a-z0-9]+', '-', 'g')), ''),
    'org'
  );
$$;

-- Atomically create an L1 org on a 30-day trial + the owner membership.
-- Slug is derived from the name and made unique with a numeric suffix.
-- Returns the created organization row.
create or replace function public.create_org_with_owner(
  p_user_id uuid,
  p_org_name text
)
returns public.organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_base text := public.slugify(p_org_name);
  v_slug text := v_base;
  v_i    int  := 0;
  v_org  public.organizations;
begin
  if p_user_id is null then
    raise exception 'user_id_required';
  end if;
  if coalesce(trim(p_org_name), '') = '' then
    raise exception 'org_name_required';
  end if;

  -- Retry slug on collision (handles concurrent signups of the same name).
  loop
    begin
      insert into public.organizations (name, slug, level, plan, trial_ends_at)
      values (trim(p_org_name), v_slug, 1, 'trial', now() + interval '30 days')
      returning * into v_org;
      exit; -- inserted successfully
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

  return v_org;
end;
$$;

-- Atomically attach a user to an org from an invite token, after validating
-- the token (exists / not accepted / not expired / email matches). Returns the
-- org slug. Raises a keyword exception the API route maps to a localized error.
create or replace function public.accept_invite(
  p_token text,
  p_user_id uuid,
  p_user_email text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv  public.invites;
  v_slug text;
begin
  select * into v_inv from public.invites where token = p_token;

  if not found then
    raise exception 'invite_invalid';
  end if;
  if v_inv.accepted_at is not null then
    raise exception 'invite_invalid';
  end if;
  if v_inv.expires_at < now() then
    raise exception 'invite_expired';
  end if;
  if lower(v_inv.email) <> lower(coalesce(p_user_email, '')) then
    raise exception 'invite_email_mismatch';
  end if;

  insert into public.members (org_id, user_id, role)
  values (v_inv.org_id, p_user_id, v_inv.role)
  on conflict (org_id, user_id) do update set role = excluded.role;

  update public.invites set accepted_at = now() where id = v_inv.id;

  select slug into v_slug from public.organizations where id = v_inv.org_id;
  return v_slug;
end;
$$;

-- Server-only: revoke from app roles, grant to service_role.
revoke execute on function public.slugify(text) from public;
revoke execute on function public.create_org_with_owner(uuid, text) from public;
revoke execute on function public.accept_invite(text, uuid, text) from public;
grant execute on function public.create_org_with_owner(uuid, text) to service_role;
grant execute on function public.accept_invite(text, uuid, text) to service_role;
