-- P5-10 — Trả lời bù trong 7 ngày, ở mục "Bỏ lỡ".
--
-- Policy `answers_write` ban đầu không ràng buộc `asked_on` chút nào: gọi API
-- thẳng thì trả lời được câu của ngày mai (đọc trước câu hỏi tương lai) hoặc
-- lấp kín cả năm ngoái. Giao diện không chặn được những việc đó — chỉ policy
-- mới chặn được, xem docs/features/p5-daily-question.md mục 4.

drop policy if exists answers_write on public.question_answers;

create policy answers_write on public.question_answers for insert
  with check (
    public.can_write_to(couple_id)
    and user_id = auth.uid()
    -- không trả lời trước cho ngày chưa tới
    and asked_on <= public.couple_today(couple_id)
    -- cửa sổ trả lời bù: hôm nay và 7 ngày trước đó
    and asked_on >= public.couple_today(couple_id) - 7
  );
