import { useEffect } from 'react'
import { useUiStore } from '../lib/store'
import { applyTheme, watchSystemPreference } from '../lib/theme'

/** Dong bo theme trong Zustand voi class `dark` tren <html>. */
export function ThemeSync() {
  const theme = useUiStore((s) => s.theme)

  useEffect(() => {
    applyTheme(theme)
    if (theme !== 'system') return
    return watchSystemPreference(() => applyTheme('system'))
  }, [theme])

  return null
}
