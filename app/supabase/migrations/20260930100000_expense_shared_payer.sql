-- Chi tiêu: paid_by null = Quỹ chung (cả hai), không gắn một người.
-- Vẫn chỉ để thống kê / nhìn lại — không tính nợ (D6).
alter table public.expenses
  alter column paid_by drop not null;

create or replace function public.expense_summary(
  p_couple_id uuid,
  p_month date
)
returns table (
  total_minor      bigint,
  outing_count     int,
  avg_outing_minor bigint,
  by_category      jsonb,
  by_payer         jsonb
)
language sql stable security definer set search_path = public as $$
  with scope as (
    select e.*
    from public.expenses e
    where e.couple_id = p_couple_id
      and e.deleted_at is null
      and e.spent_on >= date_trunc('month', p_month)::date
      and e.spent_on <  (date_trunc('month', p_month) + interval '1 month')::date
      and public.is_member_of(p_couple_id)
  ),
  median as (
    select percentile_cont(0.5) within group (order by amount_minor) as m
    from scope
  ),
  typical as (
    select s.* from scope s, median
    where median.m is null or s.amount_minor <= median.m * 10
  )
  select
    coalesce((select sum(amount_minor) from scope), 0)::bigint,
    (select count(*) from scope)::int,
    coalesce((select avg(amount_minor) from typical), 0)::bigint,
    coalesce((
      select jsonb_object_agg(coalesce(category, 'other'), total)
      from (
        select category, sum(amount_minor) as total
        from scope group by category
      ) c
    ), '{}'::jsonb),
    coalesce((
      select jsonb_object_agg(coalesce(paid_by::text, 'shared'), total)
      from (
        select paid_by, sum(amount_minor) as total
        from scope group by paid_by
      ) p
    ), '{}'::jsonb);
$$;
