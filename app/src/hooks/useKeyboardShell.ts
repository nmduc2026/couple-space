import { useEffect, useRef, useState } from 'react'

/** Co bao nhiêu px so với baseline thì coi là bàn phím (không phải URL bar). */
const KEYBOARD_DROP_PX = 120

export type KeyboardPinPhase = 'open' | 'resize'

/**
 * Khóa scroll trang + khi bàn phím mở thì ghim shell đúng vùng nhìn thấy.
 * `onPinned('open')` lần đầu mở; `'resize'` khi vv đổi lúc đang mở.
 */
export function useKeyboardShell(
  enabled: boolean,
  onPinned?: (phase: KeyboardPinPhase) => void,
) {
  const shellRef = useRef<HTMLElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const onPinnedRef = useRef(onPinned)
  onPinnedRef.current = onPinned
  const [keyboardOpen, setKeyboardOpen] = useState(false)

  useEffect(() => {
    if (!enabled) {
      setKeyboardOpen(false)
      return
    }

    const html = document.documentElement
    const body = document.body
    const prevHtml = html.style.overflow
    const prevBody = body.style.overflow
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'

    const vv = window.visualViewport
    const shell = shellRef.current
    if (!vv || !shell) {
      return () => {
        html.style.overflow = prevHtml
        body.style.overflow = prevBody
      }
    }

    let baseline = vv.height
    let pinned = false

    const clear = () => {
      if (!pinned && !shell.style.position) {
        setKeyboardOpen(false)
        return
      }
      pinned = false
      shell.style.position = ''
      shell.style.top = ''
      shell.style.left = ''
      shell.style.right = ''
      shell.style.height = ''
      shell.style.width = ''
      shell.style.zIndex = ''
      setKeyboardOpen(false)
    }

    const pin = () => {
      const top = `${vv.offsetTop}px`
      const height = `${Math.round(vv.height)}px`
      if (
        pinned &&
        shell.style.top === top &&
        shell.style.height === height
      ) {
        return
      }
      const justOpened = !pinned
      pinned = true
      shell.style.position = 'fixed'
      shell.style.top = top
      shell.style.left = '0'
      shell.style.right = '0'
      shell.style.height = height
      shell.style.width = '100%'
      shell.style.zIndex = '40'
      if (window.scrollY !== 0) window.scrollTo(0, 0)
      onPinnedRef.current?.(justOpened ? 'open' : 'resize')
      if (justOpened) setKeyboardOpen(true)
    }

    const sync = () => {
      if (vv.height > baseline) baseline = vv.height
      if (baseline - vv.height > KEYBOARD_DROP_PX) pin()
      else clear()
    }

    vv.addEventListener('resize', sync)
    vv.addEventListener('scroll', sync)

    return () => {
      vv.removeEventListener('resize', sync)
      vv.removeEventListener('scroll', sync)
      clear()
      html.style.overflow = prevHtml
      body.style.overflow = prevBody
    }
  }, [enabled])

  return { shellRef, scrollerRef, keyboardOpen }
}
