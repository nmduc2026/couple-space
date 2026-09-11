# D. Tương tác — P2-17 → P2-19

Đặc tả: [p2-timeline.md](../../../docs/features/p2-timeline.md) mục 5.

Nhóm nhỏ nhất Phase 2, nhưng là nhóm **đổi cảm giác của app nhiều nhất**: từ "hai cuốn nhật
ký đặt cạnh nhau" thành "một cuộc trò chuyện chậm giữa hai người".

Đây cũng là lần đầu dùng **realtime** — sẽ dùng lại ở mọi phase sau.

---

## P2-17 · Thả tim

**Mục tiêu:** một chạm để nói "anh thấy rồi, anh thích".

**Các bước**

1. **Một loại duy nhất — trái tim.** Không làm bộ reaction nhiều biểu tượng: với hai người
   thì nó chỉ thêm lựa chọn chứ không thêm ý nghĩa, và hợp tông app hơn.

2. Chạm vào ❤️:
   - Chưa thả → thêm dòng `reactions`
   - Đã thả → **xoá dòng đó** (bỏ tim)

   Ràng buộc duy nhất `(post_id, user_id)` ở [a-database.md](a-database.md) đảm bảo không
   bao giờ có hai dòng.

3. **Phản hồi lạc quan:** tim đổi màu **ngay lập tức**, gọi database chạy nền. Thất bại thì
   trả lại trạng thái cũ.

4. Hiện tim của **cả hai người** trên thẻ bài — nhìn là biết người kia đã xem chưa.

**Xong khi:** chạm tim thấy đổi tức thì, không có độ trễ; chạm lại thì bỏ tim.

**Bẫy**
- Chạm nhanh nhiều lần dễ gửi trùng request. Chặn bằng cách khoá nút trong lúc mutation
  đang chạy, hoặc gộp lại (debounce).

---

## P2-18 · Bình luận + realtime

**Mục tiêu:** bình luận của người kia hiện ra **ngay khi họ gõ xong**, không cần tải lại.

**Các bước**

1. Ô nhập bình luận ở cuối màn hình chi tiết bài. Gửi bằng nút, không phải phím Enter
   (trên điện thoại Enter là xuống dòng).

2. Hiện lạc quan: bình luận xuất hiện ngay ở trạng thái mờ, rõ hẳn khi lưu xong.

3. **Đăng ký realtime** cho bảng `comments`, lọc theo bài đang mở:
   ```ts
   supabase.channel('comments:' + postId)
     .on('postgres_changes',
         { event: '*', schema: 'public', table: 'comments',
           filter: 'post_id=eq.' + postId },
         handler)
     .subscribe()
   ```

4. **Huỷ đăng ký khi rời màn hình.** Quên bước này thì mỗi lần mở bài là thêm một kết nối,
   và app chậm dần một cách khó hiểu.

5. Xoá bình luận của mình: nhấn giữ → Xoá.

6. Bật Realtime cho bảng `comments` trong bảng điều khiển Supabase — mặc định **tắt**.

**Xong khi:** mở cùng một bài trên hai máy, gõ bình luận ở máy A → máy B thấy trong vài giây
mà không chạm gì.

**Bẫy**
- Nếu realtime không chạy, kiểm tra theo thứ tự: (1) đã bật Realtime cho bảng chưa,
  (2) RLS có cho tài khoản đó đọc bảng không — **realtime cũng đi qua RLS**.
- Bình luận vừa gửi có thể hiện **hai lần**: một lần do cập nhật lạc quan, một lần do
  realtime bắn về. Khử trùng theo `id`.

---

## P2-19 · Push cho tim và bình luận

**Mục tiêu:** biết người kia vừa tương tác, kể cả khi không mở app.

**Các bước**

1. Dùng lại Edge Function `send-notification` từ
   [Phase 1 nhóm E](../../phase-01/steps/e-notifications.md).

2. Nội dung:

   | Việc | Thông báo |
   |---|---|
   | Thả tim | *"Linh đã thả tim bài của bạn ❤️"* |
   | Bình luận | *"Linh: ảnh này đẹp quá 💬"* (kèm đoạn đầu bình luận) |

3. Chạm vào → mở **đúng bài**, và với bình luận thì cuộn thẳng tới phần bình luận.

4. **Gộp**: thả tim rồi bỏ tim rồi thả lại → không gửi ba thông báo. Chỉ gửi lần thả tim
   đầu tiên cho mỗi bài.

5. Cho tắt riêng từng loại trong Cài đặt — dùng lại bảng tuỳ chọn đã làm ở Phase 1.

**Xong khi:** máy A thả tim → máy B (đã tắt màn hình) nhận thông báo, bấm vào mở đúng bài.

**Bẫy**
- Thông báo bình luận nên kèm nội dung. *"Bạn có một bình luận mới"* bắt người ta phải mở
  app mới biết chuyện gì — phiền mà không mang lại gì.
- Nhắc lại luật Phase 1: **không gửi thông báo về hành động của chính mình**. Tự thả tim
  bài mình thì không ai được báo.
