import { Link, useLocation } from 'react-router'
import {
  IconCalendar,
  IconHome,
  IconPhoto,
  IconPlus,
  IconWallet,
} from './icons'

type Tab = {
  to: string
  label: string
  Icon: (p: { size?: number; className?: string }) => React.ReactElement
  /** Khớp cả route con: /timeline/abc vẫn sáng tab Kỉ niệm */
  match: (path: string) => boolean
}

const TABS: Tab[] = [
  { to: '/', label: 'Trang chủ', Icon: IconHome, match: (p) => p === '/' },
  {
    to: '/timeline',
    label: 'Kỉ niệm',
    Icon: IconPhoto,
    match: (p) => p.startsWith('/timeline'),
  },
  {
    to: '/plan',
    label: 'Kế hoạch',
    Icon: IconCalendar,
    match: (p) => p.startsWith('/plan'),
  },
  {
    to: '/expenses',
    label: 'Chi tiêu',
    Icon: IconWallet,
    match: (p) => p.startsWith('/expenses'),
  },
]

/** Thanh điều hướng dưới đáy — thứ làm PWA trông giống app nhất.
 *  Nút + ở giữa nhô lên, đúng bố cục trong prototype.
 *  Cỡ chữ/icon theo prototype (10.5px / ~19px / nút + 46px). Trước đây cố ý
 *  to hơn để bù `--ui-scale: 0.8`; scale đã về 1 nên trả về cỡ design. */
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
        className="-mt-4 grid h-[46px] w-[46px] flex-none place-items-center rounded-full bg-accent text-on-accent shadow-[0_6px_16px_-6px_var(--color-accent)] transition active:scale-95"
      >
        <IconPlus size={24} />
      </Link>

      {TABS.slice(2).map((tab) => (
        <TabLink key={tab.to} tab={tab} active={tab.match(pathname)} />
      ))}
    </nav>
  )
}

function TabLink({ tab, active }: { tab: Tab; active: boolean }) {
  const { Icon } = tab
  return (
    <Link
      to={tab.to}
      aria-current={active ? 'page' : undefined}
      className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1 text-[10.5px] transition ${
        active ? 'font-semibold text-accent' : 'text-muted'
      }`}
    >
      <Icon size={20} />
      {tab.label}
    </Link>
  )
}
