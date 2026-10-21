-- One-off fixes for data already seeded. Safe to re-run.
-- Run in the Supabase SQL editor.

-- 1. Seeded ratings/comments came from the person who received the help (the Exchangee),
--    so move them out of the Exchanger columns.
update public.social_exchanges
set value_to_exchangee = coalesce(value_to_exchangee, value_to_exchanger),
    exchangee_comments = coalesce(exchangee_comments, exchanger_comments),
    value_to_exchanger = null,
    exchanger_comments = null
where seed_ref is not null
  and (value_to_exchanger is not null or exchanger_comments is not null);

-- 2. Merge "Olly Berman" into "Oliver Berman". Keeps the record that is linked to a sign-in
--    (else the older one), moves every exchange across and fills in missing email/Slack id.
do $$
declare
  v_keep public.members;
  v_drop public.members;
begin
  select * into v_keep from public.members
  where lower(full_name) in ('oliver berman', 'olly berman')
  order by (user_id is not null) desc, created_at asc
  limit 1;

  select * into v_drop from public.members
  where lower(full_name) in ('oliver berman', 'olly berman') and id <> v_keep.id
  order by created_at asc
  limit 1;

  if v_keep.id is null or v_drop.id is null then
    raise notice 'Nothing to merge (found % record(s)).', (select count(*) from public.members where lower(full_name) in ('oliver berman', 'olly berman'));
    return;
  end if;

  update public.social_exchanges set exchanger_id = v_keep.id where exchanger_id = v_drop.id;
  update public.social_exchanges set exchangee_id = v_keep.id where exchangee_id = v_drop.id;

  -- Free the unique columns on the duplicate before copying them across.
  delete from public.members where id = v_drop.id;

  update public.members
  set full_name = 'Oliver Berman',
      user_id = coalesce(user_id, v_drop.user_id),
      email = coalesce(email, v_drop.email),
      slack_user_id = coalesce(slack_user_id, v_drop.slack_user_id),
      claimed_at = coalesce(claimed_at, v_drop.claimed_at)
  where id = v_keep.id;
end;
$$;

-- Check: should list one Oliver Berman with a user_id and 4 exchanges.
select m.id, m.full_name, m.user_id, count(s.id) as exchanges
from public.members m
left join public.social_exchanges s on m.id in (s.exchanger_id, s.exchangee_id)
where lower(m.full_name) in ('oliver berman', 'olly berman')
group by m.id;
