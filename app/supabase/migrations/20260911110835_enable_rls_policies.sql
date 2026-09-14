-- ============================================================
-- PHẦN 10: PHÂN QUYỀN DÒNG (RLS) — bảng nền Phase 1
-- (Các bảng posts/events/... bật RLS khi tạo ở phase sau)
-- ============================================================

alter table public.profiles       enable row level security;
alter table public.couples        enable row level security;
alter table public.couple_members enable row level security;
alter table public.invites        enable row level security;


-- ---- profiles ----
create policy profiles_read on public.profiles for select
  using (
    id = auth.uid()
    or exists (
      select 1 from public.couple_members me
      join public.couple_members other on other.couple_id = me.couple_id
      where me.user_id = auth.uid() and me.left_at is null
        and other.user_id = profiles.id and other.left_at is null
    )
  );

create policy profiles_update_self on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());


-- ---- couples ----
create policy couples_read on public.couples for select
  using (public.is_member_of(id));

create policy couples_update on public.couples for update
  using (public.is_member_of(id)) with check (public.is_member_of(id));


-- ---- couple_members ----
create policy members_read on public.couple_members for select
  using (public.is_member_of(couple_id));


-- ---- invites ----
create policy invites_read on public.invites for select
  using (public.is_member_of(couple_id));

create policy invites_create on public.invites for insert
  with check (public.can_write_to(couple_id) and created_by = auth.uid());
