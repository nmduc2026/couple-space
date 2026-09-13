# Phase 1 — Nền móng

> **Mục tiêu:** hai máy nhìn thấy nhau. Đăng nhập được, ghép đôi được, mở app thấy
> số ngày yêu, và người kia nhận được thông báo.

**Trạng thái:** 🔄 Đang làm — nhóm A (khởi tạo) xong, tiếp nhóm B (database)
**Ước lượng:** 2–3 tuần (vừa học vừa làm)
**Nền tảng:** Vite + React + TypeScript + Tailwind → PWA · Supabase · Web Push
**Task:** [tasks.md](tasks.md) · **Hướng dẫn từng bước:** [steps/](steps/)

## 1. Định nghĩa hoàn thành (DoD)

Phase 1 xong khi **cả năm điều** sau đúng trên **máy thật của cả hai người**:

- [ ] Cả hai đăng nhập được bằng email OTP (và bằng mật khẩu nếu đã đặt — [p1-auth.md](../../docs/features/p1-auth.md))
- [ ] Người thứ nhất tạo space, người thứ hai vào bằng mã mời → cả hai thấy cùng một space
- [ ] Home hiện đúng số ngày yêu (kiểm tra cả trường hợp hai máy khác múi giờ)
- [ ] Người thứ hai tham gia → người thứ nhất **nhận được push** trên iPhone (PWA)
- [ ] Huỷ ghép đôi được, space chuyển chỉ đọc, người kia được báo

## 2. Phạm vi

### Có trong phase này

| Tính năng | Đặc tả |
|---|---|
| Đăng nhập (OTP + mật khẩu) | [p1-auth.md](../../docs/features/p1-auth.md) |
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
- Nhóm A–G (code): auth OTP, pairing RPC, Home/đếm ngày, settings/unpair, push client + Edge Function skeleton
- Migration RPC/push/realtime đã `db push`

### 🔄 Đang làm
- **P1-10 / P1-21 / P1-23 / nhóm H** — cần thao tác tay: thử RLS trên app, ghi VAPID secrets, deploy function + Vercel, cài PWA iPhone

### ✅ Auth mật khẩu (code)
- P1-37 → P1-39 code xong; còn cấu hình Redirect URLs trên Supabase khi deploy

### 🔲 Chưa làm
P1-34 → P1-36 (deploy máy thật)

## 4. Quyết định đã chốt

| # | Đã chốt |
|---|---|
| D1 | ✅ Cả hai iPhone chạy **iOS 26** — thừa điều kiện cho Web Push (cần 16.4+) |
| D2 | ✅ **Vite + React + TypeScript + Tailwind**, đóng gói PWA. Không dùng Expo. |
| D6 | ✅ Ngày bắt đầu yêu tính là **ngày thứ 1** (không phải ngày thứ 0) |
| D4 | ✅ Space `archived` giữ ảnh **6 tháng** |
| D5 | ✅ Ảnh do A đăng thì **B vẫn tải về được** |
| D8 | ✅ Auth lâu dài: **OTP lần đầu** + **mật khẩu tuỳ chọn** (đặt trong Cài đặt); không Google/Apple ở Phase 1 — [p1-auth.md](../../docs/features/p1-auth.md) |

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
| 2026-09-11 | P1-06→P1-09 + push RLS nền: `profiles`, `couples`, `couple_members`, `invites`, `is_member_of`/`can_write_to` | P1-10 còn thử 2 account | Kiểm chứng RLS rồi sang nhóm C (auth) |
| 2026-09-11 | Xác nhận P1-07: 2 user Auth → 2 dòng `profiles` (trigger OK). P1-10 phép thử đọc chéo để sau login app | Sẵn sàng nhóm C | **P1-11** Welcome — [c-auth.md](steps/c-auth.md) |
| 2026-09-11 | Implement phần lớn Phase 1 (C–G): OTP, guards thật, pairing RPC, Home, settings/unpair, push SW + `send-notification` | Còn VAPID secrets, deploy function/Vercel, thử tay trên 2 máy | P1-21 secrets → deploy function → P1-34 Vercel |
| 2026-09-11 | Review + làm lại toàn bộ UI Phase 1 theo `prototype.html`: bảng màu hồng đất, font Be Vietnam Pro, primitive dùng chung (`components/ui.tsx` + `lib/ui-classes.ts`), viết lại 9 màn hình, tách **màn huỷ ghép đôi riêng** `/settings/unpair`. Sửa: ẩn tab mật khẩu khỏi bản build thật, safe-area iPhone bị đè, input trong suốt ở dark mode, `:focus-visible`, bỏ 2 chỗ setState-trong-effect | Build + lint + test sạch, chưa xem trên máy thật | P1-21 secrets → deploy function → P1-34 Vercel |
| 2026-09-13 | Phase 1 docs+prototype hướng B auth: thêm [p1-auth.md](../../docs/features/p1-auth.md) (OTP + mật khẩu lâu dài), cập nhật pairing/flows/README; prototype thêm email-pw · forgot · reset · set-password; task P1-37→P1-39 | Chưa đụng code app | **P1-37** — bỏ gate DEV, login 2 tab |
| 2026-09-13 | P1-37: bỏ gate DEV trên EmailScreen, luôn 2 tab (mặc định OTP), copy lỗi cho user thường, link Quên mật khẩu → ForgotPasswordScreen + route /login/forgot | Chưa P1-38/39 reset | **P1-38** đặt MK trong Cài đặt |
| 2026-09-13 | P1-38+P1-39: SetPasswordScreen /settings/password, ResetPasswordScreen /login/reset (ngoài GuestOnly), link Settings, lib/password.ts; cập nhật DEPLOY Redirect URL | Chờ review + cấu hình Supabase Redirect | P1-34 Vercel hoặc review tay auth |
