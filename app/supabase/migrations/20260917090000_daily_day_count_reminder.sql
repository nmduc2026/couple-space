-- P3-21 — Push hằng ngày "Hôm nay là ngày thứ N".
--
-- Công tắc `notification_prefs.daily_day_count` đã có từ Phase 3 và mặc định
-- TẮT, nhưng `due_reminders()` chưa bao giờ sinh ra dòng nào cho nó. Migration
-- này thêm nhánh đó vào, giữ nguyên chữ ký hàm để Edge Function không phải đổi
-- cách gọi.
--
-- Ba thứ dùng chung với nhánh sự kiện, không được làm khác đi:
--   · giờ gửi tính theo múi giờ NGƯỜI NHẬN
--   · rơi vào giờ yên lặng thì hoãn tới lượt cron sau
--   · `reminder_sends` là thứ chống gửi trùng — subject_key 'daily',
--     target_date là ngày địa phương, nên mỗi người mỗi ngày đúng một lần.

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
           c.start_date,
           coalesce(np.time_zone, 'Asia/Ho_Chi_Minh') as tz,
           coalesce(np.event_reminders, true) as wants_events,
           coalesce(np.daily_day_count, false) as wants_daily,
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
           -- dịp diễn ra hôm nay gửi sớm hơn, để còn kịp làm gì đó
           case when d = 0 then time '08:00' else time '09:00' end as send_after,
           l.time_local,
           l.today_local,
           l.quiet_hours_from,
           l.quiet_hours_to
    from local_now l
    join public.events e
      on e.couple_id = l.couple_id and e.deleted_at is null
    cross join lateral unnest(e.remind_days_before) as d
    where l.wants_events

    union all

    -- Số ngày yêu: ngày bắt đầu là ngày thứ 1, khớp với upcoming_milestones()
    select l.user_id,
           l.couple_id,
           'daily' as subject_key,
           'Hôm nay là ngày thứ ' || ((l.today_local - l.start_date) + 1) as title,
           '💕' as emoji,
           l.today_local as target_date,
           0 as days_before,
           time '08:00' as send_after,
           l.time_local,
           l.today_local,
           l.quiet_hours_from,
           l.quiet_hours_to
    from local_now l
    where l.wants_daily
      and l.today_local >= l.start_date
  )
  select c.user_id, c.couple_id, c.subject_key, c.title, c.emoji,
         c.target_date, c.days_before
  from candidates c
  where c.target_date is not null
    -- đúng ngày phải nhắc
    and c.target_date - c.days_before = c.today_local
    -- đã tới giờ gửi của người này
    and c.time_local >= c.send_after
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
