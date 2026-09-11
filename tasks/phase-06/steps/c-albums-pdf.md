# C. Album + xuất PDF — P6-22 → P6-31

Đặc tả: [p6-albums-export.md](../../../docs/features/p6-albums-export.md) mục 2 và 3.
Xem trước: màn hình **P6-03** trong
[prototype.html](../../../docs/design/frontend/ui/prototype.html).

---

## P6-22 · Gom tự động theo chuyến

> **Đây là điểm khác biệt của tính năng này.** Người dùng mở tab Album lần đầu đã thấy sẵn
> 4–5 album, không phải một màn hình trống bảo họ tự tạo.

**Các bước**

1. Thuật toán gom, chạy trên các bài đã có tỉnh/thành từ
   [a-map.md](a-map.md#p6-02--bảng-chuẩn-hoá-địa-điểm):

   ```
   Sắp bài theo happened_on
   Gom thành cụm khi:
     - cùng tỉnh/thành
     - bài liền nhau cách nhau ≤ 2 ngày
   Giữ cụm có ≥ 3 bài
   ```

2. **Ngưỡng tối thiểu 3 bài.** Hai bài ở Đà Nẵng cách nhau 1 ngày có thể chỉ là hai bữa ăn,
   không phải một chuyến đi.

3. ⚠️ **Bỏ qua tỉnh "nhà"** — tỉnh có nhiều bài nhất. Không thì cả năm ở Hà Nội thành một
   "chuyến đi Hà Nội 300 ảnh", vô nghĩa.

4. Tên tự sinh: `"{Tỉnh}, tháng {N}"` → *"Đà Lạt, tháng 8"*.
   Trùng tên thì thêm ngày.

5. Tính lại khi có bài mới, nhưng **giữ nguyên album người dùng đã sửa tên hoặc đã tách bài**
   (xem P6-26).

**Xong khi:** một chuyến đi thật trong dữ liệu được gom đúng thành một album.

---

## P6-23 · Gom theo hoạt động

**Các bước**

1. Đơn giản hơn nhiều: gom mọi bài cùng `activity`.
2. Chỉ tạo khi có **≥ 10 bài** — dưới đó thì nó chỉ là một bộ lọc, không phải một album.
3. Tên: *"Tụi mình đi ăn"* · *"Cà phê"* · *"Đi chơi xa"*.
4. Album loại này đặt **dưới** album theo chuyến — chuyến đi có giá trị kể chuyện cao hơn.

**Xong khi:** có 187 bài 🍜 → xuất hiện album "Tụi mình đi ăn".

---

## P6-24 · Album tự tạo

**Các bước**

1. Nút **[+ Album mới]** → đặt tên → chọn bài từ lưới ảnh (chọn nhiều).
2. Thêm/bớt bài sau bằng cùng lưới đó.
3. Ảnh bìa: mặc định ảnh đầu tiên, cho chọn khác.
4. Kéo sắp xếp thứ tự bài trong album.

**Xong khi:** tạo một album 10 ảnh, thêm bớt được, đổi bìa được.

---

## P6-25 · Album là cách xem, không nhân bản ảnh

**Các bước**

1. Bảng nối, không sao chép gì:
   ```sql
   create table public.albums (
     id uuid primary key default gen_random_uuid(),
     couple_id uuid not null references public.couples(id) on delete cascade,
     kind text not null check (kind in ('trip','activity','custom')),
     title text not null,
     cover_post_id uuid references public.posts(id) on delete set null,
     auto_key text,          -- khoá của cụm tự gom, để tính lại mà không tạo trùng
     edited boolean not null default false,
     created_at timestamptz not null default now()
   );
   create table public.album_posts (
     album_id uuid not null references public.albums(id) on delete cascade,
     post_id  uuid not null references public.posts(id) on delete cascade,
     sort_order int not null default 0,
     primary key (album_id, post_id)
   );
   ```

2. Xoá album → **không** xoá bài (`album_posts` cascade, `posts` không đụng tới).
3. Xoá bài → nó biến khỏi mọi album (`on delete cascade` ở `album_posts`).
4. Album rỗng sau khi xoá hết bài → tự xoá nếu là album tự động; giữ lại nếu tự tạo.

**Xong khi:** xoá một album → mọi bài vẫn còn nguyên trong Timeline.

---

## P6-26 · Sửa album tự động

**Các bước**

1. Cho phép: đổi tên · bỏ bài ra · thêm bài vào · đổi bìa.
2. Sửa bất kỳ thứ gì → đặt `edited = true`, và từ đó **thuật toán gom không đụng vào nữa**.
3. Nút "Chuyển thành album của tôi" → `kind = 'custom'`, tách hẳn khỏi cơ chế tự gom.
4. Nút "Tính lại" cho album chưa sửa, phòng khi gom sai.

**Xong khi:** sửa tên một album tự động → thêm bài mới vào Timeline → tên vẫn giữ nguyên.

---

## P6-27 · Sinh PDF ở Edge Function

> ⚠️ **Chạy ở server, không ở client.** Vài chục ảnh thì trình duyệt làm được; vài trăm ảnh
> — trường hợp thường gặp sau một năm — sẽ **đứng máy**.

**Các bước**

1. Tạo function `generate-book`, nhận `album_id` hoặc khoảng thời gian.

2. Đây là **việc chạy nền có thông báo** ngay từ đầu, không phải việc đồng bộ rồi sửa sau:
   ```
   App gọi → function trả ngay "đã nhận, đang làm"
                                   ↓
                      function làm việc (vài phút)
                                   ↓
                      lưu file vào Storage
                                   ↓
                      push "Sách của bạn đã xong 📕" + link tải
   ```

3. Bảng theo dõi tiến trình:
   ```sql
   create table public.book_jobs (
     id uuid primary key default gen_random_uuid(),
     couple_id uuid not null references public.couples(id) on delete cascade,
     status text not null default 'pending'
            check (status in ('pending','running','done','failed')),
     file_path text, error text,
     created_at timestamptz not null default now()
   );
   ```

4. Thư viện PDF chạy được trên Deno — chọn loại nhẹ, ghép ảnh + chữ là đủ.

5. Chỉ cho **một job đang chạy** mỗi space.

**Xong khi:** gọi function → nhận phản hồi ngay → vài phút sau nhận push kèm link tải được.

---

## P6-28 · Bố cục sách

**Các bước**

1. | Trang | Nội dung |
   |---|---|
   | Bìa | Ảnh bìa đôi · tên hai người · khoảng thời gian |
   | Trang 2 | Số ngày bên nhau · số buổi hẹn · số nơi đã đi (dùng lại số liệu [Wrapped](b-wrapped.md)) |
   | Nội dung | Theo tháng: tiêu đề tháng, rồi ảnh + caption + ngày + địa điểm |
   | Trang cuối | Một câu kết + ngày xuất sách |

2. Font phải nhúng vào PDF và **hỗ trợ đầy đủ dấu tiếng Việt** — thử với chữ có dấu nặng
   chồng dấu mũ (`ộ`, `ợ`, `ế`) trước khi làm tiếp.

3. Caption dài → cắt gọn, không tràn trang.

**Xong khi:** mở PDF ra, mọi dấu tiếng Việt hiện đúng, không trang nào tràn.

---

## P6-29 · Tuỳ chọn khổ và mật độ

**Các bước**

1. Khổ: **A4** hoặc **A5**. A5 là khổ sách ảnh phổ biến ở tiệm in.
2. Mật độ: **1 / 2 / 4** ảnh mỗi trang.
3. Ước lượng số trang và dung lượng **trước khi tạo**: *"Khoảng 84 trang · ~28 MB"*.
4. Chừa lề trong (gutter) 15mm nếu người dùng định đóng gáy.

**Xong khi:** đổi từ A4 1 ảnh sang A5 4 ảnh → số trang ước lượng đổi hợp lý.

---

## P6-30 · Dùng ảnh đã nén

**Các bước**

1. Dùng **bản đã nén 1920px** từ [Phase 2](../../phase-02/steps/b-post.md), không tải bản nào khác.

2. Đủ để in A5 ở ~300 DPI (A5 rộng 148mm ≈ 1748px). In A4 1 ảnh/trang thì hơi thiếu, nhưng
   chấp nhận được — và đó là đánh đổi đã chọn từ Phase 2 khi quyết định **chỉ giữ bản nén**.

3. Giữ file PDF dưới **~50MB** để còn gửi được qua email. Vượt thì tự giảm chất lượng ảnh.

**Xong khi:** sách 80 trang ra file dưới 50MB, in thử một trang A5 nhìn nét.

---

## P6-31 · Thông báo và link tải

**Các bước**

1. Xong → push: *"Cuốn sách của hai đứa đã xong 📕"*, chạm vào mở màn hình tải.
2. Link tải là **signed URL hạn 24 giờ** từ Supabase Storage.
3. Hết hạn → cho tạo lại, không cần làm lại từ đầu nếu file còn trong Storage.
4. Dọn file PDF cũ hơn 7 ngày bằng cron — chúng nặng và tạo lại được.
5. Job `failed` → báo rõ và cho thử lại, đừng để im ở trạng thái "đang làm" mãi mãi.

**Xong khi:** nhận push, chạm vào, tải được file về iPhone.

**Bẫy**
- Tải file trên PWA iOS có thể vướng. Nếu `<a download>` không chạy, mở signed URL trong tab
  mới — Safari sẽ hiện trình xem PDF có nút chia sẻ/lưu. Cách này luôn hoạt động.
