# Phase 1 — Nền móng

> **Mục tiêu:** hai máy nhìn thấy nhau. Đăng nhập được, ghép đôi được, mở app thấy
> số ngày yêu, và người kia nhận được thông báo.

**Trạng thái:** 🔄 Đang làm — nhóm A (khởi tạo) xong, tiếp nhóm B (database)
**Ước lượng:** 2–3 tuần (vừa học vừa làm)
**Nền tảng:** Vite + React + TypeScript + Tailwind → PWA · Supabase · Web Push
**Task:** [tasks.md](tasks.md) · **Hướng dẫn từng bước:** [steps/](steps/)

## 1. Định nghĩa hoàn thành (DoD)

Phase 1 xong khi **cả năm điều** sau đúng trên **máy thật của cả hai người**:

- [ ] Cả hai đăng nhập được bằng email OTP
- [ ] Người thứ nhất tạo space, người thứ hai vào bằng mã mời → cả hai thấy cùng một space
- [ ] Home hiện đúng số ngày yêu (kiểm tra cả trường hợp hai máy khác múi giờ)
- [ ] Người thứ hai tham gia → người thứ nhất **nhận được push** trên iPhone (PWA)
- [ ] Huỷ ghép đôi được, space chuyển chỉ đọc, người kia được báo

## 2. Phạm vi

### Có trong phase này

| Tính năng | Đặc tả |
|---|---|
| Auth email OTP | (Supabase Auth, không cần đặc tả riêng) |
| Ghép đôi | [pairing.md](../../docs/features/p1-pairing.md) |
| Hồ sơ đôi | [couple-profile.md](../../docs/features/p1-couple-profile.md) |
| Home (bản tối giản) | [home-dashboard.md](../../docs/features/p1-home-dashboard.md) |
| Đếm ngày | [day-counter.md](../../docs/features/p1-day-counter.md) |
| Thông báo (đường ống) | [notifications.md](../../docs/features/p1-notifications.md) |
| Huỷ ghép đôi (bản rút gọn) | [breakup.md](../../docs/features/p1-breakup.md) mục 7 |

### KHÔNG có trong phase này

Timeline · ảnh · chi tiêu · sự kiện · mục tiêu · widget · theme tuỳ biến ·
đăng nhập Google/Apple · xuất dữ liệu.

> Home ở phase này **chỉ có ảnh bìa + số ngày + mốc gần nhất**. Các khối khác chưa có
> tính năng tương ứng nên ẩn hẳn — và như vậy là đủ đẹp.

## 3. Tiến độ

### ✅ Đã xong
- Nhóm A (P1-01 → P1-05b): Vite/React/TS, Tailwind + theme, PWA, React Router khung 3 trạng thái, Supabase client (`PUBLISHABLE_KEY`), TanStack Query + Zustand

### 🔄 Đang làm
*(sẵn sàng bắt đầu nhóm B)*

### 🔲 Chưa làm
Nhóm B trở đi — xem [tasks.md](tasks.md).

## 4. Quyết định đã chốt

| # | Đã chốt |
|---|---|
| D1 | ✅ Cả hai iPhone chạy **iOS 26** — thừa điều kiện cho Web Push (cần 16.4+) |
| D2 | ✅ **Vite + React + TypeScript + Tailwind**, đóng gói PWA. Không dùng Expo. |
| D6 | ✅ Ngày bắt đầu yêu tính là **ngày thứ 1** (không phải ngày thứ 0) |
| D4 | ✅ Space `archived` giữ ảnh **6 tháng** |
| D5 | ✅ Ảnh do A đăng thì **B vẫn tải về được** |

**Không còn task nào bị chặn.** Toàn bộ danh sách sẵn sàng làm.

## 5. Rủi ro đã biết

| Rủi ro | Cách giảm |
|---|---|
| Push trên PWA iOS phụ thuộc hành vi của iOS mà mình không kiểm soát (bắt buộc "Thêm vào Màn hình chính", chỉ xin quyền được sau thao tác người dùng) | Làm nhóm E **sớm**, không để cuối phase. Phát hiện trục trặc ở tuần cuối thì hỏng cả kế hoạch nhắc nhở của Phase 3. |
| Lệch 1 ngày do múi giờ | Viết **test** cho hàm đếm ngày **trước khi** làm giao diện — [steps/f-home.md](steps/f-home.md). |
| Quên bật RLS ở một bảng → lộ dữ liệu | Kiểm chứng bằng tài khoản thứ ba, không tin vào cảm giác — [steps/b-database.md](steps/b-database.md). |
| Đẩy nhầm `.env.local` lên GitHub | Kiểm tra `.gitignore` **trước** commit đầu tiên. |

## 6. Nhật ký phiên

> Mỗi phiên thêm **một dòng**. Ghi cụ thể, đừng ghi "đã cập nhật code".

| Ngày | Đã làm | Dừng ở đâu | Bước tiếp theo |
|---|---|---|---|
| 2026-09-11 | Tổ chức lại toàn bộ tài liệu: tách `docs/features/`, đổi `others/` → `decisions/`, dựng `tasks/`, viết `AGENTS.md` | Đặc tả Phase 1–2 xong, chưa có dòng code nào | Chốt các quyết định đang treo |
| 2026-09-11 | Chốt D1–D5. Đổi nền tảng sang **Vite + React (bỏ Expo)**, viết lại `tech-stack.md` và `distribution.md`. Đánh số file feature theo phase (`p1-`, `p2-`…). Viết 8 file hướng dẫn từng bước trong `steps/` | Tài liệu đã đủ để bắt đầu code | **Bắt đầu P1-01** — theo [steps/a-setup.md](steps/a-setup.md) |
| 2026-09-11 | Viết nốt đặc tả Phase 3–6, chốt D6 (không ghi nợ), lưu prototype 36 màn hình vào `docs/design/frontend/ui/` | Không đổi gì trong phase này | Không đổi |
| 2026-09-11 | Làm xong nhóm A (P1-01→P1-05b): scaffold app, Tailwind/theme, PWA+logo, router+mock guards, Supabase `PUBLISHABLE_KEY`, Query+Zustand theme | Kết thúc [a-setup.md](steps/a-setup.md) | **P1-06** — [b-database.md](steps/b-database.md) |
