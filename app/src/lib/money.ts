/** Tiền luôn là số nguyên đồng (bigint ở DB). Không dùng số thực —
 *  0.1 + 0.2 !== 0.3 và sai số đó tích lại qua từng khoản. */

export function formatVnd(minor: number | bigint): string {
  return `${Number(minor).toLocaleString('vi-VN')} đ`
}

/** Rút gọn cho khối tổng: 1.250.000 đ → 1,25 tr */
export function formatShortVnd(minor: number): string {
  if (minor >= 1_000_000_000) {
    return `${(minor / 1_000_000_000).toFixed(1).replace('.', ',')} tỉ`
  }
  if (minor >= 1_000_000) {
    return `${(minor / 1_000_000).toFixed(minor >= 10_000_000 ? 0 : 1).replace('.', ',')} tr`
  }
  if (minor >= 1_000) return `${Math.round(minor / 1_000)}k`
  return String(minor)
}

/** Người dùng gõ "180000" → hiện "180.000". Chỉ giữ chữ số. */
export function formatAmountInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 12)
  if (!digits) return ''
  return Number(digits).toLocaleString('vi-VN')
}

export function parseAmountInput(raw: string): number {
  const digits = raw.replace(/\D/g, '')
  return digits ? Number(digits) : 0
}

export const EXPENSE_CATEGORIES: Array<{
  key: string
  label: string
  emoji: string
  color: string
}> = [
  { key: 'food', label: 'Ăn uống', emoji: '🍜', color: '#c2415b' },
  { key: 'cafe', label: 'Cà phê', emoji: '☕', color: '#a8724a' },
  { key: 'movie', label: 'Giải trí', emoji: '🎬', color: '#6b4e7d' },
  { key: 'travel', label: 'Đi lại', emoji: '🛵', color: '#4a5d8a' },
  { key: 'gift', label: 'Quà', emoji: '🎁', color: '#9a3f55' },
  { key: 'home', label: 'Nhà cửa', emoji: '🏠', color: '#3f7d63' },
  { key: 'other', label: 'Khác', emoji: '📦', color: '#8a7480' },
]

export function categoryOf(key: string | null) {
  return (
    EXPENSE_CATEGORIES.find((c) => c.key === key) ??
    EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1]
  )
}

/** Hoạt động của bài kỉ niệm → danh mục chi tiêu đoán sẵn. */
export function categoryFromActivity(activity: string | null): string {
  if (!activity) return 'other'
  const map: Record<string, string> = {
    food: 'food',
    cafe: 'cafe',
    movie: 'movie',
    travel: 'travel',
    gift: 'gift',
    home: 'home',
  }
  return map[activity] ?? 'other'
}
