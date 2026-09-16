import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { Link } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { EmptyState, InlineLoading } from '../../components/EmptyState'
import { QuickAddRow } from '../../components/QuickAddRow'
import { ConfirmSheet } from '../../components/ui'
import { useCouple } from '../../hooks/useCouple'
import { useSession } from '../../hooks/useSession'
import { goalProgress, isOverdue, useGoals, type Goal } from '../../hooks/useGoals'
import { todayYmd } from '../../lib/dateCount'
import { formatDay } from '../../lib/formatDate'
import { supabase } from '../../lib/supabase'
import { PREVIEW } from '../../dev/preview'

const DELETE_W = 76

export function GoalsScreen() {
  const queryClient = useQueryClient()
  const { couple } = useCouple()
  const { user } = useSession()
  const { goals, isLoading } = useGoals()

  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [showDone, setShowDone] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Goal | null>(null)

  const today = todayYmd()
  const active = goals.filter((g) => g.status === 'active')
  const done = goals.filter((g) => g.status === 'done')

  // Quá hạn xuống cuối, im lặng — không nhắc, không tô đỏ
  const ordered = [
    ...active.filter((g) => !isOverdue(g, today)),
    ...active.filter((g) => isOverdue(g, today)),
  ]

  /** Thêm nhanh: chỉ cần tên, mặc định kiểu checklist. */
  async function quickAdd() {
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

  async function confirmDelete() {
    if (!pendingDelete || PREVIEW) return
    const id = pendingDelete.id
    setPendingDelete(null)
    setOpenId(null)
    await supabase
      .from('goals')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
    await queryClient.invalidateQueries({ queryKey: ['goals'] })
  }

  return (
    <div className="px-4 pb-8">
      <QuickAddRow
        value={title}
        onChange={setTitle}
        onSubmit={quickAdd}
        placeholder="Tên mục tiêu"
        disabled={saving}
        className="pt-3"
      />

      {isLoading ? (
        <InlineLoading />
      ) : ordered.length === 0 ? (
        <EmptyState emoji="✨" title="Chưa có mục tiêu." compact />
      ) : (
        <ul className="mt-4 flex flex-col gap-2.5">
          {ordered.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              today={today}
              open={openId === goal.id}
              onOpenChange={(next) => setOpenId(next ? goal.id : null)}
              onRequestDelete={() => setPendingDelete(goal)}
            />
          ))}
        </ul>
      )}

      {done.length > 0 ? (
        <div className="mt-8">
          <button
            type="button"
            onClick={() => setShowDone((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 text-sm text-muted"
          >
            <span>Đã hoàn thành ({done.length})</span>
            <span aria-hidden>{showDone ? '▾' : '▸'}</span>
          </button>
          {showDone ? (
            <ul className="mt-2.5 flex flex-col gap-2.5 opacity-60">
              {done.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  today={today}
                  open={openId === goal.id}
                  onOpenChange={(next) => setOpenId(next ? goal.id : null)}
                  onRequestDelete={() => setPendingDelete(goal)}
                />
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {pendingDelete ? (
        <ConfirmSheet
          title="Xoá mục tiêu này?"
          onConfirm={() => void confirmDelete()}
          onCancel={() => setPendingDelete(null)}
        />
      ) : null}
    </div>
  )
}

function GoalCard({
  goal,
  today,
  open,
  onOpenChange,
  onRequestDelete,
}: {
  goal: Goal
  today: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onRequestDelete: () => void
}) {
  const { ratio, label } = goalProgress(goal)
  const overdue = isOverdue(goal, today)
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const start = useRef<{ x: number; y: number; ox: number } | null>(null)
  const axis = useRef<'h' | 'v' | null>(null)
  const didDrag = useRef(false)

  useEffect(() => {
    if (!dragging) setOffset(open ? -DELETE_W : 0)
  }, [open, dragging])

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    start.current = {
      x: e.clientX,
      y: e.clientY,
      ox: open ? -DELETE_W : 0,
    }
    axis.current = null
    didDrag.current = false
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!start.current) return
    const dx = e.clientX - start.current.x
    const dy = e.clientY - start.current.y
    if (!axis.current) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
      axis.current = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v'
      if (axis.current === 'v') {
        start.current = null
        return
      }
      setDragging(true)
    }
    if (axis.current !== 'h') return
    didDrag.current = true
    setOffset(Math.min(0, Math.max(-DELETE_W, start.current.ox + dx)))
  }

  function finishPointer() {
    if (!start.current) return
    const dragged = didDrag.current
    const final = offset
    start.current = null
    axis.current = null
    didDrag.current = false
    setDragging(false)
    if (!dragged) return
    onOpenChange(final < -DELETE_W / 2)
  }

  return (
    <li className="relative overflow-hidden rounded-xl border border-border bg-surface">
      <button
        type="button"
        aria-label={`Xoá ${goal.title}`}
        className={`absolute inset-y-0 right-0 flex w-[76px] items-center justify-center bg-accent text-[13px] font-semibold text-on-accent transition-opacity ${
          offset < -2 || open ? 'opacity-100' : 'opacity-0'
        }`}
        tabIndex={open ? 0 : -1}
        onClick={() => {
          onOpenChange(false)
          onRequestDelete()
        }}
      >
        Xoá
      </button>

      <div
        className="relative touch-pan-y will-change-transform bg-surface"
        style={{
          transform: `translateX(${offset}px)`,
          transition: dragging ? 'none' : 'transform 200ms ease-out',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishPointer}
        onPointerCancel={finishPointer}
      >
        <Link
          to={`/plan/goals/${goal.id}`}
          className={`block bg-surface p-3.5 ${overdue ? 'opacity-55' : ''}`}
          onClick={(e) => {
            if (open || Math.abs(offset) > 4) {
              e.preventDefault()
              onOpenChange(false)
            }
          }}
        >
          <div className="flex items-center gap-3">
            <span aria-hidden className="text-xl">
              {goal.emoji ?? '✨'}
            </span>
            <b className="min-w-0 flex-1 truncate text-[15px] font-semibold text-text">
              {goal.title}
            </b>
          </div>

          <div className="mt-2.5 h-[7px] overflow-hidden rounded-full bg-soft">
            <span
              className="block h-full rounded-full bg-accent transition-[width]"
              style={{ width: `${Math.round(ratio * 100)}%` }}
            />
          </div>

          <div className="mt-2 flex items-baseline justify-between gap-3 text-[12px] text-muted">
            <span className="min-w-0 truncate tabular-nums">{label}</span>
            {goal.due_date ? (
              <span className="shrink-0">Hạn {formatDay(goal.due_date)}</span>
            ) : null}
          </div>
        </Link>
      </div>
    </li>
  )
}
