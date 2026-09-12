import { useEffect, useRef } from 'react'

/*
 * Pháo hoa mừng kết quả.
 *
 * Vẽ bằng canvas chứ không phải hàng chục thẻ div có animation: mỗi hạt là
 * một phép tính, không phải một phần tử DOM để trình duyệt phải bố trí lại.
 *
 * Tự dừng sau khi hạt cuối tắt — pháo hoa chạy mãi thì lần thứ ba đã thấy
 * phiền, và giữ vòng lặp vẽ sống là ăn pin vô ích.
 */

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}

const GRAVITY = 0.045
const DRAG = 0.985
const BURSTS = 3
const PER_BURST = 34

export function Fireworks({ colors }: { colors: string[] }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return

    // Người đã bật "giảm chuyển động" thì tôn trọng, không bắn gì cả
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.scale(dpr, dpr)

    const parts: Particle[] = []
    const burst = (cx: number, cy: number) => {
      for (let i = 0; i < PER_BURST; i++) {
        const angle = (Math.PI * 2 * i) / PER_BURST + Math.random() * 0.2
        const speed = 1.6 + Math.random() * 2.4
        parts.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          color: colors[i % colors.length],
        })
      }
    }

    const timers: number[] = []
    for (let b = 0; b < BURSTS; b++) {
      timers.push(
        window.setTimeout(
          () => burst(w * (0.25 + 0.25 * b), h * (0.32 + 0.12 * Math.random())),
          b * 260,
        ),
      )
    }

    let raf = 0
    const frame = () => {
      ctx.clearRect(0, 0, w, h)
      for (const p of parts) {
        p.vx *= DRAG
        p.vy = p.vy * DRAG + GRAVITY
        p.x += p.vx
        p.y += p.vy
        p.life -= 0.012
      }
      for (const p of parts) {
        if (p.life <= 0) continue
        ctx.globalAlpha = Math.max(0, p.life)
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, 2.4, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      // Còn hạt nào sống, hoặc còn đợt chưa bắn, thì vẽ tiếp
      const alive = parts.some((p) => p.life > 0)
      if (alive || parts.length === 0) raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      timers.forEach(window.clearTimeout)
    }
  }, [colors])

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-20 h-full w-full"
    />
  )
}
