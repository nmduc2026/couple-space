# D. Xuất toàn bộ dữ liệu — P6-32 → P6-40

Đặc tả: [p6-albums-export.md](../../../docs/features/p6-albums-export.md) mục 4.

> ### Đây không phải tính năng cao cấp. Đây là **quyền của người dùng với dữ liệu của họ**.
>
> Nút *"Tải toàn bộ dữ liệu về máy"* đã nằm sẵn ở màn hình
> [huỷ ghép đôi](../../phase-01/steps/g-settings.md) từ **Phase 1**, trong trạng thái
> "Sắp có". Nhóm này là lúc nối nó vào thật.
>
> **Nếu chỉ làm được một nhóm trong Phase 6, làm nhóm này.** Nó không phụ thuộc lượng dữ
> liệu, và nó là thứ khiến app đáng tin.

---

## P6-32 · Edge Function đóng gói ZIP

**Các bước**

1. Function `export-data`, chạy nền giống
   [sinh PDF](c-albums-pdf.md#p6-27--sinh-pdf-ở-edge-function) — dùng lại đúng khuôn:
   nhận yêu cầu → trả ngay → làm → push kèm link.

2. Cấu trúc ZIP:
   ```
   couple-space-export-2026-09-11.zip
   ├── README.txt
   ├── ky-niem.html          ← mở bằng trình duyệt, xem lại được
   ├── ky-niem.json
   ├── chi-tieu.json
   ├── su-kien.json
   ├── muc-tieu.json
   ├── cau-hoi.json
   ├── thu-tuong-lai.json    ← chỉ thư ĐÃ mở
   ├── tam-trang.json
   ├── an-gi.json
   └── anh/
       ├── 2026-09-12-bun-cha-hang-quat-1.jpg
       └── …
   ```

3. Với vài nghìn ảnh: **stream vào ZIP**, đừng nạp hết vào bộ nhớ. Edge Function có giới hạn
   RAM, và đây là chỗ dễ hết.

4. JSON viết đẹp (xuống dòng, thụt lề) — người mở ra để đọc, không phải máy.

**Xong khi:** tải ZIP về, giải nén, cấu trúc đúng như trên.

---

## P6-33 · Tên file ảnh có nghĩa

**Mục tiêu:** người mở ZIP ba năm sau hiểu được nó là gì mà không cần tra cứu.

**Các bước**

1. Mẫu tên: `{ngày}-{caption rút gọn}-{số thứ tự}.jpg`
   → `2026-09-12-bun-cha-hang-quat-1.jpg`

2. Chuẩn hoá: bỏ dấu, chữ thường, thay khoảng trắng bằng `-`, cắt **40 ký tự**.

3. Không có caption → dùng địa điểm; không có cả hai → `2026-09-12-ky-niem-1.jpg`.

4. Trùng tên → thêm 4 ký tự đầu của `post_id`.

5. ❌ **Không dùng UUID làm tên file.** `a3f2b1c8-....jpg` là thứ khiến bản xuất trở nên vô
   dụng với con người — mà con người mới là người mở nó.

**Xong khi:** mở thư mục `anh/` và đọc tên file là hình dung ra được nội dung.

---

## P6-34 · File `ky-niem.html`

> **Chi phí thêm nhỏ, giá trị lớn.** JSON thì đúng nhưng không ai ngồi đọc. File HTML này
> là thứ biến bản xuất từ "dữ liệu" thành "kỉ niệm xem lại được".

**Các bước**

1. Một file HTML **tự chứa** (CSS inline), trỏ tới ảnh bằng đường dẫn tương đối `anh/...`.

2. Bố cục: timeline theo tháng, mỗi bài có ảnh · caption · ngày · địa điểm · chi phí ·
   bình luận.

3. **Không JavaScript, không tải gì từ mạng.** Nó phải mở được trên một máy tính không có
   internet, mười năm sau.

4. Đầu trang: tên hai người · ngày bắt đầu yêu · tổng số kỉ niệm · ngày xuất.

5. Dùng font hệ thống. Đừng nhúng font — file sẽ nặng vô ích.

**Xong khi:** ngắt mạng, mở `ky-niem.html` bằng trình duyệt → xem lại được toàn bộ timeline
kèm ảnh.

---

## P6-35 · `README.txt`

**Các bước**

1. Viết bằng **tiếng Việt, giọng người**, không phải tài liệu kỹ thuật:

   ```
   DỮ LIỆU COUPLE SPACE CỦA MINH & LINH
   Xuất ngày 11/09/2026

   Mở file ky-niem.html bằng trình duyệt là xem lại được mọi kỉ niệm,
   không cần cài gì.

   Thư mục anh/ chứa toàn bộ ảnh, tên file có ngày và nội dung.

   Các file .json là dữ liệu thô, mở bằng Notepad cũng đọc được:
     ky-niem.json    – bài đăng, caption, bình luận
     chi-tieu.json   – các khoản đã tiêu
     ...

   Ảnh trong bản xuất này là bản đã nén (cạnh dài 1920px).
   ```

2. Có gì đã bị dọn thì **nói rõ**:
   ```
   LƯU Ý: ảnh của không gian này đã được dọn ngày 11/03/2026
   (sau 6 tháng không ai truy cập). Phần chữ vẫn còn đầy đủ.
   ```

**Xong khi:** đưa file này cho người không biết gì về app, họ hiểu phải làm gì.

---

## P6-36 · Thư chưa mở không lọt vào bản xuất

**Các bước**

1. `thu-tuong-lai.json` chỉ chứa:
   - thư **đã mở** (`open_on <= hôm nay`)
   - thư **do chính người xuất viết** (họ luôn đọc lại được)

2. Thư chưa mở của người kia → **chỉ metadata**, không có nội dung:
   ```json
   { "tieu_de": "Mười năm nữa", "nguoi_viet": "Linh",
     "mo_vao": "2036-03-15", "noi_dung": null }
   ```

3. ⚠️ Function chạy bằng `service_role` nên **bỏ qua RLS** — phải tự lọc trong query. Đây
   chính là chỗ RLS không cứu được, và là chỗ dễ rò rỉ nhất của cả nhóm.

**Xong khi:** A viết thư hẹn 2036 → B xuất dữ liệu → trong ZIP **không có** nội dung thư đó.

---

## P6-37 · Wishlist không lộ dấu vết

**Các bước**

1. Bản xuất của một người chứa:
   - ✅ Toàn bộ **nội dung** wishlist của cả hai
   - ✅ Trạng thái `planned`/`bought` **do chính họ đặt**
   - ❌ **Không** có trạng thái do người kia đặt

2. Cùng lý do với P6-36: `service_role` bỏ qua RLS, phải tự lọc.

3. Chi tiết luật: [e-wishlist.md](e-wishlist.md) và
   [p6-gift-wishlist.md](../../../docs/features/p6-gift-wishlist.md) mục 2.

**Xong khi:** Minh đánh dấu "định mua" một món của Linh → Linh xuất dữ liệu → **không thấy**
dấu đó.

---

## P6-38 · Nối vào nút ở màn hình huỷ ghép đôi

**Các bước**

1. Ở [màn hình huỷ ghép đôi](../../phase-01/steps/g-settings.md), nút
   **[⬇ Tải toàn bộ dữ liệu về máy]** đang ở trạng thái *"Sắp có"* từ Phase 1 — giờ nối thật.

2. Giữ nguyên **vị trí**: **trước** ô gõ xác nhận. Nhiều người bấm huỷ trong lúc xúc động;
   nút này phải đập vào mắt trước.

3. Bấm → bắt đầu xuất, hiện tiến trình ngay tại đó, **không rời màn hình**.

4. Thêm một nút tương tự trong Cài đặt → Tài khoản, để dùng bất cứ lúc nào mà không phải
   vào "Vùng nguy hiểm".

**Xong khi:** nút hết trạng thái "Sắp có", bấm vào chạy thật.

---

## P6-39 · Xuất được cả khi space đã archived

**Các bước**

1. ⚠️ **Đây là lúc người ta cần nó nhất.** Query trong function **không được lọc**
   `status = 'active'` — khác với phần lớn query khác trong app.

2. Kiểm: huỷ ghép đôi → space `archived` → vẫn xuất được đầy đủ.

3. Space `archived` quá 6 tháng (ảnh đã dọn) → bản xuất vẫn có **đầy đủ phần chữ**, và
   `README.txt` nói rõ ảnh đã bị dọn từ khi nào (P6-35).

4. Cả hai người đều xuất được **toàn bộ**, kể cả ảnh do người kia đăng — quyết định **D5**,
   xem [p1-breakup.md](../../../docs/features/p1-breakup.md) mục 6.

**Xong khi:** space `archived` → cả hai tài khoản đều xuất ra bản đầy đủ.

---

## P6-40 · Giới hạn tần suất

**Các bước**

1. **1 lần / giờ / space.** Sinh ZIP là việc nặng, và không ai cần xuất nhiều hơn thế.
2. Chạm giới hạn → báo rõ kèm thời gian: *"Vừa xuất lúc 14:20 — thử lại sau 14:32 nhé."*
3. Link cũ còn hạn thì đưa lại luôn thay vì bắt chờ.
4. Dọn file ZIP cũ hơn 7 ngày bằng cron.

**Xong khi:** xuất hai lần liên tiếp → lần hai đưa lại link cũ thay vì tạo mới.
