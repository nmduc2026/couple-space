# Couple Space — Tổng quan

> App cho cặp đôi: một "không gian chung" để lưu kỉ niệm, đếm ngày, nhắc dịp đặc biệt
> và cùng nhau thực hiện mục tiêu.

**Đây là bản đồ tổng quan.** Chi tiết nghiệp vụ từng tính năng nằm trong
[docs/features/](docs/features/README.md); thiết kế kỹ thuật nằm trong
[docs/design/](docs/design/); việc cần làm nằm trong [tasks/](tasks/README.md).

## 1. Định vị

**Một câu:** Nơi hai người cùng viết lại chuyện tình của mình — và được nhắc để
không bỏ lỡ điều gì.

**Nguyên tắc xuyên suốt:**

- **Space-first, không phải user-first.** Mọi dữ liệu thuộc về *cặp đôi*, không
  thuộc về một người. Điều này quyết định toàn bộ data model.
- **Mở app ra là thấy giá trị ngay** — số ngày yêu + ảnh + việc sắp tới, không cần thao tác.
- **Không cạnh tranh với Messenger.** Không làm chat đầy đủ. Làm những thứ Messenger
  không làm được: ký ức có cấu trúc, nhắc nhở, thống kê.
- **Nhẹ nhàng, không gây áp lực.** Không biến tình yêu thành KPI.

## 2. Bản đồ tính năng

### Tầng 0 — Nền móng (bắt buộc, làm trước tiên)

| Tính năng | Một dòng | Phase |
|---|---|---|
| [Ghép đôi](docs/features/p1-pairing.md) | Mã mời 6 ký tự + deep link. Một tài khoản thuộc đúng 1 space. | 1 |
| [Hồ sơ đôi](docs/features/p1-couple-profile.md) | Biệt danh, avatar, ngày bắt đầu yêu, theme màu. | 1 |
| [Home / Dashboard](docs/features/p1-home-dashboard.md) | Ảnh bìa + số ngày + việc sắp tới + hoạt động mới. | 1 |
| [Thông báo 2 chiều](docs/features/p1-notifications.md) | Bạn đăng ảnh → người kia nhận push. "Mạch máu" của app. | 1 |
| [Huỷ ghép đôi](docs/features/p1-breakup.md) | Chia tay là *tính năng thật*, không phải ca biên. | 1 |

### Tầng 1 — MVP

| Tính năng | Một dòng | Phase |
|---|---|---|
| [Đếm ngày](docs/features/p1-day-counter.md) | Số ngày bên nhau + mốc tự động (100/365/1000…). | 1 |
| [Dòng thời gian](docs/features/p2-timeline.md) | Một timeline chung, cả hai cùng đăng ảnh/caption/địa điểm. | 2 |
| [Tối nay ăn gì?](docs/features/p2-eat-tonight.md) ⭐ | Danh sách quán + quay ngẫu nhiên có luật. Tần suất dùng cao nhất app. | 2 → 5 |
| [Sự kiện & nhắc nhở](docs/features/p3-events-reminders.md) | Sinh nhật, kỉ niệm, đếm ngược, nhắc cả hai máy. | 3 |
| [Chi tiêu chung](docs/features/p4-expenses.md) | Ghi lại đã tiêu gì, thống kê theo tháng và danh mục. **Không ghi nợ nhau.** | 4 |
| [Mục tiêu chung](docs/features/p4-goals.md) | Bucket list "những điều muốn làm cùng nhau". | 4 |

### Tầng 2 — Làm app "dính"

| Tính năng | Một dòng | Phase |
|---|---|---|
| [Câu hỏi mỗi ngày](docs/features/p5-daily-question.md) ⭐ | Trả lời rồi mới thấy câu trả lời của người kia. | 5 |
| [Thư gửi tương lai](docs/features/p5-future-letter.md) | Viết thư, hẹn ngày mở khoá. Rẻ nhất, cảm xúc cao nhất. | 5 |
| [Check-in tâm trạng](docs/features/p5-mood-checkin.md) | Một chạm mỗi ngày + biểu đồ theo tháng + streak. | 5 |
| [Nhắc nhẹ (Nudge)](docs/features/p5-nudge.md) | Gửi một cái "chạm": nhớ em / về chưa. | 5 |
| [Wishlist quà tặng](docs/features/p6-gift-wishlist.md) | Người kia xem được nhưng không biết mình đã xem gì. | 6 |
| [Bản đồ dấu chân](docs/features/p6-footprint-map.md) | Những nơi hai người đã đi cùng nhau. | 6 |
| [Tổng kết năm](docs/features/p6-wrapped.md) ⭐ | Ảnh đẹp chia sẻ được — kênh lan truyền miễn phí. | 6 |
| [Album & sao lưu](docs/features/p6-albums-export.md) | Album theo chuyến đi, xuất PDF, xuất toàn bộ dữ liệu. | 6 |

### Tầng 3 — Để sau / cân nhắc kỹ

| Tính năng | Vì sao chưa làm |
|---|---|
| **Widget màn hình khoá** | PWA trên iOS không hỗ trợ widget. Chỉ mở lại nếu chi $99/năm Apple Developer — xem [distribution.md](docs/decisions/distribution.md). |
| Theo dõi chu kì kinh nguyệt | Dữ liệu sức khoẻ nhạy cảm: bắt buộc opt-in, mã hoá, ràng buộc pháp lý (GDPR, chính sách App Store). |
| Chia sẻ vị trí realtime | Tốn pin, quyền chạy nền khó, dễ tạo cảm giác giám sát. Thay bằng gắn địa điểm thủ công. |
| Chat đầy đủ | Chi phí cao, không thắng nổi Messenger/Zalo. |
| Mạng xã hội nhiều cặp đôi | Làm loãng định vị "riêng tư". |

## 3. Những vấn đề khó đã nhận diện

Bốn vấn đề dưới đây ảnh hưởng tới toàn bộ kiến trúc, hay bị bỏ quên:

1. **Chia tay thì sao?** — đã tách thành đặc tả riêng: [breakup.md](docs/features/p1-breakup.md)
2. **Một người dùng, người kia không.** Rủi ro chết app lớn nhất. Onboarding phải kéo
   được người thứ hai vào trong 24 giờ đầu → [pairing.md](docs/features/p1-pairing.md)
3. **Riêng tư trong không gian chung.** ✅ **Đã chốt: không có nhật ký "chỉ mình thấy".**
   Mọi thứ đưa vào space là của cả hai — đó là toàn bộ định vị sản phẩm, và nhập nhèm chỗ
   này gây hậu quả nặng hơn nhiều so với lợi ích. Ba ngoại lệ duy nhất, đều là **giấu tạm
   thời có mục đích rõ ràng** chứ không phải "khu vực riêng tư":
   [wishlist quà tặng](docs/features/p6-gift-wishlist.md) (giữ bất ngờ),
   [câu hỏi mỗi ngày](docs/features/p5-daily-question.md) (che tới khi cả hai trả lời),
   [thư gửi tương lai](docs/features/p5-future-letter.md) (khoá tới ngày hẹn).
   Ai cần nhật ký riêng thì dùng app khác — app này không nhận việc đó.
4. **Chi phí lưu trữ ảnh.** Khoản tốn kém nhất → [cost-estimate.md](docs/decisions/cost-estimate.md)

Kiếm tiền: **chưa đặt ra** ở giai đoạn này (app dùng riêng cho 2 người). Nếu sau này
phát hành: freemium, và **không** đặt tường phí ở tính năng cảm xúc lõi.

## 4. Lộ trình

| Phase | Nội dung | Mục tiêu |
|---|---|---|
| [1 — Nền móng](tasks/phase-01/context.md) | Auth, ghép đôi, hồ sơ đôi, Home + đếm ngày, push | Hai máy nhìn thấy nhau |
| [2 — Kỉ niệm](tasks/phase-02/context.md) | Timeline ảnh, địa điểm, thả tim/bình luận, "Ăn gì?" bản gọn | App có nội dung |
| [3 — Nhịp sống](tasks/phase-03/context.md) | Sự kiện + đếm ngược + nhắc | Có lý do mở app hằng ngày |
| [4 — Cùng nhau](tasks/phase-04/context.md) | Chi tiêu chung, mục tiêu chung | Khác biệt so với app cùng loại |
| [5 — Gắn kết](tasks/phase-05/context.md) | Câu hỏi mỗi ngày, thư tương lai, tâm trạng, "Ăn gì?" đầy đủ | Giữ chân |
| [6 — Lan truyền](tasks/phase-06/context.md) | Bản đồ dấu chân, Wrapped, xuất PDF | Tăng trưởng |

## 5. Nền tảng đã chốt

| Hạng mục | Lựa chọn |
|---|---|
| Giao diện | **Vite + React + TypeScript + Tailwind**, đóng gói **PWA** — [tech-stack.md](docs/decisions/tech-stack.md) |
| Backend | Supabase thuần (Postgres + Auth + Storage + Realtime + Edge Functions) |
| Phân quyền | Row-Level Security theo `couple_id`, bật từ bảng đầu tiên |
| Phân phối | Deploy Vercel → cài ra màn hình chính iPhone. Không store, $0 — [distribution.md](docs/decisions/distribution.md) |
| Nếu sau này lên store | Bọc bằng **Capacitor**, giữ nguyên code |

Chi tiết và lý do: [docs/decisions/](docs/decisions/) và [docs/design/backend/backend-architecture.md](docs/design/backend/backend-architecture.md).

---

*Trạng thái: **code xong cả 6 phase, backend đã chạy thật.** 20 migration đã
push lên Supabase, 4 Edge Function đã deploy, cron đang chạy, dữ liệu mẫu đã
đổ để thử tay. Phân quyền RLS đã kiểm bằng phiên đăng nhập thật của cả hai
người. Xuất PDF chạy thật ra sách 13 trang.*

*Còn bốn việc, đều cần máy thật: deploy Vercel, cài PWA lên hai iPhone, chạy
checklist DoD Phase 1, và để máy qua đêm xác nhận giờ push. Xem
[tasks/DEPLOY.md](tasks/DEPLOY.md).*
