-- Ăn gì: thêm trạng thái "đã chọn" (chốt từ vòng quay, chưa đi thật).
-- Quay chỉ lấy từ Muốn thử (want).

alter table public.eat_items
  drop constraint if exists eat_items_status_check;

alter table public.eat_items
  add constraint eat_items_status_check
  check (status in ('want', 'picked', 'tried', 'archived'));

create or replace function public.spin_eat(
  p_couple_id uuid,
  p_cooldown_days int default 14,
  p_limit int default 40
)
returns table (id uuid, name text, kind text, address text, map_url text, never_tried boolean)
language sql stable security definer set search_path = public as $$
  with disliked as (
    select distinct v.item_id
    from public.eat_visits v
    join public.eat_ratings r on r.visit_id = v.id
    where v.couple_id = p_couple_id and r.verdict = 'nope'
  )
  select i.id, i.name, i.kind, i.address, i.map_url,
         true as never_tried
  from public.eat_items i
  where i.couple_id = p_couple_id
    and i.deleted_at is null
    and i.status = 'want'
    and i.id not in (select item_id from disliked)
    and public.is_member_of(p_couple_id)
  order by random()
  limit p_limit;
$$;
