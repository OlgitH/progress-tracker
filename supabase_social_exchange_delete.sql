-- Lets the Exchangee who logged an exchange delete it. Imported (seeded) exchanges can't be deleted.
-- Safe to re-run. Run in the Supabase SQL editor.
drop policy if exists "exchangee can delete exchange" on public.social_exchanges;
create policy "exchangee can delete exchange" on public.social_exchanges
  for delete to authenticated using (
    seed_ref is null
    and exists (select 1 from public.members m where m.user_id = auth.uid() and m.id = exchangee_id)
  );

grant delete on public.social_exchanges to authenticated;
