import { Link, useLocation } from 'react-router'

type Tab = {
  to: string
  label: string
  emoji: string
  /** Khớp cả route con: /timeline/abc vẫn sáng tab Kỉ niệm */
  match: (path: string) => boolean
}

const TABS: Tab[] = [
  { to: '/', label: 'Nhà', emoji: '🏠', match: (p) => p === '/' },
  {
    to: '/timeline',
    label: 'Kỉ niệm',
    emoji: '📷',
    match: (p) => p.startsWith('/timeline'),
  },
  {
    to: '/plan',
    label: 'Kế hoạch',
    emoji: '🗓️',
    match: (p) => p.startsWith('/plan'),
  },
  {
    to: '/eat',
    label: 'Ăn gì',
    emoji: '🍜',
    match: (p) => p.startsWith('/eat'),
  },
]

/** Thanh điều hướng dưới đáy — thứ làm PWA trông giống app nhất.
 *  Nút + ở giữa nhô lên, đúng bố cục trong prototype. */
export function TabBar() {
  const { pathname } = useLocation()

  return (
    <nav className="pb-safe sticky bottom-0 z-20 mt-auto flex items-center justify-around border-t border-border bg-[color-mix(in_srgb,var(--color-surface)_92%,transparent)] px-1.5 pt-2 backdrop-blur-xl">
      {TABS.slice(0, 2).map((tab) => (
        <TabLink key={tab.to} tab={tab} active={tab.match(pathname)} />
      ))}

      <Link
        to="/compose"
        aria-label="Thêm kỉ niệm"
        className="-mt-7 grid h-14 w-14 flex-none place-items-center rounded-full bg-accent text-2xl text-on-accent shadow-[0_8px_20px_-6px_var(--color-accent)] transition active:scale-95"
      >
        +
      </Link>

      {TABS.slice(2).map((tab) => (
        <TabLink key={tab.to} tab={tab} active={tab.match(pathname)} />
      ))}
    </nav>
  )
}

function TabLink({ tab, active }: { tab: Tab; active: boolean }) {
  return (
    <Link
      to={tab.to}
      aria-current={active ? 'page' : undefined}
      className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1 text-[10.5px] transition ${
        active ? 'font-semibold text-accent' : 'text-muted'
      }`}
    >
      <span aria-hidden className="text-[19px] leading-none">
        {tab.emoji}
      </span>
      {tab.label}
    </Link>
  )
}
