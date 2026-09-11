-- Phase 3 — Sự kiện, đếm ngược, nhắc nhở
-- Nguồn: docs/design/backend/database-schema.md mục 8
--        docs/features/p3-events-reminders.md

-- ============================================================
-- 1. SỰ KIỆN
-- ============================================================

create table if not exists public.events (
  id                 uuid primary key default gen_random_uuid(),
  couple_id          uuid not null references public.couples(id) on delete cascade,
  title              text not null check (length(trim(title)) > 0),
  event_date         date not null,
  recurrence         text not null default 'yearly'
                     check (recurrence in ('none', 'monthly', 'yearly')),
  remind_days_before int[] not null default '{3}',
  notes              text,
  emoji              text,
  is_system          boolean not null default false,
  created_by         uuid references public.profiles(id),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  deleted_at         timestamptz
);

create index if not exists events_couple_date_idx
  on public.events (couple_id, event_date) where deleted_at is null;

drop trigger if exists events_touch on public.events;
create trigger events_touch
  before update on public.events
  for each row execute function public.touch_updated_at();


-- ------------------------------------------------------------
-- Đánh dấu đã gửi. Khoá duy nhất chính là thứ chống gửi trùng khi
-- cron chạy lại trong cùng một giờ hoặc khi function bị gọi lặp.
-- ------------------------------------------------------------
create table if not exists public.reminder_sends (
  id          uuid primary key default gen_random_uuid(),
  couple_id   uuid not null references public.couples(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  -- 'event:<uuid>' hoặc 'milestone:<nhãn>' hoặc 'daily'
  subject_key text not null,
  -- ngày mà lời nhắc này nói tới, theo lịch của người nhận
  target_date date not null,
  days_before int not null default 0,
  sent_at     timestamptz not null default now(),
  unique (user_id, subject_key, target_date, days_before)
);

create index if not exists reminder_sends_lookup_idx
  on public.reminder_sends (couple_id, target_date);


-- ------------------------------------------------------------
-- Tắt nhắc cho một mốc hệ thống. Mốc tự sinh thì không xoá được,
-- nhưng tắt nhắc thì được — p3-events-reminders.md.
-- ------------------------------------------------------------
create table if not exists public.milestone_mutes (
  couple_id  uuid not null references public.couples(id) on delete cascade,
  label      text not null,
  created_at timestamptz not null default now(),
  primary key (couple_id, label)
);


-- ============================================================
-- 2. Múi giờ + tuỳ chọn nhắc của từng người
-- ============================================================

alter table public.notification_prefs
  add column if not exists event_reminders  boolean not null default true,
  add column if not exists daily_day_count  boolean not null default false,
  add column if not exists quiet_hours_from time,
  add column if not exists quiet_hours_to   time,
  -- Múi giờ máy, client tự ghi lên. Nhắc gửi 9:00 GIỜ NGƯỜI NHẬN,
  -- không phải 9:00 UTC — nếu không thì hai máy khác múi giờ lệch nhau.
  add column if not exists time_zone text not null default 'Asia/Ho_Chi_Minh';


-- ============================================================
-- 3. RLS
-- ============================================================

alter table public.events           enable row level security;
alter table public.reminder_sends   enable row level security;
alter table public.milestone_mutes  enable row level security;

drop policy if exists events_read  on public.events;
drop policy if exists events_write on public.events;

create policy events_read on public.events for select
  using (public.is_member_of(couple_id));
-- not is_system ở CẢ HAI vế: using chặn sửa/xoá sự kiện hệ thống,
-- with check chặn người dùng tự tạo sự kiện giả danh hệ thống.
create policy events_write on public.events for all
  using (public.can_write_to(couple_id) and not is_system)
  with check (public.can_write_to(couple_id) and not is_system);

drop policy if exists mutes_read  on public.milestone_mutes;
drop policy if exists mutes_write on public.milestone_mutes;

create policy mutes_read on public.milestone_mutes for select
  using (public.is_member_of(couple_id));
create policy mutes_write on public.milestone_mutes for all
  using (public.can_write_to(couple_id))
  with check (public.can_write_to(couple_id));

-- reminder_sends: chỉ của mình, và chỉ đọc. Ghi là việc của Edge Function
-- (chạy bằng service role, bỏ qua RLS).
drop policy if exists reminder_sends_own on public.reminder_sends;
create policy reminder_sends_own on public.reminder_sends for select
  using (user_id = auth.uid());


-- ============================================================
-- 4. MỐC HỆ THỐNG — tính ra, không lưu thành dòng
-- Lưu vào bảng sẽ sinh dữ liệu rác và sai khi sửa ngày bắt đầu yêu.
-- ============================================================

create or replace function public.upcoming_milestones(
  p_couple_id uuid,
  p_limit int default 5
)
returns table (label text, milestone_date date, days_away int)
language sql stable security definer set search_path = public as $$
  with c as (
    select start_date from public.couples where id = p_couple_id
  ),
  day_marks as (
    -- ngày bắt đầu yêu là ngày thứ 1 → mốc thứ n rơi vào start_date + (n-1)
    select 'Ngày thứ ' || n as label, (c.start_date + (n - 1))::date as d
    from c, unnest(array[100,200,300,365,500,600,700,730,800,900,1000,
                         1095,1460,1825,2000,2555,3000,3650]) as n
  ),
  year_marks as (
    select 'Kỉ niệm ' || y || ' năm' as label,
           (c.start_date + (y || ' years')::interval)::date as d
    from c, generate_series(1, 30) as y
  ),
  month_marks as (
    select 'Tròn ' || mo || ' tháng' as label,
           (c.start_date + (mo || ' months')::interval)::date as d
    from c, generate_series(1, 11) as mo
  )
  select m.label, m.d, (m.d - current_date)::int
  from (select * from day_marks union all
        select * from year_marks union all
        select * from month_marks) m
  where m.d >= current_date
    and not exists (
      select 1 from public.milestone_mutes mu
      where mu.couple_id = p_couple_id and mu.label = m.label
    )
    and public.is_member_of(p_couple_id)
  order by m.d
  limit p_limit;
$$;

grant execute on function public.upcoming_milestones(uuid, int) to authenticated;


-- ============================================================
-- 5. LẦN TỚI CỦA MỘT SỰ KIỆN LẶP
-- Ca biên: 29/2 ở năm không nhuận, ngày 31 ở tháng 30 ngày.
-- Postgres cộng interval đã tự kẹp về ngày cuối tháng, nên lấy luôn.
-- ============================================================

create or replace function public.next_occurrence(
  p_event_date date,
  p_recurrence text,
  p_from date default current_date
)
returns date
language plpgsql immutable set search_path = public as $$
declare
  candidate date;
  step int := 0;
begin
  if p_recurrence = 'none' then
    return p_event_date;
  end if;

  loop
    if p_recurrence = 'yearly' then
      candidate := (p_event_date + (step || ' years')::interval)::date;
    else
      candidate := (p_event_date + (step || ' months')::interval)::date;
    end if;

    exit when candidate >= p_from;
    step := step + 1;
    -- chặn vòng lặp vô hạn nếu dữ liệu hỏng
    if step > 2000 then
      return null;
    end if;
  end loop;

  return candidate;
end $$;

grant execute on function public.next_occurrence(date, text, date) to authenticated;


-- ============================================================
-- 6. MỘT DANH SÁCH DUY NHẤT: sự kiện người dùng + mốc hệ thống
-- ============================================================

create or replace function public.upcoming_agenda(
  p_couple_id uuid,
  p_limit int default 20
)
returns table (
  id          text,
  title       text,
  emoji       text,
  occurs_on   date,
  days_away   int,
  is_system   boolean,
  recurrence  text
)
language sql stable security definer set search_path = public as $$
  with user_events as (
    select e.id::text as id,
           e.title,
           e.emoji,
           public.next_occurrence(e.event_date, e.recurrence) as occurs_on,
           false as is_system,
           e.recurrence
    from public.events e
    where e.couple_id = p_couple_id and e.deleted_at is null
  ),
  system_marks as (
    select 'milestone:' || m.label as id,
           m.label as title,
           '💕'::text as emoji,
           m.milestone_date as occurs_on,
           true as is_system,
           'none'::text as recurrence
    from public.upcoming_milestones(p_couple_id, 12) m
  )
  select a.id, a.title, a.emoji, a.occurs_on,
         (a.occurs_on - current_date)::int as days_away,
         a.is_system, a.recurrence
  from (select * from user_events union all select * from system_marks) a
  where a.occurs_on is not null
    and public.is_member_of(p_couple_id)
  order by a.occurs_on
  limit p_limit;
$$;

grant execute on function public.upcoming_agenda(uuid, int) to authenticated;


-- ============================================================
-- 7. AI CẦN NHẮC NGAY BÂY GIỜ
-- Edge Function `send-reminders` gọi hàm này mỗi giờ.
--
-- Luật:
--  - Gửi 9:00 giờ NGƯỜI NHẬN; 8:00 nếu dịp đó rơi đúng hôm nay.
--  - Trong giờ yên lặng thì hoãn, không bỏ — nên điều kiện chỉ là
--    "đã qua giờ gửi", và bảng reminder_sends chặn gửi lại.
-- ============================================================

create or replace function public.due_reminders()
returns table (
  user_id     uuid,
  couple_id   uuid,
  subject_key text,
  title       text,
  emoji       text,
  target_date date,
  days_before int
)
language sql stable security definer set search_path = public as $$
  with recipients as (
    select cm.user_id,
           cm.couple_id,
           coalesce(np.time_zone, 'Asia/Ho_Chi_Minh') as tz,
           coalesce(np.event_reminders, true) as wants_events,
           np.quiet_hours_from,
           np.quiet_hours_to
    from public.couple_members cm
    join public.couples c on c.id = cm.couple_id
    left join public.notification_prefs np on np.user_id = cm.user_id
    where cm.left_at is null and c.status = 'active'
  ),
  local_now as (
    select r.*,
           (now() at time zone r.tz)::date as today_local,
           (now() at time zone r.tz)::time as time_local
    from recipients r
  ),
  candidates as (
    select l.user_id,
           l.couple_id,
           'event:' || e.id as subject_key,
           e.title,
           e.emoji,
           public.next_occurrence(e.event_date, e.recurrence, l.today_local) as target_date,
           d as days_before,
           l.time_local,
           l.today_local,
           l.quiet_hours_from,
           l.quiet_hours_to
    from local_now l
    join public.events e
      on e.couple_id = l.couple_id and e.deleted_at is null
    cross join lateral unnest(e.remind_days_before) as d
    where l.wants_events
  )
  select c.user_id, c.couple_id, c.subject_key, c.title, c.emoji,
         c.target_date, c.days_before
  from candidates c
  where c.target_date is not null
    -- đúng ngày phải nhắc
    and c.target_date - c.days_before = c.today_local
    -- đã tới giờ gửi của người này
    and c.time_local >= (case when c.days_before = 0 then time '08:00' else time '09:00' end)
    -- đang trong giờ yên lặng thì để lượt cron sau gửi
    and not (
      c.quiet_hours_from is not null and c.quiet_hours_to is not null
      and (
        (c.quiet_hours_from < c.quiet_hours_to
          and c.time_local >= c.quiet_hours_from and c.time_local < c.quiet_hours_to)
        or
        (c.quiet_hours_from > c.quiet_hours_to
          and (c.time_local >= c.quiet_hours_from or c.time_local < c.quiet_hours_to))
      )
    )
    -- chưa gửi lần nào cho đúng mốc này
    and not exists (
      select 1 from public.reminder_sends s
      where s.user_id = c.user_id
        and s.subject_key = c.subject_key
        and s.target_date = c.target_date
        and s.days_before = c.days_before
    );
$$;

revoke all on function public.due_reminders() from public, anon, authenticated;
