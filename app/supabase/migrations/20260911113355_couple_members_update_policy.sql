create policy members_update_self on public.couple_members for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
