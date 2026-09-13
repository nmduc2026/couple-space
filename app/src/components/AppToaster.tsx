import { useSyncExternalStore } from 'react'
import { Toaster } from 'sonner'
import { useUiStore } from '../lib/store'

function subscribeSystem(onStore: () => void) {
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  media.addEventListener('change', onStore)
  return () => media.removeEventListener('change', onStore)
}

/** Toast toàn app (sonner). Portal ra `body` nên không bị TabBar / zoom che. */
export function AppToaster() {
  const mode = useUiStore((s) => s.theme)
  const systemDark = useSyncExternalStore(
    subscribeSystem,
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
    () => false,
  )
  const theme =
    mode === 'dark' || (mode === 'system' && systemDark) ? 'dark' : 'light'

  return (
    <Toaster
      theme={theme}
      position="top-center"
      richColors
      offset="max(16px, env(safe-area-inset-top))"
      mobileOffset="max(12px, env(safe-area-inset-top))"
      duration={2600}
      toastOptions={{
        classNames: {
          toast: 'font-sans! shadow-lg!',
          title: 'text-[14px]! font-medium!',
        },
      }}
    />
  )
}
