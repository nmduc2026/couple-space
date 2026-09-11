# B. Đăng kỉ niệm — P2-05 → P2-10

Đặc tả: [p2-timeline.md](../../../docs/features/p2-timeline.md).

> **Luật chi phối cả nhóm:** đăng một kỉ niệm phải **xong dưới 30 giây**, và **chỉ caption
> là cần gõ**. Mọi trường khác tuỳ chọn và có giá trị đoán sẵn.
>
> Bắt buộc điền nhiều trường = không ai đăng = app không có nội dung = mọi tính năng
> Phase 4–6 không có gì để tính.

---

## P2-05 · Chọn ảnh + nén ở client

**Mục tiêu:** ảnh 4MB từ iPhone trở thành ~300KB **trước khi** rời khỏi máy.

**Đây là task quan trọng nhất Phase 2 về mặt chi phí.** Nén hay không nén là khác biệt giữa
*free tier dùng được 6 năm* và *5 tháng* — xem [cost-estimate.md](../../../docs/decisions/cost-estimate.md).

**Các bước**

1. Chọn ảnh bằng input chuẩn của web (PWA không có API ảnh native):
   ```html
   <input type="file" accept="image/*" multiple />
   ```
   Trên iPhone, thao tác này mở đúng trình chọn ảnh của hệ thống.

2. Nén bằng Canvas trong `src/lib/imageCompress.ts`:
   - Đọc file vào `createImageBitmap()`
   - Thu nhỏ sao cho **cạnh dài tối đa 1920px** (giữ đúng tỉ lệ)
   - Xuất ra JPEG chất lượng **~0.8** bằng `canvas.toBlob()`

   > ⏳ **D7 chưa chốt chính thức** (xem [../context.md](../context.md) mục 5).
   > Hai con số trên là mặc định đề nghị — cứ làm theo, đặt thành hằng số một chỗ để sau
   > đổi chỉ sửa một dòng.

3. **Đọc EXIF trước khi nén** — Canvas sẽ xoá sạch EXIF. Cần lấy ra:
   - Ngày chụp → dùng ở P2-06
   - Hướng xoay (orientation) → nếu bỏ qua, ảnh chụp dọc sẽ **hiện nằm ngang**

4. Xử lý ảnh sống (HEIC của iPhone): trình duyệt iOS tự chuyển sang JPEG khi qua Canvas,
   nhưng **phải thử trên máy thật** để chắc.

5. In ra console kích thước trước/sau để tự kiểm chứng.

**Xong khi:** chọn một ảnh chụp bằng iPhone, console báo giảm từ vài MB xuống vài trăm KB,
và ảnh chụp dọc vẫn hiện dọc.

**Bẫy**
- **Ảnh xoay sai là lỗi hay gặp nhất** khi tự nén bằng Canvas. Thử với cả ảnh ngang và ảnh dọc.
- Nén 9 ảnh cùng lúc sẽ làm treo giao diện. Làm **lần lượt từng ảnh** và hiện tiến độ.
- Không giữ bản gốc (D8 — đề nghị: chỉ giữ bản nén). Bản gốc vẫn nằm trong thư viện ảnh
  của người dùng, không cần lưu thêm lần nữa.

---

## P2-06 · Đọc EXIF lấy ngày

**Mục tiêu:** người dùng không phải chọn ngày — app tự điền.

**Các bước**

1. Lấy ngày chụp từ EXIF của **ảnh đầu tiên** trong lô đã chọn.

2. Quy tắc dự phòng, theo thứ tự:
   - Có EXIF hợp lệ → dùng ngày đó
   - Không có EXIF (ảnh tải về, ảnh chụp màn hình) → **hôm nay**
   - EXIF có ngày ở **tương lai** → bỏ qua, dùng hôm nay

3. Luôn cho sửa tay. Hiện ngày ở dạng dễ đọc (`12/09/2026`), không phải chuỗi ISO.

4. Chuyển sang `YYYY-MM-DD` để lưu vào `happened_on` — **không** đi qua `toISOString()`,
   hàm đó đổi sang UTC và làm lệch 1 ngày.

**Xong khi:** chọn một ảnh cũ trong thư viện → ô ngày tự điền đúng ngày chụp, không lệch.

---

## P2-07 · Màn hình soạn bài

**Mục tiêu:** một màn hình duy nhất, không chia nhiều bước.

**Các bước**

1. Từ nút (+) → mở **thẳng** trình chọn ảnh. **Không có màn hình trung gian** kiểu
   "Bạn muốn đăng gì?".

2. Chọn xong → màn hình soạn bài, theo thứ tự từ trên xuống:

   | Phần | Ghi chú |
   |---|---|
   | Ảnh đã chọn | Kéo sắp xếp, bấm x để bỏ |
   | **Caption** | **Con trỏ đặt sẵn ở đây** ngay khi màn hình mở |
   | Ngày | Điền sẵn từ EXIF |
   | Địa điểm | Tuỳ chọn. Gợi ý từ các nơi đã nhập trước đó |
   | Hoạt động | Một chạm chọn icon: 🍜 🍰 ✈️ 🎬 🏠 |
   | 💰 Chi phí | Tuỳ chọn, **gập lại mặc định** |

3. Phần chi phí ở Phase 2 **chỉ lưu số tiền vào bài**, chưa nối với bảng `expenses`
   (Phase 4). Cứ để trường dữ liệu sẵn, nối sau.

4. Nút [Đăng] luôn bật, kể cả khi chỉ có ảnh và không có caption.

**Xong khi:** bấm (+) tới lúc bấm [Đăng] chỉ cần chọn ảnh và gõ một dòng — bấm giờ thử,
phải dưới 30 giây.

**Bẫy**
- Đừng làm nhiều bước kiểu wizard. Mỗi bước thêm là một chỗ người dùng bỏ ngang.
- Bàn phím iPhone che mất nửa màn hình — đảm bảo caption và nút [Đăng] vẫn thấy được khi
  bàn phím mở.

---

## P2-08 · Phản hồi lạc quan + upload nền

**Mục tiêu:** bấm [Đăng] là **thấy bài ngay**, không chờ.

**Các bước**

1. Bấm [Đăng]:
   - Đóng màn hình soạn bài **ngay lập tức**
   - Chèn bài vào timeline ở trạng thái **"đang tải"** (ảnh hiện bằng bản xem trước từ máy,
     phủ một lớp mờ + vòng tiến độ)
   - Upload chạy nền

2. Thứ tự upload:
   ```
   tạo dòng posts  →  upload từng ảnh lên Storage  →  tạo các dòng post_media
   ```
   Upload xong tấm nào thì bỏ lớp mờ tấm đó — người dùng thấy tiến triển thật.

3. Lỗi giữa chừng → bài giữ nguyên trên timeline với dấu ⚠️ và nút **[Thử lại]**.
   **Không** xoá bài đi và bắt người dùng làm lại từ đầu.

4. Dùng `mutation` của TanStack Query với cập nhật lạc quan để timeline tự đồng bộ.

**Xong khi:** bấm [Đăng] thì bài hiện trong dưới 1 giây, ảnh rõ dần khi upload xong.

**Bẫy**
- Bài mồ côi: tạo `posts` xong rồi upload ảnh hỏng → có bài không ảnh. Hoặc dọn khi thử lại
  thất bại, hoặc chấp nhận và cho sửa. **Đừng để im.**

---

## P2-09 · Hàng đợi đồng bộ khi mất mạng

**Mục tiêu:** đăng được cả khi không có mạng — vì đó chính là lúc người ta muốn đăng.

**Các bước**

1. Lưu bài chưa gửi vào **IndexedDB** (không phải `localStorage` — ảnh quá lớn).
   Mỗi mục gồm: dữ liệu bài + các ảnh đã nén dạng Blob.

2. Bài trong hàng đợi vẫn hiện trên timeline, trạng thái **"chờ gửi"**.

3. Tự gửi lại khi:
   - Sự kiện `online` bắn ra
   - App được mở lại

4. Thử lại có **giãn cách tăng dần** (1s, 2s, 4s…), tối đa vài lần rồi dừng và chờ người
   dùng bấm [Thử lại].

5. Cho **xoá** mục trong hàng đợi — đừng để một bài hỏng kẹt mãi ở đó.

**Xong khi:** bật chế độ máy bay → đăng một bài → thấy "chờ gửi" → tắt chế độ máy bay →
bài tự gửi đi mà không cần chạm gì.

**Bẫy**
- Đây là thứ dễ bị coi là "ca biên" và bỏ qua. Nó **không** phải ca biên: đi chơi, chụp ảnh,
  sóng yếu — là kịch bản dùng chính của app này.
- Đóng app giữa lúc upload phải tiếp tục được ở lần mở sau, không mất ảnh.

---

## P2-10 · Push + gộp thông báo

**Mục tiêu:** người kia biết có bài mới, nhưng không bị 9 thông báo liền.

**Các bước**

1. Dùng lại Edge Function `send-notification` đã làm ở
   [Phase 1 nhóm E](../../phase-01/steps/e-notifications.md). **Không viết hàm gửi mới.**

2. Gọi khi bài upload **xong hẳn** (không phải lúc bấm Đăng — mạng có thể hỏng):
   > *"Minh vừa thêm một kỉ niệm 📷"*

3. **Gộp thông báo:** đăng nhiều bài trong vòng vài phút → chỉ một thông báo.
   Cách đơn giản: trước khi gửi, kiểm tra đã gửi thông báo cùng loại cho người này trong
   10 phút gần nhất chưa; rồi thì đổi nội dung thành *"Minh vừa thêm 3 kỉ niệm 📷"*.

4. Bấm vào thông báo → mở **đúng bài đó**, không phải Home.

5. Nhớ luật từ Phase 1: **không bao giờ gửi thông báo về hành động của chính mình.**

**Xong khi:** máy A đăng 3 bài liên tiếp → máy B nhận **một** thông báo, bấm vào mở đúng bài.

**Bẫy**
- Gọi push từ app thì mạng hỏng là mất thông báo. Từ phase này nên chuyển sang
  **database trigger** trên bảng `posts` — chắc chắn hơn, và về sau mọi tính năng đều dùng
  chung cách đó.
