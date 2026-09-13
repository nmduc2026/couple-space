# Phase 1 — Danh sách task

Bối cảnh, phạm vi và nhật ký: [context.md](context.md).
**Hướng dẫn từng bước:** [steps/](steps/) — mỗi nhóm một file.

Trạng thái: `[ ]` chưa làm · `[~]` đang làm · `[x]` xong · `[!]` bị chặn

**Nền tảng đã chốt:** Vite + React + TypeScript + Tailwind, đóng gói PWA · Supabase ·
Web Push (VAPID). Xem [tech-stack.md](../../docs/decisions/tech-stack.md).

## A. Khởi tạo dự án → [steps/a-setup.md](steps/a-setup.md)

- [x] **P1-01** Khởi tạo Vite + React + TypeScript, chạy được `npm run dev`
- [x] **P1-02** Cài Tailwind, đặt biến màu + chế độ tối ngay từ đầu
- [x] **P1-03** Cài `vite-plugin-pwa`: manifest, icon, service worker, vùng an toàn iPhone
- [x] **P1-04** Cài React Router, dựng khung điều hướng 3 trạng thái
- [x] **P1-05** Tạo project Supabase, cài client, biến môi trường, kết nối thử
- [x] **P1-05b** Cài TanStack Query + Zustand, tách dữ liệu server khỏi state UI

## B. Database → [steps/b-database.md](steps/b-database.md)

- [x] **P1-06** Cài Supabase CLI, khởi tạo thư mục migration
- [x] **P1-07** Migration nền móng + `profiles` — [database-schema.md](../../docs/design/backend/database-schema.md) mục 4
- [x] **P1-08** Migration `couples` + `couple_members` + trạng thái space — mục 5
- [x] **P1-09** Hàm phân quyền `is_member_of` / `can_write_to` — mục 6
- [~] **P1-10** Bật RLS — đã bật; còn tự thử đọc chéo 2 account trên app

## C. Auth → [steps/c-auth.md](steps/c-auth.md)

Đặc tả: [p1-auth.md](../../docs/features/p1-auth.md)

- [x] **P1-11** Màn hình Welcome
- [x] **P1-12** Nhập email → gửi OTP (màn có tab OTP + Mật khẩu)
- [x] **P1-13** Nhập OTP → đăng nhập, lưu phiên, tự đăng nhập lại khi mở app
- [x] **P1-14** Điều hướng theo trạng thái: chưa đăng nhập / chưa có space / đã ghép đôi
- [x] **P1-37** Tab Mật khẩu trên màn email (`signInWithPassword`)
- [x] **P1-38** Đặt / đổi mật khẩu trong Cài đặt
- [x] **P1-39** Quên mật khẩu + màn đặt lại từ email — còn cấu hình Redirect URLs trên Supabase (tay)

## D. Ghép đôi → [steps/d-pairing.md](steps/d-pairing.md)

Đặc tả: [p1-pairing.md](../../docs/features/p1-pairing.md)

- [x] **P1-15** Màn hình "Bạn đã có mã mời chưa?"
- [x] **P1-16** Thiết lập đôi: ngày bắt đầu yêu · biệt danh · avatar
- [x] **P1-17** Sinh mã mời 6 ký tự (bỏ `0 O 1 I L`), hạn 7 ngày
- [x] **P1-18** Phòng chờ + chia sẻ lời mời + link điền sẵn mã
- [x] **P1-19** Luồng người thứ hai: xác nhận lời mời → tham gia → thiết lập nhanh
- [x] **P1-20** Ca biên trong RPC (đủ người · mã sai/hết hạn · tự mời · rate limit)

## E. Thông báo → [steps/e-notifications.md](steps/e-notifications.md)

*Làm sớm, đừng để cuối phase — đây là phần dễ vỡ kế hoạch nhất.*
Đặc tả: [p1-notifications.md](../../docs/features/p1-notifications.md)

- [~] **P1-21** Sinh cặp khoá VAPID — đã generate; cần bạn ghi vào `.env` + Edge secrets
- [x] **P1-22** Xin quyền + đăng ký Web Push, lưu subscription (UI Cài đặt)
- [x] **P1-23** Edge Function `send-notification` (cần deploy + secrets)
- [x] **P1-24** Thông báo "người ấy đã tham gia" (gọi function sau redeem)
- [x] **P1-25** Hướng dẫn "Thêm vào Màn hình chính" trong Cài đặt

## F. Home + đếm ngày → [steps/f-home.md](steps/f-home.md)

- [x] **P1-26** Hàm đếm ngày + test
- [x] **P1-27** Home: ảnh bìa / gradient + biệt danh + số ngày + mốc
- [x] **P1-28** Banner "Đang chờ ... tham gia"
- [x] **P1-29** Nút tải lại + dải ngoại tuyến (kéo-để-tải-lại tối giản = nút)

## G. Cài đặt + huỷ ghép đôi → [steps/g-settings.md](steps/g-settings.md)

- [x] **P1-30** Màn hình Cài đặt
- [x] **P1-31** Sửa hồ sơ đôi — **đủ cả**: ngày, biệt danh, **ảnh bìa** và **theme màu**. Theme thuộc về space nên đồng bộ realtime; đổi ngày bắt đầu yêu thì báo người kia
- [x] **P1-32** Bật/tắt loại "người ấy tham gia" + bật push máy
- [x] **P1-33** Huỷ ghép đôi bản rút gọn (RPC `unpair`)

## H. Đưa lên máy thật → [steps/h-deploy.md](steps/h-deploy.md)

- [ ] **P1-34** Đẩy code lên GitHub, nối Vercel, deploy lần đầu
- [ ] **P1-35** Cài PWA lên iPhone cả hai người
- [ ] **P1-36** Chạy hết checklist DoD ở [context.md](context.md) mục 1
