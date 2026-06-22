-- Run this in the Supabase SQL editor after creating your initial user account.
-- 1) In the app, go to /login and click "Create Initial User".
-- 2) Replace the email below with that same email before running.

begin;

alter table public.updates
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- Backfill legacy rows to your initial user.
with initial_user as (
  select id
  from auth.users
  where email = 'olly@greencrown.studio'
  limit 1
)
update public.updates u
set user_id = iu.id
from initial_user iu
where u.user_id is null;

-- Fail fast if backfill did not assign all existing rows.
do $$
begin
  if exists (select 1 from public.updates where user_id is null) then
    raise exception 'Some updates rows still have null user_id. Check the initial user email in this script.';
  end if;
end
$$;

alter table public.updates
  alter column user_id set not null,
  alter column user_id set default auth.uid();

alter table public.updates enable row level security;

create index if not exists updates_user_id_created_at_idx
  on public.updates (user_id, created_at desc);

-- Clear old policies so only user-scoped access remains.
drop policy if exists "Users can view their own updates" on public.updates;
drop policy if exists "Users can create their own updates" on public.updates;
drop policy if exists "Users can update their own updates" on public.updates;
drop policy if exists "Users can delete their own updates" on public.updates;

create policy "Users can view their own updates"
  on public.updates
  for select
  using (auth.uid() = user_id);

create policy "Users can create their own updates"
  on public.updates
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own updates"
  on public.updates
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own updates"
  on public.updates
  for delete
  using (auth.uid() = user_id);

commit;
