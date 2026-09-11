# Huỷ ghép đôi ("chia tay thì sao?")

`Phase 1` · `Tầng 0 — Nền móng` · Đặc tả: ✅ đầy đủ · [← Danh sách tính năng](README.md)

> Một câu: đây là **tính năng thật**, không phải ca biên — và cách xử lý nó quyết định
> app có đáng tin hay không.

## 1. Vì sao cần làm ngay từ Phase 1

Ba lý do:

1. **Xử lý tệ chuyện này là lý do người ta gỡ app** và kể lại cho người khác nghe.
2. Nó ràng buộc **data model**: quyết định "ảnh do A đăng thì B có được giữ không"
   ảnh hưởng tới cách lưu quyền sở hữu ở mọi bảng. Sửa sau rất đắt.
3. Nó cũng là đường thoát cho tình huống tầm thường hơn nhiều: **ghép nhầm người**,
   hoặc muốn tạo lại space từ đầu.

## 2. Nguyên tắc

> **Không xoá gì ngay. Không kịch tính. Luôn cho mang dữ liệu về trước.**

| Nguyên tắc | Vì sao |
|---|---|
| Một người là đủ để huỷ ghép | Bắt cả hai đồng ý thì người muốn thoát bị giam. Không chấp nhận được. |
| Xoá vĩnh viễn thì cần **cả hai** | Một người không được quyền xoá kỉ niệm của người kia. |
| Chuyển sang **chỉ đọc**, không xoá | Cả hai vẫn xem và tải được toàn bộ. |
| Nút "Tải dữ liệu về máy" đặt **trước** nút xác nhận | Nhiều người bấm huỷ trong lúc xúc động. |
| Báo cho người kia nhẹ nhàng | Một thông báo trung tính, không có emoji trái tim vỡ. |

## 3. Luồng

```
Cài đặt → Vùng nguy hiểm → [Huỷ ghép đôi]
  ▼
Màn hình giải thích — nói thẳng, không né tránh:
  • Không gian chuyển sang chỉ đọc, không ai đăng thêm được
  • Cả hai VẪN xem và tải được toàn bộ kỉ niệm
  • Không có gì bị xoá ngay
  • Muốn xoá vĩnh viễn thì cần cả hai cùng xác nhận
  ▼
[Tải toàn bộ dữ liệu về máy]     ← đặt TRƯỚC nút xác nhận
  ▼
Gõ xác nhận → [Huỷ ghép đôi]
  ▼
Space → chỉ đọc  ·  Thông báo cho người kia  ·  Cả hai được tạo space mới
```

## 4. Trạng thái space

| Trạng thái | Đăng mới | Xem lại | Tải về | Ai vào được |
|---|---|---|---|---|
| `active` | ✅ | ✅ | ✅ | Cả hai |
| `archived` (sau huỷ ghép) | ❌ | ✅ | ✅ | Cả hai |
| `deleted` | ❌ | ❌ | ❌ | Không ai |

Chuyển sang `deleted` cần **cả hai cùng xác nhận**, hoặc tự động sau một thời gian dài
không ai truy cập (chưa chốt — xem mục 6).

## 5. Ca biên

| Tình huống | Xử lý |
|---|---|
| Huỷ ghép rồi muốn quay lại | Ghép lại tạo **space mới**. Space cũ vẫn ở chế độ chỉ đọc. Không "hồi sinh" space cũ — trạng thái nửa vời gây rối hơn là giúp. |
| Một người xoá tài khoản | Space chuyển `archived`; người còn lại vẫn xem và tải được. |
| Huỷ ghép khi chưa có người thứ hai | Chỉ là **huỷ space**, xoá thẳng, không cần nghi thức gì. |
| Người kia đang mở app lúc bị huỷ | Cập nhật realtime sang chế độ chỉ đọc + thông báo trong app. |
| Một người ở nhiều space cũ `archived` | Cho phép. Danh sách "không gian cũ" trong Cài đặt. |

## 6. Hai điều đã chốt

**Space `archived` giữ ảnh 6 tháng.** Sau 6 tháng không ai truy cập → báo trước 30 ngày
qua email → xoá ảnh, **giữ lại toàn bộ phần chữ** (caption, bình luận, sự kiện, chi tiêu).
Đủ lâu để nguôi ngoai và kịp tải dữ liệu về; đủ ngắn để không đốt tiền lưu trữ —
xem [cost-estimate.md](../decisions/cost-estimate.md).

**Ảnh do A đăng thì B vẫn tải về được.** Kỉ niệm là của chung — đó là toàn bộ định vị của
app, và cách hiểu ngược lại biến mọi tấm ảnh thành tài sản tranh chấp. Điều này phải
**nói rõ ngay lúc onboarding**, không để người dùng phát hiện vào lúc chia tay.

> Hệ quả lên data model: mọi ảnh thuộc về `couple_id`; cột `author_id` chỉ để hiển thị
> "ai đăng" — **không** dùng làm cơ sở phân quyền.

## 7. Phạm vi Phase 1

Phase 1 chỉ cần: **chuyển sang chỉ đọc + thông báo + cho tạo space mới**.
Xuất dữ liệu đầy đủ và xoá vĩnh viễn làm ở Phase 6 cùng
[album & sao lưu](p6-albums-export.md) — nhưng **trạng thái space phải có trong schema
ngay từ đầu**.

## 8. Phụ thuộc

[Ghép đôi](p1-pairing.md) · [Thông báo](p1-notifications.md) ·
[Album & sao lưu](p6-albums-export.md) (phần tải dữ liệu về, Phase 6).
