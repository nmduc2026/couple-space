/* Theme màu của SPACE — thuộc về cặp đôi, không thuộc về máy.
 *
 * Khác hẳn với `store.ts`: ở đó là sáng/tối/theo máy, tức lựa chọn của từng
 * người trên từng máy. Còn cái này là màu nhấn của cả không gian chung, một
 * người đổi thì người kia cũng đổi theo — xem docs/features/p1-couple-profile.md
 * mục 4.
 *
 * Mỗi bộ phải khai cả bản sáng lẫn bản tối. Dùng chung một mã màu cho cả hai
 * thì hoặc là chìm nghỉm trên nền tối, hoặc là chói mắt trên nền sáng.
 */

export type CoupleTheme = {
  key: string
  label: string
  /** Màu hiện trên ô chọn — lấy bản sáng cho dễ nhận ra. */
  swatch: string
  /** Ba chặng của khối bìa: nhạt → đậm → sẫm. Chữ trên nền này LUÔN màu
   *  trắng, nên chặng cuối phải đủ tối. Dùng cho ảnh bìa mặc định ở Home và
   *  cho ảnh Tổng kết năm xuất ra. */
  cover: [string, string, string]
  light: { accent: string; soft: string; onAccent: string }
  dark: { accent: string; soft: string; onAccent: string }
}

export const COUPLE_THEMES: CoupleTheme[] = [
  {
    key: 'rose',
    cover: ['#e8a0ae', '#c2415b', '#7c3350'],
    label: 'Hồng',
    swatch: '#c2415b',
    light: { accent: '#c2415b', soft: '#f7e3e8', onAccent: '#ffffff' },
    dark: { accent: '#e8788d', soft: '#3a242b', onAccent: '#2a1218' },
  },
  {
    key: 'ocean',
    cover: ['#8fc3de', '#2f6f93', '#1b3f56'],
    label: 'Biển',
    swatch: '#2f6f93',
    light: { accent: '#2f6f93', soft: '#ddeaf2', onAccent: '#ffffff' },
    dark: { accent: '#79b4d6', soft: '#1e3442', onAccent: '#0e1c24' },
  },
  {
    key: 'forest',
    cover: ['#93cdb1', '#3f7d63', '#224636'],
    label: 'Rừng',
    swatch: '#3f7d63',
    light: { accent: '#3f7d63', soft: '#dcebe3', onAccent: '#ffffff' },
    dark: { accent: '#7fc2a2', soft: '#1f3830', onAccent: '#0d1f18' },
  },
  {
    key: 'sunset',
    cover: ['#f0b183', '#b8612c', '#6d3516'],
    label: 'Hoàng hôn',
    swatch: '#b8612c',
    light: { accent: '#b8612c', soft: '#f6e5d8', onAccent: '#ffffff' },
    dark: { accent: '#e39a68', soft: '#3a2a1e', onAccent: '#2a1809' },
  },
  {
    key: 'plum',
    cover: ['#c0a6d1', '#6b4e7d', '#3b2a47'],
    label: 'Mận',
    swatch: '#6b4e7d',
    light: { accent: '#6b4e7d', soft: '#eae2f0', onAccent: '#ffffff' },
    dark: { accent: '#b394c7', soft: '#2f2438', onAccent: '#1a1022' },
  },
]

export const DEFAULT_THEME = COUPLE_THEMES[0]

export function coupleThemeByKey(key: string | null | undefined) {
  return COUPLE_THEMES.find((t) => t.key === key) ?? DEFAULT_THEME
}

/**
 * Ghi đè biến màu trên `<html>`.
 *
 * Phải gọi lại mỗi khi sáng/tối đổi, vì hai chế độ dùng hai bộ mã màu khác
 * nhau. `ThemeSync` lo việc đó.
 */
export function applyCoupleTheme(key: string | null | undefined, isDark: boolean) {
  const theme = coupleThemeByKey(key)
  const palette = isDark ? theme.dark : theme.light
  const root = document.documentElement

  root.style.setProperty('--color-accent', palette.accent)
  root.style.setProperty('--color-soft', palette.soft)
  root.style.setProperty('--color-on-accent', palette.onAccent)
}

/** Chuỗi CSS cho khối bìa khi chưa đặt ảnh.
 *
 *  Trước đây là gradient chéo 150° qua ba chặng sáng → đậm → sẫm. Kiểu
 *  đó đập vào mắt ngay là đồ dựng nhanh — nó là thứ nằm sẵn trong mọi bản
 *  mẫu, chỉ đổi màu. Giờ chỉ còn hai chặng đậm → sẫm đổ thẳng xuống, giống
 *  bóng mờ dưới chân một tấm ảnh thật hơn là một mảng màu trang trí — và khi
 *  người dùng đặt ảnh bìa thật thì hai trạng thái trông liền mạch với nhau.
 *
 *  Chặng sáng nhất vẫn giữ trong `cover` vì ảnh Tổng kết năm còn dùng. */
export function coverGradient(key: string | null | undefined) {
  const [, b, c] = coupleThemeByKey(key).cover
  return `linear-gradient(178deg, ${b}, ${c})`
}
