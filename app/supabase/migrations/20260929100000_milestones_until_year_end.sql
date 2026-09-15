-- Mốc hệ thống trên Kế hoạch chỉ trong năm lịch hiện tại (từ hôm nay → 31/12).
-- Trước đây generate_series năm 1..30 + limit → list đầy "Kỉ niệm 9 năm" xa tương lai.
create or replace function public.upcoming_milestones(
  p_couple_id uuid,
  p_limit int default 5
)
returns table (label text, milestone_date date, days_away int)
language sql stable security definer set search_path = public as $$
  with c as (
    select start_date from public.couples where id = p_couple_id
  ),
  bounds as (
    select make_date(extract(year from current_date)::int, 12, 31)::date as year_end
  ),
  day_marks as (
    -- ngày bắt đầu yêu là ngày thứ 1 → mốc thứ n rơi vào start_date + (n-1)
    select 'Ngày thứ ' || n as label, (c.start_date + (n - 1))::date as d
    from c, unnest(array[100,200,300,365,500,600,700,730,800,900,1000,
                         1095,1460,1825,2000,2555,3000,3650]) as n
  ),
  year_marks as (
    select case when y = 1 then 'Kỉ niệm 1 năm' else 'Kỉ niệm ' || y || ' năm' end as label,
           (c.start_date + (y || ' years')::interval)::date as d
    from c, generate_series(1, 50) as y
  ),
  month_marks as (
    -- đủ xa để còn mốc "Tròn N tháng" rơi trong phần còn lại của năm
    select 'Tròn ' || mo || ' tháng' as label,
           (c.start_date + (mo || ' months')::interval)::date as d
    from c, generate_series(1, 120) as mo
  )
  select m.label, m.d, (m.d - current_date)::int
  from (
    select * from day_marks
    union all
    select * from year_marks
    union all
    select * from month_marks
  ) m
  cross join bounds b
  where m.d >= current_date
    and m.d <= b.year_end
    and not exists (
      select 1 from public.milestone_mutes mu
      where mu.couple_id = p_couple_id and mu.label = m.label
    )
    and public.is_member_of(p_couple_id)
  order by m.d
  limit p_limit;
$$;
