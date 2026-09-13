-- ============================================================
-- PHẦN 3: HÀM PHÂN QUYỀN
-- ============================================================

-- "Người đang đăng nhập có thuộc space này không?"
create or replace function public.is_member_of(p_couple_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.couple_members m
    where m.couple_id = p_couple_id
      and m.user_id  = auth.uid()
      and m.left_at is null
  );
$$;

-- "Có được GHI vào space này không?"
-- Space archived (chia tay) thì chỉ đọc.
create or replace function public.can_write_to(p_couple_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.couple_members m
    join public.couples c on c.id = m.couple_id
    where m.couple_id = p_couple_id
      and m.user_id   = auth.uid()
      and m.left_at   is null
      and c.status    in ('pending', 'active')
      and c.deleted_at is null
  );
$$;

-- Tiện ích: lấy space đang hoạt động của người đang đăng nhập
create or replace function public.my_couple_id()
returns uuid
language sql stable security definer set search_path = public as $$
  select m.couple_id from public.couple_members m
  where m.user_id = auth.uid() and m.left_at is null
  limit 1;
$$;
