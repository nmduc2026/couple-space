import { useState } from 'react'
import { ACTIVITY_LABELS } from '../../lib/activities'
import { btn } from '../../lib/ui-classes'

/*
 * Hai bộ lọc cho Timeline: thời gian (chọn một) và hoạt động (chọn nhiều).
 *
 * Trước đây là một dải chip cuộn ngang. Dải đó có hai vấn đề: mỗi lần chỉ lọc
 * được đúng một thứ, và khi đã đi được vài năm thì chip năm đẩy chip hoạt động
 * ra khỏi màn hình — muốn lọc "ăn uống" phải vuốt ngang đi tìm.
 */

export type TimeFilter = { kind: 'all' } | { kind: 'year'; year: string }

const chevron = (
  <span aria-hidden className="ml-auto text-[11px] text-muted">
    ▾
  </span>
)

const trigger =
  'flex flex-1 items-center gap-2 rounded-2xl border border-border bg-surface px-3.5 py-2.5 text-[13.5px] text-text'

export function TimelineFilters({
  years,
  time,
  onTime,
  activities,
  onActivities,
}: {
  years: string[]
  time: TimeFilter
  onTime: (next: TimeFilter) => void
  activities: string[]
  onActivities: (next: string[]) => void
}) {
  const [sheet, setSheet] = useState<'time' | 'activity' | null>(null)

  const timeLabel = time.kind === 'all' ? 'Mọi lúc' : `Năm ${time.year}`
  const activityLabel =
    activities.length === 0
      ? 'Mọi hoạt động'
      : activities.length === 1
        ? (ACTIVITY_LABELS[activities[0]]?.label ?? activities[0])
        : `${activities.length} loại`

  const toggle = (key: string) =>
    onActivities(
      activities.includes(key)
        ? activities.filter((a) => a !== key)
        : [...activities, key],
    )

  return (
    <>
      <div className="flex gap-2 px-4 py-3">
        <button type="button" onClick={() => setSheet('time')} className={trigger}>
          <span aria-hidden>🗓️</span>
          <span className="truncate">{timeLabel}</span>
          {chevron}
        </button>
        <button
          type="button"
          onClick={() => setSheet('activity')}
          className={`${trigger} ${activities.length ? 'border-accent' : ''}`}
        >
          <span aria-hidden>🏷️</span>
          <span className="truncate">{activityLabel}</span>
          {chevron}
        </button>
      </div>

      {sheet === 'time' ? (
        <Sheet title="Thời gian" onClose={() => setSheet(null)}>
          <Option
            active={time.kind === 'all'}
            onClick={() => {
              onTime({ kind: 'all' })
              setSheet(null)
            }}
          >
            Mọi lúc
          </Option>
          {years.map((y) => (
            <Option
              key={y}
              active={time.kind === 'year' && time.year === y}
              onClick={() => {
                onTime({ kind: 'year', year: y })
                setSheet(null)
              }}
            >
              Năm {y}
            </Option>
          ))}
        </Sheet>
      ) : null}

      {sheet === 'activity' ? (
        <Sheet title="Hoạt động" onClose={() => setSheet(null)}>
          {Object.entries(ACTIVITY_LABELS).map(([key, meta]) => (
            <Option
              key={key}
              active={activities.includes(key)}
              multi
              onClick={() => toggle(key)}
            >
              <span aria-hidden className="mr-1.5">
                {meta.emoji}
              </span>
              {meta.label}
            </Option>
          ))}
          {activities.length > 0 ? (
            <button
              type="button"
              onClick={() => onActivities([])}
              className={`${btn.ghost} mt-2`}
            >
              Bỏ chọn hết
            </button>
          ) : null}
        </Sheet>
      ) : null}
    </>
  )
}

function Sheet({
  title,
  children,
  onClose,
}: {
  title: string
  children: React.ReactNode
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="max-h-[80svh] w-full overflow-y-auto rounded-t-3xl border-t border-border bg-bg p-5 pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[17px] font-semibold text-text">{title}</p>
        <div className="mt-3">{children}</div>
        <button type="button" onClick={onClose} className={`${btn.ghost} mt-2`}>
          Xong
        </button>
      </div>
    </div>
  )
}

function Option({
  children,
  active,
  multi = false,
  onClick,
}: {
  children: React.ReactNode
  active: boolean
  multi?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="flex w-full items-center gap-3 border-b border-border py-3 text-left text-[15px] text-text last:border-b-0"
    >
      <span
        aria-hidden
        className={`grid h-5 w-5 flex-none place-items-center border text-[11px] ${
          multi ? 'rounded-md' : 'rounded-full'
        } ${
          active
            ? 'border-accent bg-accent text-on-accent'
            : 'border-border text-transparent'
        }`}
      >
        ✓
      </span>
      <span className="min-w-0 flex-1">{children}</span>
    </button>
  )
}
