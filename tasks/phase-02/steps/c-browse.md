# C. Xem lại — P2-11 → P2-16

Đặc tả: [p2-timeline.md](../../../docs/features/p2-timeline.md) mục 4.

Nhóm này nhẹ hơn nhóm B nhiều. Cái khó duy nhất là **ảnh**: tải bao nhiêu, tải lúc nào, và
đừng đốt băng thông — vì băng thông mới là khoản đắt, không phải dung lượng lưu trữ.

---

## P2-11 · Timeline dạng thẻ

**Mục tiêu:** màn hình chính để xem lại kỉ niệm.

**Các bước**

1. Truy vấn có phân trang, mới nhất trước:
   ```ts
   supabase.from('posts')
     .select('*, post_media(*), profiles!author_id(display_name, avatar_url)')
     .is('deleted_at', null)
     .order('happened_on', { ascending: false })
     .range(from, to)
   ```
   Dùng `useInfiniteQuery` của TanStack Query, mỗi trang ~10 bài.

2. Thẻ bài đăng gồm: ảnh · caption · địa điểm · chi phí (nếu có) · ngày · ai đăng · ❤️ · 💬.

3. **Chia nhóm theo tháng**, tiêu đề dính khi cuộn (`Tháng 9, 2026`).

4. Nhiều ảnh trong một bài → hiện lưới nhỏ trên thẻ (1 ảnh: tràn viền; 2–4 ảnh: lưới;
   trên 4: lưới + nhãn "+5").

5. **Tải ảnh lười** (`loading="lazy"`) và chừa sẵn khung đúng tỉ lệ để trang không nhảy
   khi ảnh tải xong.

**Xong khi:** cuộn qua 30 bài mượt, không giật, không nhảy layout.

**Bẫy**
- Đừng tải ảnh kích thước đầy đủ cho thẻ nhỏ. Nếu thấy tốn băng thông, cân nhắc lưu thêm
  một bản thumbnail lúc upload (P2-05) — rẻ hơn nhiều so với tải bản lớn mỗi lần cuộn.
- Signed URL có hạn: xin theo lô cho các bài đang hiện, đừng xin từng tấm một.

---

## P2-12 · Chế độ lưới ảnh

**Mục tiêu:** xem nhanh toàn bộ ảnh, không cần đọc caption.

**Các bước**

1. Nút chuyển chế độ ở header: **Dòng thời gian** ⇄ **Lưới ảnh**.

2. Lưới 3 cột, ảnh vuông (cắt giữa), không có chữ.

3. Nhớ lựa chọn của người dùng (`localStorage`) — lần sau mở vào đúng chế độ họ thích.

4. Chạm vào một ảnh → mở chi tiết bài chứa ảnh đó, **nhảy đúng tới tấm đã chạm**.

**Xong khi:** chuyển qua lại hai chế độ mượt, vị trí cuộn không bị nhảy về đầu.

---

## P2-13 · Chi tiết bài

**Mục tiêu:** xem ảnh cho đã, và đọc bình luận.

**Các bước**

1. Ảnh toàn màn hình, **vuốt ngang** để chuyển tấm, hiện chỉ số `2/5`.

2. Bên dưới: caption đầy đủ · địa điểm · hoạt động · chi phí · ngày · ai đăng.

3. Phần bình luận nằm dưới cùng (nối ở [d-reactions.md](d-reactions.md)).

4. Vuốt xuống để đóng — cử chỉ quen thuộc trên iOS.

5. Ở đây **mới** tải ảnh bản lớn, không phải ở timeline.

**Xong khi:** vuốt qua 5 ảnh mượt trên iPhone thật, không chớp trắng giữa các tấm.

**Bẫy**
- Tải trước tấm kế tiếp trong lúc người dùng đang xem tấm hiện tại — nếu không, mỗi lần
  vuốt là một lần chờ.

---

## P2-14 · Sửa / xoá bài

**Mục tiêu:** sửa được lỗi chính tả, xoá được bài đăng nhầm.

**Các bước**

1. Nhấn giữ thẻ bài → bảng chọn: **Sửa** · **Xoá**.
   **Chỉ hiện với bài của chính mình.**

2. Sửa: mở lại màn hình soạn bài với dữ liệu điền sẵn. Cho sửa caption, ngày, địa điểm,
   hoạt động. Phase 2 **chưa** cho thêm/bớt ảnh — để sau, tránh phình.

3. Xoá: hỏi xác nhận, rồi **xoá mềm** (đặt `deleted_at`).

4. Xoá bài → bình luận đi theo. File ảnh trong Storage thì dọn sau bằng một việc chạy định
   kỳ, không xoá ngay — tránh hỏng nếu người dùng đổi ý.

**Xong khi:** sửa caption trên máy A, máy B thấy đổi. Xoá bài thì cả hai máy đều mất bài đó.

**Bẫy**
- Cả hai cùng sửa một bài: người lưu sau thắng. Với 2 người dùng thì đủ, không cần làm phức tạp hơn.

---

## P2-15 · Bộ lọc

**Mục tiêu:** tìm lại kỉ niệm cũ mà không phải cuộn mãi.

**Các bước**

1. Bộ lọc nhẹ nhàng ở header, **không chiếm chỗ**: theo **năm** và theo **hoạt động**.

2. Lọc chạy ở database (thêm điều kiện vào truy vấn), không lọc ở client — nếu không, càng
   nhiều bài càng chậm và càng tốn băng thông.

3. Đang lọc thì hiện rõ dấu hiệu + nút xoá bộ lọc.

**Xong khi:** lọc theo "🍜 ăn uống" ra đúng các bài đã gắn hoạt động đó.

**Bẫy**
- Đừng làm ô tìm kiếm toàn văn ở Phase 2. Với vài chục bài thì lọc là đủ; tìm kiếm để sau
  khi dữ liệu đã nhiều.

---

## P2-16 · Trạng thái rỗng

**Mục tiêu:** timeline trống vẫn mời gọi, không lạnh lẽo.

**Các bước**

1. Chưa có bài nào → **không** hiện "Chưa có dữ liệu". Thay bằng:
   > *Kỉ niệm đầu tiên của hai đứa nằm ở đây nè 📷*
   > **[Đăng kỉ niệm đầu tiên]**

2. Lọc ra 0 kết quả → thông điệp khác hẳn: *"Không có kỉ niệm nào trong năm 2025"* + nút
   xoá bộ lọc. Đừng dùng chung một màn hình cho hai tình huống khác nhau.

3. Đang tải lần đầu → hiện khung xương (skeleton), không hiện vòng xoay giữa màn hình trắng.

**Xong khi:** tài khoản mới tinh mở tab Kỉ niệm thấy màn hình dễ chịu và biết phải làm gì.

**Bẫy**
- Trạng thái rỗng là màn hình **đầu tiên** người dùng thấy ở tab này. Làm qua loa thì ấn
  tượng đầu tiên về tính năng chính của app là một màn hình trống.
