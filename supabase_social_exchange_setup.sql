-- Social Exchange setup for My Studio.
-- Run in the Supabase SQL editor, then run supabase_social_exchange_seed.sql.

create extension if not exists pgcrypto;

-- A member is a person (or group/organisation) who can give or receive an exchange.
-- Seeded members have no user_id until they sign in with Slack and claim the record.
create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete set null,
  full_name text not null,
  email text,
  slack_user_id text,
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists members_email_key on public.members (lower(email)) where email is not null;
create unique index if not exists members_slack_user_id_key on public.members (slack_user_id) where slack_user_id is not null;
create index if not exists members_full_name_idx on public.members (lower(full_name));

-- The Exchangee (who received help) creates the record; the Exchanger (who gave it) is then
-- notified and adds their own side. Either side is null only for seeded exchanges with a group.
create table if not exists public.social_exchanges (
  id uuid primary key default gen_random_uuid(),
  seed_ref text unique,
  exchanger_id uuid references public.members (id),
  exchangee_id uuid references public.members (id),
  hours numeric(6, 2) not null check (hours > 0),
  exchanged_on date not null,
  description text not null,
  -- Filled in by the Exchangee when they create the record.
  value_to_exchangee smallint check (value_to_exchangee between 0 and 10),
  social_value smallint check (social_value between 0 and 10),
  exchangee_comments text,
  -- Filled in later by the Exchanger.
  value_to_exchanger smallint check (value_to_exchanger between 0 and 10),
  exchanger_comments text,
  exchanger_responded_at timestamptz,
  created_at timestamptz not null default now(),
  check (exchanger_id is distinct from exchangee_id),
  check (exchanger_id is not null or exchangee_id is not null)
);

create index if not exists social_exchanges_exchanger_idx on public.social_exchanges (exchanger_id, exchanged_on desc);
create index if not exists social_exchanges_exchangee_idx on public.social_exchanges (exchangee_id, exchanged_on desc);

alter table public.members enable row level security;
alter table public.social_exchanges enable row level security;

-- Any signed-in member can see the member list (needed for the "who helped you?" picker),
-- but not other people's email or Slack id (see column grants below).
drop policy if exists "members readable by signed-in users" on public.members;
create policy "members readable by signed-in users" on public.members
  for select to authenticated using (true);

revoke select on public.members from authenticated;
grant select (id, user_id, full_name) on public.members to authenticated;

-- Members are created/claimed only through claim_member() below.

-- Exchanges are private to the two people involved.
drop policy if exists "exchanges readable by participants" on public.social_exchanges;
create policy "exchanges readable by participants" on public.social_exchanges
  for select to authenticated using (
    exists (
      select 1 from public.members m
      where m.user_id = auth.uid() and m.id in (exchanger_id, exchangee_id)
    )
  );

-- Only the Exchangee can create an exchange, and only as themselves.
drop policy if exists "exchangee can log exchange" on public.social_exchanges;
create policy "exchangee can log exchange" on public.social_exchanges
  for insert to authenticated with check (
    exists (
      select 1 from public.members m
      where m.user_id = auth.uid() and m.id = exchangee_id
    )
  );

-- The Exchanger can add their feedback, and nothing else (enforced by the column grant).
drop policy if exists "exchanger can give feedback" on public.social_exchanges;
create policy "exchanger can give feedback" on public.social_exchanges
  for update to authenticated
  using (exists (select 1 from public.members m where m.user_id = auth.uid() and m.id = exchanger_id))
  with check (exists (select 1 from public.members m where m.user_id = auth.uid() and m.id = exchanger_id));

revoke update on public.social_exchanges from authenticated;
grant update (value_to_exchanger, exchanger_comments, exchanger_responded_at)
  on public.social_exchanges to authenticated;

-- Called after Slack sign-in. Links the signed-in user to their seeded member record
-- (matched on Slack user id, then verified email), or creates a new member if none exists.
-- Identity comes from the JWT, never from arguments, so it can't be spoofed by a caller.
create or replace function public.claim_member()
returns public.members
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text := nullif(lower(auth.jwt() ->> 'email'), '');
  v_meta jsonb := coalesce(auth.jwt() -> 'user_metadata', '{}'::jsonb);
  v_slack_id text := nullif(coalesce(v_meta ->> 'https://slack.com/user_id', v_meta ->> 'provider_id'), '');
  v_name text := nullif(trim(coalesce(v_meta ->> 'full_name', v_meta ->> 'name', '')), '');
  v_member public.members;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_member from public.members where user_id = v_uid;
  if found then
    return v_member;
  end if;

  select * into v_member from public.members
  where user_id is null
    and ((v_slack_id is not null and slack_user_id = v_slack_id)
      or (v_email is not null and lower(email) = v_email))
  order by (slack_user_id = v_slack_id) desc nulls last
  limit 1;

  if found then
    update public.members
    set user_id = v_uid,
        claimed_at = now(),
        email = coalesce(email, v_email),
        slack_user_id = coalesce(slack_user_id, v_slack_id)
    where id = v_member.id
    returning * into v_member;
    return v_member;
  end if;

  insert into public.members (user_id, full_name, email, slack_user_id, claimed_at)
  values (v_uid, coalesce(v_name, v_email, 'New member'), v_email, v_slack_id, now())
  returning * into v_member;
  return v_member;
end;
$$;

revoke all on function public.claim_member() from public;
grant execute on function public.claim_member() to authenticated;

-- Lets the Exchangee look up who to notify (the Exchanger) for an exchange they created.
create or replace function public.exchange_notify_target(p_exchange_id uuid)
returns table (full_name text, email text, slack_user_id text)
language sql
stable
security definer
set search_path = public
as $$
  select er.full_name, er.email, er.slack_user_id
  from public.social_exchanges s
  join public.members ee on ee.id = s.exchangee_id and ee.user_id = auth.uid()
  join public.members er on er.id = s.exchanger_id
  where s.id = p_exchange_id;
$$;

revoke all on function public.exchange_notify_target(uuid) from public;
grant execute on function public.exchange_notify_target(uuid) to authenticated;

