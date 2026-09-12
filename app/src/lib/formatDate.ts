/** Ngày lịch dạng YYYY-MM-DD -> "15/3/2026". Luôn dựng lúc 12h trưa
 *  để không bị lệch ngày khi trình duyệt quy về UTC. */
export function formatDay(ymd: string) {
  return new Date(`${ymd}T12:00:00`).toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  })
}

/** "2026-03-15" → "15 tháng 3, 2026". Viết đủ chữ "tháng" để không ai đọc
 *  nhầm thứ tự ngày/tháng như định dạng toàn số — đó chính là lỗi mà
 *  `<input type="date">` gây ra khi máy để tiếng Anh. */
export function formatDateLong(ymd: string) {
  const [y, m, d] = ymd.split('-').map(Number)
  return `${d} tháng ${m}, ${y}`
}

/** Thời điểm bình luận. Hôm nay thì chỉ cần giờ; khác ngày thì kèm ngày —
 *  "14:32" đọc nhanh hơn "12/9/2026 14:32" khi cả cuộc trò chuyện ở trong
 *  cùng một buổi. */
export function formatCommentTime(iso: string) {
  const at = new Date(iso)
  const time = at.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  })
  const sameDay = at.toDateString() === new Date().toDateString()
  if (sameDay) return time
  const day = at.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })
  return `${day} · ${time}`
}
