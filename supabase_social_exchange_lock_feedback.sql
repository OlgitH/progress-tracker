-- Makes Exchanger feedback final once submitted. Safe to re-run.
-- Run in the Supabase SQL editor.
-- The Exchanger can save drafts while exchanger_responded_at is null; once it is set, no more updates.
drop policy if exists "exchanger can give feedback" on public.social_exchanges;
create policy "exchanger can give feedback" on public.social_exchanges
  for update to authenticated
  using (
    exchanger_responded_at is null
    and exists (select 1 from public.members m where m.user_id = auth.uid() and m.id = exchanger_id)
  )
  with check (exists (select 1 from public.members m where m.user_id = auth.uid() and m.id = exchanger_id));
