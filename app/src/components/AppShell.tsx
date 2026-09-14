import { Link, Outlet } from 'react-router'
import { TabBar } from './TabBar'
import { useOutbox } from '../hooks/useOutbox'

/** Vỏ chung cho các màn có thanh tab. Màn toàn trang (soạn bài, huỷ
 *  ghép đôi) nằm ngoài shell này để không bị tab che mất nút chính. */
export function AppShell() {
  // Gắn đúng một lần ở đây: hàng đợi tự gửi lại suốt vòng đời app
  const { pending } = useOutbox()

  return (
    <div className="flex min-h-app flex-col bg-bg">
      {pending.length > 0 ? (
        <p className="top-safe sticky top-0 z-20 bg-soft px-4 py-1.5 text-center text-[12.5px] text-accent">
          Đang chờ gửi ({pending.length})
        </p>
      ) : null}
      <Outlet />
      <TabBar />
    </div>
  )
}

/** Thanh tiêu đề dính trên đầu các màn trong shell.
 *
 *  `back` dành cho những màn đi từ Home (Câu hỏi, Tâm trạng, Thư, Dấu chân…).
 *  Bốn màn có trong thanh tab thì KHÔNG truyền `back` — ở đó thanh tab đã là
 *  đường ra, thêm mũi tên chỉ gây rối. */
export function TopHeader({
  title,
  right,
  back,
}: {
  title: string
  right?: React.ReactNode
  back?: string
}) {
  return (
    <header className="top-safe sticky top-0 z-10 flex items-center gap-2.5 border-b border-border bg-[color-mix(in_srgb,var(--color-bg)_92%,transparent)] px-4 pb-2.5 backdrop-blur-xl">
      {back ? (
        <Link
          to={back}
          aria-label="Quay lại"
          className="-ml-1 grid h-9 w-9 flex-none place-items-center rounded-full border border-border bg-surface text-[16px] text-text transition active:scale-95"
        >
          ←
        </Link>
      ) : null}
      <h1 className="text-[17px] font-bold tracking-[-0.01em] text-text">
        {title}
      </h1>
      {right ? <div className="ml-auto flex gap-2">{right}</div> : null}
    </header>
  )
}
