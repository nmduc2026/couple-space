# A. Database + Storage — P2-01 → P2-04

SQL đã viết sẵn ở [database-schema.md](../../../docs/design/backend/database-schema.md)
mục 7 và 13. Việc ở đây là chạy đúng thứ tự và **kiểm chứng RLS cho cả ảnh**, không chỉ
cho dữ liệu.

> Ảnh là chỗ RLS hay bị hở nhất: bảng thì có policy, nhưng file trong Storage lại quên —
> và lúc đó ai có URL cũng xem được.

---

## P2-01 · Migration `posts` + `post_media`

**Mục tiêu:** có bảng lưu bài đăng và danh sách ảnh của mỗi bài.

**Các bước**

1. Migration mới:
   ```powershell
   npx supabase migration new posts
   ```

2. Chép SQL ở [database-schema.md](../../../docs/design/backend/database-schema.md)
   **mục 7**, phần `posts` và `post_media`.

3. Kiểm lại ba cột dễ bị làm sai:

   | Cột | Phải là | Vì sao |
   |---|---|---|
   | `happened_on` | **`date`** | Ngày kỉ niệm xảy ra, không phải lúc bấm đăng. Dùng `timestamptz` sẽ lệch múi giờ. |
   | `created_at` | `timestamptz` | Lúc bấm đăng — khác `happened_on`, đừng gộp làm một |
   | `author_id` | có, nhưng **chỉ để hiển thị** | Phân quyền dựa vào `couple_id`. Xem [p1-breakup.md](../../../docs/features/p1-breakup.md) mục 6. |

4. `post_media` cần `sort_order` để giữ đúng thứ tự ảnh người dùng kéo sắp xếp.

5. `npx supabase db push`

**Xong khi:** chèn tay một bài + hai ảnh, đọc ra đúng thứ tự.

**Bẫy**
- Dùng **xoá mềm** (`deleted_at`) chứ đừng xoá cứng. Xoá cứng một bài có gắn chi tiêu
  (Phase 4) sẽ kéo theo rắc rối dây chuyền.

---

## P2-02 · Migration `reactions` + `comments`

**Mục tiêu:** có chỗ lưu tim và bình luận.

**Các bước**

1. Chép SQL ở [database-schema.md](../../../docs/design/backend/database-schema.md) mục 7.

2. `reactions` cần **ràng buộc duy nhất** `(post_id, user_id)` — một người thả tim một bài
   đúng một lần. Thả lại là **bỏ tim**, không phải thêm dòng thứ hai.

3. `comments` cần `deleted_at`, và xoá bài thì bình luận của bài đó cũng đi theo
   (`on delete cascade`).

4. `npx supabase db push`

**Xong khi:** thả tim hai lần liên tiếp bằng SQL → lần thứ hai bị chặn bởi ràng buộc duy nhất.

---

## P2-03 · Storage bucket + policy

**Mục tiêu:** ảnh lưu được, và **chỉ hai người trong space xem được**.

**Các bước**

1. Tạo bucket theo [database-schema.md](../../../docs/design/backend/database-schema.md)
   **mục 13**. Đặt bucket ở chế độ **private**, không phải public.

2. **Quy ước đường dẫn file** — quyết định này khó đổi về sau:
   ```
   <couple_id>/<post_id>/<uuid>.jpg
   ```
   Đặt `couple_id` ở **đoạn đầu tiên** là điều kiện để viết policy đơn giản: policy chỉ cần
   đọc đoạn đầu của đường dẫn rồi gọi `is_member_of()`.

3. Viết policy cho `storage.objects`: đọc thì `is_member_of`, ghi thì `can_write_to` —
   cùng hai hàm đã làm ở Phase 1.

4. App **không** dùng URL công khai. Mỗi lần hiển thị ảnh thì xin **signed URL** có hạn
   (ví dụ 1 giờ), hoặc tải qua client đã đăng nhập.

**Xong khi:** copy đường dẫn một file ảnh, mở ở cửa sổ ẩn danh (chưa đăng nhập) → **bị từ chối**.

**Bẫy**
- Bucket để **public** là lỗi nghiêm trọng nhất có thể mắc ở phase này: mọi ảnh riêng tư của
  hai người thành công khai với bất kỳ ai đoán được URL. Kiểm tra kỹ bước 1.
- Signed URL có hạn → **đừng cache URL trong database**. Cache ảnh thì được, cache URL thì không.

---

## P2-04 · Kiểm chứng RLS cho ảnh

**Mục tiêu:** chắc chắn tài khoản ngoài space không đọc được gì, kể cả file.

**Các bước** — dùng lại tài khoản thứ ba đã tạo ở Phase 1:

1. A đăng một bài có ảnh.
2. Đăng nhập bằng C (ngoài space), thử:
   - `select * from posts` → phải ra **mảng rỗng**
   - Gọi thẳng đường dẫn file ảnh của A → phải **bị từ chối**
   - Xin signed URL cho file của A → phải **thất bại**
3. Chuyển space của A sang `archived`, kiểm tra A **vẫn xem được ảnh** nhưng **không upload được**.

**Xong khi:** cả ba phép thử ở bước 2 cho đúng kết quả, và bước 3 đúng.

**Bẫy**
- Đừng thử bằng SQL Editor trên web Supabase — chỗ đó chạy quyền cao nhất và **luôn** thấy hết.
  Phải thử từ app, bằng tài khoản thật.
- Mỗi khi thêm bảng mới ở các phase sau, việc đầu tiên là bật RLS cho nó.
