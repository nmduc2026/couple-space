# Đếm ngày quen nhau

`Phase 1` · `Tầng 1 — MVP` · Đặc tả: ✅ đầy đủ · [← Danh sách tính năng](README.md)

> Một câu: con số lớn ở [Home](p1-home-dashboard.md) khiến mở app ra là thấy giá trị ngay.

## 1. Vì sao cần

Đây là tính năng **đơn giản nhất và được nhìn nhiều nhất** của cả app. Nó cũng là
lý do người ta cài app loại này ngay từ đầu.

## 2. Luật nghiệp vụ

### Cách tính — chỗ dễ sai nhất

> **Tính theo ngày lịch ở múi giờ người dùng, không theo mốc thời gian UTC.**

```
số ngày = (ngày hôm nay ở múi giờ người dùng) − (ngày bắt đầu yêu)
```

- Ngày bắt đầu yêu lưu kiểu `date` (không có giờ, không có múi giờ).
- **Không** dùng `now()` của server rồi trừ ra mili-giây — cách đó lệch 1 ngày với
  người ở múi giờ khác, và lỗi này rất khó phát hiện muộn.
- Ngày bắt đầu tính là **ngày thứ 1** hay **ngày thứ 0**? → **Chốt: ngày thứ 1.**
  Hôm bắt đầu yêu hiển thị "ngày thứ 1", đúng với cách người Việt nói.

### Mốc tự động

App tự sinh các mốc, không cần người dùng tạo:

| Loại mốc | Ví dụ |
|---|---|
| Trăm ngày | 100, 200, 300, 500, 1000, 2000… |
| Tròn tháng | đủ 1 tháng, 2 tháng… (theo ngày trong tháng, không phải 30 ngày) |
| Tròn năm | 1 năm, 2 năm… |

- Mốc gần nhất hiện ngay dưới con số lớn: *"còn 88 ngày nữa là 500"*.
- Mỗi mốc tự sinh một [sự kiện](p3-events-reminders.md) + nhắc trước 3 ngày.
- Mốc hệ thống **không xoá được** nhưng **tắt nhắc được**.
- Tròn tháng có thể gây ồn (mỗi tháng một lần) → mặc định **chỉ nhắc mốc tròn năm và
  trăm ngày**; tròn tháng chỉ hiện, không nhắc.

## 3. Ca biên

| Tình huống | Xử lý |
|---|---|
| Hai người khác múi giờ | Mỗi máy hiển thị theo múi giờ **của máy đó**. Chấp nhận lệch 1 ngày giữa hai người — đúng với cảm nhận thực tế của mỗi người. |
| Người dùng đổi múi giờ khi đi du lịch | Số ngày cập nhật theo múi giờ mới. Không cố giữ số cũ. |
| Đổi ngày bắt đầu yêu | Mọi mốc tính lại; mốc đã qua không gửi thông báo hồi tố. |
| Tròn tháng vào ngày 31 | Tháng không có ngày 31 thì lấy **ngày cuối tháng**. |
| Ngày bắt đầu là 29/2 | Năm không nhuận lấy **28/2**. |
| Chưa ghép đôi | Vẫn đếm được — ngày bắt đầu yêu đã nhập lúc tạo space. |

## 4. Ngoài phạm vi

- **Widget màn hình khoá** — PWA trên iOS không hỗ trợ. Xem
  [distribution.md](../decisions/distribution.md). Thay thế: một
  [push hằng ngày](p1-notifications.md) *"Hôm nay là ngày thứ 386 💕"*, bật/tắt được.
- Đếm ngược tới ngày cưới, đếm ngày xa nhau — để sau.

## 5. Phụ thuộc

- [Hồ sơ đôi](p1-couple-profile.md) — nguồn của ngày bắt đầu yêu.
- [Sự kiện & nhắc nhở](p3-events-reminders.md) — nơi mốc tự động hiện ra (Phase 3).
