# Dòng thời gian kỉ niệm (Timeline)

`Phase 2` · `Tầng 1 — MVP` · Đặc tả: ✅ đầy đủ · [← Danh sách tính năng](README.md)

> Một câu: một dòng thời gian **chung**, cả hai cùng đăng — nơi app tích được dữ liệu
> để mọi tính năng sau này dựa vào.

## 1. Vì sao cần

Timeline là **nội dung** của app. Không có nó thì [Wrapped](p6-wrapped.md),
[bản đồ dấu chân](p6-footprint-map.md), [album](p6-albums-export.md) và phần thống kê của
[Ăn gì](p2-eat-tonight.md) đều không có gì để tính.

## 2. Luật quan trọng nhất

> **Đăng một kỉ niệm phải xong dưới 30 giây, và chỉ có caption là bắt buộc.**

Mọi trường khác đều tuỳ chọn và đều có giá trị đoán sẵn hợp lý. Bắt buộc điền nhiều
trường = không ai đăng = app chết. Đây là cùng một bài học đã ghi ở
[Ăn gì](p2-eat-tonight.md) mục 3.

| Trường | Cách lấy |
|---|---|
| Ảnh / video | Người dùng chọn, tối đa theo `VITE_MAX_PHOTOS` (mặc định 8) |
| Caption | Gõ tay — **trường duy nhất nên có** |
| Ngày | **Tự điền từ EXIF** ảnh đầu tiên, sửa được |
| Địa điểm | Tuỳ chọn, gợi ý từ các nơi đã đi |
| Loại hoạt động | Một chạm chọn icon: 🍜 🍰 ✈️ 🎬 🏠 … |
| Chi phí | Tuỳ chọn, mở gọn xuống → sinh thẳng một khoản [chi tiêu](p4-expenses.md) |

## 3. Luồng đăng bài

```
(+) → "Kỉ niệm mới"
  ▼
Mở THẲNG thư viện ảnh — không có màn hình trung gian
  ▼
MỘT màn hình soạn bài duy nhất (không chia nhiều bước)
  ├─ Ảnh đã chọn (kéo sắp xếp, xoá)
  ├─ Caption          ← con trỏ đặt sẵn ở đây
  ├─ Ngày             ← điền sẵn từ EXIF
  ├─ Địa điểm · Hoạt động · 💰 Chi phí   ← tuỳ chọn
  ▼
[Đăng]
  ├─ Bài hiện NGAY trên timeline ở trạng thái "đang tải"
  ├─ Ảnh upload chạy nền
  └─ Xong → push cho người kia
```

**Phản hồi lạc quan (optimistic).** Đăng bài, thả tim, bình luận đều hiện ngay lập tức,
đồng bộ chạy nền. App cảm xúc mà giật lag thì mất hết cảm giác.

## 4. Xem lại

- Hai chế độ: **Dòng thời gian** (thẻ lớn, có caption và tương tác) và
  **Lưới ảnh** (3 cột, chỉ ảnh).
- Mỗi thẻ timeline hiện **header kiểu feed**: avatar chữ cái + biệt danh người
  đăng + thời điểm đăng (`created_at`, dạng tương đối). Không cần vào chi tiết
  mới biết ai đăng.
- Bài **của mình** có nút `⋯` ngay trên thẻ → **Cập nhật** / **Xoá** (xoá hỏi
  xác nhận tại chỗ; cập nhật mở form sửa ở màn chi tiết). Form sửa cho phép
  **thêm / xoá ảnh** (cùng giới hạn `VITE_MAX_PHOTOS`), không chỉ sửa chữ.
  Bài của người kia không có menu này.
- Ngày kỉ niệm (`happened_on`), nơi chốn và hoạt động vẫn nằm dưới caption —
  đó là ngày sự kiện, khác với lúc bài được đăng lên.
- Chia nhóm theo tháng, tiêu đề dính (`Tháng 9, 2026`).
- Chạm vào → chi tiết: cùng header người đăng, ảnh toàn màn hình (vuốt ngang)
  + bình luận bên dưới.
- Lọc theo năm, theo hoạt động.

## 5. Tương tác

- **Thả tim**: một loại duy nhất, không có bộ reaction. Đơn giản hơn và hợp tông app.
- **Bình luận**: chỉ giữa hai người, hiện realtime.
- Xoá bài → xoá luôn bình luận của bài đó.

## 6. Ca biên

| Tình huống | Xử lý |
|---|---|
| Ảnh không có EXIF (ảnh tải về, ảnh chụp màn hình) | Mặc định **ngày hôm nay**, sửa được. |
| EXIF có ngày ở tương lai | Bỏ qua, dùng ngày hôm nay. |
| Mất mạng lúc đăng | Xếp vào **hàng đợi đồng bộ**, bài hiện ở trạng thái "chờ gửi". Đi chơi thường không có mạng tốt — đây là tình huống thường gặp, không phải hiếm. |
| Upload dở dang rồi tắt app | Tiếp tục ở lần mở sau, hoặc cho huỷ. |
| Ảnh quá lớn | **Nén ở client trước khi upload**, ngay từ ngày đầu. Đây là khoản chi phí lớn nhất về sau — xem [cost-estimate.md](../decisions/cost-estimate.md). |
| Video | ⚠️ Video phá vỡ mọi tính toán dung lượng. **Phase 2 chỉ làm ảnh.** |
| Cả hai cùng sửa một bài | Người lưu sau thắng. Với 2 người dùng thì đủ. |
| Xoá bài có gắn chi phí | Hỏi rõ: xoá luôn khoản chi hay giữ lại. |

## 7. Ngoài phạm vi (Phase 2)

- Video.
- Sticker.
- Xem theo bản đồ → [bản đồ dấu chân](p6-footprint-map.md), Phase 6.
- Album theo chủ đề → [album](p6-albums-export.md), Phase 6.

## 8. Phụ thuộc

- [Ghép đôi](p1-pairing.md) + [hồ sơ đôi](p1-couple-profile.md) — phải xong trước.
- [Thông báo](p1-notifications.md) — push khi có bài mới.
- Supabase Storage + nén ảnh ở client.
