# Hướng dẫn làm việc — Couple Space

> File này là **nguồn sự thật duy nhất** về quy ước của dự án.
> Claude Code, Codex và Cursor đều đọc file này. `CLAUDE.md` chỉ trỏ về đây.

## 1. Dự án là gì

App cho cặp đôi: lưu kỉ niệm, đếm ngày yêu, nhắc dịp đặc biệt, chi tiêu chung.
Giai đoạn hiện tại: **chỉ 2 người dùng thật** (chủ dự án + người yêu).
Đọc [overview.md](overview.md) để nắm toàn cảnh.

**Ngôn ngữ:** toàn bộ tài liệu và trao đổi viết bằng **tiếng Việt**.
Code (tên biến, hàm, commit message) viết bằng tiếng Anh.

## 2. Quy trình bắt buộc mỗi phiên làm việc

**Đầu phiên — đọc theo đúng thứ tự này trước khi làm bất cứ việc gì:**

1. `tasks/README.md` — biết phase nào đang chạy
2. `tasks/phase-XX/context.md` của phase đó — biết đã làm tới đâu, đang vướng gì
3. `tasks/phase-XX/tasks.md` — chọn task tiếp theo
4. `tasks/phase-XX/steps/<nhóm>.md` — hướng dẫn từng bước cho task đó
5. Đặc tả nghiệp vụ liên quan (`docs/features/pN-*.md`, `docs/design/...`)

**Cuối phiên — bắt buộc cập nhật, không được bỏ qua:**

1. `tasks/phase-XX/tasks.md` — tick task đã xong, đổi trạng thái task đang dở
2. `tasks/phase-XX/context.md` — thêm một dòng vào **Nhật ký phiên**:
   *ngày · đã làm gì · dừng ở đâu · bước tiếp theo*
3. Nếu phát sinh quyết định cần chủ dự án chốt → ghi vào mục **Quyết định đang treo**

> Đây là cơ chế duy nhất chống rơi việc giữa các phiên. Phiên sau chỉ biết đúng
> những gì phiên trước ghi lại — không ghi thì coi như chưa làm.

## 3. Viết gì vào đâu

| Loại nội dung | Nơi viết | Tuyệt đối không |
|---|---|---|
| Tổng quan, bản đồ tính năng, định vị | `overview.md` | Đặc tả chi tiết từng tính năng |
| **Nghiệp vụ** một tính năng: làm gì, luật, ca biên | `docs/features/<ten>.md` | SQL, code, tên component |
| **Thiết kế backend**: schema, RLS, RPC, kiến trúc | `docs/design/backend/` | Nghiệp vụ dài dòng |
| **Thiết kế frontend**: màn hình, flow, state, UI | `docs/design/frontend/` | Nghiệp vụ dài dòng |
| **Prototype bấm được** (HTML/CSS/JS một file, khớp app hiện tại) | `docs/design/frontend/ui/prototype.html` | Code thật của app — đây chỉ là bản dựng thử |
| **Quyết định** công nghệ, phân phối, chi phí | `docs/decisions/` | Task, tiến độ |
| **Task theo phase** + tiến độ + nhật ký | `tasks/phase-XX/context.md`, `tasks.md` | Đặc tả nghiệp vụ |
| **Hướng dẫn từng bước** cho mỗi nhóm task | `tasks/phase-XX/steps/<a-z>-<ten>.md` | Luật nghiệp vụ (link sang `docs/features/`) |

**Nguyên tắc một nguồn:** mỗi thông tin chỉ viết ở **đúng một chỗ**, nơi khác thì
link tới. Thấy nội dung trùng lặp ở hai file → gộp lại, đừng sửa cả hai.

**Đổi một tính năng thì sửa ba chỗ, cùng lúc:** đặc tả trong `docs/features/`,
màn hình tương ứng trong `prototype.html`, và task trong `tasks/`. Bỏ sót chỗ nào là
lần sau có hai nguồn mâu thuẫn nhau.

## 4. Quy ước file & link

- **Tên file bằng tiếng Anh, kebab-case.** Nội dung bên trong vẫn là tiếng Việt.
- File trong `docs/features/` mang **tiền tố phase**: `p1-pairing.md`, `p2-timeline.md`…
  Nhìn tên là biết thuộc phase nào, và trình duyệt file tự sắp theo đúng thứ tự làm.
  Tính năng đổi phase → đổi tên file **và sửa mọi link trỏ tới nó**.
- Mỗi file feature mở đầu bằng một **dòng nhãn** ngay dưới tiêu đề, gồm bốn phần ngăn bằng
  dấu `·` — phase, tầng, trạng thái đặc tả, và một link quay về `docs/features/README.md`.
  Xem file bất kỳ trong `docs/features/` để lấy đúng khuôn.
- Link markdown dùng **đường dẫn tương đối từ chính file đang viết**.
  Từ `docs/features/x.md` về overview là `../../overview.md`.
  **Kiểm tra lại link mỗi khi di chuyển file** — link hỏng là lý do phiên sau đọc lạc.
- Tiêu đề `#` đầu file, không có tiêu đề `#` thứ hai.

## 5. Quyết định đã chốt (đừng đề xuất lại)

| Hạng mục | Đã chốt | Chi tiết |
|---|---|---|
| Giao diện | **Vite + React + TypeScript + Tailwind**, đóng gói **PWA**. Không dùng Expo. | [tech-stack.md](docs/decisions/tech-stack.md) |
| Backend | **Supabase thuần** — không viết thêm tầng API Laravel/Spring | [backend-architecture.md](docs/design/backend/backend-architecture.md) |
| Phân quyền | RLS theo `couple_id` ở tầng database, bật từ bảng đầu tiên | [database-schema.md](docs/design/backend/database-schema.md) |
| Phân phối | Deploy Vercel → cài ra màn hình chính iPhone. Không store, không APK. | [distribution.md](docs/decisions/distribution.md) |
| Push | **Web Push (VAPID)** qua Edge Function — một nhánh duy nhất | [p1-notifications.md](docs/features/p1-notifications.md) |
| Riêng tư | Không có nhật ký "chỉ mình thấy". Mọi thứ trong space là chung. | [overview.md](overview.md) mục 3 |
| Widget | **Để sau** — PWA trên iOS không làm được widget | [distribution.md](docs/decisions/distribution.md) |

## 6. Nguyên tắc sản phẩm (chi phối mọi thiết kế)

1. **Space-first.** Mọi bảng mang `couple_id`. Không bao giờ hardcode "user A và user B".
2. **Mở app là thấy giá trị ngay**, không cần thao tác.
3. **Nhập liệu tối thiểu.** Trường bắt buộc càng ít càng tốt; cái gì suy ra được thì
   tự suy ra, đừng bắt người dùng gõ.
4. **Ngày kỉ niệm lưu kiểu `date`, không phải `timestamp`.** Tính theo ngày lịch ở
   múi giờ người dùng, nếu không countdown lệch 1 ngày.
5. **Vắng push vẫn phải dùng được.** Push là gia vị, không phải điều kiện sống.

## 7. Khi chưa chắc

Hỏi chủ dự án. **Không tự ý:** đổi công nghệ đã chốt, thêm tính năng ngoài phase
hiện tại, hay nhảy sang phase sau khi phase hiện tại chưa xong.

Chủ dự án đang **vibe code** — không phải chuyên gia mobile/PWA. Khi giải thích
đánh đổi kỹ thuật, nói bằng ngôn ngữ thường và nêu rõ hệ quả thực tế, đừng chỉ
liệt kê thuật ngữ.
