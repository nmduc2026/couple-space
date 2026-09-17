# Hồ sơ đôi

`Phase 1` · `Tầng 0 — Nền móng` · Đặc tả: ✅ đầy đủ · [← Danh sách tính năng](README.md)

> Một câu: những thông tin định danh **của cặp đôi**, không phải của từng người.

## 1. Vì sao cần

Đây là chỗ thể hiện rõ nhất nguyên tắc **space-first**: app không hỏi "bạn tên gì"
mà hỏi "hai bạn gọi nhau là gì". Toàn bộ chữ trong app sau đó dùng biệt danh thật
của hai người — không bao giờ dùng "đối tác", "người dùng B".

## 2. Dữ liệu

### Thuộc về space (cả hai cùng sửa được)

| Trường | Bắt buộc | Ghi chú |
|---|---|---|
| Ngày bắt đầu yêu | ✅ | Kiểu **`date`**, không phải `timestamp`. Nền tảng của [đếm ngày](p1-day-counter.md). |
| Ảnh bìa đôi | — | Hiển thị đầu [Home](p1-home-dashboard.md). |
| ~~Theme màu~~ | — | ⚠️ **Đã chuyển sang "thuộc về từng người"** — xem [tasks/README.md](../../tasks/README.md) quyết định D7. Lưu ở `profiles.color_theme`. |

### Thuộc về từng người

| Trường | Bắt buộc | Ghi chú |
|---|---|---|
| Biệt danh | ✅ | Cách người kia gọi mình. Hiện khắp app. |
| Avatar | — | Bỏ qua được, dùng chữ cái đầu làm ảnh mặc định. Đổi ở **Trang cá nhân** (`/profile`) — chạm avatar → xem / đổi. |
| Status tường | — | “Bạn đang nghĩ gì?” — bài ngắn trên trang cá nhân, **không** phải kỉ niệm Timeline. |
| Nhận xét về người kia | — | Một ghi chú dài, chỉ người viết sửa được; người được viết chỉ đọc. Xem/viết trên trang đối phương. |
| Theme màu | — | Chọn từ bộ có sẵn. Dùng **biến màu ngay từ đầu**. |

## 3. Luật nghiệp vụ

- **Cả hai đều sửa được thông tin chung**, kể cả ngày bắt đầu yêu. Không có khái niệm
  "chủ space" — trái với nguyên tắc space-first.
- **Đổi ngày bắt đầu yêu → báo cho người kia.** Đây là con số cảm xúc nhất trong app;
  đổi âm thầm sẽ gây hiểu lầm.
- Biệt danh chỉ chủ nhân sửa được. Không ai đặt biệt danh thay người kia.
- Ngày bắt đầu yêu **không được ở tương lai**.

## 4. Ca biên

| Tình huống | Xử lý |
|---|---|
| Ngày bắt đầu yêu ở tương lai | Chặn ngay khi nhập. |
| Ngày quá xa quá khứ (ví dụ 1950) | Cảnh báo nhẹ, vẫn cho lưu. |
| Biệt danh rỗng / toàn khoảng trắng | Chặn. |
| Đổi theme khi người kia đang mở app | ~~Áp dụng realtime cho cả hai~~ — không còn áp dụng, theme giờ là của từng người (quyết định D7). |

## 5. Ngoài phạm vi

- Nhiều ảnh bìa / album bìa.
- Theme tự tạo màu tuỳ ý — chỉ bộ có sẵn ở Phase 1.

## 6. Phụ thuộc

[Ghép đôi](p1-pairing.md) — màn hình thiết lập nằm trong luồng onboarding.
