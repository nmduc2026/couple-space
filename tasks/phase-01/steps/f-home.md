# F. Home + đếm ngày — P1-26 → P1-29

Đặc tả: [p1-home-dashboard.md](../../../docs/features/p1-home-dashboard.md) ·
[p1-day-counter.md](../../../docs/features/p1-day-counter.md).

Đây là màn hình được mở nhiều nhất. Phase 1 nó chỉ có ảnh bìa + số ngày — và như vậy là đủ.

---

## P1-26 · Hàm đếm ngày

**Mục tiêu:** con số đúng, ở mọi múi giờ, mọi ngày trong năm.

**Làm task này TRƯỚC khi làm giao diện.** Nó là logic thuần, test được, và sai thì rất khó
phát hiện muộn.

**Các bước**

1. Tạo `src/lib/dateCount.ts` với hàm:
   ```ts
   daysTogether(startDate: string): number   // '2024-03-15' → 412
   ```

2. **Quy tắc tính** — đọc kỹ, đây là chỗ dễ sai nhất cả dự án:
   - `startDate` là chuỗi `YYYY-MM-DD`, **không có giờ, không có múi giờ**
   - Lấy ngày hôm nay **theo múi giờ của máy**, cũng dưới dạng `YYYY-MM-DD`
   - Trừ hai ngày lịch với nhau, **+1** (ngày bắt đầu yêu là "ngày thứ 1")

3. **Tuyệt đối không** dùng `new Date(startDate)` rồi trừ mili-giây. `new Date('2024-03-15')`
   được hiểu là **nửa đêm UTC**, và ở Việt Nam (UTC+7) nó thành 7 giờ sáng — lệch ngày trong
   nhiều trường hợp.

4. Viết hàm tính mốc tiếp theo: `nextMilestone(startDate)` trả về mốc gần nhất trong
   {trăm ngày, tròn tháng, tròn năm} và số ngày còn lại.

5. **Viết test** cho các ca biên:

   | Ca | Mong đợi |
   |---|---|
   | Hôm nay là ngày bắt đầu yêu | `1` |
   | Bắt đầu 29/2, năm sau không nhuận | Tròn năm rơi vào 28/2 |
   | Bắt đầu ngày 31, tháng sau chỉ có 30 ngày | Tròn tháng rơi vào ngày cuối tháng |
   | Đổi múi giờ máy sang UTC-8 rồi tính lại | Số ngày đổi theo, không lệch bậy |

**Xong khi:** toàn bộ test ở trên xanh.

**Bẫy**
- Cân nhắc dùng thư viện nhẹ chuyên xử lý ngày lịch thay vì tự tính — nhưng dù dùng gì, vẫn
  phải viết test ở bước 5. Đây không phải chỗ để tin tưởng.
- Hai người khác múi giờ thì **mỗi máy hiển thị theo múi giờ của máy đó**. Chấp nhận lệch
  1 ngày giữa hai người — đúng với cảm nhận thực tế, không phải lỗi.

---

## P1-27 · Giao diện Home

**Mục tiêu:** mở app là thấy hết, không cần chạm gì.

**Các bước**

1. Tạo `src/features/home/HomeScreen.tsx`, cuộn dọc, từ trên xuống:

   ```
   ┌──────────────────────────────────────┐
   │  [ảnh bìa đôi]                    ⚙  │
   │         Minh 🤍 Linh                 │
   │            412                       │
   │          ngày bên nhau               │
   │   ── còn 88 ngày nữa là 500 ──       │
   └──────────────────────────────────────┘
   ```

2. Chưa có ảnh bìa → dùng nền gradient theo màu chủ đạo, **không** hiện ô trống xám.

3. Icon ⚙ ở góc phải header → `/settings`. Không chiếm một tab.

4. **Khối nào chưa có tính năng thì ẩn hẳn**, đừng hiện "Chưa có dữ liệu". Danh sách khối
   sẽ xuất hiện dần qua các phase — xem
   [p1-home-dashboard.md](../../../docs/features/p1-home-dashboard.md) mục 2.

5. Con số ngày là thứ **lớn nhất màn hình**. Đừng để nó phải cạnh tranh với gì khác.

**Xong khi:** trên iPhone thật, ảnh bìa không bị tai thỏ che, con số hiện đúng, chế độ tối đẹp.

---

## P1-28 · Banner chờ ghép đôi

**Mục tiêu:** người thứ nhất vào Home được, nhưng luôn nhớ mời người kia.

**Các bước**

1. Nếu space mới có 1 thành viên, hiện dải banner ngay dưới header:
   > *Đang chờ **Linh** tham gia* · **[Mời lại]**

2. [Mời lại] mở lại bảng chia sẻ với đúng nội dung ở
   [d-pairing.md](d-pairing.md#p1-18--phòng-chờ--lời-mời).

3. Lắng nghe realtime: người kia tham gia → banner biến mất + hiện màn hình chúc mừng.

**Xong khi:** trên máy người thứ nhất, khi máy kia bấm tham gia thì banner tự biến mất mà
không cần tải lại trang.

**Bẫy**
- Đây là tính năng chống rủi ro lớn nhất của app ("một người dùng, người kia không"). Đừng
  làm banner mờ nhạt tới mức không ai thấy, cũng đừng làm nó chắn đường.

---

## P1-29 · Kéo để tải lại + trạng thái ngoại tuyến

**Mục tiêu:** app vẫn dùng được khi push không tới hoặc mạng chập chờn.

**Các bước**

1. **Kéo để tải lại** — bắt buộc, vì push có thể không tới. Trên PWA phải tự làm (không có
   sẵn như app native): bắt sự kiện chạm khi đang ở đầu trang, kéo quá ngưỡng thì gọi
   `refetch()` của TanStack Query.

2. Phát hiện mất mạng bằng `navigator.onLine` + sự kiện `online`/`offline`, hiện một dải
   mỏng *"Đang ngoại tuyến"* ở đầu màn hình.

3. Mất mạng → **hiện dữ liệu đã cache**, không hiện màn hình lỗi trắng.

4. Cấu hình TanStack Query giữ cache đủ lâu để lần mở app sau có nội dung ngay lập tức,
   rồi mới làm mới ngầm phía sau.

**Xong khi:** bật chế độ máy bay, mở app → vẫn thấy số ngày và ảnh bìa, có dải báo ngoại tuyến.

**Bẫy**
- Kéo-để-tải-lại trên iOS dễ đụng với hiệu ứng nảy (rubber-band) của Safari. Thử kỹ trên
  máy thật; nếu vướng quá thì tạm thay bằng một nút tải lại ở header — có còn hơn không.
