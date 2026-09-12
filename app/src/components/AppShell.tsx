import { Outlet } from 'react-router'
import { TabBar } from './TabBar'
import { useOutbox } from '../hooks/useOutbox'

/** Vỏ chung cho các màn có thanh tab. Màn toàn trang (soạn bài, huỷ
 *  ghép đôi) nằm ngoài shell này để không bị tab che mất nút chính. */
export function AppShell() {
  // Gắn đúng một lần ở đây: hàng đợi tự gửi lại suốt vòng đời app
  const { pending } = useOutbox()

  return (
    <div className="flex min-h-svh flex-col bg-bg">
      {pending.length > 0 ? (
        <p className="top-safe sticky top-0 z-20 bg-soft px-4 py-1.5 text-center text-[12.5px] text-accent">
          {pending.length} việc đang chờ gửi — sẽ tự gửi khi có mạng
        </p>
      ) : null}
      <Outlet />
      <TabBar />
    </div>
  )
}

/** Thanh tiêu đề dính trên đầu các màn trong shell. */
export function TopHeader({
  title,
  right,
}: {
  title: string
  right?: React.ReactNode
}) {
  return (
    <header className="top-safe sticky top-0 z-10 flex items-center gap-2.5 border-b border-border bg-[color-mix(in_srgb,var(--color-bg)_92%,transparent)] px-4 pb-2.5 backdrop-blur-xl">
      <h1 className="text-[17px] font-bold tracking-[-0.01em] text-text">
        {title}
      </h1>
      {right ? <div className="ml-auto flex gap-2">{right}</div> : null}
    </header>
  )
}
