import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useUiStore } from '../lib/store'
import { applyTheme, watchSystemPreference } from '../lib/theme'
import { applyCoupleTheme } from '../lib/coupleTheme'
import { useCouple } from '../hooks/useCouple'
import { supabase } from '../lib/supabase'
import { PREVIEW } from '../dev/preview'

/**
 * Đồng bộ hai lớp theme, ở hai tầng khác nhau:
 *
 *  · sáng / tối / theo máy — lựa chọn của TỪNG NGƯỜI, lưu trong Zustand
 *  · màu nhấn — thuộc về CẶP ĐÔI, lưu trong `couples.theme`
 *
 * Phải áp cùng chỗ vì màu nhấn có hai bộ mã khác nhau cho nền sáng và nền
 * tối: đổi sáng/tối mà không áp lại màu là màu nhấn lệch tông.
 */
export function ThemeSync() {
  const mode = useUiStore((s) => s.theme)
  const { couple } = useCouple()
  const coupleTheme = couple?.theme
  const coupleId = couple?.id
  const queryClient = useQueryClient()

  useEffect(() => {
    const sync = () => {
      applyTheme(mode)
      applyCoupleTheme(
        coupleTheme,
        document.documentElement.classList.contains('dark'),
      )
    }

    sync()
    if (mode !== 'system') return
    return watchSystemPreference(sync)
  }, [mode, coupleTheme])

  // Người kia đổi theme thì máy này đổi theo ngay — theme thuộc về space,
  // xem docs/features/p1-couple-profile.md mục 4.
  useEffect(() => {
    if (!coupleId || PREVIEW) return

    const channel = supabase
      .channel(`couple-${coupleId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'couples',
          filter: `id=eq.${coupleId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['couple'] })
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [coupleId, queryClient])

  return null
}
