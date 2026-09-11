# Wishlist quà tặng

`Phase 6` · `Tầng 2 — Làm app dính` · Đặc tả: 🔲 mới có tóm tắt · [← Danh sách tính năng](README.md)

> **Trạng thái: chưa đặc tả đầy đủ** — thuộc **Phase 6**.
> Dưới đây là tóm tắt đã thống nhất. Viết chi tiết trước khi phase 6 bắt đầu.

## Tóm tắt

- Mỗi người liệt kê thứ mình thích.
- Người kia xem được nhưng **không biết mình đã xem gì** → giữ được bất ngờ.

## Cần làm rõ khi đặc tả

- Đây là dữ liệu *của một người* trong không gian chung → RLS phải khác khuôn mẫu
  `couple_id` thông thường.
- Đã chốt (D3): app **không có khu vực riêng tư chung chung**. Đây là một trong ba ngoại lệ
  duy nhất, và nó chỉ giấu **một việc rất hẹp** — *ai đã xem mục nào* — chứ không giấu nội
  dung. Cả hai vẫn thấy toàn bộ wishlist của nhau.
- Có đánh dấu "đã mua" mà người kia không thấy không?
