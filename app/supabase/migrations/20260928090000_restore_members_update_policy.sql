-- Policy UPDATE trên couple_members từng có (20260911113355) nhưng đã mất trên
-- database thật — chỉ còn members_read. Hệ quả: đổi biệt danh trong Cài đặt
-- "thành công" (Supabase không báo lỗi khi RLS lọc hết dòng) nhưng không ghi
-- được. Khôi phục lại, bọc auth.uid() theo kiểu InitPlan như các policy khác.

drop policy if exists members_update_self on public.couple_members;
create policy members_update_self on public.couple_members for update
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
