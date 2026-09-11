import { useState } from 'react'
import { Link } from 'react-router'
import { TopHeader } from '../../components/AppShell'
import { useAgenda, type AgendaItem } from '../../hooks/useAgenda'
import { countdownLabel } from '../../lib/recurrence'
import { formatDay } from '../../lib/formatDate'
import { btn } from '../../lib/ui-classes'

export function PlanScreen() {
  const { agenda, isLoading } = useAgenda(30)
  const [showPast, setShowPast] = useState(false)

  const upcoming = agenda.filter((a) => a.days_away >= 0)
  const past = agenda.filter((a) => a.days_away < 0)

  return (
    <>
      <TopHeader
        title="Kế hoạch"
        right={
          <Link
            to="/plan/new"
            className="rounded-full bg-accent px-3 py-1 text-sm font-semibold text-on-accent"
          >
            + Thêm
          </Link>
        }
      />

      <div className="flex-1 px-4 py-3">
        {isLoading ? (
          <p className="py-16 text-center text-sm text-muted">Đang tải...</p>
        ) : upcoming.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="flex flex-col gap-2.5">
            {upcoming.map((item) => (
              <AgendaRow key={item.id} item={item} />
            ))}
          </ul>
        )}

        {past.length > 0 ? (
          <div className="mt-8">
            <button
              type="button"
              onClick={() => setShowPast((v) => !v)}
              className="flex w-full items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-muted"
            >
              <span>Đã qua ({past.length})</span>
              <span aria-hidden>{showPast ? '▾' : '▸'}</span>
            </button>
            {showPast ? (
              <ul className="mt-2.5 flex flex-col gap-2.5 opacity-60">
                {past.map((item) => (
                  <AgendaRow key={item.id} item={item} />
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <p className="text-5xl" aria-hidden>
        🎂
      </p>
      <p className="mt-5 text-[17px] font-semibold text-text">
        Chưa có dịp nào được đánh dấu
      </p>
      <p className="mt-2 max-w-[30ch] text-sm leading-relaxed text-muted">
        Sinh nhật, ngày cưới, chuyến đi sắp tới — thêm một lần, cả hai máy
        cùng được nhắc.
      </p>
      <Link to="/plan/new" className={`${btn.primary} mt-7 max-w-[18rem]`}>
        Thêm dịp đầu tiên
      </Link>
    </div>
  )
}

function AgendaRow({ item }: { item: AgendaItem }) {
  const body = (
    <>
      <CountdownRing days={item.days_away} emoji={item.emoji} />
      <div className="min-w-0 flex-1">
        <b className="block truncate text-[15px] font-semibold text-text">
          {item.title}
        </b>
        <span className="block text-[12.5px] text-muted">
          {formatDay(item.occurs_on)} · {countdownLabel(item.days_away)}
        </span>
      </div>
      {item.is_system ? (
        <span className="shrink-0 rounded-full bg-soft px-2 py-0.5 text-[11px] text-accent">
          tự động
        </span>
      ) : (
        <span aria-hidden className="shrink-0 text-muted">
          ›
        </span>
      )}
    </>
  )

  const className =
    'flex items-center gap-3.5 rounded-2xl border border-border bg-surface p-3.5'

  // Mốc hệ thống không sửa, không xoá — chỉ tắt nhắc được trong Cài đặt
  if (item.is_system) {
    return <li className={className}>{body}</li>
  }

  return (
    <li>
      <Link to={`/plan/${item.id}`} className={`${className} w-full`}>
        {body}
      </Link>
    </li>
  )
}

/** Vòng tròn đếm ngược: phần đã trôi qua tô màu, phần còn lại để mờ.
 *  Quy ước 90 ngày là một vòng đầy — xa hơn thì gần như trống. */
function CountdownRing({
  days,
  emoji,
}: {
  days: number
  emoji: string | null
}) {
  const span = 90
  const progress = Math.max(0, Math.min(1, (span - days) / span))
  const deg = Math.round(progress * 360)

  return (
    <span
      aria-hidden
      className="grid h-12 w-12 flex-none place-items-center rounded-full"
      style={{
        background: `conic-gradient(var(--color-accent) ${deg}deg, var(--color-soft) ${deg}deg)`,
      }}
    >
      <span className="grid h-9 w-9 place-items-center rounded-full bg-surface text-base">
        {emoji ?? '📅'}
      </span>
    </span>
  )
}
