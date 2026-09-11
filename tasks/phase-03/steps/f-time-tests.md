# F. Kiểm thử thời gian — P3-25 → P3-28

> **Nhóm này hay bị bỏ, và đó là lý do nên làm nó.**
>
> Lỗi ngày tháng có một đặc điểm khó chịu: **hôm nay nó không sai.** Nó sai vào 29/2 năm
> sau, vào tháng 2, vào lúc người dùng đi du lịch. Tới lúc đó thì không ai nhớ code này
> viết thế nào nữa.

Ba task đầu là **test tự động** — viết một lần, chạy mãi. Task cuối là **test thật trên
máy**, không thay thế được.

---

## P3-25 · Test sự kiện hằng năm vào 29/2

**Mục tiêu:** năm không nhuận thì nhắc 28/2, không bỏ qua, không nhảy sang 1/3.

**Các bước**

1. Test cho hàm tính "lần xảy ra tiếp theo" của sự kiện `yearly`:

   | Ngày sự kiện | Năm đang xét | Kết quả đúng |
   |---|---|---|
   | 29/02/2024 | 2025 (không nhuận) | **28/02/2025** |
   | 29/02/2024 | 2028 (nhuận) | 29/02/2028 |
   | 29/02/2024 | 2026 | 28/02/2026 |

2. Cùng quy tắc áp cho **mốc tròn năm** ở
   [b-milestones.md](b-milestones.md) — ngày bắt đầu yêu 29/2 cũng gặp ca này.

3. Truyền ngày cố định vào hàm. **Đừng dùng `current_date`** — test sẽ xanh hôm nay và đỏ
   vào đúng năm không nhuận.

**Xong khi:** ba dòng trên xanh.

**Bẫy**
- Nhảy sang 1/3 là lựa chọn sai: sinh nhật 29/2 mà nhắc vào tháng 3 thì người dùng thấy
  app hiểu nhầm mình. 28/2 là lựa chọn đúng về mặt cảm nhận.

---

## P3-26 · Test hằng tháng vào ngày 31

**Mục tiêu:** tháng ngắn thì lấy ngày cuối tháng.

**Các bước**

1. | Ngày sự kiện | Tháng đang xét | Kết quả đúng |
   |---|---|---|
   | 31/01 | tháng 2 (28 ngày) | **28/02** |
   | 31/01 | tháng 2 năm nhuận | **29/02** |
   | 31/03 | tháng 4 (30 ngày) | **30/04** |
   | 31/01 | tháng 3 (31 ngày) | 31/03 |

2. Dòng cuối quan trọng: sau khi lùi về 28/02, tháng sau phải quay lại **31/03**, không
   phải mắc kẹt ở ngày 28. Nghĩa là luôn tính từ **ngày gốc**, không tính từ lần trước.

3. PostgreSQL `date + interval '1 month'` xử lý đúng — nhưng **cộng dồn nhiều lần thì sai**.
   Luôn tính `ngày_gốc + interval 'n months'`, không phải `lần_trước + interval '1 month'`.

**Xong khi:** bốn dòng xanh, đặc biệt dòng cuối.

**Bẫy**
- Điểm 2 là bug âm thầm điển hình: nó chỉ lộ ra sau **ba tháng** dùng thật, và lúc đó rất
  khó lần ra nguyên nhân.

---

## P3-27 · Test đổi múi giờ

**Mục tiêu:** giờ nhận nhắc đổi theo nơi người dùng đang ở.

**Các bước**

1. Test hàm chọn người cần gửi ở thời điểm UTC cho trước:

   | Giờ UTC | Múi giờ người nhận | Có gửi không? |
   |---|---|---|
   | 02:00 | `Asia/Ho_Chi_Minh` (UTC+7) → 09:00 | ✅ Có |
   | 02:00 | `America/Los_Angeles` (UTC-8) → 18:00 hôm trước | ❌ Không |
   | 17:00 | `America/Los_Angeles` → 09:00 | ✅ Có |

2. Test cả trường hợp người dùng **chưa có `timezone`** → mặc định `Asia/Ho_Chi_Minh`,
   không phải UTC.

3. Test một lần đổi giờ theo mùa (DST) ở múi giờ có DST — Việt Nam không có, nhưng nếu
   một người đi nước ngoài thì gặp.

**Xong khi:** ba dòng xanh và mặc định đúng.

---

## P3-28 · Test thật: để máy qua đêm

> **Không thay thế được bằng test tự động.** Đây là bài kiểm duy nhất chứng minh cả chuỗi
> cron → function → web push → iPhone thật sự chạy khi không ai mở app.

**Các bước**

1. Tạo một sự kiện cho **ngày mai**, bật nhắc trước 1 ngày.

2. **Đóng hẳn app** trên cả hai máy. Không để mở nền.

3. Để qua đêm.

4. Sáng hôm sau kiểm đủ bốn điểm:
   - [ ] **Cả hai máy** đều nhận thông báo
   - [ ] Tới vào khoảng **9:00**, không phải giữa đêm
   - [ ] Đúng **một** thông báo mỗi máy, không phải nhiều
   - [ ] Chạm vào mở đúng màn hình sự kiện

5. Kiểm lại `cron.job_run_details` và bảng `reminder_sends` xem khớp với thực tế không.

**Xong khi:** cả bốn điểm đúng.

**Nếu sai — chẩn đoán theo thứ tự này:**

| Triệu chứng | Kiểm chỗ nào |
|---|---|
| Không máy nào nhận | `cron.job_run_details` — cron có chạy không? Có lỗi không? |
| Cron chạy nhưng không có push | Gọi tay function với `dry_run` — nó có thấy sự kiện đó không? |
| Function thấy nhưng không gửi | `reminder_sends` — có dòng ghi sẵn từ lần chạy trước chặn lại không? |
| Một máy nhận, máy kia không | `push_subscriptions` của máy kia còn hiệu lực không? `notification_prefs` có tắt không? |
| Nhận nhiều lần | Ràng buộc `unique` của `reminder_sends` — xem [a-database.md](a-database.md#p3-03--bảng-đã-gửi--chống-gửi-trùng) |
| Tới sai giờ | `profiles.timezone` của người đó có đúng không? |

---

## Trước khi kết thúc Phase 3

Chạy lại toàn bộ DoD ở [../context.md](../context.md) mục 1, rồi:

1. Cập nhật [../context.md](../context.md): trạng thái ✅ + dòng nhật ký phiên
2. Cập nhật [../../README.md](../../README.md): **Phase đang chạy** → Phase 4
3. Đọc lại [p4-expenses.md](../../../docs/features/p4-expenses.md) **mục 1** trước khi bắt
   đầu Phase 4 — phần "không ghi nợ nhau" là thứ dễ vô thức làm ngược lại nhất
