/* Ngày nào là "bỏ lỡ": có câu hỏi nhưng mình chưa trả lời, và vẫn còn trong
   cửa sổ trả lời bù. Tách riêng để test được — policy `answers_write` ở DB
   giữ đúng luật này, đây chỉ là bản cho giao diện. */

export const CATCHUP_DAYS = 7

/** Lùi `n` ngày từ một ngày YYYY-MM-DD, tính theo lịch chứ không theo giờ. */
export function shiftDay(ymd: string, delta: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const t = Date.UTC(y, m - 1, d) + delta * 86_400_000
  return new Date(t).toISOString().slice(0, 10)
}

/**
 * Các ngày còn trả lời bù được, mới nhất trước.
 * Không tính hôm nay (hôm nay có mục riêng), không tính ngày trước khi đôi
 * này bắt đầu dùng app — hỏi về ngày chưa tồn tại thì vô nghĩa.
 */
export function missedDays(
  today: string,
  answeredDates: string[],
  since: string,
): string[] {
  const answered = new Set(answeredDates)
  const days: string[] = []
  for (let back = 1; back <= CATCHUP_DAYS; back++) {
    const day = shiftDay(today, -back)
    if (day < since) break
    if (!answered.has(day)) days.push(day)
  }
  return days
}
