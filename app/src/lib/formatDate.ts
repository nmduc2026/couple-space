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
