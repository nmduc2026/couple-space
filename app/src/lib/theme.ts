/** Gắn class `dark` trên <html> theo cài đặt máy. Ghi đè bằng thêm/bớt class tay. */
export function applySystemTheme() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  document.documentElement.classList.toggle('dark', prefersDark)
}

export function watchSystemTheme() {
  applySystemTheme()
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  media.addEventListener('change', applySystemTheme)
  return () => media.removeEventListener('change', applySystemTheme)
}
