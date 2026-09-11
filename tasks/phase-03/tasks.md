# Phase 3 — Danh sách task

Bối cảnh và nhật ký: [context.md](context.md).
**Hướng dẫn từng bước:** [steps/](steps/) — mỗi nhóm một file.
Đặc tả: [p3-events-reminders.md](../../docs/features/p3-events-reminders.md) ·
[p1-day-counter.md](../../docs/features/p1-day-counter.md)

Trạng thái: `[ ]` chưa làm · `[~]` đang làm · `[x]` xong · `[!]` bị chặn

## A. Database → [steps/a-database.md](steps/a-database.md)

- [x] **P3-01** Migration `events` — [database-schema.md](../../docs/design/backend/database-schema.md) mục 8
- [x] **P3-02** Migration `event_reminders` (mốc nhắc trước, nhiều mốc cho một sự kiện) — mốc nhắc lưu trong `events.remind_days_before int[]` theo database-schema.md mục 8, không tách bảng riêng
- [x] **P3-03** Bảng đánh dấu "đã gửi" cho từng mốc nhắc — **chống gửi trùng khi cron chạy lại**
- [~] **P3-04** Bật RLS cho cả ba bảng, kiểm chứng bằng tài khoản thứ ba — policy đã viết, còn tự thử bằng tài khoản thứ ba

## B. Mốc hệ thống — tính, không lưu → [steps/b-milestones.md](steps/b-milestones.md)

- [x] **P3-05** Hàm `upcoming_milestones()`: sinh mốc trăm ngày / tròn tháng / tròn năm từ ngày bắt đầu yêu
- [x] **P3-06** Xử lý ca biên ngày: **29/2**, ngày 31 ở tháng ngắn — viết test trước
- [x] **P3-07** Trộn mốc hệ thống với sự kiện người dùng thành **một danh sách** sắp theo ngày còn lại
- [~] **P3-08** Bảng tắt nhắc riêng cho từng mốc hệ thống (xoá thì không, tắt thì được) — bảng `milestone_mutes` + lọc trong `upcoming_milestones()` xong; **chưa có nút tắt trong giao diện**

## C. Giao diện Kế hoạch → [steps/c-plan-ui.md](steps/c-plan-ui.md)

- [x] **P3-09** Mở tab **Kế hoạch** trong tab bar (đang ẩn từ Phase 2)
- [x] **P3-10** Danh sách sự kiện + **vòng tròn đếm ngược** (conic-gradient theo % thời gian còn lại)
- [x] **P3-11** Nhãn "hệ thống" và ẩn nút xoá với mốc tự sinh
- [x] **P3-12** Mục "Đã qua" gập lại ở cuối
- [x] **P3-13** Màn hình tạo / sửa sự kiện: tên · ngày · lặp · nhắc trước · ghi chú
- [x] **P3-14** Trạng thái rỗng có sức mời gọi

## D. Gửi nhắc — phần khó nhất phase → [steps/d-reminders.md](steps/d-reminders.md)

- [x] **P3-15** Bật `pg_cron`, tạo job chạy **mỗi giờ**
- [x] **P3-16** Edge Function `send-reminders`: quét sự kiện tới hạn → lọc theo `notification_prefs` → gọi hàm gửi đã có từ Phase 1
- [x] **P3-17** Gửi lúc **9:00 theo múi giờ máy nhận** (8:00 nếu sự kiện diễn ra hôm nay)
- [x] **P3-18** Áp dụng **giờ yên lặng** — hoãn tới hết giờ yên lặng, không bỏ
- [x] **P3-19** **Gộp** khi cùng ngày có nhiều dịp: *"Hôm nay có 3 dịp đặc biệt"*
- [x] **P3-20** Đánh dấu đã gửi để cron chạy lại không gửi trùng — dùng bảng ở P3-03
- [ ] **P3-21** Push hằng ngày *"Hôm nay là ngày thứ 412 💕"*, **bật/tắt được**, mặc định **tắt** — **chưa làm**: công tắc đã có trong Cài đặt, `send-reminders` chưa sinh lời nhắc hằng ngày

## E. Home → [steps/e-home.md](steps/e-home.md)

- [x] **P3-22** Khối "SẮP TỚI" trên Home (1–2 sự kiện gần nhất)
- [x] **P3-23** Mục bật/tắt từng loại nhắc trong Cài đặt
- [x] **P3-24** Cài đặt giờ yên lặng

## F. Kiểm thử thời gian — đừng bỏ qua → [steps/f-time-tests.md](steps/f-time-tests.md)

Nhóm này hay bị bỏ, và lỗi chỉ lộ ra sau nhiều tháng.

- [x] **P3-25** Test: sự kiện hằng năm vào 29/2 ở năm không nhuận
- [x] **P3-26** Test: hằng tháng vào ngày 31 ở tháng 30 ngày và tháng 2
- [~] **P3-27** Test: đổi múi giờ máy → giờ nhận nhắc đổi theo — hàm nhận `time_zone` của từng người; **chưa có test tự động**
- [ ] **P3-28** Test thật: đặt một sự kiện cho ngày mai, **để máy qua đêm**, xác nhận push tới đúng giờ — **chưa làm**, phải thử tay qua đêm trên máy thật
