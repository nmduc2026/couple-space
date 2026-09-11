# Đặc tả tính năng

Mỗi file ở đây trả lời câu hỏi **"tính năng này hoạt động thế nào"** — nghiệp vụ,
luật, ca biên. Không chứa SQL, không chứa code: thiết kế kỹ thuật nằm ở
[../design/](../design/).

Bản đồ tổng quan và thứ tự ưu tiên: [../../overview.md](../../overview.md).

## Trạng thái đặc tả

| Tính năng | Phase | Trạng thái |
|---|---|---|
| [Ghép đôi](p1-pairing.md) | 1 | ✅ Đã đặc tả |
| [Hồ sơ đôi](p1-couple-profile.md) | 1 | ✅ Đã đặc tả |
| [Home / Dashboard](p1-home-dashboard.md) | 1 | ✅ Đã đặc tả |
| [Thông báo](p1-notifications.md) | 1 | ✅ Đã đặc tả |
| [Đếm ngày](p1-day-counter.md) | 1 | ✅ Đã đặc tả |
| [Huỷ ghép đôi](p1-breakup.md) | 1 | ✅ Đã đặc tả |
| [Dòng thời gian](p2-timeline.md) | 2 | ✅ Đã đặc tả |
| [Tối nay ăn gì?](p2-eat-tonight.md) | 2 → 5 | ✅ Đã đặc tả |
| [Sự kiện & nhắc nhở](p3-events-reminders.md) | 3 | 🔲 Tóm tắt |
| [Chi tiêu chung](p4-expenses.md) | 4 | 🔲 Tóm tắt |
| [Mục tiêu chung](p4-goals.md) | 4 | 🔲 Tóm tắt |
| [Câu hỏi mỗi ngày](p5-daily-question.md) | 5 | 🔲 Tóm tắt |
| [Thư gửi tương lai](p5-future-letter.md) | 5 | 🔲 Tóm tắt |
| [Check-in tâm trạng](p5-mood-checkin.md) | 5 | 🔲 Tóm tắt |
| [Nhắc nhẹ (Nudge)](p5-nudge.md) | 5 | 🔲 Tóm tắt |
| [Wishlist quà tặng](p6-gift-wishlist.md) | 6 | 🔲 Tóm tắt |
| [Bản đồ dấu chân](p6-footprint-map.md) | 6 | 🔲 Tóm tắt |
| [Tổng kết năm](p6-wrapped.md) | 6 | 🔲 Tóm tắt |
| [Album & sao lưu](p6-albums-export.md) | 6 | 🔲 Tóm tắt |

> **Quy tắc:** một tính năng phải ở trạng thái ✅ **trước khi** phase chứa nó bắt đầu.
> Đặc tả đi trước code đúng một bước — không viết trước xa hơn, vì thứ viết quá sớm
> gần như chắc chắn phải sửa.

## Quy ước đặt tên

Tên file mang **tiền tố phase**: `p1-pairing.md`, `p2-timeline.md`, `p6-wrapped.md`…
Nhìn tên là biết thuộc phase nào, và trình duyệt file tự sắp theo đúng thứ tự sẽ làm.

Tính năng chuyển sang phase khác → **đổi tên file và sửa mọi link trỏ tới nó**.
Mỗi file mở đầu bằng một dòng nhãn ngay dưới tiêu đề, ghi phase · tầng · trạng thái đặc tả.

## Cấu trúc một file đặc tả

```
# Tên tính năng
> Một câu: tính năng này giải quyết vấn đề gì

## 1. Vì sao cần        — bỏ qua thì mất gì
## 2. Luật nghiệp vụ    — phần quan trọng nhất
## 3. Luồng chính       — người dùng làm gì, theo thứ tự
## 4. Ca biên           — chỗ hay quên, hay gây bug
## 5. Ngoài phạm vi     — nói rõ cái KHÔNG làm, tránh phình
## 6. Phụ thuộc         — cần tính năng nào có trước
```
