# F. Home — P4-36 → P4-38

Đặc tả: [p1-home-dashboard.md](../../../docs/features/p1-home-dashboard.md) mục 2.
Xem trước: màn hình **P4-01** trong
[prototype.html](../../../docs/design/frontend/ui/prototype.html).

Sau nhóm này, Home đã **đủ mọi khối** — đây là hình dạng cuối cùng của nó. Phase 5 và 6
không thêm khối mới nào.

---

## P4-36 · Khối "THÁNG NÀY"

**Các bước**

1. Đặt **dưới** khối Kỉ niệm gần đây:
   ```
   THÁNG NÀY                        Chi tiết
   8 buổi hẹn              2.450.000đ
   Đi ăn 12 lần — nhiều nhất tháng này
   ```

2. Dòng thứ hai là **dải nhận xét rút gọn** từ
   [c-expense-view.md](c-expense-view.md#p4-20--dải-nhận-xét) — dùng lại cùng hàm, chỉ lấy
   câu ngắn nhất.

3. Tháng chưa có khoản chi nào → **ẩn hẳn khối**.

4. "Chi tiết" → tab Chi tiêu, đúng tháng đang hiện.

**Xong khi:** Home hiện đúng tổng tháng hiện tại, chạm vào mở đúng tháng đó.

---

## P4-37 · Khối "MỤC TIÊU"

**Các bước**

1. Đặt cuối cùng, dưới khối Tháng này:
   ```
   MỤC TIÊU                      Xem tất cả
   Đi Đà Lạt        ████████░░  80%
   ```

2. **Chỉ một mục tiêu** — chọn cái **gần hoàn thành nhất** trong số đang làm. Nó tạo cảm
   giác sắp tới đích, thay vì nhắc về đống việc còn dở.

3. Không có mục tiêu đang làm → ẩn hẳn khối.

4. Mục tiêu quá hạn **không được chọn** hiện ở đây — giữ đúng luật "quá hạn thì im lặng"
   ở [d-goals.md](d-goals.md#p4-31--quá-hạn-thì-im-lặng).

**Xong khi:** Home hiện mục tiêu gần xong nhất; hoàn thành nó thì khối đổi sang mục tiêu khác.

---

## P4-38 · Rà lại Home một lượt

> **Task dễ bỏ qua nhất, và nên làm thật.** Home đã lớn dần qua bốn phase, mỗi phase thêm
> một khối. Không rà lại thì nó là một chồng thẻ chắp vá chứ không phải một màn hình được
> thiết kế.

**Các bước**

1. **Thứ tự khối** — theo mức độ cần gấp, không theo thứ tự phase đã làm:

   | # | Khối | Vì sao ở đây |
   |---|---|---|
   | 1 | Ảnh bìa + số ngày | Lý do người ta cài app |
   | 2 | Sắp tới | Việc cần biết ngay |
   | 3 | 🍜 Tối nay ăn gì? | Việc cần **làm** ngay |
   | 4 | Kỉ niệm gần đây | Để ngắm |
   | 5 | Tháng này | Để nhìn lại |
   | 6 | Mục tiêu | Nhìn xa |

   Từ "cần gấp" xuống "nhìn xa". Ai mở app vội chỉ cần đọc hai khối đầu.

2. **Khoảng cách thống nhất**: cùng một `gap` giữa mọi khối, cùng padding trong thẻ, tiêu
   đề khối cùng cỡ và cùng kiểu.

3. **Không phải mọi khối đều là thẻ.** Khối "Sắp tới" và "Kỉ niệm gần đây" là danh sách,
   không cần viền và bóng. Đóng khung tất cả làm mất thứ bậc — cái gì cũng nổi thì không
   cái nào nổi.

4. Kiểm **trạng thái ít dữ liệu**: tài khoản mới, chưa có chi tiêu, chưa có mục tiêu →
   Home chỉ còn 3 khối và vẫn phải đẹp.

5. Kiểm **chế độ tối** và **vùng an toàn iPhone** một lượt từ đầu tới cuối.

6. Kiểm thời gian tải: Home giờ gọi 5–6 truy vấn. Gộp lại bằng một RPC nếu thấy chậm, và
   hiện khung xương thay vì màn hình trắng.

**Xong khi:**
- [ ] Cuộn từ trên xuống dưới, khoảng cách đều, không có khối nào lạc điệu
- [ ] Tài khoản mới tinh mở Home vẫn đẹp
- [ ] Chế độ tối đọc được mọi chỗ
- [ ] Home tải xong trong ~1 giây trên mạng 4G

---

## Trước khi kết thúc Phase 4

Chạy lại toàn bộ DoD ở [../context.md](../context.md) mục 1 — đặc biệt dòng cuối:

> **Tìm khắp app: không còn chữ "nợ" nào.**

Rồi:

1. Cập nhật [../context.md](../context.md): trạng thái ✅ + nhật ký phiên
2. Cập nhật [../../README.md](../../README.md): **Phase đang chạy** → Phase 5
3. Phase 5 có hai tính năng mà **RLS chính là tính năng** (câu hỏi mỗi ngày, thư tương lai).
   Đọc kỹ [../../phase-05/steps/README.md](../../phase-05/steps/README.md) trước khi bắt đầu.
