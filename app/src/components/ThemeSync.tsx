import { useEffect } from 'react'
import { useUiStore } from '../lib/store'
import { applyTheme, watchSystemPreference } from '../lib/theme'
import { applyCoupleTheme } from '../lib/coupleTheme'
import { useCouple } from '../hooks/useCouple'
import { useMyProfile } from '../hooks/useMyProfile'

/**
 * Đồng bộ hai lớp theme, ở hai tầng khác nhau:
 *
 *  · sáng / tối / theo máy — lựa chọn THEO MÁY, để trong Zustand. Cùng một
 *    người có thể thích nền tối trên giường và nền sáng ngoài trời.
 *  · màu nhấn — lựa chọn THEO NGƯỜI, lưu ở `profiles.color_theme`, nên đổi
 *    trên điện thoại thì mở trên máy tính cũng thấy vậy.
 *
 * Phải áp cùng chỗ vì màu nhấn có hai bộ mã khác nhau cho nền sáng và nền
 * tối: đổi sáng/tối mà không áp lại màu là màu nhấn lệch tông.
 */
export function ThemeSync() {
  const mode = useUiStore((s) => s.theme)
  const { profile } = useMyProfile()
  const { couple } = useCouple()
  // Chưa chọn gì thì dùng màu của space làm điểm xuất phát
  const color = profile?.color_theme ?? couple?.theme

  useEffect(() => {
    const sync = () => {
      applyTheme(mode)
      applyCoupleTheme(
        color,
        document.documentElement.classList.contains('dark'),
      )
    }

    sync()
    if (mode !== 'system') return
    return watchSystemPreference(sync)
  }, [mode, color])

  return null
}
