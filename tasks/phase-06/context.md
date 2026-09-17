# Phase 6 — Lan truyền

> **Mục tiêu:** tổng kết, xuất dữ liệu, và những thứ khoe được ra ngoài.

**Trạng thái:** 🔲 Chưa bắt đầu (chờ Phase 5 xong)
**Task:** [tasks.md](tasks.md) · **Hướng dẫn từng bước:** [steps/](steps/)

## 1. Định nghĩa hoàn thành (DoD)

- [ ] Bản đồ hiện đúng số tỉnh thành đã đi, chạm vào một nơi lọc được Timeline
- [ ] Địa điểm lạ → app hỏi **một lần**, lần sau tự nhận
- [ ] Wrapped sinh ra và **kể được một câu chuyện**, không phải một bảng số
- [ ] Wrapped không có câu nào so sánh theo hướng tiêu cực
- [ ] Xuất ảnh Wrapped, chia sẻ được lên mạng xã hội từ iPhone
- [ ] Album tự động gom đúng ít nhất một chuyến đi có thật
- [ ] Xuất PDF vài trăm ảnh → chạy nền, nhận push khi xong, file mở được
- [ ] **Tải ZIP toàn bộ dữ liệu, giải nén, mở `ky-niem.html` xem lại được mà không cần app**
- [ ] Nút tải dữ liệu ở màn hình huỷ ghép đôi **đã hết trạng thái "Sắp có"**
- [ ] Wishlist: dùng hai tài khoản thật, xác nhận chủ wishlist **không biết** người kia đã xem/đánh dấu gì

## 2. Phạm vi

| Tính năng | Đặc tả |
|---|---|
| Bản đồ dấu chân | [footprint-map.md](../../docs/features/p6-footprint-map.md) |
| Tổng kết năm (Wrapped) ⭐ | [wrapped.md](../../docs/features/p6-wrapped.md) |
| Album & xuất PDF | [albums-export.md](../../docs/features/p6-albums-export.md) |
| Xuất toàn bộ dữ liệu | [albums-export.md](../../docs/features/p6-albums-export.md) — hoàn thiện flow [huỷ ghép đôi](../../docs/features/p1-breakup.md) |
| Wishlist quà tặng | [gift-wishlist.md](../../docs/features/p6-gift-wishlist.md) |

## 3. Tiến độ

### ✅ Đã xong
*(chưa có)*

### 🔄 Đang làm
*(chưa bắt đầu)*

### 🔲 Chưa làm
Toàn bộ — xem [tasks.md](tasks.md).

## 4. Quyết định đang treo

*(chưa có — thêm vào đây khi phát sinh)*

## 5. Nhật ký phiên

| Ngày | Đã làm | Dừng ở đâu | Bước tiếp theo |
|---|---|---|---|
| 2026-09-11 | Tạo khung phase | Chưa bắt đầu | Chờ phase trước đạt DoD |
| 2026-09-11 | Viết đặc tả đầy đủ 4 tính năng Phase 6 + dựng 4 màn hình prototype | Đã có đặc tả, chưa chia task | Chờ Phase 5 đạt DoD |
| 2026-09-17 | Admin units 34+3321 (DB), GeoJSON tỉnh+xã lazy, MapScreen choropleth + `/map/:code`, Compose select tỉnh→xã, bỏ hardcode provinces.ts | Migration `20261001120000_admin_units.sql` chưa `db push`; prototype chưa sync đầy đủ | `supabase db push` · smoke map trên máy thật · chỉnh UI zoom nếu cần |
| 2026-09-17 | Vá Vite: plugin `geojson-as-json` (`.geojson` → `export default`) — hết crash `/map` `Unexpected token ':'` | Build pass; cần reload dev server | Smoke `/map` · `db push` nếu chưa |
| 2026-09-17 | Map trống hồng: geometry simplify làm polygon “lật” tô kín khung; rebuild GeoJSON từ HF + contrast fill/stroke | Provinces+communes project sạch (d3 bounds OK) | Reload `/map` · `db push` nếu chưa |
| 2026-09-17 | Map UI: bỏ hint, map `fillHeight`, nhãn tỉnh + tint miền + chip khi chạm | Đã xong UI polish | Smoke `/map` · `db push` nếu chưa |
| 2026-09-17 | Sửa map cắt nửa: AppShell `h-app` + `fitExtent`; bỏ tint miền (chỉ tô khi đã đi) | Chờ reload xác nhận | Smoke `/map` |
| 2026-09-17 | Compose: SelectField Modal, thứ tự Tỉnh→Xã→Địa điểm; GPS fill 2 bước; map nút ± zoom | Xong | Smoke compose + map |
| 2026-09-17 | Map: inset Hoàng Sa + Trường Sa (tô theo tỉnh cha Đà Nẵng / Khánh Hòa) | Xong | Smoke `/map` |
| 2026-09-17 | Map: vẽ Hoàng Sa/Trường Sa trên cùng bản đồ (bỏ ô inset), fitExtent cả Biển Đông | Xong | Smoke `/map` |
| 2026-09-17 | Thử polygon trong DB rồi **đổi lại**: giữ GeoJSON ở `src/lib/geo/` như cũ (không cột geometry / không seed:geo) | Đã revert xong | Smoke `/map` · `db push` admin_units nếu chưa |
| 2026-09-17 | Map UI: số thống nhất; list tỉnh đã đi (sort lần↓/tên); bỏ popup hỏi tỉnh → nhóm Khác + sửa qua PostDetail; nền map `bg-surface` | Xong | Smoke `/map` + sửa kỉ niệm gắn tỉnh |
| 2026-09-17 | Map: thêm tổng lần + bỏ bold; Trang cá nhân `/profile` (cover + avatar); lối vào từ Home (avatar) + Cài đặt | Xong | Đổi avatar trên máy thật |
