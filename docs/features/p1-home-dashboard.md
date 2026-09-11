# Home / Dashboard

`Phase 1` · `Tầng 0 — Nền móng` · Đặc tả: ✅ đầy đủ · [← Danh sách tính năng](README.md)

> Một câu: mở app ra là thấy hết, **không cần chạm gì**.

## 1. Vì sao cần

Home là màn hình được mở nhiều nhất. Nếu nó bắt người dùng chạm thêm một cái nữa mới
thấy giá trị thì nguyên tắc *"mở app ra là thấy giá trị ngay"* đã hỏng.

## 2. Các khối trên Home

Cuộn dọc, từ trên xuống — mỗi khối là một lối tắt vào tab tương ứng:

| Khối | Nội dung | Xuất hiện từ |
|---|---|---|
| Ảnh bìa + biệt danh | Ảnh đôi, tên hai người, icon ⚙ Cài đặt | Phase 1 |
| **Số ngày bên nhau** | Con số lớn nhất màn hình + mốc gần nhất | Phase 1 |
| Sắp tới | 1–2 [sự kiện](p3-events-reminders.md) gần nhất kèm số ngày còn lại | Phase 3 |
| 🍜 Tối nay ăn gì? | Số chỗ đang muốn thử — [eat-tonight.md](p2-eat-tonight.md) | Phase 2 |
| Kỉ niệm gần đây | 4 ảnh mới nhất + "Xem tất cả" | Phase 2 |
| Tháng này | Số buổi hẹn + tổng [chi tiêu](p4-expenses.md) | Phase 4 |
| Mục tiêu | [Mục tiêu](p4-goals.md) đang dở + thanh tiến độ | Phase 4 |

> Bố cục hình ảnh cụ thể (khung, khoảng cách, chữ) nằm ở
> [screens-and-flows.md](../design/frontend/screens-and-flows.md) mục 3 — tài liệu này
> chỉ nói **có gì trên Home và vì sao**.

## 3. Luật nghiệp vụ

- **Mỗi khối là một lối tắt** vào tab tương ứng. Không có khối nào chỉ để trang trí.
- **Khối rỗng thì ẩn hẳn**, không hiện "Chưa có dữ liệu". Home của tuần đầu tiên chỉ
  có ảnh bìa + số ngày — và như vậy là đủ đẹp.
- Các khối xuất hiện dần theo phase: Phase 1 chỉ có ảnh bìa + số ngày; khối nào có
  tính năng tương ứng thì mới hiện.
- **Kéo để tải lại.** Bắt buộc — vì [push](p1-notifications.md) có thể không tới.
- Cài đặt là icon ⚙ ở góc header, **không chiếm một tab**.

## 4. Ca biên

| Tình huống | Xử lý |
|---|---|
| Chưa ghép đôi | Hiện banner *"Đang chờ [tên] tham gia"* + nút mời lại. Vẫn vào xem được — **không chặn**. |
| Chưa có ảnh bìa | Dùng nền gradient theo theme màu đã chọn. |
| Mất mạng | Hiện dữ liệu đã cache + dải báo "đang ngoại tuyến". Không hiện màn hình lỗi trắng. |
| Space chuyển sang chỉ đọc (sau [huỷ ghép đôi](p1-breakup.md)) | Ẩn mọi nút thêm mới, giữ nguyên phần xem lại. |

## 5. Ngoài phạm vi

- Tuỳ biến thứ tự các khối.
- Widget — xem [đếm ngày](p1-day-counter.md).

## 6. Phụ thuộc

Gần như mọi tính năng khác đều đổ dữ liệu về đây. Nhưng Home phải **chạy được khi
chưa có tính năng nào** ngoài [đếm ngày](p1-day-counter.md) và [hồ sơ đôi](p1-couple-profile.md).
