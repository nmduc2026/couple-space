-- Bọc `auth.uid()` trong policy thành `(select auth.uid())`.
--
-- Gọi thẳng `auth.uid()` trong policy khiến Postgres coi nó là biểu thức phụ
-- thuộc từng dòng và TÍNH LẠI MỖI DÒNG. Bọc trong một subquery vô hướng thì nó
-- thành InitPlan: tính đúng một lần cho cả câu truy vấn.
--
-- Đây là cảnh báo `auth_rls_initplan` của Supabase advisor — 28 policy dính.
-- Chênh lệch không thấy được khi bảng mới vài chục dòng, nhưng sau vài năm
-- dùng thật thì mỗi lần mở Timeline là thêm vài nghìn lần gọi thừa.
--
-- Định nghĩa dưới đây LẤY TỪ CHÍNH DATABASE (`pg_policies`), chỉ đổi đúng chỗ
-- cần bọc — không viết lại luật phân quyền bằng tay, để không sửa nhầm.

drop policy if exists comments_insert on public.comments;
create policy comments_insert on public.comments for insert
  with check ((can_write_to(couple_id) AND (author_id = (select auth.uid()))));

drop policy if exists comments_update on public.comments;
create policy comments_update on public.comments for update
  using (((author_id = (select auth.uid())) AND can_write_to(couple_id)))
  with check (((author_id = (select auth.uid())) AND can_write_to(couple_id)));

drop policy if exists ratings_write on public.eat_ratings;
create policy ratings_write on public.eat_ratings for all
  using (((user_id = (select auth.uid())) AND can_write_to(couple_id)))
  with check (((user_id = (select auth.uid())) AND can_write_to(couple_id)));

drop policy if exists export_runs_own on public.export_runs;
create policy export_runs_own on public.export_runs for all
  using ((user_id = (select auth.uid())))
  with check ((user_id = (select auth.uid())));

drop policy if exists contributions_write on public.goal_contributions;
create policy contributions_write on public.goal_contributions for all
  using ((can_write_to(couple_id) AND (user_id = (select auth.uid()))))
  with check ((can_write_to(couple_id) AND (user_id = (select auth.uid()))));

drop policy if exists invite_attempts_own on public.invite_attempts;
create policy invite_attempts_own on public.invite_attempts for all
  using ((user_id = (select auth.uid())))
  with check ((user_id = (select auth.uid())));

drop policy if exists invites_create on public.invites;
create policy invites_create on public.invites for insert
  with check ((can_write_to(couple_id) AND (created_by = (select auth.uid()))));

drop policy if exists letters_delete on public.letters;
create policy letters_delete on public.letters for delete
  using (((author_id = (select auth.uid())) AND can_write_to(couple_id) AND (open_on > couple_today(couple_id))));

drop policy if exists letters_insert on public.letters;
create policy letters_insert on public.letters for insert
  with check ((can_write_to(couple_id) AND (author_id = (select auth.uid()))));

drop policy if exists letters_read on public.letters;
create policy letters_read on public.letters for select
  using ((is_member_of(couple_id) AND ((author_id = (select auth.uid())) OR (open_on <= couple_today(couple_id)))));

drop policy if exists letters_update on public.letters;
create policy letters_update on public.letters for update
  using (((author_id = (select auth.uid())) AND can_write_to(couple_id) AND (open_on > couple_today(couple_id))))
  with check ((author_id = (select auth.uid())));

drop policy if exists mood_write on public.mood_checkins;
create policy mood_write on public.mood_checkins for all
  using (((user_id = (select auth.uid())) AND can_write_to(couple_id)))
  with check (((user_id = (select auth.uid())) AND can_write_to(couple_id)));

drop policy if exists prefs_own on public.notification_prefs;
create policy prefs_own on public.notification_prefs for all
  using ((user_id = (select auth.uid())))
  with check ((user_id = (select auth.uid())));

drop policy if exists nudges_insert on public.nudges;
create policy nudges_insert on public.nudges for insert
  with check ((can_write_to(couple_id) AND (from_user = (select auth.uid())) AND (( SELECT count(*) AS count
   FROM nudges n
  WHERE ((n.from_user = (select auth.uid())) AND (n.created_at > (now() - '24:00:00'::interval)))) < 5) AND (NOT (EXISTS ( SELECT 1
   FROM nudges n
  WHERE ((n.from_user = (select auth.uid())) AND (n.created_at > (now() - '00:10:00'::interval))))))));

drop policy if exists pdf_insert on public.pdf_exports;
create policy pdf_insert on public.pdf_exports for insert
  with check (((requested_by = (select auth.uid())) AND is_member_of(couple_id)));

drop policy if exists posts_delete on public.posts;
create policy posts_delete on public.posts for delete
  using (((author_id = (select auth.uid())) AND can_write_to(couple_id)));

drop policy if exists posts_insert on public.posts;
create policy posts_insert on public.posts for insert
  with check ((can_write_to(couple_id) AND (author_id = (select auth.uid()))));

drop policy if exists posts_update on public.posts;
create policy posts_update on public.posts for update
  using (((author_id = (select auth.uid())) AND can_write_to(couple_id)))
  with check (((author_id = (select auth.uid())) AND can_write_to(couple_id)));

drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select
  using (((id = (select auth.uid())) OR (EXISTS ( SELECT 1
   FROM (couple_members me
     JOIN couple_members other ON ((other.couple_id = me.couple_id)))
  WHERE ((me.user_id = (select auth.uid())) AND (me.left_at IS NULL) AND (other.user_id = profiles.id) AND (other.left_at IS NULL))))));

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update
  using ((id = (select auth.uid())))
  with check ((id = (select auth.uid())));

drop policy if exists push_subs_own on public.push_subscriptions;
create policy push_subs_own on public.push_subscriptions for all
  using ((user_id = (select auth.uid())))
  with check ((user_id = (select auth.uid())));

drop policy if exists answers_read on public.question_answers;
create policy answers_read on public.question_answers for select
  using ((is_member_of(couple_id) AND ((user_id = (select auth.uid())) OR has_answered_on(couple_id, asked_on))));

drop policy if exists answers_update on public.question_answers;
create policy answers_update on public.question_answers for update
  using (((user_id = (select auth.uid())) AND can_write_to(couple_id) AND (created_at > (now() - '24:00:00'::interval))))
  with check ((user_id = (select auth.uid())));

drop policy if exists answers_write on public.question_answers;
create policy answers_write on public.question_answers for insert
  with check ((can_write_to(couple_id) AND (user_id = (select auth.uid())) AND (asked_on <= couple_today(couple_id)) AND (asked_on >= (couple_today(couple_id) - 7))));

drop policy if exists reactions_write on public.reactions;
create policy reactions_write on public.reactions for all
  using (((user_id = (select auth.uid())) AND can_write_to(couple_id)))
  with check (((user_id = (select auth.uid())) AND can_write_to(couple_id)));

drop policy if exists reminder_sends_own on public.reminder_sends;
create policy reminder_sends_own on public.reminder_sends for select
  using ((user_id = (select auth.uid())));

drop policy if exists wishlist_write on public.wishlist_items;
create policy wishlist_write on public.wishlist_items for all
  using (((owner_id = (select auth.uid())) AND can_write_to(couple_id)))
  with check (((owner_id = (select auth.uid())) AND can_write_to(couple_id)));

drop policy if exists marks_own on public.wishlist_marks;
create policy marks_own on public.wishlist_marks for all
  using (((marked_by = (select auth.uid())) AND is_member_of(couple_id)))
  with check (((marked_by = (select auth.uid())) AND can_write_to(couple_id) AND (EXISTS ( SELECT 1
   FROM wishlist_items w
  WHERE ((w.id = wishlist_marks.item_id) AND (w.owner_id <> (select auth.uid())))))));
