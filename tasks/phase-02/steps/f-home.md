# F. Home — P2-26

Đặc tả: [p1-home-dashboard.md](../../../docs/features/p1-home-dashboard.md) mục 2.

Phase 1 Home chỉ có ảnh bìa + số ngày. Phase 2 thêm hai khối, và đây là lần đầu Home trở
thành "bảng điều khiển" thật sự chứ không phải một trang tĩnh.

---

## P2-26 · Khối "Kỉ niệm gần đây" + tab bar

**Mục tiêu:** mở app là thấy ảnh mới nhất, và đi được tới mọi nơi.

**Các bước**

1. **Khối "Kỉ niệm gần đây"** đặt dưới khối số ngày:
   ```
   ├──────────────────────────────────────┤
   │  KỈ NIỆM GẦN ĐÂY          Xem tất cả │
   │  [ảnh] [ảnh] [ảnh] [ảnh]             │
   ```
   - 4 ảnh mới nhất, vuông, chạm vào mở chi tiết bài
   - "Xem tất cả" → tab Kỉ niệm
   - **Chưa có bài nào → ẩn hẳn khối này**, đừng hiện ô trống

2. Thêm **thẻ "Tối nay ăn gì?"** từ [e-eat-tonight.md](e-eat-tonight.md#p2-25--thẻ-trên-home).
   Đặt nó **trên** khối Kỉ niệm — đó là thứ cần dùng gấp, còn ảnh thì để ngắm.

3. **Dựng tab bar** — giờ mới có lý do, vì đã đủ hai nơi để đi:
   ```
   🏠 Nhà     📷 Kỉ niệm     ➕     📅 Kế hoạch(ẩn)    💰 Chi tiêu(ẩn)
   ```
   - Phase 2 chỉ hiện **Nhà** · **Kỉ niệm** · nút **(+)** ở giữa
   - Hai tab Kế hoạch và Chi tiêu ẩn cho tới Phase 3–4
   - Nút (+) mở bảng chọn nhanh; Phase 2 mới có một mục: **Kỉ niệm mới**

4. Tab bar phải dùng `pb-safe` (từ [Phase 1 P1-02](../../phase-01/steps/a-setup.md)) —
   nếu không sẽ bị thanh gạt dưới đáy iPhone che.

5. Kéo để tải lại (đã làm ở Phase 1) giờ phải làm mới **cả hai khối mới**.

**Xong khi:** đăng một bài từ máy A → kéo tải lại trên máy B → ảnh xuất hiện ở khối Kỉ niệm
gần đây trên Home.

**Bẫy**
- **Đừng hiện sẵn các tab chưa có nội dung.** Tab bấm vào ra màn hình trống là dấu hiệu app
  chưa xong — tệ hơn nhiều so với việc chưa có tab đó.
- Nút (+) chỉ có một lựa chọn thì **bỏ luôn bảng chọn**, bấm vào mở thẳng flow đăng bài.
  Thêm bảng chọn khi có mục thứ hai (Phase 3).

---

## Trước khi kết thúc Phase 2

Chạy lại toàn bộ DoD ở [../context.md](../context.md) mục 1 trên **hai máy thật**:

- [ ] Đăng một kỉ niệm có ảnh **xong dưới 30 giây**, chỉ cần gõ caption
- [ ] Ảnh **được nén ở client** — kiểm chứng bằng dung lượng thật trong Storage
- [ ] Đăng khi bật chế độ máy bay → vào hàng đợi → tự gửi khi có mạng lại
- [ ] Người kia nhận push và thấy bài mới
- [ ] Thả tim / bình luận hiện realtime trên máy kia
- [ ] "Ăn gì": thêm quán bằng **một ô nhập**, quay ra kết quả hợp lý
- [ ] Tài khoản thứ ba (ngoài space) **không xem được ảnh**, kể cả khi có URL

Rồi bắt buộc:

1. Cập nhật [../context.md](../context.md): trạng thái ✅ + dòng nhật ký phiên
2. Cập nhật [../../README.md](../../README.md): **Phase đang chạy** → Phase 3
3. Viết đặc tả đầy đủ cho [p3-events-reminders.md](../../../docs/features/p3-events-reminders.md)
   (đang ở trạng thái 🔲), rồi mới chia task và viết `phase-03/steps/`

> **Kiểm tra riêng dung lượng Storage trước khi sang phase sau.** Nếu 50 tấm ảnh đã ăn hết
> vài trăm MB thì việc nén ở [b-post.md](b-post.md) có gì đó sai — sửa ngay bây giờ, vì càng
> về sau càng nhiều ảnh phải xử lý lại.
