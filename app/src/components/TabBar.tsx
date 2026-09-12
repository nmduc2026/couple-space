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
    to: '/expenses',
    label: 'Chi tiêu',
    emoji: '💰',
    match: (p) => p.startsWith('/expenses'),
  },
]

/** Thanh điều hướng dưới đáy — thứ làm PWA trông giống app nhất.
 *  Nút + ở giữa nhô lên, đúng bố cục trong prototype.
 *
 *  Kích thước ở đây CỐ Ý to hơn phần còn lại của app. Cả giao diện đã thu nhỏ
 *  bằng `--ui-scale`, nhưng thanh tab là thứ chạm vào nhiều nhất và chạm bằng
 *  ngón cái, nên bị thu nhỏ theo là quá bé. Không lồng thêm `zoom` để bù vì
 *  `pb-safe` chia theo `--ui-scale`, lồng hai lớp là tính sai vùng an toàn. */
export function TabBar() {
  const { pathname } = useLocation()

  return (
    <nav className="pb-safe sticky bottom-0 z-20 mt-auto flex items-center justify-around border-t border-border bg-[color-mix(in_srgb,var(--color-surface)_92%,transparent)] px-1.5 pt-2.5 backdrop-blur-xl">
      {TABS.slice(0, 2).map((tab) => (
        <TabLink key={tab.to} tab={tab} active={tab.match(pathname)} />
      ))}

      <Link
        to="/compose"
        aria-label="Thêm kỉ niệm"
        className="-mt-8 grid h-16 w-16 flex-none place-items-center rounded-full bg-accent text-3xl text-on-accent shadow-[0_8px_20px_-6px_var(--color-accent)] transition active:scale-95"
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
      className={`flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-[13px] transition ${
        active ? 'font-semibold text-accent' : 'text-muted'
      }`}
    >
      <span aria-hidden className="text-[23px] leading-none">
        {tab.emoji}
      </span>
      {tab.label}
    </Link>
  )
}
