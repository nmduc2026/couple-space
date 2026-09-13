import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { TopHeader } from '../../components/AppShell'
import { useAgenda, type AgendaItem } from '../../hooks/useAgenda'
import { useCouple } from '../../hooks/useCouple'
import { useSession } from '../../hooks/useSession'
import { supabase } from '../../lib/supabase'
import { isBirthday, shouldSuggest, suggestedTask } from '../../lib/eventSuggestion'
import { PREVIEW } from '../../dev/preview'
import { countdownLabel } from '../../lib/recurrence'
import { formatDay } from '../../lib/formatDate'
import { btn } from '../../lib/ui-classes'
import { GoalsScreen } from '../goals/GoalsScreen'

export function PlanScreen() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'goals' ? 'goals' : 'events'
  const { agenda, isLoading } = useAgenda(30)
  const [showPast, setShowPast] = useState(false)
  const queryClient = useQueryClient()
  const { couple } = useCouple()
  const { user } = useSession()
  const [dismissed, setDismissed] = useState<string[]>([])
  const [creating, setCreating] = useState(false)

  function setTab(next: 'events' | 'goals') {
    const p = new URLSearchParams(params)
    if (next === 'goals') p.set('tab', 'goals')
    else p.delete('tab')
    setParams(p, { replace: true })
  }

  const upcoming = agenda.filter((a) => a.days_away >= 0)
  const past = agenda.filter((a) => a.days_away < 0)

  // Chỉ gợi ý cho dịp gần nhất — nhiều dải gợi ý cùng lúc là làm phiền
  const suggestFor = upcoming.find(
    (a) => shouldSuggest(a.days_away) && !dismissed.includes(a.id) && suggestedTask(a.title),
  )
  const suggestion = suggestFor ? suggestedTask(suggestFor.title) : null

  /** Tạo thẳng một mục tiêu checklist, hạn đúng ngày diễn ra dịp. */
  async function createTask() {
    if (!suggestFor || !suggestion || !couple || !user || PREVIEW) return
    setCreating(true)
    const { error } = await supabase.from('goals').insert({
      couple_id: couple.id,
      title: suggestion,
      kind: 'checklist',
      due_date: suggestFor.occurs_on,
      created_by: user.id,
    })
    setCreating(false)
    if (error) return
    setDismissed((list) => [...list, suggestFor.id])
    await queryClient.invalidateQueries({ queryKey: ['goals'] })
    setTab('goals')
  }

  return (
    <>
      <TopHeader
        title="Kế hoạch"
        right={
          tab === 'events' ? (
            <Link
              to="/plan/new"
              className="rounded-full bg-accent px-3 py-1 text-sm font-semibold text-on-accent"
            >
              + Thêm
            </Link>
          ) : undefined
        }
      />

      <div className="px-4 pt-3">
        <div className="flex gap-1 rounded-2xl border border-border bg-surface p-1">
          {(
            [
              ['events', 'Sự kiện'],
              ['goals', 'Mục tiêu'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
                tab === value ? 'bg-accent text-on-accent' : 'text-muted'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'goals' ? <GoalsScreen /> : null}

      <div
        className="flex-1 px-4 py-3"
        hidden={tab !== 'events'}
      >
        {suggestion && suggestFor ? (
          <div className="mb-3 rounded-2xl border border-accent/30 bg-soft p-3.5">
            <p className="text-[13.5px] leading-relaxed text-text">
              Còn{' '}
              {suggestFor.days_away === 0
                ? 'hôm nay'
                : `${suggestFor.days_away} ngày`}{' '}
              · <b className="font-semibold">{suggestFor.title}</b>
            </p>
            <div className="mt-2.5 flex gap-2">
              <button
                type="button"
                onClick={() => void createTask()}
                disabled={creating}
                className="rounded-full bg-accent px-3.5 py-1.5 text-[13px] font-semibold text-on-accent disabled:opacity-50"
              >
                Tạo việc cần làm
              </button>
              {isBirthday(suggestFor.title) ? (
                <Link
                  to="/wishlist"
                  className="rounded-full border border-border px-3.5 py-1.5 text-[13px] font-semibold text-accent"
                >
                  🎁 Xem wishlist
                </Link>
              ) : null}
              <button
                type="button"
                onClick={() => setDismissed((l) => [...l, suggestFor.id])}
                className="rounded-full px-3 py-1.5 text-[13px] font-medium text-muted"
              >
                Bỏ qua
              </button>
            </div>
          </div>
        ) : null}

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
        Chưa có sự kiện.
      </p>
      <Link to="/plan/new" className={`${btn.primary} mt-7 max-w-[18rem]`}>
        Thêm
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
