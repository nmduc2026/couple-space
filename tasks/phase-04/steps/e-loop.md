# E. Vòng lặp khép kín — P4-32 → P4-35

Đặc tả: [p4-goals.md](../../../docs/features/p4-goals.md) mục 1 và 3.

> **Nhóm nhỏ nhất Phase 4, nhưng là nhóm có giá trị sản phẩm cao nhất.**
>
> Bốn task này nối các tính năng rời rạc thành một vòng:
> ```
> Mục tiêu "đi Đà Lạt"
>    → tích bước cuối
>    → bài Timeline
>    → ảnh + chi tiêu của chuyến đi
>    → Wrapped cuối năm
> ```
> Không tính năng nào khác trong app tạo được chuỗi đó. Nếu phải cắt bớt Phase 4 vì hết
> thời gian, **đừng cắt nhóm này** — cắt nhóm G (Home) thì đúng hơn.

---

## P4-32 · Màn hình chúc mừng

**Mục tiêu:** khoảnh khắc hoàn thành phải có cảm giác.

**Các bước**

1. Kích hoạt khi:
   - `checklist`: tích **bước cuối cùng**
   - `count`: đạt số mục tiêu
   - `amount`: tổng nạp ≥ mục tiêu

2. Hiện một lớp phủ, không phải một toast nhỏ:
   ```
             🎉
      Hai đứa làm được rồi!
         Đi Đà Lạt

   [Đăng lên kỉ niệm]     [Để sau]
   ```

3. Hoạt ảnh ngắn (~1 giây), tôn trọng `prefers-reduced-motion`.

4. Ghi `completed_at` ngay khi tích, **không chờ** người dùng chọn gì. Hai việc độc lập.

5. **[Để sau] cũng hoàn toàn ổn.** Không nhắc lại, không hiện dấu chấm "chưa đăng".

**Xong khi:** tích bước cuối → lớp phủ hiện; chọn "Để sau" → đóng, mục tiêu đã xong, không
còn nhắc gì.

**Bẫy**
- Đừng chặn thao tác tích cho tới khi lớp phủ đóng. Nếu người dùng vuốt đi mất, mục tiêu
  vẫn phải đã hoàn thành.

---

## P4-33 · Nhảy vào flow đăng bài

**Mục tiêu:** từ chúc mừng tới bài đăng chỉ còn chọn ảnh.

**Các bước**

1. **[Đăng lên kỉ niệm]** mở form soạn bài của
   [Phase 2](../../phase-02/steps/b-post.md) với:

   | Trường | Điền sẵn |
   |---|---|
   | Caption | `Đi Đà Lạt ✓` |
   | Ngày | Hôm nay |
   | Hoạt động | Đoán theo tên mục tiêu nếu được (`đi`/`chuyến` → ✈️) |
   | Ảnh | **Mở thẳng trình chọn ảnh** |

2. Con trỏ **không** đặt ở caption (đã có sẵn chữ) — mở luôn trình chọn ảnh, vì đó là thứ
   duy nhất còn thiếu.

3. Đăng xong → lưu `post_id` vào `goals`, để mục "Đã hoàn thành" hiện được ảnh.

4. Người dùng **sửa caption thoải mái**. `Đi Đà Lạt ✓` chỉ là điểm bắt đầu, không phải bắt buộc.

5. Huỷ giữa chừng → mục tiêu vẫn đã hoàn thành, chỉ là chưa có bài.

**Xong khi:** từ tích bước cuối tới bài đăng xong chỉ cần: chạm [Đăng lên kỉ niệm] → chọn
ảnh → chạm [Đăng].

---

## P4-34 · Bỏ tích sau khi đã sinh bài

**Mục tiêu:** không làm mất một kỉ niệm vì một thao tác trạng thái.

**Các bước**

1. Bỏ tích bước cuối → `completed_at` về `null`, mục tiêu quay lại "đang làm".

2. ⚠️ **Bài Timeline giữ nguyên.** Không xoá, không hỏi có xoá không.

   Lý do: bài đó **đã là một kỉ niệm thật** — có ảnh thật, có thể đã có tim và bình luận
   của người kia. Nó không phải hệ quả của một trạng thái, nó là một sự kiện đã xảy ra.

3. `goals.post_id` **giữ nguyên**. Tích lại lần nữa thì không sinh bài thứ hai — kiểm
   `post_id` đã có chưa trước khi hiện nút [Đăng lên kỉ niệm].

4. Xoá hẳn mục tiêu → bài vẫn giữ nguyên. Cùng lý do.

**Xong khi:** tích → đăng bài → bỏ tích → tích lại: chỉ có **một** bài Timeline, không phải hai.

---

## P4-35 · Nối gợi ý hành động của Sự kiện

**Mục tiêu:** thông báo nhắc không chỉ tạo lo lắng, mà mở ra một việc làm được.

**Các bước**

1. Ở [Phase 3](../../phase-03/steps/d-reminders.md), thông báo nhắc sự kiện đã có chỗ dành
   cho gợi ý hành động nhưng **tạm ẩn** vì chưa có Mục tiêu. Giờ mở.

2. Mở app từ thông báo nhắc → dưới chi tiết sự kiện hiện một dải:
   > *Còn 7 ngày là kỉ niệm 1 năm — đặt bàn chưa?*
   > **[Tạo việc cần làm]**

3. Chạm → tạo mục tiêu `checklist` với:
   - Tên gợi ý theo loại sự kiện (`Chuẩn bị kỉ niệm 1 năm`)
   - **Hạn = ngày sự kiện**
   - Vài bước con gợi ý sẵn, tích/xoá được: `Đặt bàn` · `Mua quà` · `Chọn đồ`

4. Câu gợi ý theo loại sự kiện:

   | Loại | Câu |
   |---|---|
   | Sinh nhật | *"Nghĩ quà chưa?"* → nối tới [wishlist](../../../docs/features/p6-gift-wishlist.md) ở Phase 6 |
   | Kỉ niệm | *"Đặt bàn chưa?"* |
   | Chuyến đi | *"Đặt vé, đặt phòng chưa?"* |
   | Tự tạo | (không gợi ý) |

5. **Hiện một lần cho mỗi sự kiện.** Bỏ qua rồi thì thôi — gợi ý lặp lại thành cằn nhằn.

**Xong khi:** nhận nhắc sinh nhật → mở app → chạm [Tạo việc cần làm] → có một mục tiêu với
hạn đúng ngày sinh nhật và ba bước con.

**Bẫy**
- Điểm 5 quan trọng. Một gợi ý hữu ích lặp lại 7 lần trong 7 ngày trở thành thứ người ta
  muốn tắt.
