-- Đổi tên đôi đang có sang Đức + Diên (chạy trong Supabase SQL Editor, role postgres).
-- Dùng khi space đã seed trước đó với tên khác.

do $$
declare
  cid uuid;
  u1  uuid;
  u2  uuid;
begin
  select c.id into cid
  from public.couples c
  where c.status <> 'archived'
  order by c.created_at asc
  limit 1;

  if cid is null then
    raise exception 'Chua co couple nao. Chay seed_demo_couple.sql truoc.';
  end if;

  select user_id into u1 from public.couple_members
  where couple_id = cid and left_at is null order by joined_at asc limit 1;

  select user_id into u2 from public.couple_members
  where couple_id = cid and left_at is null order by joined_at asc offset 1 limit 1;

  update public.couples set invited_name = 'Diên' where id = cid;

  update public.couple_members set nickname = 'Đức'
  where couple_id = cid and user_id = u1;
  update public.profiles set display_name = 'Đức' where id = u1;

  if u2 is not null then
    update public.couple_members set nickname = 'Diên'
    where couple_id = cid and user_id = u2;
    update public.profiles set display_name = 'Diên' where id = u2;
  end if;

  raise notice 'Doi ten OK cho couple_id=%', cid;
end $$;
