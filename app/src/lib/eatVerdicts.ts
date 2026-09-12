/* Ba mức đánh giá quán. Tách khỏi file component để Fast Refresh không vỡ —
   cùng lý do với ui-classes.ts. */

export type Verdict = 'love' | 'ok' | 'nope'

/** Ba mức, không phải 5 sao: thang 1–5 tạo do dự ("3 hay 4 sao nhỉ?") mà
 *  không thêm thông tin dùng được. Mục đích duy nhất của đánh giá là lọc cho
 *  lần quay sau — xem docs/features/p2-eat-tonight.md mục 4. */
export const VERDICTS: Array<{ key: Verdict; emoji: string; label: string }> = [
  { key: 'love', emoji: '😍', label: 'Ngon, ăn lại' },
  { key: 'ok', emoji: '🙂', label: 'Cũng được' },
  { key: 'nope', emoji: '😕', label: 'Thôi' },
]

export function verdictOf(key: string) {
  return VERDICTS.find((v) => v.key === key)
}
