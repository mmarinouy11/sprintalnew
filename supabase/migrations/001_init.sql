-- =============================================================================
-- Sprintal — core schema (migration 001)
--
-- Idempotent: safe to run repeatedly on a fresh or existing Supabase instance.
--   - tables       -> create table if not exists
--   - functions    -> create or replace
--   - triggers     -> drop trigger if exists + create
--   - policies     -> drop policy if exists + create
--
-- Security posture (architectural rules #1, #2):
--   - RLS is enabled on EVERY table.
--   - The ONLY policies are SELECT policies scoped to org membership.
--   - There are deliberately NO insert/update/delete policies, so those are
--     denied by default for the `anon` / `authenticated` roles. All mutations
--     go through /app/api routes using the service_role key, which bypasses
--     RLS (service_role has BYPASSRLS in Supabase).
-- =============================================================================

create extension if not exists pgcrypto; -- gen_random_uuid()

-- Legacy cleanup (spec section 9): drop the old org_areas table if present.
drop table if exists org_areas;

-- -----------------------------------------------------------------------------
-- Shared helper: auto-maintain updated_at on UPDATE.
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =============================================================================
-- Tables
-- =============================================================================

-- Organizations: 4-level hierarchy (L1 root -> L4). Plan lives on the L1 root;
-- always resolve it via get_root_org() (rule #3), never trust a sub-org.
create table if not exists public.organizations (
  id                     uuid primary key default gen_random_uuid(),
  name                   text not null,
  slug                   text not null unique,
  parent_org_id          uuid references public.organizations (id) on delete cascade,
  level                  int  not null default 1 check (level between 1 and 4),
  plan                   text not null default 'trial',
  brand_color            text not null default '#5C6AC4',
  locale                 text not null default 'en' check (locale in ('en', 'es', 'pt')),
  trial_ends_at          timestamptz,
  paddle_customer_id     text,
  paddle_subscription_id text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index if not exists organizations_parent_org_id_idx
  on public.organizations (parent_org_id);

-- Membership: which users belong to which org, and with what role.
create table if not exists public.members (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  role       text not null check (role in ('owner', 'admin', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, user_id)
);
create index if not exists members_user_id_idx on public.members (user_id);
create index if not exists members_org_id_idx on public.members (org_id);

-- Sprints: the cadence unit within an org.
create table if not exists public.sprints (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations (id) on delete cascade,
  name          text not null,
  status        text not null default 'planned' check (status in ('planned', 'active', 'closed')),
  start_date    date,
  end_date      date,
  duration_days int,
  closed_at     timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists sprints_org_id_idx on public.sprints (org_id);

-- Bets: the strategic unit inside a sprint.
create table if not exists public.bets (
  id                uuid primary key default gen_random_uuid(),
  sprint_id         uuid not null references public.sprints (id) on delete cascade,
  org_id            uuid not null references public.organizations (id) on delete cascade,
  title             text not null,
  hypothesis        text,
  kill_criteria     text,
  scale_trigger     text,
  leading_indicators text[] not null default '{}',
  bet_type          text not null default 'strategic' check (bet_type in ('strategic', 'enabler')),
  status            text not null default 'draft'
                      check (status in ('draft', 'active', 'scaled', 'pivoted', 'done', 'killed')),
  signal            text check (signal in ('strong', 'unclear', 'weak')),
  parent_alert      boolean not null default false,
  created_by        uuid references auth.users (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists bets_sprint_id_idx on public.bets (sprint_id);
create index if not exists bets_org_id_idx on public.bets (org_id);

-- Bet alignments: parent/child links across the bet graph.
create table if not exists public.bet_alignments (
  id            uuid primary key default gen_random_uuid(),
  parent_bet_id uuid not null references public.bets (id) on delete cascade,
  child_bet_id  uuid not null references public.bets (id) on delete cascade,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (parent_bet_id, child_bet_id),
  check (parent_bet_id <> child_bet_id)
);
create index if not exists bet_alignments_parent_idx on public.bet_alignments (parent_bet_id);
create index if not exists bet_alignments_child_idx on public.bet_alignments (child_bet_id);

-- Signal checks: append-only log of signal readings on a bet.
create table if not exists public.signal_checks (
  id         uuid primary key default gen_random_uuid(),
  bet_id     uuid not null references public.bets (id) on delete cascade,
  signal     text not null check (signal in ('strong', 'unclear', 'weak')),
  note       text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists signal_checks_bet_id_idx on public.signal_checks (bet_id);

-- Strategic reviews: append-only log of decisions on a bet.
create table if not exists public.strategic_reviews (
  id               uuid primary key default gen_random_uuid(),
  bet_id           uuid not null references public.bets (id) on delete cascade,
  decision         text not null
                     check (decision in ('keep_active', 'scale', 'pivot', 'done', 'kill')),
  rationale        text,
  evidence_summary text,
  created_by       uuid references auth.users (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists strategic_reviews_bet_id_idx on public.strategic_reviews (bet_id);

-- Evidence: supporting notes/sources attached to a bet.
create table if not exists public.evidence (
  id         uuid primary key default gen_random_uuid(),
  bet_id     uuid not null references public.bets (id) on delete cascade,
  source     text,
  note       text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists evidence_bet_id_idx on public.evidence (bet_id);

-- Notifications: per-user, scoped to an org.
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  org_id     uuid not null references public.organizations (id) on delete cascade,
  type       text not null,
  priority   text not null default 'info' check (priority in ('info', 'important', 'urgent')),
  payload    jsonb not null default '{}'::jsonb,
  read_at    timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists notifications_user_id_idx on public.notifications (user_id);
create index if not exists notifications_org_id_idx on public.notifications (org_id);

-- Coach usage: metering for AI coach credits.
create table if not exists public.coach_usage (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  coach        text not null check (coach in ('formulation', 'semantic')),
  credits_used int  not null default 0,
  called_at    timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists coach_usage_org_id_idx on public.coach_usage (org_id);

-- Invites: pending org invitations by email + token.
create table if not exists public.invites (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  email       text not null,
  role        text not null check (role in ('owner', 'admin', 'editor', 'viewer')),
  token       text not null unique,
  expires_at  timestamptz not null,
  accepted_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists invites_org_id_idx on public.invites (org_id);

-- -----------------------------------------------------------------------------
-- updated_at triggers (one per table).
-- -----------------------------------------------------------------------------
do $$
declare
  t text;
  tables text[] := array[
    'organizations', 'members', 'sprints', 'bets', 'bet_alignments',
    'signal_checks', 'strategic_reviews', 'evidence', 'notifications',
    'coach_usage', 'invites'
  ];
begin
  foreach t in array tables loop
    execute format('drop trigger if exists set_updated_at on public.%I;', t);
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at();', t);
  end loop;
end $$;

-- =============================================================================
-- Functions / RPCs
-- =============================================================================

-- Membership helper used by RLS policies. SECURITY DEFINER so it reads
-- `members` without re-triggering RLS (which would recurse on the members
-- policy). search_path is pinned to keep the definer context safe.
create or replace function public.is_member_of(target_org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.members m
    where m.org_id = target_org_id
      and m.user_id = auth.uid()
  );
$$;

-- Membership-via-bet helper for tables that reference a bet but not an org.
create or replace function public.is_member_of_bet(target_bet_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.is_member_of((select b.org_id from public.bets b where b.id = target_bet_id));
$$;

-- count_sub_orgs: recursively count ALL descendants of root_id.
-- Server-side only (invoked via service_role); execute is revoked from the
-- app roles below so it cannot be used to probe the org tree from the client.
create or replace function public.count_sub_orgs(root_id uuid)
returns int
language sql
stable
as $$
  with recursive descendants as (
    select id from public.organizations where parent_org_id = root_id
    union all
    select o.id
    from public.organizations o
    join descendants d on o.parent_org_id = d.id
  )
  select count(*)::int from descendants;
$$;

-- get_root_org: walk parent_org_id up to the L1 root and return that org row
-- (rule #3 — plan is always read from the root).
create or replace function public.get_root_org(org_id uuid)
returns public.organizations
language sql
stable
as $$
  with recursive chain as (
    select * from public.organizations where id = org_id
    union all
    select o.*
    from public.organizations o
    join chain c on o.id = c.parent_org_id
    where c.parent_org_id is not null
  )
  select * from chain where parent_org_id is null limit 1;
$$;

-- =============================================================================
-- Row Level Security
-- =============================================================================

alter table public.organizations   enable row level security;
alter table public.members          enable row level security;
alter table public.sprints          enable row level security;
alter table public.bets             enable row level security;
alter table public.bet_alignments   enable row level security;
alter table public.signal_checks    enable row level security;
alter table public.strategic_reviews enable row level security;
alter table public.evidence         enable row level security;
alter table public.notifications    enable row level security;
alter table public.coach_usage      enable row level security;
alter table public.invites          enable row level security;

-- SELECT policies — members can read rows belonging to orgs they are in.
-- No INSERT/UPDATE/DELETE policies exist by design (mutations = service_role).

drop policy if exists organizations_select_members on public.organizations;
create policy organizations_select_members on public.organizations
  for select to authenticated
  using (public.is_member_of(id));

drop policy if exists members_select_members on public.members;
create policy members_select_members on public.members
  for select to authenticated
  using (public.is_member_of(org_id));

drop policy if exists sprints_select_members on public.sprints;
create policy sprints_select_members on public.sprints
  for select to authenticated
  using (public.is_member_of(org_id));

drop policy if exists bets_select_members on public.bets;
create policy bets_select_members on public.bets
  for select to authenticated
  using (public.is_member_of(org_id));

drop policy if exists bet_alignments_select_members on public.bet_alignments;
create policy bet_alignments_select_members on public.bet_alignments
  for select to authenticated
  using (
    public.is_member_of_bet(parent_bet_id)
    or public.is_member_of_bet(child_bet_id)
  );

drop policy if exists signal_checks_select_members on public.signal_checks;
create policy signal_checks_select_members on public.signal_checks
  for select to authenticated
  using (public.is_member_of_bet(bet_id));

drop policy if exists strategic_reviews_select_members on public.strategic_reviews;
create policy strategic_reviews_select_members on public.strategic_reviews
  for select to authenticated
  using (public.is_member_of_bet(bet_id));

drop policy if exists evidence_select_members on public.evidence;
create policy evidence_select_members on public.evidence
  for select to authenticated
  using (public.is_member_of_bet(bet_id));

-- Notifications are personal: a user only ever reads their OWN rows. This is a
-- stricter subset of "orgs where they are members" and avoids leaking one
-- member's notifications to co-members.
drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists coach_usage_select_members on public.coach_usage;
create policy coach_usage_select_members on public.coach_usage
  for select to authenticated
  using (public.is_member_of(org_id));

drop policy if exists invites_select_members on public.invites;
create policy invites_select_members on public.invites
  for select to authenticated
  using (public.is_member_of(org_id));

-- =============================================================================
-- Grants
--
-- RLS gates rows; grants gate the command. `authenticated` gets SELECT only,
-- so even the row-visible tables cannot be mutated except via service_role
-- (which is granted everything and bypasses RLS). `anon` gets nothing.
-- =============================================================================
grant usage on schema public to anon, authenticated, service_role;

grant select on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;

-- Membership helpers must be callable by `authenticated` (they run inside RLS
-- policy evaluation). The org-tree RPCs must NOT be — they are server-only.
grant execute on function public.is_member_of(uuid) to authenticated, service_role;
grant execute on function public.is_member_of_bet(uuid) to authenticated, service_role;

revoke execute on function public.count_sub_orgs(uuid) from public;
revoke execute on function public.get_root_org(uuid) from public;
grant execute on function public.count_sub_orgs(uuid) to service_role;
grant execute on function public.get_root_org(uuid) to service_role;
