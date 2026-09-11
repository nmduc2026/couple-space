# Tasks — bảng điều khiển

> **Đây là cửa vào duy nhất.** Mọi phiên làm việc (Claude / Codex / Cursor) bắt đầu
> bằng việc đọc file này, rồi đọc `context.md` của phase đang chạy.
> Quy trình đầy đủ: [../AGENTS.md](../AGENTS.md) mục 2.

## Phase đang chạy

> ### 🔄 **Phase 1 — Nền móng**
> Chưa bắt đầu viết code. Đang hoàn thiện đặc tả.
> → [phase-01/context.md](phase-01/context.md) · [phase-01/tasks.md](phase-01/tasks.md)

## Toàn cảnh

| Phase | Tên | Mục tiêu | Trạng thái |
|---|---|---|---|
| [1](phase-01/context.md) | Nền móng | Hai máy nhìn thấy nhau | 🔲 Chưa bắt đầu |
| [2](phase-02/context.md) | Kỉ niệm | App có nội dung | 🔲 Chưa bắt đầu |
| [3](phase-03/context.md) | Nhịp sống | Có lý do mở app hằng ngày | 🔲 Chưa bắt đầu |
| [4](phase-04/context.md) | Cùng nhau | Khác biệt so với app cùng loại | 🔲 Chưa bắt đầu |
| [5](phase-05/context.md) | Gắn kết | Giữ chân | 🔲 Chưa bắt đầu |
| [6](phase-06/context.md) | Lan truyền | Tăng trưởng | 🔲 Chưa bắt đầu |

Ký hiệu: 🔲 chưa bắt đầu · 🔄 đang làm · ✅ xong · ⏸ tạm dừng

## Quyết định đã chốt

Đã chốt, **không bàn lại** trừ khi bối cảnh đổi. Chi tiết ở cột cuối.

| # | Câu hỏi | Đã chốt | Ghi ở đâu |
|---|---|---|---|
| D1 | iPhone có đủ iOS 16.4+ để nhận push trên PWA không? | ✅ **Cả hai máy chạy iOS 26** — không vướng gì | [p1-notifications.md](../docs/features/p1-notifications.md) |
| D2 | Expo hay web thuần? | ✅ **Vite + React + TypeScript + Tailwind**, đóng gói PWA. Không dùng Expo. Sau này muốn lên store thì bọc bằng Capacitor. | [tech-stack.md](../docs/decisions/tech-stack.md) |
| D3 | Có khu vực "chỉ mình thấy" trong không gian chung không? | ✅ **Không có nhật ký riêng.** Mọi thứ trong space là chung. Chỉ 3 ngoại lệ có kiểm soát. | [../overview.md](../overview.md) mục 3 |
| D4 | Space `archived` giữ ảnh bao lâu? | ✅ **6 tháng** không ai truy cập → báo trước 30 ngày → xoá ảnh, giữ phần chữ | [p1-breakup.md](../docs/features/p1-breakup.md) |
| D5 | Ảnh do A đăng thì B có tải về được không? | ✅ **Có.** Kỉ niệm là chung — đó là toàn bộ định vị của app. | [p1-breakup.md](../docs/features/p1-breakup.md) |

## Quyết định đang treo

*(Chưa có. Phát sinh thì thêm vào đây, ghi rõ nó chặn task nào.)*

## Cách ghi chép

**Đầu phiên:** đọc file này → `phase-XX/context.md` → tài liệu liên quan.

**Cuối phiên — bắt buộc:**
1. Tick task đã xong trong `phase-XX/tasks.md`
2. Thêm một dòng vào **Nhật ký phiên** của `phase-XX/context.md`
3. Phát sinh câu hỏi cần chốt → thêm vào bảng **Quyết định đang treo**
4. Xong cả phase → đổi trạng thái ở bảng trên + đổi mục **Phase đang chạy**

> Phiên sau chỉ biết đúng những gì phiên trước ghi lại. Không ghi = coi như chưa làm.
