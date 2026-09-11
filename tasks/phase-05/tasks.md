# Phase 5 — Danh sách task

Bối cảnh và nhật ký: [context.md](context.md).
**Hướng dẫn từng bước:** [steps/](steps/) — mỗi nhóm một file.
Đặc tả: [p5-daily-question.md](../../docs/features/p5-daily-question.md) ·
[p5-future-letter.md](../../docs/features/p5-future-letter.md) ·
[p5-mood-checkin.md](../../docs/features/p5-mood-checkin.md) ·
[p5-nudge.md](../../docs/features/p5-nudge.md) ·
[p2-eat-tonight.md](../../docs/features/p2-eat-tonight.md) mục 8

Trạng thái: `[ ]` chưa làm · `[~]` đang làm · `[x]` xong · `[!]` bị chặn

> **Phase này có hai tính năng mà RLS là toàn bộ tính năng**, không phải lớp bảo vệ:
> câu hỏi mỗi ngày (nhóm A) và thư tương lai (nhóm B). Làm sai ở tầng giao diện thì tính
> năng vẫn *trông* đúng nhưng đã hỏng. Kiểm chứng bằng cách gọi API trực tiếp, không phải
> bằng cách nhìn màn hình.

## A. Câu hỏi mỗi ngày → [steps/a-daily-question.md](steps/a-daily-question.md)

- [ ] **P5-01** Soạn ngân hàng **~300 câu hỏi tiếng Việt**, phân loại: nhẹ · vui · sâu · nhìn lại · nhìn tới
- [ ] **P5-02** Migration `question_answers` (`couple_id`, `question_index`, `user_id`, `answered_on`, nội dung)
- [ ] **P5-03** Hàm chọn câu của ngày: xáo trộn cố định theo `couple_id`, quay vòng khi hết
- [ ] **P5-04** Lưu **múi giờ của space**, dùng nó để xác định "hôm nay" — không dùng múi giờ máy
- [ ] **P5-05** 🔒 **RLS có điều kiện**: chỉ đọc được câu trả lời của người kia khi tồn tại câu trả lời của mình cho cùng câu đó
- [ ] **P5-06** Kiểm chứng P5-05 **bằng cách gọi API trực tiếp** với token của người chưa trả lời
- [ ] **P5-07** Màn hình câu hỏi — 4 trạng thái (chưa ai trả lời / người kia đã trả lời / mình đã trả lời / cả hai xong)
- [ ] **P5-08** Ô mờ là **khối giả có kích thước gần đúng**, không phải nội dung thật bị CSS blur
- [ ] **P5-09** Sửa câu trả lời trong **24 giờ**, có nhãn "đã chỉnh"; sau đó khoá
- [ ] **P5-10** Mục "Bỏ lỡ" — trả lời bù trong 7 ngày
- [ ] **P5-11** Sách hỏi đáp: xem theo thời gian, tìm theo từ khoá
- [ ] **P5-12** Push buổi sáng + push khi người kia trả lời (mỗi ngày tối đa một lần nhắc)

## B. Thư gửi tương lai → [steps/b-future-letter.md](steps/b-future-letter.md)

- [ ] **P5-13** Migration `letters` (`open_on` kiểu **`date`**, người viết, người nhận, tiêu đề, nội dung)
- [ ] **P5-14** 🔒 **RLS chặn theo ngày**: trước `open_on` chỉ trả metadata, **không trả nội dung**
- [ ] **P5-15** Người viết luôn đọc lại được thư của mình
- [ ] **P5-16** Kiểm chứng P5-14 bằng cách gọi API trực tiếp
- [ ] **P5-17** Màn hình viết thư + gợi ý ngày mở lấy từ [sự kiện](../../docs/features/p3-events-reminders.md)
- [ ] **P5-18** Danh sách "Sắp mở" (🔒 + đếm ngược) và "Đã mở"
- [ ] **P5-19** Sửa/xoá trước ngày mở; **khoá vĩnh viễn** sau ngày mở
- [ ] **P5-20** Cron gửi push khi có thư mở khoá
- [ ] **P5-21** Thêm cảnh báo vào [màn hình huỷ ghép đôi](../../docs/features/p1-breakup.md): *"Còn 2 lá thư sẽ mở vào 2027 và 2036"*

## C. Check-in tâm trạng → [steps/c-mood.md](steps/c-mood.md)

- [ ] **P5-22** Migration `mood_checkins` (một bản ghi / người / ngày, `unique`)
- [ ] **P5-23** Màn hình chọn 5 mức + ghi chú tuỳ chọn, sửa được trong ngày
- [ ] **P5-24** Realtime: người kia thấy ngay
- [ ] **P5-25** Push **chỉ khi** mức 😞 hoặc 😕, nội dung nhẹ nhàng
- [ ] **P5-26** Biểu đồ 7 / 30 ngày, hai người hai màu, đọc được sự lệch nhau
- [ ] **P5-27** Câu nhận xét sinh từ dữ liệu — **chỉ hiện khi có ≥ 5 ngày của cả hai**
- [ ] **P5-28** Streak **chung** (cả hai cùng check-in). Đứt thì về 0, **im lặng tuyệt đối**

## D. Nudge → [steps/d-nudge.md](steps/d-nudge.md)

- [ ] **P5-29** Bốn nudge cố định, gọi Edge Function đã có từ Phase 1
- [ ] **P5-30** Giới hạn: 5 lần/người/ngày, cách nhau ≥ 10 phút
- [ ] **P5-31** Bảng trượt từ dưới lên; ba lối vào (dưới biểu đồ tâm trạng · nhấn giữ avatar · nút +)
- [ ] **P5-32** Nudge "đi ăn không?" → người nhận chạm vào mở thẳng vòng quay Ăn gì
- [ ] **P5-33** Cảnh báo trước khi gửi trong khung 23:00–06:00 (**giờ yên lặng không áp dụng cho nudge**)
- [ ] **P5-34** Mất mạng → thử lại một lần rồi báo thất bại, **không xếp hàng đợi**

## E. "Tối nay ăn gì?" — phần B → [steps/e-eat-tonight-b.md](steps/e-eat-tonight-b.md)

- [ ] **P5-35** Migration `eat_visits` + `eat_ratings` — [p2-eat-tonight.md](../../docs/features/p2-eat-tonight.md) mục 6
- [ ] **P5-36** View `eat_item_stats` — nhớ `security_invoker = true`
- [ ] **P5-37** Nối lượt ghé với `posts` và `expenses` → **số lần ăn và giá trung bình tự tính**
- [ ] **P5-38** Nút [Chốt] tạo lượt ghé + hỏi mở form đăng kỉ niệm
- [ ] **P5-39** Dải hỏi đánh giá 3 mức, một chạm, bỏ qua được
- [ ] **P5-40** Nhắc đánh giá **đúng một lần** hôm sau nếu người kia chưa đánh giá
- [ ] **P5-41** Thêm luật 1 và 2 vào hàm quay: loại chỗ ăn trong 14 ngày · loại chỗ ai đó chê
- [ ] **P5-42** Màn hình chi tiết quán hiện đủ thống kê tự tính
