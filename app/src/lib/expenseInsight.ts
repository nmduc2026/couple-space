/* Dải nhận xét ở màn Chi tiêu: biến bảng số thành một câu đọc được.
   Tách khỏi màn hình để test được — luật ở đây là nghiệp vụ, không phải giao diện. */

import { categoryOf, formatVnd } from './money'

export type InsightInput = {
  /** Tổng của tháng đang xem, theo danh mục. */
  byCategory: Record<string, number>
  outingCount: number
  totalMinor: number
  /** Tháng trước: null nghĩa là chưa có tháng nào trước đó để so. */
  previous: { outingCount: number; totalMinor: number } | null
  /** Khoản chi đắt nhất trong tháng, để làm câu dự phòng. */
  biggest: { note: string | null; category: string | null; amountMinor: number } | null
}

/** Một câu, hoặc null khi tháng rỗng (màn hình đã có trạng thái rỗng riêng). */
export function expenseInsight(input: InsightInput): string | null {
  const { byCategory, outingCount, previous, biggest } = input
  if (outingCount === 0) return null

  if (!previous || previous.outingCount === 0) {
    return 'Tháng đầu tiên ghi chi tiêu'
  }

  // Ưu tiên so danh mục dùng nhiều nhất — cụ thể hơn là so tổng
  const diff = outingCount - previous.outingCount
  if (diff !== 0) {
    const word = diff > 0 ? 'nhiều hơn' : 'ít hơn'
    return `Tháng này ghi ${outingCount} khoản — ${word} tháng trước ${Math.abs(diff)}`
  }

  // Bằng nhau về số lần thì nói về tiền
  const money = input.totalMinor - previous.totalMinor
  if (money !== 0) {
    const word = money > 0 ? 'nhiều hơn' : 'ít hơn'
    return `Cùng ${outingCount} khoản như tháng trước, nhưng tiêu ${word} ${formatVnd(Math.abs(money))}`
  }

  if (biggest) {
    const name = biggest.note?.trim() || categoryOf(biggest.category).label
    return `Khoản lớn nhất tháng này: ${name} — ${formatVnd(biggest.amountMinor)}`
  }

  const top = Object.entries(byCategory).sort((a, b) => Number(b[1]) - Number(a[1]))[0]
  return top ? `Tiêu nhiều nhất cho ${categoryOf(top[0]).label.toLowerCase()}` : null
}
