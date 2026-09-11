/** Loại hoạt động gắn vào một kỉ niệm. Khoá lưu trong DB là tiếng Anh
 *  (posts.activity), nhãn hiện ra là tiếng Việt. */
export const ACTIVITY_LABELS: Record<
  string,
  { label: string; emoji: string }
> = {
  food: { label: 'Ăn uống', emoji: '🍜' },
  cafe: { label: 'Cà phê', emoji: '☕' },
  travel: { label: 'Đi chơi', emoji: '✈️' },
  movie: { label: 'Phim', emoji: '🎬' },
  home: { label: 'Ở nhà', emoji: '🏠' },
  gift: { label: 'Quà', emoji: '🎁' },
}

export const ACTIVITY_KEYS = Object.keys(ACTIVITY_LABELS)
