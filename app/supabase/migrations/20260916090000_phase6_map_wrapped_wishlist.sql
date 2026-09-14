-- Phase 6 — Bản đồ dấu chân · Wrapped · Album · Xuất dữ liệu · Wishlist quà
-- Nguồn: docs/features/p6-*.md

-- ============================================================
-- 1. CHUẨN HOÁ ĐỊA ĐIỂM → TỈNH/THÀNH
-- Người dùng gõ tự do ("Sài Gòn", "tp hcm", "Q1"). Bảng này nhớ lại
-- những lần đã hỏi để lần sau tự nhận, mỗi đôi một bảng riêng.
-- ============================================================

create table if not exists public.place_aliases (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references public.couples(id) on delete cascade,
  -- chuỗi người dùng gõ, đã hạ chữ thường và bỏ dấu
  alias      text not null,
  -- mã tỉnh/thành trong lib/provinces.ts, hoặc null nếu ở nước ngoài
  province_code text,
  country    text not null default 'VN',
  created_at timestamptz not null default now(),
  unique (couple_id, alias)
);

alter table public.posts
  add column if not exists province_code text,
  add column if not exists country text;

create index if not exists posts_province_idx
  on public.posts (couple_id, province_code) where deleted_at is null;


-- ============================================================
-- 2. WRAPPED — tính một lần mỗi năm, xem lại vĩnh viễn
-- ============================================================

create table if not exists public.wrapped_reports (
  couple_id  uuid not null references public.couples(id) on delete cascade,
  year       int not null,
  payload    jsonb not null,
  created_at timestamptz not null default now(),
  primary key (couple_id, year)
);

-- Gom số liệu cả năm từ MỌI nguồn. Nhóm nào không có dữ liệu thật thì
-- giao diện bỏ hẳn — hiện số 0 còn tệ hơn không hiện gì.
create or replace function public.wrapped_stats(p_couple_id uuid, p_year int)
returns jsonb
language sql stable security definer set search_path = public as $$
  with bounds as (
    select make_date(p_year, 1, 1) as d0, make_date(p_year, 12, 31) as d1
  ),
  post_stats as (
    select count(*)::int as posts,
           count(distinct p.happened_on)::int as days_with_memory,
           count(distinct p.province_code) filter (where p.province_code is not null)::int as provinces
    from public.posts p, bounds b
    where p.couple_id = p_couple_id and p.deleted_at is null
      and p.happened_on between b.d0 and b.d1
  ),
  photo_stats as (
    select count(*)::int as photos
    from public.post_media m
    join public.posts p on p.id = m.post_id
    cross join bounds b
    where m.couple_id = p_couple_id and p.deleted_at is null
      and p.happened_on between b.d0 and b.d1
  ),
  expense_stats as (
    select coalesce(sum(e.amount_minor), 0)::bigint as total_minor,
           count(*)::int as entries
    from public.expenses e, bounds b
    where e.couple_id = p_couple_id and e.deleted_at is null
      and e.spent_on between b.d0 and b.d1
  ),
  eat_stats as (
    select count(*)::int as visits,
           count(distinct v.item_id)::int as places
    from public.eat_visits v, bounds b
    where v.couple_id = p_couple_id and v.visited_on between b.d0 and b.d1
  ),
  goal_stats as (
    select count(*)::int as done
    from public.goals g, bounds b
    where g.couple_id = p_couple_id and g.deleted_at is null
      and g.status = 'done'
      and g.completed_at::date between b.d0 and b.d1
  ),
  question_stats as (
    select count(distinct q.asked_on)::int as days_answered
    from public.question_answers q, bounds b
    where q.couple_id = p_couple_id and q.asked_on between b.d0 and b.d1
  ),
  mood_stats as (
    select count(distinct m.mood_date)::int as days_checked,
           round(avg(m.mood)::numeric, 2) as avg_mood
    from public.mood_checkins m, bounds b
    where m.couple_id = p_couple_id and m.mood_date between b.d0 and b.d1
  ),
  top_place as (
    select i.name, count(*)::int as visits
    from public.eat_visits v
    join public.eat_items i on i.id = v.item_id
    cross join bounds b
    where v.couple_id = p_couple_id and v.visited_on between b.d0 and b.d1
    group by i.name order by count(*) desc limit 1
  )
  select jsonb_build_object(
    'year', p_year,
    'posts', (select posts from post_stats),
    'photos', (select photos from photo_stats),
    'days_with_memory', (select days_with_memory from post_stats),
    'provinces', (select provinces from post_stats),
    'spend_minor', (select total_minor from expense_stats),
    'expense_entries', (select entries from expense_stats),
    'eat_visits', (select visits from eat_stats),
    'eat_places', (select places from eat_stats),
    'goals_done', (select done from goal_stats),
    'question_days', (select days_answered from question_stats),
    'mood_days', (select days_checked from mood_stats),
    'mood_avg', (select avg_mood from mood_stats),
    'top_place', (select name from top_place),
    'top_place_visits', (select visits from top_place)
  )
  where public.is_member_of(p_couple_id);
$$;

grant execute on function public.wrapped_stats(uuid, int) to authenticated;


-- ============================================================
-- 3. ALBUM — là một CÁCH XEM, không nhân bản ảnh.
-- Xoá album không đụng gì tới bài.
-- ============================================================

create table if not exists public.albums (
  id          uuid primary key default gen_random_uuid(),
  couple_id   uuid not null references public.couples(id) on delete cascade,
  title       text not null check (length(trim(title)) > 0),
  cover_post_id uuid references public.posts(id) on delete set null,
  -- 'auto_trip' | 'auto_activity' | 'manual'
  source      text not null default 'manual'
              check (source in ('auto_trip', 'auto_activity', 'manual')),
  created_by  uuid references public.profiles(id),
  created_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create table if not exists public.album_posts (
  album_id  uuid not null references public.albums(id) on delete cascade,
  post_id   uuid not null references public.posts(id) on delete cascade,
  couple_id uuid not null references public.couples(id) on delete cascade,
  position  int not null default 0,
  primary key (album_id, post_id)
);


-- Gom tự động theo chuyến: cùng tỉnh, cách nhau ≤ 2 ngày, ít nhất 3 bài.
create or replace function public.suggested_trips(p_couple_id uuid)
returns table (province_code text, start_on date, end_on date, post_count int)
language sql stable security definer set search_path = public as $$
  with ordered as (
    select p.id, p.province_code, p.happened_on,
           lag(p.happened_on) over (
             partition by p.province_code order by p.happened_on
           ) as prev_day
    from public.posts p
    where p.couple_id = p_couple_id
      and p.deleted_at is null
      and p.province_code is not null
  ),
  marked as (
    select *,
           case
             when prev_day is null or happened_on - prev_day > 2 then 1
             else 0
           end as is_new_trip
    from ordered
  ),
  grouped as (
    select *,
           sum(is_new_trip) over (
             partition by province_code order by happened_on
             rows between unbounded preceding and current row
           ) as trip_no
    from marked
  )
  select g.province_code, min(g.happened_on), max(g.happened_on), count(*)::int
  from grouped g
  where public.is_member_of(p_couple_id)
  group by g.province_code, g.trip_no
  having count(*) >= 3
  order by min(g.happened_on) desc;
$$;

grant execute on function public.suggested_trips(uuid) to authenticated;


-- ============================================================
-- 4. WISHLIST QUÀ — bất đối xứng, phần dễ sai nhất phase này
-- Nội dung: cả hai đọc được.
-- Dấu vết ("đã tính mua cái này"): CHỈ người đặt dấu đọc được.
-- Chủ wishlist mà thấy được dấu là hỏng toàn bộ tính năng.
-- ============================================================

create table if not exists public.wishlist_items (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references public.couples(id) on delete cascade,
  owner_id   uuid not null references public.profiles(id) on delete cascade,
  title      text not null check (length(trim(title)) > 0),
  url        text,
  note       text,
  price_hint_minor bigint,
  -- 'open' = còn muốn · 'archived' = thôi không cần nữa (chủ tự đổi)
  status     text not null default 'open' check (status in ('open', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists wishlist_couple_idx
  on public.wishlist_items (couple_id, owner_id);

drop trigger if exists wishlist_touch on public.wishlist_items;
create trigger wishlist_touch
  before update on public.wishlist_items
  for each row execute function public.touch_updated_at();


create table if not exists public.wishlist_marks (
  item_id    uuid not null references public.wishlist_items(id) on delete cascade,
  couple_id  uuid not null references public.couples(id) on delete cascade,
  -- người ĐẶT dấu, tức là người đi mua quà — không phải chủ wishlist
  marked_by  uuid not null references public.profiles(id) on delete cascade,
  state      text not null check (state in ('planned', 'bought')),
  note       text,
  created_at timestamptz not null default now(),
  primary key (item_id, marked_by)
);


-- ============================================================
-- 5. RLS
-- ============================================================

alter table public.place_aliases    enable row level security;
alter table public.wrapped_reports  enable row level security;
alter table public.albums           enable row level security;
alter table public.album_posts      enable row level security;
alter table public.wishlist_items   enable row level security;
alter table public.wishlist_marks   enable row level security;

drop policy if exists aliases_read  on public.place_aliases;
drop policy if exists aliases_write on public.place_aliases;
create policy aliases_read on public.place_aliases for select
  using (public.is_member_of(couple_id));
create policy aliases_write on public.place_aliases for all
  using (public.can_write_to(couple_id))
  with check (public.can_write_to(couple_id));

drop policy if exists wrapped_read  on public.wrapped_reports;
drop policy if exists wrapped_write on public.wrapped_reports;
create policy wrapped_read on public.wrapped_reports for select
  using (public.is_member_of(couple_id));
create policy wrapped_write on public.wrapped_reports for all
  using (public.can_write_to(couple_id))
  with check (public.can_write_to(couple_id));

drop policy if exists albums_read  on public.albums;
drop policy if exists albums_write on public.albums;
create policy albums_read on public.albums for select
  using (public.is_member_of(couple_id));
create policy albums_write on public.albums for all
  using (public.can_write_to(couple_id))
  with check (public.can_write_to(couple_id));

drop policy if exists album_posts_read  on public.album_posts;
drop policy if exists album_posts_write on public.album_posts;
create policy album_posts_read on public.album_posts for select
  using (public.is_member_of(couple_id));
create policy album_posts_write on public.album_posts for all
  using (public.can_write_to(couple_id))
  with check (public.can_write_to(couple_id));


-- ---- Wishlist: nội dung chung ----
drop policy if exists wishlist_read   on public.wishlist_items;
drop policy if exists wishlist_write  on public.wishlist_items;
create policy wishlist_read on public.wishlist_items for select
  using (public.is_member_of(couple_id));
-- Chỉ chủ mới thêm/sửa/xoá món trong wishlist của mình
create policy wishlist_write on public.wishlist_items for all
  using (owner_id = auth.uid() and public.can_write_to(couple_id))
  with check (owner_id = auth.uid() and public.can_write_to(couple_id));


-- ---- Wishlist marks: CHỈ người đặt dấu đọc được ----
-- Không có "or is_member_of" ở đây. Thêm vào là hỏng cả tính năng.
drop policy if exists marks_own on public.wishlist_marks;
create policy marks_own on public.wishlist_marks for all
  using (marked_by = auth.uid() and public.is_member_of(couple_id))
  with check (
    marked_by = auth.uid()
    and public.can_write_to(couple_id)
    -- không tự đánh dấu món của chính mình: vô nghĩa, và là đường rò rỉ
    and exists (
      select 1 from public.wishlist_items w
      where w.id = item_id and w.owner_id <> auth.uid()
    )
  );


-- ============================================================
-- 6. CHỦ WISHLIST BỎ MỘT MÓN
--
-- Cạm bẫy: hàm này KHÔNG được trả về ai đã đánh dấu món đó. Space chỉ có
-- hai người, nên "có người đã đánh dấu" đồng nghĩa với "người kia đã tính
-- mua cho mình" — đúng cái điều mà cả tính năng này sinh ra để giấu.
-- Vì vậy hàm chỉ đổi trạng thái, không trả gì.
--
-- Người kia biết được là nhờ chính máy họ: họ đọc được dấu của mình, thấy
-- món đã chuyển `archived` thì hiện cảnh báo. Không có đường nào chạy
-- ngược về phía chủ wishlist.
-- ============================================================

create or replace function public.archive_wish(p_item_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_owner uuid;
begin
  select owner_id into v_owner
  from public.wishlist_items where id = p_item_id;

  if v_owner is null or v_owner <> auth.uid() then
    raise exception 'Không phải món trong wishlist của bạn';
  end if;

  update public.wishlist_items set status = 'archived' where id = p_item_id;
end $$;

grant execute on function public.archive_wish(uuid) to authenticated;


-- ============================================================
-- 7. NHẬT KÝ XUẤT DỮ LIỆU — dùng để giới hạn 1 lần/giờ
-- ============================================================

create table if not exists public.export_runs (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references public.couples(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists export_runs_user_idx
  on public.export_runs (user_id, created_at desc);

alter table public.export_runs enable row level security;

drop policy if exists export_runs_own on public.export_runs;
create policy export_runs_own on public.export_runs for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
