# Phase 6 — Danh sách task

Bối cảnh và nhật ký: [context.md](context.md).
**Hướng dẫn từng bước:** [steps/](steps/) — mỗi nhóm một file.
Đặc tả: [p6-footprint-map.md](../../docs/features/p6-footprint-map.md) ·
[p6-wrapped.md](../../docs/features/p6-wrapped.md) ·
[p6-albums-export.md](../../docs/features/p6-albums-export.md) ·
[p6-gift-wishlist.md](../../docs/features/p6-gift-wishlist.md)

Trạng thái: `[ ]` chưa làm · `[~]` đang làm · `[x]` xong · `[!]` bị chặn

> **Phase này hầu như không tạo dữ liệu mới** — nó đọc lại những gì 5 phase trước đã tích.
> Vì vậy nó chỉ có ý nghĩa khi app **đã dùng thật ít nhất vài tháng**. Làm sớm thì không có
> gì để kể.

## A. Bản đồ dấu chân → [steps/a-map.md](steps/a-map.md)

- [~] **P6-01** Tìm/dựng file **SVG 63 tỉnh thành Việt Nam** (không dùng Leaflet — xem đặc tả mục 3) — **chưa có SVG thật**; bản đồ hiện là lưới 63 tỉnh xếp theo ba miền
- [x] **P6-02** Bảng chuẩn hoá địa điểm: tên tự do → tỉnh/thành, có danh sách đồng nghĩa (*Sài Gòn* = *TP.HCM*)
- [x] **P6-03** Tra ngược từ toạ độ (bài có link Google Maps) ra tỉnh/thành — `provinceByCoords()`, tâm 63 tỉnh gần đúng; lấp lửng hoặc ngoài VN thì trả null chứ không đoán bừa
- [x] **P6-04** Khớp tên với danh sách 63 tỉnh, xử lý dấu và cách viết
- [x] **P6-05** **Hỏi người dùng một lần** với địa điểm không khớp, lưu lại để lần sau tự nhận — `usePlaceResolution` + hộp thoại `AskProvince` trên màn Dấu chân
- [x] **P6-06** Vẽ bản đồ: tỉnh đã đi tô màu, chấm kèm tên và số lần ghé — dạng lưới, chưa phải bản đồ vẽ
- [x] **P6-07** Chạm vào một nơi → lọc Timeline theo nơi đó
- [x] **P6-08** Thống kê: `n/63 tỉnh thành` · tổng địa điểm · nơi xa nhất
- [x] **P6-09** Địa điểm nước ngoài đếm riêng, không cố vẽ lên bản đồ Việt Nam
- [x] **P6-10** Trạng thái rỗng: nút mở bài gần nhất để bổ sung địa điểm

## B. Wrapped → [steps/b-wrapped.md](steps/b-wrapped.md)

- [x] **P6-11** SQL view gom số liệu cả năm từ **mọi** nguồn (timeline · chi tiêu · ăn gì · mục tiêu · câu hỏi · bản đồ)
- [x] **P6-12** Bảng `wrapped_reports` lưu kết quả mỗi năm — tính một lần, xem lại vĩnh viễn
- [x] **P6-13** Chỉ hiện nhóm **có dữ liệu thật**, bỏ hẳn nhóm rỗng (không hiện số 0)
- [x] **P6-14** Câu kết viết bằng văn, sinh từ dữ liệu
- [x] **P6-15** Bản rút gọn cho cặp mới quen: dưới 30 ngày → không hiện; 30 ngày–6 tháng → nhấn vào **mật độ**, không vào tổng số
- [x] **P6-16** **Không bao giờ so sánh theo hướng tiêu cực** — rà lại mọi câu sinh ra
- [x] **P6-17** Màn hình chọn thứ muốn khoe, từng dòng bật/tắt riêng
- [x] **P6-18** Vẽ ảnh chia sẻ bằng **Canvas** → PNG
- [x] **P6-19** Bản xem trước **đúng như ảnh sẽ xuất ra**, không phải gần đúng
- [x] **P6-20** Chia sẻ bằng `navigator.share()`; đường lùi: hiện ảnh để nhấn giữ và lưu
- [x] **P6-21** Hiện trên Home từ 15/12, chốt số liệu 31/12 — `lib/wrappedSeason.ts`, có test; tháng 1 vẫn xem tổng kết năm trước

## C. Album → [steps/c-albums-pdf.md](steps/c-albums-pdf.md)

- [x] **P6-22** Gom tự động **theo chuyến**: cùng tỉnh, cách nhau ≤ 2 ngày, ≥ 3 bài — `lib/albumGrouping.ts` (có test) + màn `/albums`; bản đồ ghi `province_code` ngược vào bài nên dữ liệu mới có thật
- [x] **P6-23** Gom tự động **theo hoạt động** — gom trong phạm vi **một năm**, nếu không "Ăn uống" gộp 5 năm thành album 400 bài không ai mở
- [x] **P6-24** Album tự tạo: chọn bài thủ công — nút + Tạo, thêm/bớt bài trong màn chi tiết
- [x] **P6-25** Album là **cách xem**, không nhân bản ảnh — xoá album không xoá bài — giao diện nói rõ điều đó ở cả nút xoá lẫn nút tách bài
- [x] **P6-26** Sửa album tự động: tách bài, đổi tên, chuyển thành album tự tạo — sửa nội dung một album tự gom sẽ tự chuyển `source` sang `manual`

## D. Xuất PDF → [steps/c-albums-pdf.md](steps/c-albums-pdf.md)

- [x] **P6-27** Edge Function sinh PDF — **chạy nền**, chia **nhiều đợt**. `export-pdf` + hàng đợi `pdf_exports`. **Đã chạy thật trên project**: 16 bài → 13 trang. Một lượt chạy không đủ bộ nhớ (`WORKER_RESOURCE_LIMIT`) nên pha 1 đổi ảnh theo đợt 4 bài, pha 2 mới ghép sách
- [x] **P6-28** Bố cục sách: bìa · trang mở đầu (số liệu Wrapped) · nội dung theo tháng — sang tháng mới là sang trang mới
- [x] **P6-29** Chọn khổ A4/A5 và mật độ ảnh (1/2/4 ảnh mỗi trang) — màn `/albums/export`
- [x] **P6-30** Dùng bản ảnh đã nén — app chỉ lưu **một** bản, cạnh dài **1600px** (`lib/image.ts`), không phải 1920 như đặc tả ghi. 1600px ≈ 275dpi ở khổ A5, đủ in. Ảnh lưu dạng **WebP** nên function phải giải mã WebP → JPEG mới nhúng được (pdf-lib không đọc WebP)
- [x] **P6-31** Push khi xong + link tải có hạn 24 giờ — `expires_at`, cron dọn hằng tuần, bucket `couple-exports` riêng

## E. Xuất toàn bộ dữ liệu — phần bắt buộc → [steps/d-export.md](steps/d-export.md)

- [x] **P6-32** Edge Function đóng gói ZIP: các file JSON + thư mục `anh/`
- [x] **P6-33** Tên file ảnh mang **ngày và caption**, không phải UUID
- [x] **P6-34** Sinh `ky-niem.html` — mở bằng trình duyệt là xem lại được timeline
- [x] **P6-35** `README.txt` giải thích từng file
- [x] **P6-36** Thư tương lai **chưa mở** không nằm trong bản xuất của người không viết nó
- [x] **P6-37** Trạng thái `planned`/`bought` của wishlist không lộ sang bản xuất của người kia
- [x] **P6-38** **Nối vào nút đã đặt sẵn từ Phase 1** ở màn hình huỷ ghép đôi (đang ở trạng thái "Sắp có")
- [x] **P6-39** Xuất được cả khi space `archived` — đây là lúc cần nó nhất
- [x] **P6-40** Giới hạn 1 lần/giờ

## F. Wishlist quà tặng → [steps/e-wishlist.md](steps/e-wishlist.md)

- [x] **P6-41** Migration `wishlist_items` + `wishlist_marks` (trạng thái do **người kia** đặt)
- [x] **P6-42** 🔒 RLS riêng: nội dung cả hai đọc được, **dấu vết chỉ người đặt đọc được**
- [x] **P6-43** Thêm nhanh một ô nhập + nhận chia sẻ link (kèm nút "Dán link" làm đường chính)
- [x] **P6-44** Đánh dấu `planned` / `bought` — chủ wishlist **không thấy**
- [x] **P6-45** Chủ wishlist chuyển `archived` → người kia **thấy** + nhận thông báo nếu đã đánh dấu — chủ bỏ món thì người kia thấy + có cảnh báo ở máy họ; **push thì chưa**
- [x] **P6-46** ⚠️ **Rà toàn bộ push**: không thông báo nào lộ hành vi của người kia trên wishlist
- [x] **P6-47** Nối với [sự kiện](../../docs/features/p3-events-reminders.md): sinh nhật gần tới → nhắc xem wishlist — lối tắt trong dải gợi ý ở tab Sự kiện
- [x] **P6-48** Test kỹ "ai thấy gì" bằng hai tài khoản thật trước khi cho dùng — `verify-rls.mjs` mở phiên thật cho cả hai: chủ món không thấy dấu, người đặt dấu vẫn thấy, danh sách món thì cả hai đọc được

## G. Kết → [steps/e-wishlist.md](steps/e-wishlist.md)

- [~] **P6-49** Rà lại toàn bộ app một lượt: trạng thái rỗng, chế độ tối, vùng an toàn iPhone — đã rà bằng ảnh chụp 2 theme; **chưa thử trên iPhone thật**
- [x] **P6-50** Cập nhật `overview.md` và `tasks/README.md` — ghi rõ 7 task còn lại đều không phải việc viết code — đánh dấu 6 phase đã xong — xem nhật ký phiên
