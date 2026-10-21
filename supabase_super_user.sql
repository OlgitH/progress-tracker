-- Super user access for My Studio.
-- A super user can see every member's goals, goal updates and Social Exchanges.
-- Run in the Supabase SQL editor. Safe to re-run.

alter table public.members add column if not exists is_super_user boolean not null default false;

-- Signed-in users can't read or change this column (members only grants select on named columns,
-- and there is no update policy), so it can only be set here in the SQL editor.

create or replace function public.is_super_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.members m
    where m.user_id = auth.uid() and m.is_super_user
  );
$$;

revoke all on function public.is_super_user() from public;
grant execute on function public.is_super_user() to authenticated;

-- Extra read access, added alongside the existing "own rows" policies.
drop policy if exists "super user reads all exchanges" on public.social_exchanges;
create policy "super user reads all exchanges" on public.social_exchanges
  for select to authenticated using (public.is_super_user());

drop policy if exists "super user reads all goals" on public.goals;
create policy "super user reads all goals" on public.goals
  for select to authenticated using (public.is_super_user());

drop policy if exists "super user reads all updates" on public.updates;
create policy "super user reads all updates" on public.updates
  for select to authenticated using (public.is_super_user());

-- Make Oliver the super user (matched on the email he signs in with).
update public.members m
set is_super_user = true
from auth.users u
where u.id = m.user_id
  and lower(u.email) in ('olly@greencrownservices.co.uk', 'olly@greencrown.studio');

-- Check: should list Oliver.
select id, full_name, user_id from public.members where is_super_user;
