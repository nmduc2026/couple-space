# B. Ghi chi tiêu — P4-09 → P4-15

Đặc tả: [p4-expenses.md](../../../docs/features/p4-expenses.md) mục 3.
Xem trước: màn hình **P4-03** trong
[prototype.html](../../../docs/design/frontend/ui/prototype.html).

> **Luật chi phối cả nhóm:** ghi một khoản chi phải xong **dưới 15 giây**, form chỉ có
> **4 trường**. Cùng bài học đã gặp ở [Timeline](../../phase-02/steps/b-post.md) và
> [Ăn gì](../../phase-02/steps/e-eat-tonight.md): form dài thì hai tuần sau không ai ghi nữa.

---

## P4-09 · Mở tab Chi tiêu

**Các bước**

1. Gỡ trạng thái ẩn của tab **💰 Chi tiêu** trong tab bar.
2. Nút (+) giờ có ba mục: `Kỉ niệm mới` · `Chi tiêu mới` · `Sự kiện mới`.
3. Thứ tự trong bảng chọn theo **tần suất dùng**, không theo thứ tự phase.

**Xong khi:** tab bar đủ 4 tab + nút (+), mọi tab đều ra màn hình thật.

---

## P4-10 · Form thêm chi tiêu

**Mục tiêu:** bốn trường, hết.

**Các bước**

1. Thứ tự trường:

   | Trường | Bắt buộc | Mặc định |
   |---|---|---|
   | Số tiền | ✅ | — (con trỏ đặt sẵn ở đây) |
   | Nội dung | ✅ | — |
   | Danh mục | — | Đoán theo nội dung nếu được |
   | Ngày | — | Hôm nay |
   | Ai trả | — | **Người đang ghi** |

2. ❌ **Không có trường "chia thế nào".** Không có "bao trọn", không có "theo tỉ lệ".
   Nếu bạn đang nhìn một bản thiết kế cũ có những trường đó — bản đó đã lỗi thời.

3. Dòng phụ ở cuối form thay cho chỗ trước đây hiện số dư nợ:
   > *📊 Tháng 9 tới giờ: **2.630.000đ** · 9 buổi hẹn*

   Nó cho ngữ cảnh mà không tạo áp lực — đúng thứ đang cần ở vị trí đó.

4. Nút Lưu ở **header**, không phải cuối trang (bàn phím iPhone che mất).

**Xong khi:** ghi một khoản chi trong dưới 15 giây, bấm giờ thử thật.

---

## P4-11 · Bàn phím số và định dạng tiền

**Mục tiêu:** gõ tiền không khó chịu.

**Các bước**

1. `inputMode="numeric"` để iPhone mở bàn phím số.

2. **Định dạng khi đang gõ**: `180000` → hiện `180.000`. Lưu vào state là số nguyên, chỉ
   định dạng ở lớp hiển thị.

3. Ô nhập số tiền là **chữ to nhất màn hình** (~26px, đậm) — nó là trường chính.

4. Nút tắt cộng nhanh: `+10k` `+50k` `+100k` bên dưới ô nhập. Phần lớn khoản chi là số tròn.

5. `font-variant-numeric: tabular-nums` ở mọi chỗ hiện tiền để các chữ số thẳng cột.

**Xong khi:** gõ `180000` thấy `180.000 đ` mượt, không nhảy con trỏ.

**Bẫy**
- Định dạng khi gõ dễ làm con trỏ nhảy về đầu. Nếu vướng, đơn giản hơn: chỉ định dạng khi
  **rời khỏi ô** (`onBlur`).

---

## P4-12 · Danh mục

**Mục tiêu:** chọn một chạm, không gõ.

**Các bước**

1. Bảy danh mục **cố định**, hiện thành hàng icon:
   `🍜 ăn uống` · `☕ cà phê` · `🎬 giải trí` · `✈️ du lịch` · `🛒 mua sắm` · `🎁 quà` · `📦 khác`

2. **Không cho tự tạo danh mục.** Nghe linh hoạt nhưng làm thống kê vỡ vụn — và với hai
   người cùng nhập thì không ai giữ được sự nhất quán.

3. Không chọn gì → `📦 khác`. Không bắt buộc.

**Xong khi:** chọn danh mục là một chạm, không mở màn hình phụ.

---

## P4-13 · Nối với form soạn bài Timeline

**Mục tiêu:** không nhập hai lần.

**Các bước**

1. Mục "💰 Thêm chi phí" trong form soạn bài (đã dựng gọn ở
   [Phase 2](../../phase-02/steps/b-post.md), mới chỉ lưu số tiền vào bài) — giờ nối thật.

2. Mở ra thì hiện gọn: số tiền · danh mục · ai trả. **Không hỏi lại** ngày và nội dung —
   lấy từ bài.

3. Đăng bài thành công → tạo `expenses` với:
   - `post_id` = bài vừa tạo
   - `spent_on` = `happened_on` của bài (**không phải hôm nay**)
   - `title` = caption bài (cắt 60 ký tự)

4. **Thứ tự quan trọng:** tạo bài trước, tạo khoản chi sau. Bài hỏng thì không có khoản chi
   mồ côi.

5. Số tiền đã lưu trong bài từ Phase 2 — nếu đã có dữ liệu thật thì viết một migration chuyển
   chúng thành `expenses`.

**Xong khi:** đăng một kỉ niệm kèm chi phí → sang tab Chi tiêu thấy khoản đó, có icon 📷,
chạm vào mở đúng bài.

**Bẫy**
- Điểm 3: dùng `happened_on` chứ không phải `now()`. Đăng ảnh chuyến đi tuần trước mà khoản
  chi ghi hôm nay thì thống kê tháng sai.

---

## P4-14 · Đoán sẵn danh mục

**Mục tiêu:** bớt một chạm.

**Các bước**

1. Từ **hoạt động của bài** sang danh mục chi tiêu:

   | Hoạt động bài | Danh mục |
   |---|---|
   | 🍜 | ăn uống |
   | ☕ | cà phê |
   | 🎬 | giải trí |
   | ✈️ | du lịch |
   | 🏠 · không có | khác |

2. Đoán thêm từ **nội dung** khi ghi tay: chứa "cà phê"/"coffee" → cà phê; "phim"/"CGV" →
   giải trí. Một bảng từ khoá ngắn, không cần thông minh.

3. **Luôn cho sửa.** Đoán sai mà không sửa được thì tệ hơn không đoán.

**Xong khi:** đăng bài gắn 🍜 kèm chi phí → danh mục tự chọn "ăn uống".

---

## P4-15 · Hàng đợi đồng bộ

**Mục tiêu:** ghi được khi mất mạng.

**Các bước**

1. **Dùng lại cơ chế hàng đợi đã dựng ở
   [Phase 2](../../phase-02/steps/b-post.md#p2-09--hàng-đợi-đồng-bộ-khi-mất-mạng).**
   Không viết cái thứ hai.

2. Khoản chi nhẹ hơn ảnh nhiều (chỉ vài trăm byte) nên phần này đơn giản — nhưng vẫn cần:
   người ta hay ghi chi tiêu **ngay lúc trả tiền**, thường ở trong quán, sóng yếu.

3. Khoản chờ gửi hiện trong danh sách với dấu ⏳, vẫn tính vào tổng tháng.

**Xong khi:** bật chế độ máy bay → ghi một khoản → thấy ⏳ → tắt chế độ máy bay → tự gửi đi.
