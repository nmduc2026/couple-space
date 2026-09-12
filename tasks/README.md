# Tasks — bảng điều khiển

> **Đây là cửa vào duy nhất.** Mọi phiên làm việc (Claude / Codex / Cursor) bắt đầu
> bằng việc đọc file này, rồi đọc `context.md` của phase đang chạy.
> Quy trình đầy đủ: [../AGENTS.md](../AGENTS.md) mục 2.

## Prototype

36 màn hình bấm được của cả 6 phase, dựng theo đặc tả trong `docs/features/`:
**[docs/design/frontend/ui/prototype.html](../docs/design/frontend/ui/prototype.html)**
— mở bằng trình duyệt. Sửa tính năng thì **sửa prototype cùng lúc với đặc tả**, để nó không
lệch khỏi tài liệu.

## Đưa lên thật

Bước đang chặn mọi thứ còn lại: **[DEPLOY.md](DEPLOY.md)** — thứ tự bắt buộc
(secrets → deploy function → DB settings → `db push`), kèm những việc phải
kiểm chứng bằng tay sau đó.

## Phase đang chạy

> ### ✅ **Code xong · backend đã chạy thật · đã có dữ liệu mẫu**
> 22 migration đã push, 4 Edge Function đã deploy, cron đang chạy, dữ liệu mẫu
> đã đổ. RLS kiểm bằng token thật của cả hai người — tất cả đạt. Xuất PDF chạy
> thật ra sách 13 trang.
>
> **Còn 4 task, đều cần máy thật:**
>
> | Phase | Còn |
> |---|---|
> | 1 | P1-34 Vercel · P1-35 cài PWA · P1-36 checklist DoD |
> | 3 | P3-28 để máy qua đêm, xác nhận giờ push |
>
> Chi tiết và những cái bẫy đã vấp: **[DEPLOY.md](DEPLOY.md)**.

## Toàn cảnh

| Phase | Tên | Mục tiêu | Task | Hướng dẫn từng bước | Trạng thái |
|---|---|---|---|---|---|
| [1](phase-01/context.md) | Nền móng | Hai máy nhìn thấy nhau | 36 | ✅ [steps/](phase-01/steps/) | 🔄 Code xong · còn deploy |
| [2](phase-02/context.md) | Kỉ niệm | App có nội dung | 26 | ✅ [steps/](phase-02/steps/) | ✅ Code xong |
| [3](phase-03/context.md) | Nhịp sống | Có lý do mở app hằng ngày | 28 | ✅ [steps/](phase-03/steps/) | 🔄 Code xong · còn test qua đêm |
| [4](phase-04/context.md) | Cùng nhau | Khác biệt so với app cùng loại | 38 | ✅ [steps/](phase-04/steps/) | ✅ Code xong |
| [5](phase-05/context.md) | Gắn kết | Giữ chân | 42 | ✅ [steps/](phase-05/steps/) | 🔄 Code xong · còn kiểm chứng RLS |
| [6](phase-06/context.md) | Lan truyền | Tăng trưởng | 50 | ✅ [steps/](phase-06/steps/) | 🔄 Code xong · còn test 2 tài khoản |

**220 task** cho cả 6 phase. Đặc tả nghiệp vụ đã đầy đủ cho **cả 19 tính năng**.

**220 task, 26 file hướng dẫn từng bước** — đủ cho cả 6 phase.

> ⚠️ **`steps/` của Phase 3–6 viết trước khi có code thật.** Tên file, tên hàm và lệnh cài
> thư viện trong đó là **dự kiến** theo quy ước đặt ở Phase 1. Khi bắt tay vào một phase,
> nếu code thật khác — **tin code thật**, rồi sửa lại file hướng dẫn. Phần luật nghiệp vụ
> và cảnh báo "bẫy" thì không phụ thuộc code, dùng được nguyên.

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
| D6 | Chi tiêu có ghi nợ nhau không? | ✅ **Không.** Bỏ số dư nợ, nút "đã thanh toán", và cách chia. Chỉ ghi ai trả để thống kê. Trái định vị sản phẩm, và là nguồn phức tạp lớn nhất của Phase 4. | [p4-expenses.md](../docs/features/p4-expenses.md) mục 1 |

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
