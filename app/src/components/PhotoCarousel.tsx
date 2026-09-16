import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'

export type PhotoCarouselItem = { id: string; url: string }

type Props = {
  items: PhotoCarouselItem[]
  /** Aspect / kích thước khung ngoài (vd. `aspect-square`, `aspect-[4/3]`). */
  className?: string
  /** 0 = tắt tự chạy. Mặc định 5 giây. */
  autoPlayMs?: number
  showArrows?: boolean
  showDots?: boolean
  showCounter?: boolean
  /** Vuốt/mũi tên không được kích hoạt onOpen / link cha. */
  blockLinkOnGesture?: boolean
  /** Chạm ảnh (không vuốt) — mở chi tiết từ danh sách. */
  onOpen?: () => void
  lazy?: boolean
}

/**
 * Gallery trượt ngang, quay vòng. Clone đầu/cuối để last→first vẫn
 * trượt cùng chiều, không nhảy cóc.
 */
export function PhotoCarousel({
  items,
  className = 'aspect-square',
  autoPlayMs = 5000,
  showArrows = true,
  showDots = true,
  showCounter = true,
  blockLinkOnGesture = false,
  onOpen,
  lazy = false,
}: Props) {
  const n = items.length
  const itemKey = items.map((i) => i.id).join('|')
  // offset trên track có clone: 0 = clone cuối, 1..n = ảnh thật, n+1 = clone đầu
  const [offset, setOffset] = useState(1)
  const [animate, setAnimate] = useState(true)
  const [visible, setVisible] = useState(true)
  const rootRef = useRef<HTMLDivElement>(null)
  const swipeStart = useRef<{ x: number; y: number } | null>(null)
  const gestured = useRef(false)
  const offsetRef = useRef(offset)
  offsetRef.current = offset

  const logical = n === 0 ? 0 : (((offset - 1) % n) + n) % n

  useEffect(() => {
    setAnimate(false)
    setOffset(1)
    const id = requestAnimationFrame(() => setAnimate(true))
    return () => cancelAnimationFrame(id)
  }, [itemKey])

  useEffect(() => {
    const el = rootRef.current
    if (!el || n < 2 || !autoPlayMs) return
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.55 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [n, autoPlayMs])

  useEffect(() => {
    if (n < 2 || !autoPlayMs || !visible) return
    const timer = window.setInterval(() => step(1), autoPlayMs)
    return () => clearInterval(timer)
    // Đổi ảnh (tay/auto) → đếm lại 5s
    // eslint-disable-next-line react-hooks/exhaustive-deps -- step đọc offsetRef
  }, [n, autoPlayMs, visible, offset])

  function step(delta: number) {
    if (n < 2) return
    const cur = offsetRef.current
    // Đang đứng trên clone / đang snap — bỏ qua để không lệch track
    if (cur <= 0 || cur >= n + 1) return
    setAnimate(true)
    setOffset(cur + delta)
  }

  function onTransitionEnd() {
    const cur = offsetRef.current
    if (cur === 0) {
      setAnimate(false)
      setOffset(n)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimate(true))
      })
    } else if (cur === n + 1) {
      setAnimate(false)
      setOffset(1)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimate(true))
      })
    }
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (n < 2) return
    if ((e.target as HTMLElement).closest('button')) return
    swipeStart.current = { x: e.clientX, y: e.clientY }
    gestured.current = false
  }

  function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    if (!swipeStart.current || n < 2) {
      swipeStart.current = null
      return
    }
    const dx = e.clientX - swipeStart.current.x
    const dy = e.clientY - swipeStart.current.y
    swipeStart.current = null
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return
    gestured.current = true
    step(dx < 0 ? 1 : -1)
  }

  function onClick(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest('button')) return
    if (gestured.current) {
      if (blockLinkOnGesture) {
        e.preventDefault()
        e.stopPropagation()
      }
      gestured.current = false
      return
    }
    onOpen?.()
  }

  if (n === 0) return null

  if (n === 1) {
    return (
      <div
        ref={rootRef}
        role={onOpen ? 'link' : undefined}
        className={`relative overflow-hidden bg-soft ${className} ${onOpen ? 'cursor-pointer' : ''}`}
        onClick={() => onOpen?.()}
      >
        <img
          src={items[0].url}
          alt=""
          draggable={false}
          loading={lazy ? 'lazy' : undefined}
          className="h-full w-full object-cover select-none"
        />
      </div>
    )
  }

  // Track: [last] [...items] [first]
  const track = [items[n - 1], ...items, items[0]]

  return (
    <div
      ref={rootRef}
      role={onOpen ? 'link' : undefined}
      className={`relative touch-pan-y overflow-hidden bg-soft ${className} ${onOpen ? 'cursor-pointer' : ''}`}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        swipeStart.current = null
      }}
      onClick={onClick}
    >
      <div
        className="flex h-full"
        style={{
          width: `${track.length * 100}%`,
          transform: `translateX(-${(offset * 100) / track.length}%)`,
          transition: animate
            ? 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1)'
            : 'none',
        }}
        onTransitionEnd={onTransitionEnd}
      >
        {track.map((item, i) => (
          <div
            key={`${item.id}-${i}`}
            className="h-full shrink-0"
            style={{ width: `${100 / track.length}%` }}
          >
            <img
              src={item.url}
              alt=""
              draggable={false}
              loading={lazy ? 'lazy' : undefined}
              className="pointer-events-none h-full w-full object-cover select-none"
            />
          </div>
        ))}
      </div>

      {showArrows ? (
        <>
          <button
            type="button"
            aria-label="Ảnh trước"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              gestured.current = true
              step(-1)
            }}
            className="absolute top-1/2 left-2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-xl text-white"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Ảnh sau"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              gestured.current = true
              step(1)
            }}
            className="absolute top-1/2 right-2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-xl text-white"
          >
            ›
          </button>
        </>
      ) : null}

      {showDots ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center gap-1.5">
          {items.map((item, i) => (
            <span
              key={item.id}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === logical ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
              }`}
            />
          ))}
        </div>
      ) : null}

      {showCounter ? (
        <p className="pointer-events-none absolute top-3 right-3 z-10 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-medium text-white tabular-nums">
          {logical + 1}/{n}
        </p>
      ) : null}
    </div>
  )
}
