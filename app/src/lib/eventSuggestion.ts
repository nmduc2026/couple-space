/* Gợi ý hành động kèm theo một dịp sắp tới.
   Nhắc mà không kèm việc làm được thì chỉ tạo áp lực — xem
   docs/features/p3-events-reminders.md mục 3. */

/** Từ khoá trong tên dịp → việc thường phải làm trước. Khớp không dấu, thường hoá. */
const HINTS: Array<[RegExp, string]> = [
  [/sinh nhat/, 'Chuẩn bị quà'],
  [/ki niem|kỉ niệm|anniversary/, 'Đặt bàn'],
  [/cuoi|wedding/, 'Chuẩn bị đồ'],
  [/di |chuyen di|travel|trip/, 'Đặt vé'],
  [/phim|movie/, 'Đặt vé'],
]

function plain(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
}

/** Việc gợi ý cho một dịp, hoặc null nếu không đoán được gì hữu ích. */
export function suggestedTask(title: string): string | null {
  const key = plain(title)
  for (const [pattern, task] of HINTS) {
    if (pattern.test(key)) return `${task} cho ${title.trim()}`
  }
  return null
}

/** Chỉ gợi ý khi dịp đủ gần để làm gì đó, và chưa trôi qua. */
export function shouldSuggest(daysAway: number) {
  return daysAway >= 0 && daysAway <= 14
}
