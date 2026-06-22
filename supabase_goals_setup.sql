-- Run this after the auth migration. It converts updates to reference a user-owned goals table.

begin;

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

alter table public.goals enable row level security;

drop policy if exists "Users can view their own goals" on public.goals;
drop policy if exists "Users can create their own goals" on public.goals;
drop policy if exists "Users can update their own goals" on public.goals;
drop policy if exists "Users can delete their own goals" on public.goals;

create policy "Users can view their own goals"
  on public.goals
  for select
  using (auth.uid() = user_id);

create policy "Users can create their own goals"
  on public.goals
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own goals"
  on public.goals
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own goals"
  on public.goals
  for delete
  using (auth.uid() = user_id);

alter table public.updates
  add column if not exists goal_id uuid references public.goals(id) on delete restrict;

insert into public.goals (user_id, name)
select distinct u.user_id, u.goal
from public.updates u
where u.goal is not null and u.goal <> ''
on conflict (user_id, name) do nothing;

update public.updates u
set goal_id = g.id
from public.goals g
where g.user_id = u.user_id
  and g.name = u.goal
  and u.goal_id is null;

do $$
begin
  if exists (select 1 from public.updates where goal_id is null) then
    raise exception 'Some updates rows still have null goal_id. Check that goal names exist in public.goals.';
  end if;
end
$$;

alter table public.updates
  alter column goal_id set not null;

create index if not exists goals_user_id_archived_at_idx
  on public.goals (user_id, archived_at, created_at desc);

create index if not exists updates_goal_id_created_at_idx
  on public.updates (goal_id, created_at desc);

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
  with check (
    auth.uid() = user_id
    and goal_id in (select id from public.goals where user_id = auth.uid())
  );

create policy "Users can update their own updates"
  on public.updates
  for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and goal_id in (select id from public.goals where user_id = auth.uid())
  );

create policy "Users can delete their own updates"
  on public.updates
  for delete
  using (auth.uid() = user_id);

commit;