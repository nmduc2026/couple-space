import { todayYmd } from './dateCount'

export type Recurrence = 'none' | 'monthly' | 'yearly'

function parse(ymd: string) {
  const [y, m, d] = ymd.split('-').map(Number)
  return { y, m, d }
}

function format(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function daysInMonth(y: number, m: number) {
  return new Date(y, m, 0).getDate()
}

/** Lần tới của một sự kiện lặp, tính theo ngày lịch.
 *
 *  Hai ca biên bắt buộc đúng, và chỉ lộ ra sau nhiều tháng nếu làm sai:
 *  - 29/2 ở năm không nhuận → kẹp về 28/2
 *  - ngày 31 ở tháng 30 ngày hoặc tháng 2 → kẹp về ngày cuối tháng
 *
 *  Kẹp chỉ áp cho lần hiện ra, không ghi đè ngày gốc — nên 31/1 lặp hằng
 *  tháng vẫn quay lại đúng ngày 31 ở những tháng có 31 ngày.
 */
export function nextOccurrence(
  eventDate: string,
  recurrence: Recurrence,
  from: string = todayYmd(),
): string {
  if (recurrence === 'none') return eventDate

  const base = parse(eventDate)
  const start = parse(from)

  if (recurrence === 'yearly') {
    for (let y = start.y; y <= start.y + 200; y++) {
      const day = Math.min(base.d, daysInMonth(y, base.m))
      const candidate = format(y, base.m, day)
      if (candidate >= from) return candidate
    }
    return eventDate
  }

  // monthly
  const startIndex = start.y * 12 + (start.m - 1)
  const baseIndex = base.y * 12 + (base.m - 1)
  for (
    let index = Math.max(startIndex, baseIndex);
    index <= startIndex + 2400;
    index++
  ) {
    const y = Math.floor(index / 12)
    const m = (index % 12) + 1
    const day = Math.min(base.d, daysInMonth(y, m))
    const candidate = format(y, m, day)
    if (candidate >= from) return candidate
  }
  return eventDate
}

/** Số ngày còn lại tới một ngày lịch. Âm nghĩa là đã qua.
 *  Dựng mốc bằng UTC để mốc đổi giờ mùa hè không làm lệch một ngày. */
export function daysUntil(target: string, from: string = todayYmd()): number {
  return Math.round((utcOf(target) - utcOf(from)) / 86_400_000)
}

function utcOf(ymd: string) {
  const { y, m, d } = parse(ymd)
  return Date.UTC(y, m - 1, d)
}

/** Câu chữ cho phần đếm ngược. */
export function countdownLabel(days: number) {
  if (days === 0) return 'Hôm nay'
  if (days === 1) return 'Ngày mai'
  if (days < 0) return `${Math.abs(days)} ngày trước`
  return `còn ${days} ngày`
}
