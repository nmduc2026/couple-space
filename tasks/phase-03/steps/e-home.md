# E. Home + Cài đặt — P3-22 → P3-24

Đặc tả: [p1-home-dashboard.md](../../../docs/features/p1-home-dashboard.md) mục 2 ·
[p1-notifications.md](../../../docs/features/p1-notifications.md).

Nhóm nhẹ. Nhưng P3-23 và P3-24 là **van xả áp** cho toàn bộ nhóm D — không có chúng thì
người dùng chỉ còn một cách phản ứng với thông báo phiền: tắt hết.

---

## P3-22 · Khối "SẮP TỚI" trên Home

**Mục tiêu:** mở app là thấy việc gần nhất, không cần vào tab Kế hoạch.

**Các bước**

1. Chèn khối ngay **dưới số ngày**, trên thẻ "Ăn gì":
   ```
   SẮP TỚI                          Xem tất cả
   ⭕12  🎂 Sinh nhật Linh     24/09 · nhắc trước 7 ngày
   ⭕41  💕 Kỉ niệm 2 năm      23/10 · hằng năm
   ```

2. **Chỉ 2 mục gần nhất.** Nhiều hơn thì Home thành danh sách, và mất tính "liếc là thấy".

3. Dùng lại đúng component vòng tròn đếm ngược ở
   [c-plan-ui.md](c-plan-ui.md#p3-10--vòng-tròn-đếm-ngược) — không viết lại.

4. "Xem tất cả" → tab Kế hoạch. Chạm vào một dòng → mở sự kiện đó.

5. Không có sự kiện nào trong **90 ngày tới** → **ẩn hẳn khối**. Không hiện "Chưa có sự kiện".

**Xong khi:** Home hiện đúng 2 mục gần nhất; tạo sự kiện mới gần hơn thì danh sách đổi theo.

**Bẫy**
- Home đang lớn dần qua từng phase. Sau Phase 3 nó đã có 4 khối — rà lại khoảng cách giữa
  các khối một lượt, đừng để nó thành một chồng thẻ chắp vá.

---

## P3-23 · Bật/tắt từng loại nhắc

**Mục tiêu:** tắt được thứ làm phiền **mà không phải tắt hết**.

**Các bước**

1. Mở rộng mục **Thông báo** trong Cài đặt (đã dựng ở
   [Phase 1](../../phase-01/steps/g-settings.md)) với các loại mới:

   | Loại | Mặc định |
   |---|---|
   | Kỉ niệm mới | Bật |
   | Tim và bình luận | Bật |
   | **Nhắc sự kiện** | **Bật** |
   | **Mốc ngày yêu** | **Bật** |
   | **Tròn tháng** | **Tắt** |
   | **Lời chào hằng ngày** | **Tắt** |

2. Mỗi công tắc ghi vào `notification_prefs`, và
   [d-reminders.md](d-reminders.md#p3-16--edge-function-send-reminders) đọc bảng này ở
   bước 4 của luồng gửi.

3. Tắt là **của riêng từng người**. Người kia không biết và không bị ảnh hưởng.

**Xong khi:** tắt "Mốc ngày yêu" trên máy A → máy A không nhận, **máy B vẫn nhận**.

**Bẫy**
- Kiểm tra `notification_prefs` đúng ở **Edge Function**, không phải ở app. Lọc phía app là
  vô nghĩa với thông báo đẩy — nó đã tới máy rồi.

---

## P3-24 · Giờ yên lặng

**Mục tiêu:** không bị đánh thức lúc nửa đêm.

**Các bước**

1. Trong mục Thông báo: một dòng `Giờ yên lặng` với hai ô chọn giờ, mặc định **22:00 – 08:00**.

2. Công tắc bật/tắt riêng, mặc định **bật**.

3. Ghi rõ ở dòng phụ điều dễ hiểu nhầm:
   > *"Thông báo trong khung giờ này sẽ được hoãn tới sáng, không bị bỏ qua."*

4. Khung giờ **vắt qua nửa đêm** (22:00 → 08:00) — nhớ xử lý so sánh giờ đúng cho trường
   hợp này, nó không phải `start <= t <= end` đơn thuần.

**Xong khi:** đặt giờ yên lặng 08:00–20:00, đặt một nhắc trong khung đó, xác nhận thông báo
tới **sau** 20:00 chứ không mất.

**Bẫy**
- Điểm 4 là lỗi hay gặp: khung giờ vắt qua nửa đêm cần `t >= start OR t <= end`, không phải
  `AND`. Viết sai thì giờ yên lặng không bao giờ có tác dụng — và không ai phát hiện ra cho
  tới lúc bị đánh thức lúc 2 giờ sáng.
