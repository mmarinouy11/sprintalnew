-- Sprintal — initial migration (skeleton).
--
-- No domain tables yet. This migration only establishes the security posture
-- every future table must follow (architectural rule #2): RLS is ON by default,
-- and API routes reach data via the service_role key, which bypasses RLS after
-- the route has authorized the caller (rule #1).
--
-- Convention for every table added later:
--   1. `alter table <t> enable row level security;`
--   2. Deny-by-default: add explicit policies; never leave a table RLS-enabled
--      with no policy expecting the service_role to "just work" for end users.
--   3. Tenant isolation is enforced via org_id scoping in policies.

-- Enable extensions we rely on across the schema.
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Example of the RLS pattern future migrations follow. Kept commented so this
-- migration is a no-op beyond extensions, but documents the required shape.
--
-- create table public.orgs (
--   id uuid primary key default gen_random_uuid(),
--   parent_org_id uuid references public.orgs (id),
--   name text not null,
--   created_at timestamptz not null default now()
-- );
--
-- alter table public.orgs enable row level security;
--
-- -- End users only see orgs they are a member of; service_role bypasses this.
-- create policy "orgs_select_members" on public.orgs
--   for select using (
--     exists (
--       select 1 from public.memberships m
--       where m.org_id = orgs.id and m.user_id = auth.uid()
--     )
--   );
