# A. Bản đồ dấu chân — P6-01 → P6-10

Đặc tả: [p6-footprint-map.md](../../../docs/features/p6-footprint-map.md).
Xem trước: màn hình **P6-01** trong
[prototype.html](../../../docs/design/frontend/ui/prototype.html).

> **Không thu thập GPS, không xin quyền vị trí.** Nguồn dữ liệu duy nhất là cột địa điểm
> của bài Timeline — thứ đã có từ Phase 2. Toàn bộ nhóm này là bài toán **chuẩn hoá chữ**,
> không phải bài toán bản đồ.

---

## P6-01 · SVG bản đồ Việt Nam

**Các bước**

1. Tìm hoặc dựng một file SVG có **63 đường path**, mỗi path một tỉnh/thành, mỗi path có
   `id` là mã tỉnh.

2. ✅ **Dùng SVG tĩnh, không dùng Leaflet/Mapbox.** Lý do đã ghi ở đặc tả mục 3:

   | | SVG tĩnh | Leaflet + OSM |
   |---|---|---|
   | Chi phí | $0 | $0 nhưng tốn băng thông tải tile |
   | CSP của PWA | Không phải mở gì | **Phải mở thêm** cho ảnh từ ngoài |
   | Chạy offline | ✅ | ❌ |
   | Kích thước | Một file ~100KB | Thư viện + tile |

3. Tối ưu file: bỏ metadata, làm tròn toạ độ, gộp thuộc tính. Mục tiêu dưới ~120KB.

4. Nhúng thẳng vào component React để tô màu từng path bằng `fill` theo dữ liệu.

5. Màu lấy từ **biến CSS theme**, không phải hex cứng — phải đọc được ở chế độ tối.

**Xong khi:** bản đồ hiện ra, tô thử 5 tỉnh bằng dữ liệu giả, đẹp ở cả hai theme.

**Bẫy**
- Nếu không tìm được SVG 63 tỉnh vừa ý, đường lùi chấp nhận được: bản đồ **trừu tượng** —
  các chấm đặt theo vĩ độ/kinh độ trên một nền gradient, như prototype đang làm. Mất tính
  "bản đồ thật" nhưng vẫn truyền tải được ý và rẻ hơn nhiều.

---

## P6-02 · Bảng chuẩn hoá địa điểm

**Mục tiêu:** *"Hàng Quạt"* → `Hà Nội`.

**Các bước**

1. ```sql
   create table public.place_mappings (
     id         uuid primary key default gen_random_uuid(),
     couple_id  uuid not null references public.couples(id) on delete cascade,
     raw_name   text not null,            -- đã chuẩn hoá chữ thường, bỏ dấu
     province   text not null,            -- mã tỉnh, ví dụ 'ha-noi'
     source     text not null default 'user'
                check (source in ('user','geo','alias')),
     created_at timestamptz not null default now(),
     unique (couple_id, raw_name)
   );
   ```

2. Bảng theo **từng cặp đôi**, không dùng chung: *"chỗ cũ"* nghĩa khác nhau với mỗi người.

3. Danh sách **đồng nghĩa** viết sẵn trong app (không phải database), cho các trường hợp phổ biến:
   ```
   sai gon = tp hcm = tphcm = ho chi minh  → 'tp-hcm'
   ha noi = hn                              → 'ha-noi'
   da nang = dn                             → 'da-nang'
   ```

4. Hàm chuẩn hoá chữ dùng chung: chữ thường, bỏ dấu, bỏ khoảng trắng thừa, bỏ tiền tố
   *"quán"*, *"tiệm"*, *"nhà hàng"*.

**Xong khi:** *"Quán Bún Chả Hàng Quạt"* và *"hàng quạt"* cho ra cùng một `raw_name`.

---

## P6-03 · Tra ngược từ toạ độ

**Các bước**

1. Bài có `place_lat` / `place_lng` (từ link Google Maps dán vào) → **ưu tiên cao nhất**,
   không cần hỏi người dùng.

2. Tra ngược **không gọi API bên ngoài**. Cách rẻ: bảng 63 tỉnh với **hộp bao** (bounding box)
   toạ độ, chọn tỉnh có hộp chứa điểm đó. Đủ chính xác cho mục đích này.

3. Ranh giới chồng lấn (điểm nằm trong 2 hộp) → chọn tỉnh có tâm gần hơn.

4. Ghi kết quả vào `place_mappings` với `source = 'geo'`.

**Xong khi:** bài có toạ độ Đà Lạt → tự nhận `lam-dong`, không hỏi gì.

---

## P6-04 · Khớp tên với 63 tỉnh

**Các bước**

1. Sau bước toạ độ, thử khớp tên:
   - Khớp **chính xác** với tên tỉnh (đã chuẩn hoá) → nhận
   - Khớp với **danh sách đồng nghĩa** → nhận
   - Tên **chứa** tên tỉnh (*"chợ đêm Đà Lạt"*) → nhận

2. ❌ **Không dùng khớp gần đúng (fuzzy).** *"Hà Nam"* và *"Hà Nội"* cách nhau một ký tự —
   đoán sai ở đây tạo ra dữ liệu sai mà người dùng không biết để sửa.

3. Không khớp → để `null`, chuyển sang P6-05.

**Xong khi:** *"Đà Lạt"*, *"đalat"*, *"chợ đêm Đà Lạt"* đều ra `lam-dong`; *"Hàng Quạt"* ra `null`.

---

## P6-05 · Hỏi người dùng một lần

> **Task quyết định tính năng này sống hay chết.** Nhiều app bỏ qua bước này, và kết quả là
> bản đồ trống rỗng vì phần lớn địa điểm không khớp tự động.

**Các bước**

1. Ở màn hình bản đồ, dưới cùng, một dải gọn:
   ```
   3 địa điểm chưa biết thuộc đâu
   "Hàng Quạt"  →  [Chọn tỉnh thành]
   ```

2. Chạm → danh sách 63 tỉnh có ô tìm kiếm. Chọn xong ghi vào `place_mappings` với
   `source = 'user'`.

3. ⚠️ **Hỏi một lần, không hỏi lại.** Bỏ qua rồi thì địa điểm đó vào nhóm "Chưa xác định",
   và chỉ hiện lại nếu người dùng tự mở danh sách đó.

4. Hỏi **tối đa 3 địa điểm mỗi lần mở màn hình**. Hỏi 20 cái một lúc là một biểu mẫu, và
   không ai điền.

5. Mỗi lần trả lời làm dữ liệu tốt lên **vĩnh viễn** — lần sau gặp tên đó là tự nhận.

**Xong khi:** trả lời một địa điểm → nó xuất hiện trên bản đồ ngay, và bài khác cùng tên
cũng tự nhận.

---

## P6-06 · Vẽ bản đồ

**Các bước**

1. Tỉnh đã đi → tô màu chủ đạo, độ đậm theo số lần ghé (3 mức là đủ).
2. Tỉnh chưa đi → màu nền nhạt, viền mảnh.
3. Chấm + nhãn cho các tỉnh đã đi: tên · số lần ghé.
4. Nhãn chồng nhau ở vùng đông (đồng bằng Bắc Bộ) → chỉ hiện nhãn cho 5 tỉnh nhiều lần ghé
   nhất, còn lại chỉ chấm.
5. Không cần zoom/pan ở bản đầu. Một màn hình, nhìn toàn quốc.

**Xong khi:** bản đồ với dữ liệu thật nhìn ra ngay hai đứa hay đi đâu.

---

## P6-07 · Chạm để lọc Timeline

**Các bước**

1. Chạm một tỉnh đã đi → mở Timeline **đã lọc theo tỉnh đó**.
2. Dùng lại bộ lọc đã dựng ở [Phase 2](../../phase-02/steps/c-browse.md), thêm một kiểu lọc mới.
3. Header ghi rõ đang lọc + nút xoá lọc.
4. Chạm tỉnh **chưa đi** → không làm gì (hoặc một câu nhẹ: *"Chưa tới đây bao giờ 👀"*).

**Xong khi:** chạm Đà Lạt → thấy đúng các bài ở Đà Lạt.

---

## P6-08 · Thống kê

**Các bước**

1. Ba dòng dưới bản đồ:
   ```
   Tỉnh thành đã đi cùng nhau      5 / 63
   Địa điểm đã ghé                 49
   Đi xa nhất                      Đà Lạt · 1.480 km
   ```

2. "Đi xa nhất" tính từ tỉnh có nhiều bài nhất (coi như "nhà") tới tỉnh xa nhất, theo toạ độ
   tâm tỉnh. Không cần chính xác tuyệt đối.

3. Câu kết — **lời mời, không phải lời trách**:
   > *Còn **58 tỉnh thành** hai đứa chưa đặt chân tới.*

**Xong khi:** ba con số đúng, kiểm tay lại được.

---

## P6-09 · Địa điểm nước ngoài

**Các bước**

1. Người dùng chọn "Ngoài Việt Nam" trong danh sách ở P6-05.
2. Đếm riêng: *"và 1 quốc gia khác 🌏"* dưới bản đồ.
3. **Không** cố vẽ lên bản đồ Việt Nam.
4. Nếu sau này đi nhiều nước thì mới tính lại — lúc đó là bài toán khác (bản đồ thế giới).

**Xong khi:** đánh dấu một địa điểm là nước ngoài → hiện dòng đếm riêng, bản đồ không đổi.

---

## P6-10 · Trạng thái rỗng

**Các bước**

1. Chưa bài nào có địa điểm:
   > *Gắn địa điểm vào kỉ niệm để bắt đầu vẽ bản đồ 🗺️*
   > **[Xem kỉ niệm gần đây]**

2. Nút đó mở Timeline, và các bài **chưa có địa điểm** hiện một nhãn nhỏ gợi ý bổ sung —
   đây là cách hiệu quả nhất để có dữ liệu, hơn hẳn bảo người dùng "hãy gắn địa điểm".

3. Có ít hơn 3 tỉnh → vẫn vẽ bản đồ, nhưng bỏ câu "còn 58 tỉnh chưa tới" (nghe như trách).

**Xong khi:** tài khoản chưa gắn địa điểm bao giờ vẫn thấy màn hình dễ chịu và biết phải làm gì.
