/** Ngày lịch dạng YYYY-MM-DD -> "15/3/2026". Luôn dựng lúc 12h trưa
 *  để không bị lệch ngày khi trình duyệt quy về UTC. */
export function formatDay(ymd: string) {
  return new Date(`${ymd}T12:00:00`).toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  })
}
