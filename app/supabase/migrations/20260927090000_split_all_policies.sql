-- Tách policy `FOR ALL` thành INSERT / UPDATE / DELETE.
--
-- 17 bảng đang có hai policy cùng phủ SELECT: một `X_read FOR SELECT` và một
-- `X_write FOR ALL` (mà ALL thì bao gồm cả SELECT). Hai policy permissive trên
-- cùng một lệnh nghĩa là Postgres phải chạy CẢ HAI rồi OR kết quả, ở MỌI lượt
-- đọc — đó là cảnh báo `multiple_permissive_policies` của advisor.
--
-- Vì sao tách đi không nới lỏng cũng không siết chặt quyền đọc:
--
--   can_write_to  = là thành viên (left_at is null) VÀ space đang pending/active
--   is_member_of  = là thành viên (left_at is null HOẶC space đã archived)
--
-- Riêng vế `left_at is null` của `can_write_to` đã đủ thoả `is_member_of`, nên
-- cái gì policy GHI cho phép thì policy ĐỌC cũng cho phép. Bỏ SELECT khỏi
-- policy ghi không cắt mất quyền đọc của ai.
--
-- `wishlist_marks` KHÔNG nằm trong danh sách này: nó chỉ có một policy `FOR
-- ALL` và không có policy đọc riêng — chính phần SELECT hẹp của nó là tính
-- năng (chủ wishlist không được thấy dấu của người kia).
--
-- Sinh từ `pg_policies` của database, không viết tay.

-- album_posts
drop policy if exists album_posts_write on public.album_posts;
create policy album_posts_write_insert on public.album_posts for insert
  with check (can_write_to(couple_id));
create policy album_posts_write_update on public.album_posts for update
  using (can_write_to(couple_id))
  with check (can_write_to(couple_id));
create policy album_posts_write_delete on public.album_posts for delete
  using (can_write_to(couple_id));

-- albums
drop policy if exists albums_write on public.albums;
create policy albums_write_insert on public.albums for insert
  with check (can_write_to(couple_id));
create policy albums_write_update on public.albums for update
  using (can_write_to(couple_id))
  with check (can_write_to(couple_id));
create policy albums_write_delete on public.albums for delete
  using (can_write_to(couple_id));

-- eat_items
drop policy if exists eat_items_write on public.eat_items;
create policy eat_items_write_insert on public.eat_items for insert
  with check (can_write_to(couple_id));
create policy eat_items_write_update on public.eat_items for update
  using (can_write_to(couple_id))
  with check (can_write_to(couple_id));
create policy eat_items_write_delete on public.eat_items for delete
  using (can_write_to(couple_id));

-- eat_ratings
drop policy if exists ratings_write on public.eat_ratings;
create policy ratings_write_insert on public.eat_ratings for insert
  with check (((user_id = ( SELECT auth.uid() AS uid)) AND can_write_to(couple_id)));
create policy ratings_write_update on public.eat_ratings for update
  using (((user_id = ( SELECT auth.uid() AS uid)) AND can_write_to(couple_id)))
  with check (((user_id = ( SELECT auth.uid() AS uid)) AND can_write_to(couple_id)));
create policy ratings_write_delete on public.eat_ratings for delete
  using (((user_id = ( SELECT auth.uid() AS uid)) AND can_write_to(couple_id)));

-- eat_visits
drop policy if exists eat_visits_write on public.eat_visits;
create policy eat_visits_write_insert on public.eat_visits for insert
  with check (can_write_to(couple_id));
create policy eat_visits_write_update on public.eat_visits for update
  using (can_write_to(couple_id))
  with check (can_write_to(couple_id));
create policy eat_visits_write_delete on public.eat_visits for delete
  using (can_write_to(couple_id));

-- events
drop policy if exists events_write on public.events;
create policy events_write_insert on public.events for insert
  with check ((can_write_to(couple_id) AND (NOT is_system)));
create policy events_write_update on public.events for update
  using ((can_write_to(couple_id) AND (NOT is_system)))
  with check ((can_write_to(couple_id) AND (NOT is_system)));
create policy events_write_delete on public.events for delete
  using ((can_write_to(couple_id) AND (NOT is_system)));

-- expenses
drop policy if exists expenses_write on public.expenses;
create policy expenses_write_insert on public.expenses for insert
  with check (can_write_to(couple_id));
create policy expenses_write_update on public.expenses for update
  using (can_write_to(couple_id))
  with check (can_write_to(couple_id));
create policy expenses_write_delete on public.expenses for delete
  using (can_write_to(couple_id));

-- goal_contributions
drop policy if exists contributions_write on public.goal_contributions;
create policy contributions_write_insert on public.goal_contributions for insert
  with check ((can_write_to(couple_id) AND (user_id = ( SELECT auth.uid() AS uid))));
create policy contributions_write_update on public.goal_contributions for update
  using ((can_write_to(couple_id) AND (user_id = ( SELECT auth.uid() AS uid))))
  with check ((can_write_to(couple_id) AND (user_id = ( SELECT auth.uid() AS uid))));
create policy contributions_write_delete on public.goal_contributions for delete
  using ((can_write_to(couple_id) AND (user_id = ( SELECT auth.uid() AS uid))));

-- goal_steps
drop policy if exists steps_write on public.goal_steps;
create policy steps_write_insert on public.goal_steps for insert
  with check (can_write_to(couple_id));
create policy steps_write_update on public.goal_steps for update
  using (can_write_to(couple_id))
  with check (can_write_to(couple_id));
create policy steps_write_delete on public.goal_steps for delete
  using (can_write_to(couple_id));

-- goals
drop policy if exists goals_write on public.goals;
create policy goals_write_insert on public.goals for insert
  with check (can_write_to(couple_id));
create policy goals_write_update on public.goals for update
  using (can_write_to(couple_id))
  with check (can_write_to(couple_id));
create policy goals_write_delete on public.goals for delete
  using (can_write_to(couple_id));

-- milestone_mutes
drop policy if exists mutes_write on public.milestone_mutes;
create policy mutes_write_insert on public.milestone_mutes for insert
  with check (can_write_to(couple_id));
create policy mutes_write_update on public.milestone_mutes for update
  using (can_write_to(couple_id))
  with check (can_write_to(couple_id));
create policy mutes_write_delete on public.milestone_mutes for delete
  using (can_write_to(couple_id));

-- mood_checkins
drop policy if exists mood_write on public.mood_checkins;
create policy mood_write_insert on public.mood_checkins for insert
  with check (((user_id = ( SELECT auth.uid() AS uid)) AND can_write_to(couple_id)));
create policy mood_write_update on public.mood_checkins for update
  using (((user_id = ( SELECT auth.uid() AS uid)) AND can_write_to(couple_id)))
  with check (((user_id = ( SELECT auth.uid() AS uid)) AND can_write_to(couple_id)));
create policy mood_write_delete on public.mood_checkins for delete
  using (((user_id = ( SELECT auth.uid() AS uid)) AND can_write_to(couple_id)));

-- place_aliases
drop policy if exists aliases_write on public.place_aliases;
create policy aliases_write_insert on public.place_aliases for insert
  with check (can_write_to(couple_id));
create policy aliases_write_update on public.place_aliases for update
  using (can_write_to(couple_id))
  with check (can_write_to(couple_id));
create policy aliases_write_delete on public.place_aliases for delete
  using (can_write_to(couple_id));

-- post_media
drop policy if exists media_write on public.post_media;
create policy media_write_insert on public.post_media for insert
  with check (can_write_to(couple_id));
create policy media_write_update on public.post_media for update
  using (can_write_to(couple_id))
  with check (can_write_to(couple_id));
create policy media_write_delete on public.post_media for delete
  using (can_write_to(couple_id));

-- reactions
drop policy if exists reactions_write on public.reactions;
create policy reactions_write_insert on public.reactions for insert
  with check (((user_id = ( SELECT auth.uid() AS uid)) AND can_write_to(couple_id)));
create policy reactions_write_update on public.reactions for update
  using (((user_id = ( SELECT auth.uid() AS uid)) AND can_write_to(couple_id)))
  with check (((user_id = ( SELECT auth.uid() AS uid)) AND can_write_to(couple_id)));
create policy reactions_write_delete on public.reactions for delete
  using (((user_id = ( SELECT auth.uid() AS uid)) AND can_write_to(couple_id)));

-- wishlist_items
drop policy if exists wishlist_write on public.wishlist_items;
create policy wishlist_write_insert on public.wishlist_items for insert
  with check (((owner_id = ( SELECT auth.uid() AS uid)) AND can_write_to(couple_id)));
create policy wishlist_write_update on public.wishlist_items for update
  using (((owner_id = ( SELECT auth.uid() AS uid)) AND can_write_to(couple_id)))
  with check (((owner_id = ( SELECT auth.uid() AS uid)) AND can_write_to(couple_id)));
create policy wishlist_write_delete on public.wishlist_items for delete
  using (((owner_id = ( SELECT auth.uid() AS uid)) AND can_write_to(couple_id)));

-- wrapped_reports
drop policy if exists wrapped_write on public.wrapped_reports;
create policy wrapped_write_insert on public.wrapped_reports for insert
  with check (can_write_to(couple_id));
create policy wrapped_write_update on public.wrapped_reports for update
  using (can_write_to(couple_id))
  with check (can_write_to(couple_id));
create policy wrapped_write_delete on public.wrapped_reports for delete
  using (can_write_to(couple_id));
