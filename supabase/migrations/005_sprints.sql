-- =============================================================================
-- Sprintal — sprint lifecycle (migration 005, spec sections 1.1 & 4.1)
--
-- Idempotent. Adds the hard single-active-sprint guarantee plus transactional
-- RPCs for the create/activate/close routes. Server-only (EXECUTE granted to
-- service_role only). Plan gating for close lives in the route (getRootPlan).
-- =============================================================================

-- HARD GUARANTEE: at most one active sprint per org. The routes also check, but
-- this partial unique index makes the invariant race-proof at the DB level.
create unique index if not exists sprints_one_active_per_org
  on public.sprints (org_id)
  where status = 'active';

-- Create a sprint. Status defaults to 'active' when the org has no active
-- sprint, else 'planned'. If an active sprint appears concurrently (unique index
-- fires), it falls back to 'planned'. Duration is validated by the route against
-- the org level before calling here.
create or replace function public.create_sprint(
  p_org_id   uuid,
  p_name     text,
  p_start    date,
  p_duration int
)
returns public.sprints
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_end    date := p_start + p_duration;
  v_sprint public.sprints;
begin
  if coalesce(trim(p_name), '') = '' then
    raise exception 'name_required';
  end if;
  if p_duration is null or p_duration < 1 then
    raise exception 'invalid_duration';
  end if;

  if exists (select 1 from public.sprints where org_id = p_org_id and status = 'active') then
    v_status := 'planned';
  else
    v_status := 'active';
  end if;

  begin
    insert into public.sprints (org_id, name, status, start_date, end_date, duration_days)
    values (p_org_id, trim(p_name), v_status, p_start, v_end, p_duration)
    returning * into v_sprint;
  exception when unique_violation then
    -- Another active sprint won the race — create this one as planned instead.
    insert into public.sprints (org_id, name, status, start_date, end_date, duration_days)
    values (p_org_id, trim(p_name), 'planned', p_start, v_end, p_duration)
    returning * into v_sprint;
  end;

  return v_sprint;
end;
$$;

-- Activate a planned sprint. Blocks if another active sprint exists (checked
-- explicitly and backstopped by the unique index). One-way: planned -> active.
create or replace function public.activate_sprint(p_sprint_id uuid)
returns public.sprints
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org    uuid;
  v_status text;
  v_sprint public.sprints;
begin
  select org_id, status into v_org, v_status
  from public.sprints where id = p_sprint_id;

  if not found then
    raise exception 'sprint_not_found';
  end if;
  if v_status = 'active' then
    select * into v_sprint from public.sprints where id = p_sprint_id;
    return v_sprint; -- already active, idempotent
  end if;
  if v_status <> 'planned' then
    raise exception 'invalid_transition';
  end if;
  if exists (select 1 from public.sprints where org_id = v_org and status = 'active') then
    raise exception 'active_sprint_exists';
  end if;

  update public.sprints set status = 'active'
  where id = p_sprint_id
  returning * into v_sprint;
  return v_sprint;
end;
$$;

-- Close a sprint (one-way to 'closed'). Plan gating (not on trial) is enforced
-- by the route before this is called.
create or replace function public.close_sprint(p_sprint_id uuid)
returns public.sprints
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_sprint public.sprints;
begin
  select status into v_status from public.sprints where id = p_sprint_id;
  if not found then
    raise exception 'sprint_not_found';
  end if;
  if v_status = 'closed' then
    raise exception 'already_closed';
  end if;

  update public.sprints set status = 'closed', closed_at = now()
  where id = p_sprint_id
  returning * into v_sprint;
  return v_sprint;
end;
$$;

revoke execute on function public.create_sprint(uuid, text, date, int) from public;
revoke execute on function public.activate_sprint(uuid) from public;
revoke execute on function public.close_sprint(uuid) from public;
grant execute on function public.create_sprint(uuid, text, date, int) to service_role;
grant execute on function public.activate_sprint(uuid) to service_role;
grant execute on function public.close_sprint(uuid) to service_role;
