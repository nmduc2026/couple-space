-- Phase 5 — Câu hỏi mỗi ngày · Thư tương lai · Tâm trạng · Nudge · Ăn gì phần B
-- Nguồn: docs/features/p5-*.md · p2-eat-tonight.md mục 6

-- ============================================================
-- 0. Múi giờ của SPACE
-- "Hôm nay" của câu hỏi phải giống nhau ở cả hai máy, nếu không một
-- người đã sang ngày mới còn người kia thì chưa và ô mờ mở sai lúc.
-- ============================================================

alter table public.couples
  add column if not exists time_zone text not null default 'Asia/Ho_Chi_Minh';

create or replace function public.couple_today(p_couple_id uuid)
returns date
language sql stable security definer set search_path = public as $$
  select (now() at time zone coalesce(c.time_zone, 'Asia/Ho_Chi_Minh'))::date
  from public.couples c where c.id = p_couple_id;
$$;

grant execute on function public.couple_today(uuid) to authenticated;


-- ============================================================
-- 1. CÂU HỎI MỖI NGÀY
-- Kho câu hỏi nằm trong code client (lib/questions.ts) nên ở đây chỉ
-- lưu chỉ số. Đổi kho câu hỏi không phải migrate dữ liệu.
-- ============================================================

create table if not exists public.question_answers (
  id             uuid primary key default gen_random_uuid(),
  couple_id      uuid not null references public.couples(id) on delete cascade,
  user_id        uuid not null references public.profiles(id) on delete cascade,
  question_index int not null,
  asked_on       date not null,
  body           text not null check (length(trim(body)) > 0),
  edited_at      timestamptz,
  created_at     timestamptz not null default now(),
  unique (couple_id, user_id, asked_on)
);

create index if not exists question_answers_couple_idx
  on public.question_answers (couple_id, asked_on desc);


-- Câu của ngày do client tính (lib/questions.ts) rồi ghi kèm `question_index`.
-- Cố ý không nhân đôi công thức ở đây: hai bản sao sẽ lệch nhau lúc nào không hay.


-- ============================================================
-- 2. THƯ GỬI TƯƠNG LAI
-- ============================================================

create table if not exists public.letters (
  id          uuid primary key default gen_random_uuid(),
  couple_id   uuid not null references public.couples(id) on delete cascade,
  author_id   uuid not null references public.profiles(id) on delete cascade,
  title       text not null check (length(trim(title)) > 0),
  body        text not null,
  open_on     date not null,
  opened_at   timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists letters_couple_open_idx
  on public.letters (couple_id, open_on);

drop trigger if exists letters_touch on public.letters;
create trigger letters_touch
  before update on public.letters
  for each row execute function public.touch_updated_at();


-- ============================================================
-- 3. CHECK-IN TÂM TRẠNG
-- ============================================================

create table if not exists public.mood_checkins (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references public.couples(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  mood_date  date not null,
  -- 1 = tệ … 5 = rất vui
  mood       int not null check (mood between 1 and 5),
  note       text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (couple_id, user_id, mood_date)
);

create index if not exists mood_couple_date_idx
  on public.mood_checkins (couple_id, mood_date desc);

drop trigger if exists mood_touch on public.mood_checkins;
create trigger mood_touch
  before update on public.mood_checkins
  for each row execute function public.touch_updated_at();


-- ============================================================
-- 4. NUDGE — giới hạn tần suất nằm ở DB, không ở giao diện
-- ============================================================

create table if not exists public.nudges (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references public.couples(id) on delete cascade,
  from_user  uuid not null references public.profiles(id) on delete cascade,
  to_user    uuid not null references public.profiles(id) on delete cascade,
  kind       text not null check (kind in ('miss', 'home', 'eat', 'love')),
  created_at timestamptz not null default now()
);

create index if not exists nudges_from_idx on public.nudges (from_user, created_at desc);


-- ============================================================
-- 5. ĂN GÌ — phần B: đánh giá
-- (eat_visits đã tạo ở Phase 2)
-- ============================================================

alter table public.eat_visits
  add column if not exists expense_id uuid references public.expenses(id) on delete set null;

create table if not exists public.eat_ratings (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references public.couples(id) on delete cascade,
  visit_id   uuid not null references public.eat_visits(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  verdict    text not null check (verdict in ('love', 'ok', 'nope')),
  note       text,
  created_at timestamptz not null default now(),
  unique (visit_id, user_id)
);


-- ============================================================
-- 6. RLS
-- ============================================================

alter table public.question_answers enable row level security;
alter table public.letters          enable row level security;
alter table public.mood_checkins    enable row level security;
alter table public.nudges           enable row level security;
alter table public.eat_ratings      enable row level security;

-- ---- Câu hỏi mỗi ngày: che cho tới khi CẢ HAI cùng trả lời ----
-- Đây là policy quan trọng nhất phase này. Che bằng CSS thì mở DevTools
-- là đọc được; phải chặn ở tầng dữ liệu.
drop policy if exists answers_read   on public.question_answers;
drop policy if exists answers_write  on public.question_answers;
drop policy if exists answers_update on public.question_answers;

create policy answers_read on public.question_answers for select
  using (
    public.is_member_of(couple_id)
    and (
      user_id = auth.uid()
      or exists (
        select 1 from public.question_answers mine
        where mine.couple_id = question_answers.couple_id
          and mine.user_id = auth.uid()
          and mine.asked_on = question_answers.asked_on
      )
    )
  );

create policy answers_write on public.question_answers for insert
  with check (public.can_write_to(couple_id) and user_id = auth.uid());

-- Sửa được trong 24 giờ, sau đó khoá
create policy answers_update on public.question_answers for update
  using (
    user_id = auth.uid()
    and public.can_write_to(couple_id)
    and created_at > now() - interval '24 hours'
  )
  with check (user_id = auth.uid());


-- ---- Thư tương lai: trước ngày mở thì không đọc được nội dung ----
-- Người viết luôn đọc lại được thư của mình.
drop policy if exists letters_read   on public.letters;
drop policy if exists letters_insert on public.letters;
drop policy if exists letters_update on public.letters;
drop policy if exists letters_delete on public.letters;

create policy letters_read on public.letters for select
  using (
    public.is_member_of(couple_id)
    and (
      author_id = auth.uid()
      or open_on <= public.couple_today(couple_id)
    )
  );

create policy letters_insert on public.letters for insert
  with check (public.can_write_to(couple_id) and author_id = auth.uid());

-- Sửa/xoá trước ngày mở; sau ngày mở thì khoá vĩnh viễn
create policy letters_update on public.letters for update
  using (
    author_id = auth.uid()
    and public.can_write_to(couple_id)
    and open_on > public.couple_today(couple_id)
  )
  with check (author_id = auth.uid());

create policy letters_delete on public.letters for delete
  using (
    author_id = auth.uid()
    and public.can_write_to(couple_id)
    and open_on > public.couple_today(couple_id)
  );


-- Danh sách thư chưa mở: chỉ metadata, KHÔNG có `body`.
create or replace function public.locked_letters(p_couple_id uuid)
returns table (
  id uuid, author_id uuid, title text, open_on date, days_away int
)
language sql stable security definer set search_path = public as $$
  select l.id, l.author_id, l.title, l.open_on,
         (l.open_on - public.couple_today(p_couple_id))::int
  from public.letters l
  where l.couple_id = p_couple_id
    and l.open_on > public.couple_today(p_couple_id)
    and public.is_member_of(p_couple_id)
  order by l.open_on;
$$;

grant execute on function public.locked_letters(uuid) to authenticated;


-- ---- Tâm trạng: chung, không che ----
drop policy if exists mood_read  on public.mood_checkins;
drop policy if exists mood_write on public.mood_checkins;
create policy mood_read on public.mood_checkins for select
  using (public.is_member_of(couple_id));
create policy mood_write on public.mood_checkins for all
  using (user_id = auth.uid() and public.can_write_to(couple_id))
  with check (user_id = auth.uid() and public.can_write_to(couple_id));


-- ---- Nudge: 5 lần/người/ngày, cách nhau ít nhất 10 phút.
-- Đặt luật ở policy để người dùng không lách được bằng cách gọi API thẳng.
drop policy if exists nudges_read   on public.nudges;
drop policy if exists nudges_insert on public.nudges;
create policy nudges_read on public.nudges for select
  using (public.is_member_of(couple_id));
create policy nudges_insert on public.nudges for insert
  with check (
    public.can_write_to(couple_id)
    and from_user = auth.uid()
    and (
      select count(*) from public.nudges n
      where n.from_user = auth.uid()
        and n.created_at > now() - interval '24 hours'
    ) < 5
    and not exists (
      select 1 from public.nudges n
      where n.from_user = auth.uid()
        and n.created_at > now() - interval '10 minutes'
    )
  );


drop policy if exists ratings_read  on public.eat_ratings;
drop policy if exists ratings_write on public.eat_ratings;
create policy ratings_read on public.eat_ratings for select
  using (public.is_member_of(couple_id));
create policy ratings_write on public.eat_ratings for all
  using (user_id = auth.uid() and public.can_write_to(couple_id))
  with check (user_id = auth.uid() and public.can_write_to(couple_id));


-- ============================================================
-- 7. THỐNG KÊ QUÁN — suy ra, không lưu
-- security_invoker = true để view vẫn đi qua RLS của người gọi.
-- ============================================================

create or replace view public.eat_item_stats
with (security_invoker = true) as
select
  i.id as item_id,
  i.couple_id,
  count(distinct v.id)::int as visit_count,
  max(v.visited_on) as last_visited_on,
  avg(e.amount_minor)::bigint as avg_spend_minor,
  count(*) filter (where r.verdict = 'love')::int as love_count,
  count(*) filter (where r.verdict = 'nope')::int as nope_count
from public.eat_items i
left join public.eat_visits v on v.item_id = i.id
left join public.expenses e on e.id = v.expense_id and e.deleted_at is null
left join public.eat_ratings r on r.visit_id = v.id
where i.deleted_at is null
group by i.id, i.couple_id;


-- ============================================================
-- 8. QUAY CÓ LUẬT — bản đầy đủ
-- Luật 1: loại chỗ đã ăn trong 14 ngày
-- Luật 2: loại chỗ đã có người chê ('nope')
-- Luật 3: ưu tiên chỗ chưa thử bao giờ
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
  ),
  disliked as (
    select distinct v.item_id
    from public.eat_visits v
    join public.eat_ratings r on r.visit_id = v.id
    where v.couple_id = p_couple_id and r.verdict = 'nope'
  )
  select i.id, i.name, i.kind, i.address, i.map_url,
         (i.status = 'want') as never_tried
  from public.eat_items i
  where i.couple_id = p_couple_id
    and i.deleted_at is null
    and i.status <> 'archived'
    and i.id not in (select item_id from recent)
    and i.id not in (select item_id from disliked)
    and public.is_member_of(p_couple_id)
  order by (i.status = 'want') desc, random()
  limit p_limit;
$$;


-- ============================================================
-- 9. REALTIME cho tâm trạng và câu trả lời
-- ============================================================

do $$
declare t text;
begin
  foreach t in array array['mood_checkins', 'question_answers', 'nudges'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
