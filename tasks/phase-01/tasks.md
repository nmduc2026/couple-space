# Phase 1 — Danh sách task

Bối cảnh, phạm vi và nhật ký: [context.md](context.md).
**Hướng dẫn từng bước:** [steps/](steps/) — mỗi nhóm một file.

Trạng thái: `[ ]` chưa làm · `[~]` đang làm · `[x]` xong · `[!]` bị chặn

**Nền tảng đã chốt:** Vite + React + TypeScript + Tailwind, đóng gói PWA · Supabase ·
Web Push (VAPID). Xem [tech-stack.md](../../docs/decisions/tech-stack.md).

## A. Khởi tạo dự án → [steps/a-setup.md](steps/a-setup.md)

- [ ] **P1-01** Khởi tạo Vite + React + TypeScript, chạy được `npm run dev`
- [ ] **P1-02** Cài Tailwind, đặt biến màu + chế độ tối ngay từ đầu
- [ ] **P1-03** Cài `vite-plugin-pwa`: manifest, icon, service worker, vùng an toàn iPhone
- [ ] **P1-04** Cài React Router, dựng khung điều hướng 3 trạng thái
- [ ] **P1-05** Tạo project Supabase, cài client, biến môi trường, kết nối thử
- [ ] **P1-05b** Cài TanStack Query + Zustand, tách dữ liệu server khỏi state UI

## B. Database → [steps/b-database.md](steps/b-database.md)

- [ ] **P1-06** Cài Supabase CLI, khởi tạo thư mục migration
- [ ] **P1-07** Migration nền móng + `profiles` — [database-schema.md](../../docs/design/backend/database-schema.md) mục 4
- [ ] **P1-08** Migration `couples` + `couple_members` + trạng thái space — mục 5
- [ ] **P1-09** Hàm phân quyền `is_member_of` / `can_write_to` — mục 6
- [ ] **P1-10** Bật RLS và **kiểm tra bằng hai tài khoản khác nhau** — mục 11

## C. Auth → [steps/c-auth.md](steps/c-auth.md)

- [ ] **P1-11** Màn hình Welcome
- [ ] **P1-12** Nhập email → gửi OTP
- [ ] **P1-13** Nhập OTP → đăng nhập, lưu phiên, tự đăng nhập lại khi mở app
- [ ] **P1-14** Điều hướng theo trạng thái: chưa đăng nhập / chưa có space / đã ghép đôi

## D. Ghép đôi → [steps/d-pairing.md](steps/d-pairing.md)

Đặc tả: [p1-pairing.md](../../docs/features/p1-pairing.md)

- [ ] **P1-15** Màn hình "Bạn đã có mã mời chưa?"
- [ ] **P1-16** Thiết lập đôi: ngày bắt đầu yêu · biệt danh · avatar
- [ ] **P1-17** Sinh mã mời 6 ký tự (bỏ `0 O 1 I L`), hạn 7 ngày
- [ ] **P1-18** Phòng chờ + chia sẻ lời mời + link điền sẵn mã
- [ ] **P1-19** Luồng người thứ hai: xác nhận lời mời → tham gia → thiết lập nhanh
- [ ] **P1-20** Ca biên: space đầy · mã sai/hết hạn · tự mời mình · giới hạn dò mã

## E. Thông báo → [steps/e-notifications.md](steps/e-notifications.md)

*Làm sớm, đừng để cuối phase — đây là phần dễ vỡ kế hoạch nhất.*
Đặc tả: [p1-notifications.md](../../docs/features/p1-notifications.md)

- [ ] **P1-21** Sinh cặp khoá VAPID, lưu vào biến môi trường
- [ ] **P1-22** Xin quyền + đăng ký Web Push, lưu subscription vào database
- [ ] **P1-23** Edge Function gửi thông báo bằng `web-push`
- [ ] **P1-24** Thông báo đầu tiên: "người ấy đã tham gia"
- [ ] **P1-25** Hướng dẫn "Thêm vào Màn hình chính" trong onboarding — không có bước này thì **không có push**

## F. Home + đếm ngày → [steps/f-home.md](steps/f-home.md)

- [ ] **P1-26** Hàm đếm ngày theo ngày lịch ở múi giờ máy + **test các ca biên**
- [ ] **P1-27** Home: ảnh bìa + biệt danh + số ngày lớn + mốc gần nhất
- [ ] **P1-28** Banner "Đang chờ [tên] tham gia" khi chưa ghép đôi
- [ ] **P1-29** Kéo để tải lại + trạng thái ngoại tuyến

## G. Cài đặt + huỷ ghép đôi → [steps/g-settings.md](steps/g-settings.md)

- [ ] **P1-30** Màn hình Cài đặt (vào bằng icon ⚙ ở header Home)
- [ ] **P1-31** Sửa hồ sơ đôi — [p1-couple-profile.md](../../docs/features/p1-couple-profile.md)
- [ ] **P1-32** Bật/tắt từng loại thông báo
- [ ] **P1-33** Huỷ ghép đôi bản rút gọn — [p1-breakup.md](../../docs/features/p1-breakup.md) mục 7

## H. Đưa lên máy thật → [steps/h-deploy.md](steps/h-deploy.md)

- [ ] **P1-34** Đẩy code lên GitHub, nối Vercel, deploy lần đầu
- [ ] **P1-35** Cài PWA lên iPhone cả hai người
- [ ] **P1-36** Chạy hết checklist DoD ở [context.md](context.md) mục 1
