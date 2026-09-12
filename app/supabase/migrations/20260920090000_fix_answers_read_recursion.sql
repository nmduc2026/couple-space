-- Sửa lỗi đệ quy vô hạn trong policy đọc `question_answers`.
--
-- Policy cũ viết thế này:
--
--   create policy answers_read on public.question_answers for select
--     using (
--       public.is_member_of(couple_id)
--       and (
--         user_id = auth.uid()
--         or exists (
--           select 1 from public.question_answers mine   -- ← chính nó
--           where mine.couple_id = question_answers.couple_id
--             and mine.user_id = auth.uid()
--             and mine.asked_on = question_answers.asked_on
--         )
--       )
--     );
--
-- Câu `exists` đọc lại đúng bảng mà policy đang bảo vệ, nên Postgres phải áp
-- policy lên chính truy vấn kiểm tra policy. Nó phát hiện vòng lặp và ném:
--
--   42P17: infinite recursion detected in policy for relation "question_answers"
--
-- Kết quả: MỌI truy vấn đọc `question_answers` đều lỗi — kể cả đọc câu trả lời
-- của chính mình. Màn "Câu hỏi mỗi ngày" trắng trơn, và "Sách hỏi đáp" không
-- bao giờ có gì.
--
-- SQL này build sạch và migration áp dụng không báo gì; lỗi chỉ xuất hiện lúc
-- có người thật đọc bảng. Đó là lý do phải thử bằng token thật.
--
-- Cách sửa: đưa câu kiểm tra vào một hàm `security definer`. Hàm chạy dưới
-- quyền chủ sở hữu nên không bị áp RLS, vòng lặp biến mất — mà luật nghiệp vụ
-- thì giữ nguyên: chưa trả lời thì chưa thấy câu của người kia.

create or replace function public.has_answered_on(p_couple_id uuid, p_day date)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.question_answers
    where couple_id = p_couple_id
      and user_id = auth.uid()
      and asked_on = p_day
  );
$$;

revoke all on function public.has_answered_on(uuid, date) from public, anon;
grant execute on function public.has_answered_on(uuid, date) to authenticated;

drop policy if exists answers_read on public.question_answers;

create policy answers_read on public.question_answers for select
  using (
    public.is_member_of(couple_id)
    and (
      user_id = auth.uid()
      or public.has_answered_on(couple_id, asked_on)
    )
  );
