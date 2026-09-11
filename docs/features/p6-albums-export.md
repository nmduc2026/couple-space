# Album & sao lưu

`Phase 6` · `Tầng 2 — Làm app dính` · Đặc tả: 🔲 mới có tóm tắt · [← Danh sách tính năng](README.md)

> **Trạng thái: chưa đặc tả đầy đủ** — thuộc **Phase 6**.
> Dưới đây là tóm tắt đã thống nhất. Viết chi tiết trước khi phase 6 bắt đầu.

## Tóm tắt

- Album theo chủ đề / chuyến đi, gom từ [Timeline](p2-timeline.md).
- Xuất PDF "cuốn sách tình yêu" để in.
- **Xuất toàn bộ dữ liệu** — đây vừa là tính năng, vừa là yêu cầu về quyền dữ liệu
  người dùng, và là chỗ dựa cho flow [huỷ ghép đôi](p1-breakup.md).

## Cần làm rõ khi đặc tả

- Xuất PDF chạy ở client hay server? Vài trăm ảnh thì client sẽ đuối.
- Định dạng xuất dữ liệu: JSON + thư mục ảnh, hay ZIP?
