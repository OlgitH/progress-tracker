-- Links the seeded "Oliver Berman" (and his exchanges) to the member created at sign-in.
-- Safe to re-run. Run in the Supabase SQL editor.
do $$
declare
  v_me public.members;
  v_seed public.members;
begin
  -- The member created when you first signed in (found via your auth email).
  select m.* into v_me
  from public.members m
  join auth.users u on u.id = m.user_id
  where lower(u.email) = 'olly@greencrown.studio';

  select * into v_seed from public.members
  where user_id is null and lower(full_name) in ('oliver berman', 'olly berman')
  limit 1;

  if v_me.id is null then
    raise exception 'No member is linked to olly@greencrown.studio. Check the list below and use that user_id instead.';
  end if;

  if v_seed.id is null then
    raise notice 'Seeded Oliver Berman is already merged.';
    return;
  end if;

  update public.social_exchanges set exchanger_id = v_me.id where exchanger_id = v_seed.id;
  update public.social_exchanges set exchangee_id = v_me.id where exchangee_id = v_seed.id;
  delete from public.members where id = v_seed.id;
  update public.members set full_name = 'Oliver Berman' where id = v_me.id;
end;
$$;

-- Check: one Oliver Berman, with a user_id and 4 exchanges.
select m.id, m.full_name, m.user_id, m.email,
       (select count(*) from public.social_exchanges s where m.id in (s.exchanger_id, s.exchangee_id)) as exchanges
from public.members m
where m.user_id is not null or lower(m.full_name) like '%berman%';
