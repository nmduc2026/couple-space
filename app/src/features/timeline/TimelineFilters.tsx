import { useEffect, useRef, useState } from 'react'
import { ACTIVITY_LABELS } from '../../lib/activities'
import { provinceByCode } from '../../lib/provinces'

/*
 * Ba bộ lọc cho Timeline: thời gian (chọn một), nơi chốn (chọn một) và hoạt
 * động (chọn nhiều).
 *
 * Cả ba LUÔN hiện. Trước đây lọc theo nơi chốn chỉ xuất hiện khi đi từ màn Dấu
 * chân sang, nên vào thẳng Kỉ niệm thì không có cách nào lọc theo nơi.
 *
 * Dạng dropdown thả ngay dưới nút, không phải tấm trượt từ đáy màn hình. Tấm
 * trượt hợp với việc dài hơi (chọn ngày, chọn giờ, đọc rồi quyết); còn lọc là
 * việc bấm nhanh rồi nhìn kết quả ngay — đẩy nó xuống đáy màn hình làm mất
 * chính cái danh sách mà người ta đang muốn xem đổi thế nào.
 */

export type TimeFilter = { kind: 'all' } | { kind: 'year'; year: string }

const trigger =
  'flex w-full items-center gap-2 rounded-2xl border bg-surface px-3.5 py-2.5 text-[13.5px] text-text'

export function TimelineFilters({
  years,
  time,
  onTime,
  activities,
  onActivities,
  places,
  provinces,
  place,
  province,
  onPlace,
}: {
  years: string[]
  time: TimeFilter
  onTime: (next: TimeFilter) => void
  activities: string[]
  onActivities: (next: string[]) => void
  places: Array<{ key: string; count: number }>
  provinces: Array<{ key: string; count: number }>
  place: string | null
  province: string | null
  onPlace: (next: { place?: string | null; province?: string | null }) => void
}) {
  const [open, setOpen] = useState<'time' | 'activity' | 'place' | null>(null)

  const timeLabel = time.kind === 'all' ? 'Mọi lúc' : `Năm ${time.year}`
  const activityLabel =
    activities.length === 0
      ? 'Mọi hoạt động'
      : activities.length === 1
        ? (ACTIVITY_LABELS[activities[0]]?.label ?? activities[0])
        : `${activities.length} loại`

  const placeLabel = place
    ? place
    : province
      ? (provinceByCode(province)?.name ?? province)
      : 'Mọi nơi'

  const toggle = (key: string) =>
    onActivities(
      activities.includes(key)
        ? activities.filter((a) => a !== key)
        : [...activities, key],
    )

  return (
    <div className="flex gap-2 px-4 py-3">
      <Dropdown
        icon="🗓️"
        label={timeLabel}
        active={time.kind !== 'all'}
        open={open === 'time'}
        onOpen={() => setOpen(open === 'time' ? null : 'time')}
        onClose={() => setOpen(null)}
      >
        <Option
          active={time.kind === 'all'}
          onClick={() => {
            onTime({ kind: 'all' })
            setOpen(null)
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
              setOpen(null)
            }}
          >
            Năm {y}
          </Option>
        ))}
      </Dropdown>

      <Dropdown
        icon="📍"
        label={placeLabel}
        active={!!place || !!province}
        open={open === 'place'}
        onOpen={() => setOpen(open === 'place' ? null : 'place')}
        onClose={() => setOpen(null)}
      >
        <Option
          active={!place && !province}
          onClick={() => {
            onPlace({ place: null, province: null })
            setOpen(null)
          }}
        >
          Mọi nơi
        </Option>

        {provinces.length > 0 ? (
          <p className="px-2.5 pt-2 pb-1 text-[11px] font-bold tracking-[0.1em] text-muted uppercase">
            Tỉnh thành
          </p>
        ) : null}
        {provinces.map((p) => (
          <Option
            key={`prov-${p.key}`}
            active={province === p.key}
            onClick={() => {
              onPlace({ place: null, province: p.key })
              setOpen(null)
            }}
          >
            {provinceByCode(p.key)?.name ?? p.key}
          </Option>
        ))}

        {places.length > 0 ? (
          <p className="px-2.5 pt-2 pb-1 text-[11px] font-bold tracking-[0.1em] text-muted uppercase">
            Địa điểm
          </p>
        ) : null}
        {places.map((p) => (
          <Option
            key={`place-${p.key}`}
            active={place === p.key}
            onClick={() => {
              onPlace({ place: p.key, province: null })
              setOpen(null)
            }}
          >
            {p.key}
          </Option>
        ))}
      </Dropdown>

      <Dropdown
        icon="🏷️"
        label={activityLabel}
        active={activities.length > 0}
        open={open === 'activity'}
        onOpen={() => setOpen(open === 'activity' ? null : 'activity')}
        onClose={() => setOpen(null)}
      >
        {/* Chọn nhiều nên KHÔNG đóng sau mỗi lần bấm */}
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
            className="w-full py-2.5 text-center text-[13px] font-medium text-muted"
          >
            Bỏ chọn hết
          </button>
        ) : null}
      </Dropdown>
    </div>
  )
}

function Dropdown({
  icon,
  label,
  active,
  open,
  onOpen,
  onClose,
  children,
}: {
  icon: string
  label: string
  active: boolean
  open: boolean
  onOpen: () => void
  onClose: () => void
  children: React.ReactNode
}) {
  const box = useRef<HTMLDivElement>(null)

  // Bấm ra ngoài hoặc Esc thì đóng — cách cư xử mà ai cũng chờ đợi ở dropdown
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  return (
    <div ref={box} className="relative flex-1">
      <button
        type="button"
        onClick={onOpen}
        aria-expanded={open}
        className={`${trigger} ${active || open ? 'border-accent' : 'border-border'}`}
      >
        <span aria-hidden>{icon}</span>
        <span className="truncate">{label}</span>
        <span
          aria-hidden
          className={`ml-auto text-[11px] text-muted transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        >
          ▾
        </span>
      </button>

      {open ? (
        <div className="absolute top-full right-0 left-0 z-30 mt-1.5 max-h-72 overflow-y-auto rounded-2xl border border-border bg-surface p-1 shadow-xl">
          {children}
        </div>
      ) : null}
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
      className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left text-[14px] transition ${
        active ? 'bg-soft font-semibold text-accent' : 'text-text'
      }`}
    >
      <span
        aria-hidden
        className={`grid h-4.5 w-4.5 flex-none place-items-center border text-[10px] ${
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
