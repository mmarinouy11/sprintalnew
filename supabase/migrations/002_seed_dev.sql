-- =============================================================================
-- Sprintal — development seed (migration 002)   *** LOCAL DEV ONLY ***
--
-- Seeds one org + one owner member + one active sprint + one bet so the app
-- has something to render locally. Do NOT run this against production.
--
-- Idempotent: fixed UUIDs + ON CONFLICT DO NOTHING, so re-running is a no-op.
--
-- Owner user resolution:
--   1. If a user with email = current_setting('app.seed_user_email') exists,
--      that user is made owner. Pass it at runtime, e.g.:
--        psql "$DB_URL" -v ON_ERROR_STOP=1 \
--          -c "set app.seed_user_email = 'you@example.com';" \
--          -f supabase/migrations/002_seed_dev.sql
--      (Wire SEED_USER_EMAIL -> that GUC in your local seed script.)
--   2. Otherwise a dev user (default email dev@sprintal.test) is created in
--      auth.users. Creating auth users via raw SQL is a DEV-ONLY SHORTCUT
--      (called out per rule #8): real users come from Supabase Auth / GoTrue.
--      If the insert fails on your GoTrue schema, the seed skips the member
--      row rather than aborting.
-- =============================================================================

do $$
declare
  v_email   text := coalesce(nullif(current_setting('app.seed_user_email', true), ''), 'dev@sprintal.test');
  v_user_id uuid;
  -- Fixed IDs keep the seed idempotent and referenceable from E2E tests.
  c_user_id   constant uuid := '00000000-0000-0000-0000-0000000000aa';
  c_org_id    constant uuid := '00000000-0000-0000-0000-0000000000b1';
  c_sprint_id constant uuid := '00000000-0000-0000-0000-0000000000c1';
  c_bet_id    constant uuid := '00000000-0000-0000-0000-0000000000d1';
begin
  -- 1. Resolve (or create) the owner user.
  select id into v_user_id from auth.users where email = v_email;

  if v_user_id is null then
    v_user_id := c_user_id;
    begin
      insert into auth.users (
        id, instance_id, aud, role, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        raw_app_meta_data, raw_user_meta_data
      )
      values (
        v_user_id, '00000000-0000-0000-0000-000000000000',
        'authenticated', 'authenticated', v_email,
        crypt('sprintal-dev', gen_salt('bf')),
        now(), now(), now(),
        '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb
      )
      on conflict (id) do nothing;
    exception when others then
      raise notice 'seed: could not create auth user (%). Skipping member seed. Set SEED_USER_EMAIL to an existing user.', sqlerrm;
      v_user_id := null;
    end;
  end if;

  -- 2. Org (L1 root, trial plan).
  insert into public.organizations (id, name, slug, level, plan, trial_ends_at)
  values (c_org_id, 'Sprintal Dev', 'sprintal-dev', 1, 'trial', now() + interval '14 days')
  on conflict do nothing;

  -- 3. Owner membership (only if we have a user).
  if v_user_id is not null then
    insert into public.members (org_id, user_id, role)
    values (c_org_id, v_user_id, 'owner')
    on conflict do nothing;
  end if;

  -- 4. Active sprint.
  insert into public.sprints (id, org_id, name, status, start_date, end_date, duration_days)
  values (c_sprint_id, c_org_id, 'Sprint 1', 'active', current_date, current_date + 14, 14)
  on conflict do nothing;

  -- 5. One bet.
  insert into public.bets (
    id, sprint_id, org_id, title, hypothesis, kill_criteria, scale_trigger,
    leading_indicators, bet_type, status, signal, created_by
  )
  values (
    c_bet_id, c_sprint_id, c_org_id,
    'Simplify onboarding',
    'If we cut onboarding to three steps, week-1 activation rises.',
    'Activation stays below 5% two weeks after launch.',
    'Activation exceeds 20% two weeks after launch.',
    array['activation_rate', 'time_to_first_bet'],
    'strategic', 'active', 'unclear', v_user_id
  )
  on conflict do nothing;

  raise notice 'seed: done (owner email=%, user_id=%)', v_email, coalesce(v_user_id::text, 'none');
end $$;
