-- Phase 2 — Kỉ niệm + "Tối nay ăn gì?" (phần A)
-- Nguồn: docs/design/backend/database-schema.md mục 7, 11, 13
--        docs/features/p2-eat-tonight.md mục 6

-- ============================================================
-- 1. KỈ NIỆM
-- ============================================================

create table if not exists public.posts (
  id            uuid primary key default gen_random_uuid(),
  couple_id     uuid not null references public.couples(id) on delete cascade,
  author_id     uuid not null references public.profiles(id),
  caption       text,
  happened_on   date not null default current_date,
  place_name    text,
  place_lat     double precision,
  place_lng     double precision,
  activity      text,
  visibility    text not null default 'shared'
                check (visibility in ('shared', 'private')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

create index if not exists posts_couple_happened_idx
  on public.posts (couple_id, happened_on desc) where deleted_at is null;
create index if not exists posts_couple_created_idx
  on public.posts (couple_id, created_at desc) where deleted_at is null;

drop trigger if exists posts_touch on public.posts;
create trigger posts_touch
  before update on public.posts
  for each row execute function public.touch_updated_at();


create table if not exists public.post_media (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid not null references public.posts(id) on delete cascade,
  couple_id    uuid not null references public.couples(id) on delete cascade,
  storage_path text not null,
  media_type   text not null default 'image'
               check (media_type in ('image', 'video')),
  width        int,
  height       int,
  blurhash     text,
  position     int not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists post_media_post_idx
  on public.post_media (post_id, position);


create table if not exists public.reactions (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  couple_id  uuid not null references public.couples(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  emoji      text not null default '❤️',
  created_at timestamptz not null default now(),
  unique (post_id, user_id, emoji)
);

create index if not exists reactions_post_idx on public.reactions (post_id);


create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  couple_id  uuid not null references public.couples(id) on delete cascade,
  author_id  uuid not null references public.profiles(id),
  body       text not null check (length(trim(body)) > 0),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists comments_post_idx
  on public.comments (post_id, created_at) where deleted_at is null;


-- ============================================================
-- 2. TỐI NAY ĂN GÌ (phần A — danh sách + quay)
-- ============================================================

create table if not exists public.eat_items (
  id          uuid primary key default gen_random_uuid(),
  couple_id   uuid not null references public.couples(id) on delete cascade,
  kind        text not null default 'place' check (kind in ('dish', 'place')),
  name        text not null check (length(trim(name)) > 0),

  address     text,
  map_url     text,
  source_url  text,
  place_lat   double precision,
  place_lng   double precision,

  tags             text[] not null default '{}',
  price_hint_minor bigint,
  note             text,

  status      text not null default 'want'
              check (status in ('want', 'tried', 'archived')),

  added_by    uuid not null references public.profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create index if not exists eat_items_couple_status_idx
  on public.eat_items (couple_id, status) where deleted_at is null;
create index if not exists eat_items_tags_idx
  on public.eat_items using gin (tags);

drop trigger if exists eat_items_touch on public.eat_items;
create trigger eat_items_touch
  before update on public.eat_items
  for each row execute function public.touch_updated_at();


create table if not exists public.eat_visits (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references public.couples(id) on delete cascade,
  item_id    uuid not null references public.eat_items(id) on delete cascade,
  post_id    uuid references public.posts(id) on delete set null,
  visited_on date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists eat_visits_item_idx
  on public.eat_visits (item_id, visited_on desc);
create index if not exists eat_visits_couple_idx
  on public.eat_visits (couple_id, visited_on desc);


-- ============================================================
-- 3. RLS — bật cho mọi bảng mới, không sót cái nào
-- ============================================================

alter table public.posts       enable row level security;
alter table public.post_media  enable row level security;
alter table public.reactions   enable row level security;
alter table public.comments    enable row level security;
alter table public.eat_items   enable row level security;
alter table public.eat_visits  enable row level security;

drop policy if exists posts_read   on public.posts;
drop policy if exists posts_insert on public.posts;
drop policy if exists posts_update on public.posts;
drop policy if exists posts_delete on public.posts;

create policy posts_read on public.posts for select
  using (public.is_member_of(couple_id));
create policy posts_insert on public.posts for insert
  with check (public.can_write_to(couple_id) and author_id = auth.uid());
create policy posts_update on public.posts for update
  using (author_id = auth.uid() and public.can_write_to(couple_id))
  with check (author_id = auth.uid() and public.can_write_to(couple_id));
create policy posts_delete on public.posts for delete
  using (author_id = auth.uid() and public.can_write_to(couple_id));

drop policy if exists media_read  on public.post_media;
drop policy if exists media_write on public.post_media;

create policy media_read on public.post_media for select
  using (public.is_member_of(couple_id));
create policy media_write on public.post_media for all
  using (public.can_write_to(couple_id))
  with check (public.can_write_to(couple_id));

drop policy if exists reactions_read  on public.reactions;
drop policy if exists reactions_write on public.reactions;

create policy reactions_read on public.reactions for select
  using (public.is_member_of(couple_id));
create policy reactions_write on public.reactions for all
  using (user_id = auth.uid() and public.can_write_to(couple_id))
  with check (user_id = auth.uid() and public.can_write_to(couple_id));

drop policy if exists comments_read   on public.comments;
drop policy if exists comments_insert on public.comments;
drop policy if exists comments_update on public.comments;

create policy comments_read on public.comments for select
  using (public.is_member_of(couple_id));
create policy comments_insert on public.comments for insert
  with check (public.can_write_to(couple_id) and author_id = auth.uid());
create policy comments_update on public.comments for update
  using (author_id = auth.uid() and public.can_write_to(couple_id))
  with check (author_id = auth.uid() and public.can_write_to(couple_id));

drop policy if exists eat_items_read  on public.eat_items;
drop policy if exists eat_items_write on public.eat_items;

create policy eat_items_read on public.eat_items for select
  using (public.is_member_of(couple_id));
create policy eat_items_write on public.eat_items for all
  using (public.can_write_to(couple_id))
  with check (public.can_write_to(couple_id));

drop policy if exists eat_visits_read  on public.eat_visits;
drop policy if exists eat_visits_write on public.eat_visits;

create policy eat_visits_read on public.eat_visits for select
  using (public.is_member_of(couple_id));
create policy eat_visits_write on public.eat_visits for all
  using (public.can_write_to(couple_id))
  with check (public.can_write_to(couple_id));


-- ============================================================
-- 4. STORAGE — bucket riêng tư `couple-media`
-- Đường dẫn file: <couple_id>/<post_id>/<tên file>
-- ============================================================

insert into storage.buckets (id, name, public)
values ('couple-media', 'couple-media', false)
on conflict (id) do nothing;

drop policy if exists "media read"   on storage.objects;
drop policy if exists "media upload" on storage.objects;
drop policy if exists "media delete" on storage.objects;

create policy "media read" on storage.objects for select
  using (
    bucket_id = 'couple-media'
    and public.is_member_of(((storage.foldername(name))[1])::uuid)
  );

create policy "media upload" on storage.objects for insert
  with check (
    bucket_id = 'couple-media'
    and public.can_write_to(((storage.foldername(name))[1])::uuid)
  );

create policy "media delete" on storage.objects for delete
  using (
    bucket_id = 'couple-media'
    and public.can_write_to(((storage.foldername(name))[1])::uuid)
  );


-- ============================================================
-- 5. QUAY CÓ LUẬT — chọn quán ngẫu nhiên
-- Luật: bỏ quán vừa ghé trong `p_cooldown_days` ngày,
--       ưu tiên quán chưa thử bao giờ.
-- docs/features/p2-eat-tonight.md
-- ============================================================

create or replace function public.spin_eat(
  p_couple_id uuid,
  p_cooldown_days int default 14,
  p_limit int default 12
)
returns table (id uuid, name text, kind text, address text, map_url text, never_tried boolean)
language sql stable security definer set search_path = public as $$
  with recent as (
    select v.item_id
    from public.eat_visits v
    where v.couple_id = p_couple_id
      and v.visited_on > current_date - p_cooldown_days
  )
  select i.id, i.name, i.kind, i.address, i.map_url,
         (i.status = 'want') as never_tried
  from public.eat_items i
  where i.couple_id = p_couple_id
    and i.deleted_at is null
    and i.status <> 'archived'
    and i.id not in (select item_id from recent)
    and public.is_member_of(p_couple_id)
  -- chưa thử bao giờ thì lên trước, trong mỗi nhóm thì ngẫu nhiên
  order by (i.status = 'want') desc, random()
  limit p_limit;
$$;

grant execute on function public.spin_eat(uuid, int, int) to authenticated;


-- ============================================================
-- 6. REALTIME — bình luận và thả tim hiện ngay ở máy kia
-- ============================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'comments'
  ) then
    alter publication supabase_realtime add table public.comments;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'reactions'
  ) then
    alter publication supabase_realtime add table public.reactions;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'posts'
  ) then
    alter publication supabase_realtime add table public.posts;
  end if;
end $$;
