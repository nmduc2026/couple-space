# Ước lượng chi phí

Hai loại chi phí, tài liệu này tính cả hai:
- **Tiền** — hạ tầng, tài khoản nhà phát triển, phí định kỳ.
- **Thời gian** — công sức làm từng phần.

> ⚠️ **Giá cả thay đổi thường xuyên.** Các con số dưới đây là mức tham khảo tại thời điểm viết (2026), dùng để *định hình quyết định* chứ không phải để lập ngân sách chính xác. Kiểm tra lại tại [supabase.com/pricing](https://supabase.com/pricing) và [vercel.com/pricing](https://vercel.com/pricing) trước khi cam kết.

---

## 1. Giai đoạn dùng riêng (2 người) — **$0, không có ngoại lệ**

| Khoản | Chi phí | Ghi chú |
|---|---|---|
| Supabase | **$0** | Gói Free: ~500MB database, ~1GB storage, ~5GB băng thông/tháng. Xem mục 2 — dư sức dùng nhiều năm. |
| Vercel (hosting PWA) | **$0** | Gói Hobby: 100GB băng thông/tháng. Hai người dùng thì không chạm tới. |
| Push notification | **$0** | Web Push (VAPID) là chuẩn của trình duyệt, không qua dịch vụ nào. |
| Tài khoản nhà phát triển | **$0** | Không cần — PWA không đi qua store. |
| Tên miền | **$0** | Dùng `*.vercel.app`. Muốn tên riêng thì ~$10/năm, hoàn toàn tuỳ chọn. |

### Vì sao không còn khoản "đưa app lên máy thật"

Trong bản trước, đây là khoản tốn kém nhất: một người dùng iPhone nghĩa là **$99/năm** cho
Apple Developer Program. Sau khi chốt phân phối bằng **PWA**, khoản đó biến mất hoàn toàn —
xem [distribution.md](distribution.md).

| Cách đưa app lên iPhone | Chi phí | Trạng thái |
|---|---|---|
| **PWA — cài ra màn hình chính** | **$0** | ✅ **Đã chọn** |
| Apple Developer + TestFlight | $99/năm, build hết hạn sau 90 ngày | Đã loại |
| Tài khoản Apple miễn phí, tự ký | $0 nhưng **app hết hạn sau 7 ngày** | Đã loại — không ai duy trì nổi |

**Tổng giai đoạn 1: $0.**

Khoản $99/năm chỉ quay lại nếu sau này muốn app thật trên App Store (và khi đó cần thêm máy
Mac để build). Quyết định đó để dành cho lúc đã dùng app vài tháng.

---

## 2. Dung lượng ảnh — con số cụ thể

Đây là biến số chi phối mọi thứ, nên tính rõ ra. Giả định: mỗi bài 3 ảnh.

| Kịch bản | Dung lượng/ảnh | 1 tháng (15 bài) | 1 năm | Chạm mốc 1GB (free tier) sau |
|---|---|---|---|---|
| **Không nén** (ảnh gốc iPhone) | ~4 MB | 180 MB | 2.2 GB | **~5 tháng** |
| **Nén 1600px, chất lượng 80%** | ~300 KB | 13.5 MB | 160 MB | **~6 năm** |
| Nén + thumbnail riêng cho lưới | ~330 KB | 15 MB | 180 MB | ~5.5 năm |

Chênh lệch **hơn 13 lần**, và mắt thường không phân biệt được trên màn hình điện thoại. Đây là lý do việc nén client-side được nhắc đi nhắc lại trong các tài liệu trước — nó không phải tối ưu vặt, nó là khác biệt giữa "miễn phí nhiều năm" và "trả tiền sau 5 tháng".

Và nó **không sửa được về sau**: ảnh đã lỡ upload bản gốc thì đã tốn dung lượng rồi.

### ⚠️ Video là thứ phá vỡ mọi tính toán

Schema có cột `media_type = 'video'`, nhưng cần biết trước: **1 phút video điện thoại ≈ 60–130 MB**, tức là bằng 200–400 tấm ảnh đã nén. Chỉ cần vài chục video là hết sạch free tier.

Khuyến nghị: **MVP không hỗ trợ video.** Khi thêm, phải kèm giới hạn độ dài (15–30 giây) và nén hạ độ phân giải. Cột trong schema cứ để đó, chưa dùng tới.

---

## 3. Nếu phát hành cho nhiều người

Tính thử với **1.000 cặp đôi hoạt động**, đã nén ảnh đúng cách:

| Khoản | Ước lượng | Chi phí/tháng |
|---|---|---|
| Supabase Pro (bắt buộc khi vượt free) | Gồm ~8GB DB, ~100GB storage, ~250GB băng thông | **$25** |
| Storage vượt mức | ~320 GB tích luỹ sau năm đầu → dư ~220GB | **~$5** |
| Băng thông vượt mức | ~400–600 GB/tháng → dư ~150–350GB | **~$15–30** |
| Vercel Pro (khi vượt gói Hobby) | | **$20** |
| Apple + Google (chỉ khi phát hành lên store) | $99/năm + $25 một lần | **~$8** |
| **Tổng** | | **~$70–90/tháng** |

**Quy đổi ra mỗi cặp đôi: khoảng $0.07–0.09/tháng.** Nghĩa là chỉ cần ~2% người dùng trả phí ở mức 50.000đ/tháng là hoà vốn. Mô hình freemium ở [overview.md](../../overview.md#3-những-vấn-đề-khó-đã-nhận-diện) khả thi về mặt số học.

**Điểm cần chú ý:** storage rẻ, **băng thông mới đắt** (~$0.09/GB). Băng thông tỉ lệ với việc *xem ảnh*, không phải việc *lưu ảnh* — nên tối ưu phải nhắm vào lượt xem.

### Ba đòn bẩy giảm chi phí, theo thứ tự hiệu quả

1. **Nén trước khi upload** — giảm ~13 lần cả storage lẫn băng thông. Làm ngay từ ngày đầu.
2. **Lưới ảnh dùng thumbnail, ảnh gốc chỉ tải khi mở chi tiết** — màn hình lưới là nơi tốn băng thông nhất vì hiện 20–30 ảnh cùng lúc. Supabase có image transformation để resize khi phục vụ; hoặc tự sinh thumbnail lúc upload.
3. **Cache ảnh trên máy** — `expo-image` cache đĩa mặc định. Kỉ niệm cũ hầu như không đổi, tải một lần là đủ. Đây là lý do băng thông thực tế thường thấp hơn ước lượng khá nhiều.

Chưa cần làm: CDN riêng, nén WebP/AVIF, tự host storage. Để dành khi có người dùng thật.

---

## 4. Chi phí thời gian

Giả định: bạn đã vững backend/SQL, **mới với React và phát triển web front-end**, làm buổi
tối và cuối tuần (~10–15 giờ/tuần). Lộ trình theo 6 phase ở [tasks/](../../tasks/README.md).

| Phase | Nội dung | Ước lượng |
|---|---|---|
| **1 — Nền móng** | Dựng Vite + React, nối Supabase, auth OTP, ghép đôi, Home + đếm ngày, Web Push | **2–3 tuần** |
| **2 — Kỉ niệm** | Chọn ảnh, nén, upload, timeline, tim/bình luận, "Ăn gì" bản gọn | **2–3 tuần** |
| ⭐ | *Tới đây đã dùng thật được* | *≈ 4–6 tuần* |
| **3 — Nhịp sống** | Sự kiện, đếm ngược, pg_cron + Edge Function gửi nhắc | **1–1.5 tuần** |
| **4 — Cùng nhau** | Chi tiêu, thống kê theo danh mục, mục tiêu, quỹ chung | **2 tuần** |
| **5 — Gắn kết** | Câu hỏi mỗi ngày, thư tương lai, tâm trạng, "Ăn gì" đầy đủ | **1.5–2 tuần** |
| **6 — Lan truyền** | Bản đồ dấu chân, Wrapped, xuất PDF, xuất dữ liệu | **2–3 tuần** |
| **Tổng** | | **≈ 9–14 tuần** |

**Biến số lớn nhất là Phase 1**, không phải vì nó khó mà vì đó là lúc bạn học React, Tailwind,
PWA và Supabase client cùng lúc. Từ Phase 2 trở đi tốc độ tăng rõ rệt vì mọi màn hình sau đều
lặp lại cùng một khuôn mẫu.

**Riêng nhóm E (Web Push) của Phase 1 nên tính dư thời gian.** Đó là phần phụ thuộc vào hành
vi của iOS mà mình không kiểm soát được, và là chỗ dễ mất một buổi tối vì một chi tiết nhỏ.

**Ba điều rút ngắn con số này đáng kể:**
- Schema, user flow, màn hình và **hướng dẫn từng bước** đều đã viết sẵn — phần "nghĩ xem làm
  gì" đã xong, chỉ còn thực thi.
- Bỏ React Native để dùng web thuần khiến phần lớn code AI sinh ra chạy được ngay, vì đó là
  loại code phổ biến nhất.
- Không phải build/ký/cài app native — đẩy code là xong.

## 5. Chốt lại

- **Dùng riêng hai người: $0 thật, không có ngoại lệ.** Cả hai cài PWA ra màn hình chính iPhone. Không mua gì cả.
- **Free tier của Supabase đủ dùng ~6 năm** nếu nén ảnh, hoặc **~5 tháng** nếu không. Toàn bộ khác biệt nằm ở một bước xử lý trước khi upload.
- **Không hỗ trợ video ở MVP.** Một phút video bằng vài trăm tấm ảnh.
- **Nếu phát hành: ~$0.07–0.09/cặp đôi/tháng**, và băng thông mới là khoản đắt chứ không phải dung lượng lưu trữ.
- **Thời gian: ~4–6 tuần để có bản dùng thật (hết Phase 2), ~9–14 tuần cho cả 6 phase**, làm bán thời gian.
