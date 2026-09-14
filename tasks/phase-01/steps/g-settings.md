# G. Cài đặt + huỷ ghép đôi — P1-30 → P1-33

Đặc tả: [p1-couple-profile.md](../../../docs/features/p1-couple-profile.md) ·
[p1-breakup.md](../../../docs/features/p1-breakup.md).

---

## P1-30 · Màn hình Cài đặt

**Mục tiêu:** một nơi gọn gàng cho mọi thứ không thuộc luồng chính.

**Các bước**

1. `src/features/settings/SettingsScreen.tsx`, vào từ icon ⚙ ở header Home.

2. Bốn nhóm, theo thứ tự:

   | Nhóm | Nội dung |
   |---|---|
   | **Không gian của chúng ta** | Ảnh bìa · biệt danh hai người · ngày bắt đầu yêu · theme màu |
   | **Thông báo** | Bật/tắt riêng từng loại |
   | **Tài khoản** | Email · **Đặt / đổi mật khẩu** · Đăng xuất |
   | **Vùng nguy hiểm** | Huỷ ghép đôi |

3. "Vùng nguy hiểm" đặt **cuối cùng**, có khoảng cách rõ với phần trên, chữ màu cảnh báo.

**Xong khi:** vào ra được, đăng xuất chạy đúng (quay về `/welcome`).

---

## P1-31 · Sửa hồ sơ đôi

**Mục tiêu:** sửa được thông tin đã nhập lúc onboarding.

**Các bước**

1. Chia rõ hai loại — đây là chỗ thể hiện nguyên tắc space-first:

   | Thuộc space (**cả hai** sửa được) | Thuộc từng người (**chỉ chủ nhân** sửa) |
   |---|---|
   | Ngày bắt đầu yêu · ảnh bìa · theme màu | Biệt danh · avatar của mình |

   Không có khái niệm "chủ space". Cũng không ai được đặt biệt danh thay người kia.

2. **Đổi ngày bắt đầu yêu → gửi thông báo cho người kia.** Đây là con số cảm xúc nhất
   trong app; đổi âm thầm sẽ gây hiểu lầm.

3. Ràng buộc: ngày bắt đầu yêu **không được ở tương lai**; quá xa quá khứ (ví dụ 1950) thì
   cảnh báo nhẹ nhưng vẫn cho lưu.

4. Đổi theme → áp dụng realtime cho **cả hai máy**, vì theme thuộc về space.

5. Upload ảnh bìa: nén ở client trước khi gửi lên Supabase Storage. Đây là lần đầu đụng
   tới ảnh — làm cẩn thận vì Phase 2 sẽ dùng lại đúng đoạn code này.

**Xong khi:** sửa trên máy A, máy B thấy đổi mà không cần tải lại trang.

---

## P1-32 · Bật/tắt thông báo

**Mục tiêu:** tắt được thứ làm phiền mà **không phải tắt hết**.

**Các bước**

1. Migration bảng tuỳ chọn thông báo theo từng người, từng loại.
   Phase 1 mới có một loại ("người ấy tham gia") nhưng làm sẵn cấu trúc mở rộng được.

2. Công tắc tổng: xin quyền / thu hồi đăng ký push (nối với
   [e-notifications.md](e-notifications.md)).

3. Nếu người dùng đã từ chối quyền ở tầng hệ điều hành, hiện hướng dẫn vào Cài đặt iPhone
   để bật lại — app không tự bật được.

4. **Giờ yên lặng** (ví dụ 22:00–08:00): thông báo không khẩn thì hoãn tới sáng. Phase 1 chỉ
   cần lưu tuỳ chọn; phần hoãn thật làm ở Phase 3 khi có nhắc sự kiện.

**Xong khi:** tắt rồi thì thật sự không nhận được thông báo nữa.

---

## P1-33 · Huỷ ghép đôi (bản rút gọn)

**Mục tiêu:** có đường thoát tử tế — và đường thoát khỏi việc **ghép nhầm người**.

Phase 1 chỉ làm: **chuyển sang chỉ đọc + báo người kia + cho tạo space mới**.
Xuất dữ liệu đầy đủ và xoá vĩnh viễn để Phase 6.

**Các bước**

1. Màn hình giải thích — **nói thẳng, không né tránh**:
   ```
   • Không gian chuyển sang chỉ đọc, không ai đăng thêm được
   • Cả hai VẪN xem và tải được toàn bộ kỉ niệm
   • Không có gì bị xoá ngay
   • Muốn xoá vĩnh viễn thì cần cả hai cùng xác nhận
   ```

2. Nút **[Tải toàn bộ dữ liệu về máy]** đặt **TRƯỚC** nút xác nhận.
   Phase 1 chưa có tính năng xuất đầy đủ → tạm thời để nút này ở trạng thái *"Sắp có"*,
   nhưng **giữ đúng vị trí** để sau chỉ việc nối vào.

3. Xác nhận bằng cách gõ một từ, rồi mới cho bấm nút huỷ.

4. Thực hiện: đặt `couples.status = 'archived'`.
   Nhờ đã tách `can_write_to` ở [b-database.md](b-database.md#p1-09--hàm-phân-quyền),
   **toàn bộ quyền ghi tự động bị chặn** — không phải sửa từng chỗ.

5. Thông báo cho người kia, **nhẹ nhàng, không kịch tính**: một câu trung tính, không emoji
   trái tim vỡ.

6. Cả hai được tạo space mới. Space cũ vẫn xem được, nằm trong mục "Không gian cũ".

7. Trường hợp **chưa có người thứ hai** → chỉ là huỷ space, xoá thẳng, không cần nghi thức gì.

**Xong khi:**
- Huỷ xong, cả hai máy tự chuyển sang chế độ chỉ đọc (realtime), mọi nút thêm mới biến mất
- Người còn lại vẫn đọc được dữ liệu cũ
- Tạo được space mới ngay sau đó

**Bẫy**
- **Một người là đủ để huỷ ghép.** Bắt cả hai đồng ý thì người muốn thoát bị giam — không
  chấp nhận được. Nhưng **xoá vĩnh viễn thì phải cần cả hai**.
- Đừng "hồi sinh" space cũ khi ghép lại — ghép lại tạo space mới. Trạng thái nửa vời gây rối
  hơn là giúp.
- Xử lý phần này đàng hoàng là điều khiến app đáng tin. Đừng để nó thành một cái nút đỏ vô cảm.

---

## P1-38 · Đặt / đổi mật khẩu (phần UI Cài đặt)

Đặc tả: [p1-auth.md](../../../docs/features/p1-auth.md). Hướng dẫn đầy đủ: [c-auth.md](c-auth.md) P1-38.

Thêm hàng trong nhóm **Tài khoản**, mở form/sheet nhập mật khẩu mới + nhập lại.
Không nhét vào onboarding — chỉ khi người dùng chủ động vào Cài đặt.
