# C. Xem chi tiêu — P4-16 → P4-23

Đặc tả: [p4-expenses.md](../../../docs/features/p4-expenses.md) mục 4.
Xem trước: màn hình **P4-02** trong
[prototype.html](../../../docs/design/frontend/ui/prototype.html).

---

## P4-16 · Màn hình theo tháng

**Mục tiêu:** một tháng một màn hình, chuyển tháng dễ.

**Các bước**

1. Header: `◀ Tháng 9, 2026 ▶`. Vuốt ngang cũng chuyển tháng được.
2. Mặc định mở **tháng hiện tại**.
3. Không cho đi quá tháng có khoản chi đầu tiên, và không quá tháng hiện tại.
4. Truy vấn lọc theo `spent_on` trong khoảng tháng, ở **database**, không lọc ở client.

**Xong khi:** chuyển qua lại ba tháng mượt, số liệu đổi đúng.

---

## P4-17 · Khối tổng

**Mục tiêu:** ba con số trả lời "tháng này thế nào".

**Các bước**

1. ```
   Tổng chi                    2.450.000đ
   Minh trả 1.850.000 · Linh trả 600.000
   Trung bình mỗi buổi hẹn        306.000đ
   ```

2. "Minh trả / Linh trả" ở đây **chỉ là thông tin**. Không có mũi tên, không có màu cảnh
   báo, không có câu nào gợi ý ai nên trả bù.

3. "Trung bình mỗi buổi hẹn" = tổng chi ÷ số **bài Timeline có gắn chi phí** trong tháng —
   không phải ÷ số khoản chi (một buổi hẹn có thể có 3 khoản).

**Xong khi:** ba con số đúng, kiểm tay lại một tháng có dữ liệu thật.

---

## P4-18 · Biểu đồ tròn theo danh mục

**Mục tiêu:** nhìn là biết tiền đi đâu.

**Các bước**

1. **Không cần thư viện biểu đồ.** `conic-gradient` là đủ:
   ```css
   .donut {
     background: conic-gradient(
       var(--c-food) 0 42%, var(--c-coffee) 0 62%,
       var(--c-fun)  0 82%, var(--c-other)  0 100%);
   }
   .donut::after {           /* lỗ ở giữa */
     content:""; position:absolute; inset:25px;
     border-radius:50%; background: var(--color-surface);
   }
   ```

2. Bảy danh mục là quá nhiều lát cho một vòng tròn nhỏ. **Gộp: lấy 4 danh mục lớn nhất,
   phần còn lại vào "Khác".**

3. Màu danh mục là **màu ngữ nghĩa**, tách khỏi màu chủ đạo của theme. Chọn 4–5 màu đọc
   được ở **cả chế độ sáng và tối** — kiểm cả hai.

4. Chú thích bên cạnh: chấm màu · tên · số tiền, `tabular-nums` cho thẳng cột.

5. Giữa vòng tròn: tổng chi viết gọn (`2,45tr`).

**Xong khi:** biểu đồ đúng tỉ lệ, chú thích khớp, đọc được ở chế độ tối.

**Bẫy**
- `conic-gradient` với cú pháp `màu 0 42%` nghĩa là "từ vị trí trước tới 42%". Viết
  `màu 42%` không có số 0 sẽ ra kết quả khác hẳn.

---

## P4-19 · Danh sách khoản chi

**Các bước**

1. Mỗi dòng: ngày · icon danh mục · nội dung · ai trả · số tiền (phải, `tabular-nums`).
2. Khoản sinh từ kỉ niệm có **icon 📷**, chạm vào mở bài đó.
3. Nhóm theo ngày nếu một ngày có nhiều khoản.
4. Nhấn giữ → Sửa / Xoá.

**Xong khi:** chạm icon 📷 mở đúng bài Timeline tương ứng.

---

## P4-20 · Dải nhận xét

> **Đây là task biến một bảng số thành thông tin.** Không có nó, màn hình này chỉ là một
> cái máy tính; có nó, nó kể được chuyện.

**Mục tiêu:** một câu, sinh từ dữ liệu, đổi theo tháng.

**Các bước**

1. Tính vài chỉ số trong query tháng: số lần theo danh mục, so với tháng trước, khoản lớn nhất.

2. Chọn câu theo thứ tự ưu tiên, lấy câu **đầu tiên đủ điều kiện**:

   | Điều kiện | Câu |
   |---|---|
   | Có tháng trước + danh mục nhiều nhất chênh ≥ 3 lần | *"Tháng này tụi mình đi ăn 12 lần — nhiều hơn tháng trước 4 lần"* |
   | Có khoản ≥ 3 lần trung vị | *"Buổi hẹn đắt nhất: Đà Lạt — 4.200.000đ"* |
   | Không có tháng trước | *"Tháng đầu tiên tụi mình ghi chi tiêu 🎉"* |
   | Tháng chưa có khoản nào | (ẩn dải này) |

3. **Không bao giờ dùng giọng trách móc.** Không có *"tiêu nhiều hơn tháng trước 30%"*, và
   tuyệt đối không có cảnh báo vượt ngân sách — xem
   [p4-expenses.md](../../../docs/features/p4-expenses.md) mục 7.

**Xong khi:** ba tháng khác nhau cho ba câu khác nhau, câu nào cũng đúng.

---

## P4-21 · Loại khoản bất thường

**Mục tiêu:** một khoản 20 triệu không làm hỏng "trung bình mỗi buổi hẹn".

**Các bước**

1. Tính **trung vị** của các khoản trong tháng.
2. Khoản vượt **10 lần trung vị** → loại khỏi phép tính trung bình (vẫn tính vào tổng chi).
3. Ghi chú nhỏ khi có loại trừ: *"(chưa tính khoản đặt cọc 20tr)"* — đừng lặng lẽ bỏ, người
   dùng sẽ tưởng app tính sai.

**Xong khi:** thêm một khoản rất lớn → tổng chi tăng, trung bình mỗi buổi hẹn **không nhảy vọt**.

---

## P4-22 · Sửa / xoá khoản chi

**Mục tiêu:** sửa thoải mái, không sợ hỏng gì.

**Các bước**

1. Sửa: mở lại form với dữ liệu điền sẵn.
2. Xoá: **xoá mềm** (`deleted_at`), hỏi xác nhận.
3. ✅ **Không có số dư nào phải tính lại** — thống kê tính lại từ đầu mỗi lần truy vấn.

   > Đây là phần thưởng cụ thể của quyết định D6. Trong bản thiết kế cũ, đây là task khó
   > nhất cả phase.

**Xong khi:** sửa một khoản của tháng trước → mọi con số tháng đó tự đúng, không thao tác gì thêm.

---

## P4-23 · Xoá bài Timeline có gắn chi phí

**Mục tiêu:** không âm thầm làm mất tiền đã ghi.

**Các bước**

1. Xoá bài → kiểm tra có `expenses` nào trỏ tới không.

2. Có thì hỏi rõ:
   ```
   Bài này có gắn khoản chi 180.000đ.
   [Giữ khoản chi]   [Xoá luôn]
   ```
   **Mặc định là "Giữ"** — tiền đã tiêu là sự thật, không phụ thuộc tấm ảnh còn hay mất.

3. Giữ → `post_id` thành `null` (đã đặt `on delete set null` ở
   [a-database.md](a-database.md#p4-03--nối-với-bài-timeline)), icon 📷 biến mất.

4. Chiều ngược lại: xoá khoản chi thì **bài giữ nguyên**, không hỏi gì.

**Xong khi:** xoá một bài có chi phí → hỏi đúng câu trên; chọn "Giữ" thì khoản chi còn
nguyên trong tháng.
