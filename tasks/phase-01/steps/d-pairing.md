# D. Ghép đôi — P1-15 → P1-20

Đặc tả đầy đủ: [p1-pairing.md](../../../docs/features/p1-pairing.md).

Đây là flow quan trọng nhất Phase 1. **Mục tiêu đo được: người thứ hai tham gia trong 24 giờ
đầu.** Mọi quyết định ở nhóm này đều phục vụ con số đó.

---

## P1-15 · Màn hình "Bạn đã có mã mời chưa?"

**Mục tiêu:** rẽ nhánh giữa người tạo space và người được mời.

**Các bước**

1. Tạo `src/features/pairing/ChoiceScreen.tsx` với hai nút lớn:
   - **[Chưa, tạo không gian mới]** → `/setup`
   - **[Rồi, nhập mã mời]** → `/join`

2. Nếu người dùng vào bằng link có sẵn mã (`/join?code=A7K2M9`) thì **bỏ qua màn hình này**,
   nhảy thẳng vào màn hình xác nhận lời mời.

**Xong khi:** cả hai nhánh đi đúng, và link có mã thì không phải bấm gì thêm.

---

## P1-16 · Thiết lập đôi

**Mục tiêu:** thu đủ thông tin tối thiểu để space có ý nghĩa.

**Các bước**

1. Một màn hình, bốn trường:

   | Trường | Bắt buộc | Ghi chú |
   |---|---|---|
   | Ngày bắt đầu yêu | ✅ | Kiểu `date`. **Không cho chọn ngày tương lai.** |
   | Biệt danh của bạn | ✅ | Cách người kia gọi bạn |
   | Gọi người ấy là gì | ✅ | Dùng ngay trên Home trước khi họ tham gia |
   | Ảnh đại diện | — | Bỏ qua được, mặc định dùng chữ cái đầu |

2. Nút [Tiếp tục] gọi một RPC tạo space:
   - tạo dòng `couples` (kèm `status = 'active'`)
   - tạo dòng `couple_members` cho người tạo
   - sinh mã mời (P1-17)

   **Làm cả ba việc trong một hàm database**, không phải ba lệnh từ app — ba lệnh riêng thì
   lỗi giữa chừng sẽ để lại space hỏng.

3. Xong → `/waiting`

**Xong khi:** tạo space thành công, kiểm tra trong Table Editor thấy đủ ba thứ trên.

**Bẫy**
- Ngày bắt đầu yêu lưu **`date`**, và khi hiển thị **đừng** đi qua `new Date().toISOString()`
  — hàm đó đổi sang UTC và làm lệch 1 ngày. Xem
  [p1-day-counter.md](../../../docs/features/p1-day-counter.md) mục 2.

---

## P1-17 · Sinh mã mời

**Mục tiêu:** mã ngắn, dễ đọc to qua điện thoại, khó dò.

**Các bước**

1. Bảng chữ cái: chữ IN HOA + số, **bỏ `0` `O` `1` `I` `L`** (dễ nhầm khi đọc/gõ).
   Còn lại 31 ký tự → 6 ký tự cho khoảng 887 triệu tổ hợp.

2. Sinh mã **trong database**, không sinh ở app — để đảm bảo không trùng:
   ```sql
   -- sinh mã, thử lại nếu trùng, gắn hạn 7 ngày
   invite_code   text unique,
   invite_expires_at timestamptz default now() + interval '7 days'
   ```

3. Thêm hàm tạo lại mã mới (mã cũ vô hiệu ngay).

**Xong khi:** tạo 3 space liên tiếp ra 3 mã khác nhau, không chứa ký tự dễ nhầm.

**Bẫy**
- Mã của space **đã đủ 2 người** phải vô hiệu. Kiểm tra lúc nhập mã, không phải lúc sinh mã.

---

## P1-18 · Phòng chờ + lời mời

**Mục tiêu:** đây là màn hình quyết định người thứ hai có vào hay không.

**Các bước**

1. `src/features/pairing/WaitingScreen.tsx`:
   - Mã mời **cỡ rất lớn**, bấm vào là copy
   - Nút **[Chia sẻ lời mời]** → gọi `navigator.share()` (iOS hỗ trợ tốt)
   - Nút **[Cứ vào xem trước]** → về Home

2. **Nội dung chia sẻ phải hấp dẫn, không phải một chuỗi ký tự khô khan:**
   > *"Anh vừa tạo một nơi để tụi mình lưu kỉ niệm 🤍 Vào bằng mã **A7K2M9** nhé:*
   > *https://couple-space.vercel.app/join?code=A7K2M9"*

3. Lắng nghe realtime: người thứ hai tham gia → tự chuyển sang màn hình chúc mừng.

**Xong khi:** bấm chia sẻ mở được bảng chia sẻ của iOS; gửi link cho máy khác, mở ra thấy
mã đã điền sẵn.

**Bẫy**
- `navigator.share()` **chỉ chạy trên HTTPS**. Lúc dev ở `localhost` cũng được, nhưng qua
  IP mạng LAN thì không — đừng tưởng là code sai.
- Không chặn người dùng ở màn hình này. Nút "Cứ vào xem trước" là bắt buộc.

---

## P1-19 · Luồng người thứ hai

**Mục tiêu:** từ lúc mở link tới lúc vào Home càng ít bước càng tốt.

**Các bước**

1. `/join?code=XXXXXX` → nếu chưa đăng nhập thì đăng nhập trước, **giữ lại mã** để quay lại
   đúng chỗ (lưu vào `sessionStorage`).

2. Màn hình xác nhận lời mời — hiện đủ để người ta biết mình vào đúng chỗ:
   - Avatar + biệt danh người mời
   - Ngày bắt đầu yêu
   - Hai nút: **[Tham gia]** · **[Không phải tôi]**

3. [Tham gia] → RPC thêm `couple_members`, có kiểm tra:
   - space còn `active` và chưa đủ 2 người
   - mã chưa hết hạn
   - người này chưa thuộc space nào khác

4. Thiết lập nhanh: **chỉ biệt danh + avatar của mình**.
   **Không hỏi lại ngày bắt đầu yêu** — kế thừa từ space. Bớt một bước là bớt một chỗ rơi rụng.

5. Xong → Home + [push cho người thứ nhất](e-notifications.md).

**Xong khi:** trên hai máy khác nhau, đi trọn luồng từ lúc gửi link tới lúc cả hai cùng thấy
một Home giống nhau.

**Bẫy**
- Đăng nhập ở giữa luồng là chỗ **dễ mất mã nhất**. Phải lưu mã trước khi chuyển sang đăng
  nhập, và tự lấy lại sau khi đăng nhập xong.

---

## P1-20 · Ca biên

**Mục tiêu:** không có đường nào dẫn tới trạng thái hỏng.

**Các bước** — làm lần lượt từng dòng và tự thử:

| Tình huống | Phải xảy ra |
|---|---|
| Mã của space đã đủ 2 người | *"Không gian này đã đủ hai người rồi."* Không tiết lộ gì thêm. |
| Mã không tồn tại **hoặc** hết hạn | **Một thông báo chung cho cả hai**, không phân biệt — tránh dò mã. |
| Người đã ở space khác nhập mã | Chặn, giải thích phải rời space hiện tại trước, dẫn sang Cài đặt. |
| Tự nhập mã của chính mình | Chặn, thông báo nhẹ nhàng. |
| Hai người cùng nhập một mã đúng lúc | Người trước thắng. **Kiểm tra phải nằm trong hàm database**, không phải ở app. |
| Nhập sai nhiều lần | Giới hạn 10 lần / giờ / tài khoản. |

**Xong khi:** thử hết sáu dòng trên, không dòng nào làm app đứng hoặc vào trạng thái lạ.

**Bẫy**
- Việc "space đã đủ người chưa" phải kiểm tra **trong transaction của database**. Kiểm tra
  ở app rồi mới ghi thì hai người bấm cùng lúc sẽ lọt cả hai — và space có 3 thành viên.
