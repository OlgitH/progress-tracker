-- Links Caroline Anstey and Kerri Baillie-Lane's sign-ins to their seeded records (and exchanges).
-- Safe to re-run. Run in the Supabase SQL editor, AFTER they have signed in once.
do $$
declare
  v_pattern text;
  v_me public.members;
  v_seed public.members;
begin
  foreach v_pattern in array array['caroline%anstey', 'kerri%baillie%'] loop
    -- Seeded record: no sign-in yet, has exchanges.
    select * into v_seed from public.members
    where user_id is null and lower(full_name) like v_pattern
    limit 1;

    -- Their sign-in record: linked to a user, matching name.
    select * into v_me from public.members
    where user_id is not null and lower(full_name) like v_pattern
    limit 1;

    if v_seed.id is null then
      raise notice '%: no unlinked seeded record (already merged?)', v_pattern;
    elsif v_me.id is null then
      raise notice '%: no signed-in record with a matching name. See the check list below.', v_pattern;
    else
      update public.social_exchanges set exchanger_id = v_me.id where exchanger_id = v_seed.id;
      update public.social_exchanges set exchangee_id = v_me.id where exchangee_id = v_seed.id;
      delete from public.members where id = v_seed.id;
      update public.members set full_name = v_seed.full_name where id = v_me.id;
    end if;
  end loop;
end;
$$;

-- Check: each should have a user_id and their exchanges (Caroline 4+, Kerri many).
-- Any row with a user_id but 0 exchanges and an unexpected name is a sign-in the script couldn't match.
select m.id, m.full_name, u.email, m.user_id is not null as signed_in,
       (select count(*) from public.social_exchanges s where m.id in (s.exchanger_id, s.exchangee_id)) as exchanges
from public.members m
left join auth.users u on u.id = m.user_id
where m.user_id is not null or lower(m.full_name) similar to '%(anstey|baillie)%'
order by m.full_name;
