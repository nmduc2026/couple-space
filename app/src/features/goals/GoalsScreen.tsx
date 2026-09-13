import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useCouple } from '../../hooks/useCouple'
import { useSession } from '../../hooks/useSession'
import { goalProgress, isOverdue, useGoals, type Goal } from '../../hooks/useGoals'
import { todayYmd } from '../../lib/dateCount'
import { formatDay } from '../../lib/formatDate'
import { supabase } from '../../lib/supabase'
import { PREVIEW } from '../../dev/preview'
import { input } from '../../lib/ui-classes'

export function GoalsScreen() {
  const queryClient = useQueryClient()
  const { couple } = useCouple()
  const { user } = useSession()
  const { goals, isLoading } = useGoals()

  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [showDone, setShowDone] = useState(false)

  const today = todayYmd()
  const active = goals.filter((g) => g.status === 'active')
  const done = goals.filter((g) => g.status === 'done')

  // Quá hạn xuống cuối, im lặng — không nhắc, không tô đỏ
  const ordered = [
    ...active.filter((g) => !isOverdue(g, today)),
    ...active.filter((g) => isOverdue(g, today)),
  ]

  /** Thêm nhanh: chỉ cần tên, mặc định kiểu checklist. */
  async function quickAdd(event: FormEvent) {
    event.preventDefault()
    const value = title.trim()
    if (!value || !couple || !user || PREVIEW) return
    setSaving(true)
    const { error } = await supabase.from('goals').insert({
      couple_id: couple.id,
      title: value,
      kind: 'checklist',
      created_by: user.id,
      position: goals.length,
    })
    setSaving(false)
    if (error) return
    setTitle('')
    await queryClient.invalidateQueries({ queryKey: ['goals'] })
  }

  return (
    <div className="px-4 pb-8">
      <form onSubmit={quickAdd} className="flex gap-2 pt-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Tên mục tiêu"
          className={`${input} flex-1`}
        />
        <button
          type="submit"
          disabled={!title.trim() || saving}
          className="h-12 shrink-0 rounded-2xl border border-border px-4 text-sm font-semibold text-text disabled:opacity-40"
        >
          Thêm
        </button>
      </form>

      {isLoading ? (
        <p className="py-16 text-center text-sm text-muted">Đang tải...</p>
      ) : ordered.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-14 text-center">
          <p className="text-5xl" aria-hidden>
            ✨
          </p>
          <p className="mt-5 text-[17px] font-semibold text-text">
            Chưa có mục tiêu.
          </p>
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-2.5">
          {ordered.map((goal) => (
            <GoalCard key={goal.id} goal={goal} today={today} />
          ))}
        </ul>
      )}

      {done.length > 0 ? (
        <div className="mt-8">
          <button
            type="button"
            onClick={() => setShowDone((v) => !v)}
            className="flex w-full items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-muted"
          >
            <span>Đã hoàn thành ({done.length})</span>
            <span aria-hidden>{showDone ? '▾' : '▸'}</span>
          </button>
          {showDone ? (
            <ul className="mt-2.5 flex flex-col gap-2.5 opacity-60">
              {done.map((goal) => (
                <GoalCard key={goal.id} goal={goal} today={today} />
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function GoalCard({ goal, today }: { goal: Goal; today: string }) {
  const { ratio, label } = goalProgress(goal)
  const overdue = isOverdue(goal, today)

  return (
    <li>
      <Link
        to={`/plan/goals/${goal.id}`}
        className={`block rounded-2xl border border-border bg-surface p-3.5 ${
          overdue ? 'opacity-55' : ''
        }`}
      >
        <div className="flex items-center gap-3">
          <span aria-hidden className="text-xl">
            {goal.emoji ?? '✨'}
          </span>
          <b className="min-w-0 flex-1 truncate text-[15px] font-semibold text-text">
            {goal.title}
          </b>
          <span className="shrink-0 text-[12.5px] text-muted tabular-nums">
            {label}
          </span>
        </div>

        <div className="mt-2.5 h-[7px] overflow-hidden rounded-full bg-soft">
          <span
            className="block h-full rounded-full bg-accent transition-[width]"
            style={{ width: `${Math.round(ratio * 100)}%` }}
          />
        </div>

        {goal.due_date ? (
          <p className="mt-2 text-[12px] text-muted">
            Hạn {formatDay(goal.due_date)}
          </p>
        ) : null}
      </Link>
    </li>
  )
}
