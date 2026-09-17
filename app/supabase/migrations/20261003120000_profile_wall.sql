-- Profile wall statuses + partner notes (trang cá nhân kiểu FB)
-- status ≠ Compose / posts timeline
-- note: một ghi chú dài của A về B; B chỉ đọc

create table if not exists public.profile_statuses (
  id          uuid primary key default gen_random_uuid(),
  couple_id   uuid not null references public.couples(id) on delete cascade,
  author_id   uuid not null references public.profiles(id) on delete cascade,
  body        text not null check (length(trim(body)) > 0 and char_length(body) <= 2000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create index if not exists profile_statuses_author_idx
  on public.profile_statuses (couple_id, author_id, created_at desc)
  where deleted_at is null;

drop trigger if exists profile_statuses_touch on public.profile_statuses;
create trigger profile_statuses_touch
  before update on public.profile_statuses
  for each row execute function public.touch_updated_at();

alter table public.profile_statuses enable row level security;

drop policy if exists profile_statuses_select on public.profile_statuses;
create policy profile_statuses_select on public.profile_statuses
  for select to authenticated
  using (public.is_member_of(couple_id));

drop policy if exists profile_statuses_insert on public.profile_statuses;
create policy profile_statuses_insert on public.profile_statuses
  for insert to authenticated
  with check (
    public.can_write_to(couple_id)
    and author_id = (select auth.uid())
  );

drop policy if exists profile_statuses_update on public.profile_statuses;
create policy profile_statuses_update on public.profile_statuses
  for update to authenticated
  using (
    public.is_member_of(couple_id)
    and author_id = (select auth.uid())
  )
  with check (
    public.can_write_to(couple_id)
    and author_id = (select auth.uid())
  );

-- Một dòng: author viết về about_user trong space
create table if not exists public.partner_notes (
  id             uuid primary key default gen_random_uuid(),
  couple_id      uuid not null references public.couples(id) on delete cascade,
  author_id      uuid not null references public.profiles(id) on delete cascade,
  about_user_id  uuid not null references public.profiles(id) on delete cascade,
  body           text not null default '' check (char_length(body) <= 8000),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (couple_id, author_id, about_user_id),
  check (author_id <> about_user_id)
);

create index if not exists partner_notes_about_idx
  on public.partner_notes (couple_id, about_user_id);

drop trigger if exists partner_notes_touch on public.partner_notes;
create trigger partner_notes_touch
  before update on public.partner_notes
  for each row execute function public.touch_updated_at();

alter table public.partner_notes enable row level security;

drop policy if exists partner_notes_select on public.partner_notes;
create policy partner_notes_select on public.partner_notes
  for select to authenticated
  using (public.is_member_of(couple_id));

drop policy if exists partner_notes_insert on public.partner_notes;
create policy partner_notes_insert on public.partner_notes
  for insert to authenticated
  with check (
    public.can_write_to(couple_id)
    and author_id = (select auth.uid())
  );

drop policy if exists partner_notes_update on public.partner_notes;
create policy partner_notes_update on public.partner_notes
  for update to authenticated
  using (
    public.is_member_of(couple_id)
    and author_id = (select auth.uid())
  )
  with check (
    public.can_write_to(couple_id)
    and author_id = (select auth.uid())
  );
