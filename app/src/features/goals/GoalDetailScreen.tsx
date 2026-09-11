import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useCouple } from '../../hooks/useCouple'
import { useSession } from '../../hooks/useSession'
import { goalProgress, goalSaved, useGoals } from '../../hooks/useGoals'
import { formatVnd, formatAmountInput, parseAmountInput } from '../../lib/money'
import { formatDay } from '../../lib/formatDate'
import { supabase } from '../../lib/supabase'
import { notifyPartner } from '../../lib/notify'
import { PREVIEW } from '../../dev/preview'
import { Loading, Screen, Stage, Title, TopBar } from '../../components/ui'
import { btn, input } from '../../lib/ui-classes'

export function GoalDetailScreen() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { couple } = useCouple()
  const { user } = useSession()
  const { goals, isLoading } = useGoals()
  const goal = goals.find((g) => g.id === id)

  const [stepTitle, setStepTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [celebrating, setCelebrating] = useState(false)

  if (isLoading) return <Loading />
  if (!goal) {
    return (
      <Screen>
        <TopBar to="/plan?tab=goals" />
        <p className="px-5 py-20 text-center text-sm text-muted">
          Không tìm thấy mục tiêu này.
        </p>
      </Screen>
    )
  }

  const { ratio, label } = goalProgress(goal)
  const saved = goalSaved(goal)

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ['goals'] })
  }

  async function toggleStep(stepId: string, next: boolean) {
    if (!goal || PREVIEW) return
    await supabase
      .from('goal_steps')
      .update({
        is_done: next,
        done_at: next ? new Date().toISOString() : null,
        done_by: next ? (user?.id ?? null) : null,
      })
      .eq('id', stepId)

    const total = goal.goal_steps.length
    const doneAfter =
      goal.goal_steps.filter((s) => s.is_done).length + (next ? 1 : -1)

    if (total > 0 && doneAfter >= total) {
      await supabase
        .from('goals')
        .update({ status: 'done', completed_at: new Date().toISOString() })
        .eq('id', goal.id)
      setCelebrating(true)
      void notifyPartner(couple, user?.id ?? '', {
        title: 'Couple Space',
        body: `Xong rồi: ${goal.title} 🎉`,
        path: `/plan/goals/${goal.id}`,
      })
    } else if (goal.status === 'done') {
      // Bỏ tích sau khi đã sinh bài: mục tiêu quay lại "đang làm",
      // bài kỉ niệm giữ nguyên — nó là chuyện đã xảy ra thật.
      await supabase
        .from('goals')
        .update({ status: 'active', completed_at: null })
        .eq('id', goal.id)
    }

    await refresh()
  }

  async function addStep(event: FormEvent) {
    event.preventDefault()
    const value = stepTitle.trim()
    if (!value || !goal || PREVIEW) return
    await supabase.from('goal_steps').insert({
      goal_id: goal.id,
      couple_id: couple!.id,
      title: value,
      sort_order: goal.goal_steps.length,
    })
    setStepTitle('')
    await refresh()
  }

  async function addContribution(event: FormEvent) {
    event.preventDefault()
    const minor = parseAmountInput(amount)
    if (minor <= 0 || !goal || !user || PREVIEW) return
    await supabase.from('goal_contributions').insert({
      goal_id: goal.id,
      couple_id: couple!.id,
      user_id: user.id,
      amount_minor: minor,
    })
    setAmount('')
    await refresh()
  }

  async function bumpCount(delta: number) {
    if (!goal || PREVIEW) return
    const next = Math.max(0, goal.current_count + delta)
    const target = goal.target_count ?? 0
    await supabase
      .from('goals')
      .update({
        current_count: next,
        status: target > 0 && next >= target ? 'done' : 'active',
        completed_at:
          target > 0 && next >= target ? new Date().toISOString() : null,
      })
      .eq('id', goal.id)
    if (target > 0 && next >= target) setCelebrating(true)
    await refresh()
  }

  if (celebrating) {
    return (
      <Screen>
        <Stage className="items-center justify-center text-center">
          <p className="text-6xl" aria-hidden>
            🎉
          </p>
          <p className="mt-6 text-[22px] font-bold text-text">
            Hai đứa làm được rồi!
          </p>
          <p className="mt-2 text-[15px] text-muted">{goal.title}</p>

          <div className="mt-10 w-full">
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/compose?caption=${encodeURIComponent(goal.title)}&goal=${goal.id}`,
                )
              }
              className={btn.primary}
            >
              Đăng lên kỉ niệm
            </button>
            <button
              type="button"
              onClick={() => setCelebrating(false)}
              className={`${btn.ghost} mt-1`}
            >
              Để sau
            </button>
          </div>
        </Stage>
      </Screen>
    )
  }

  return (
    <Screen>
      <TopBar to="/plan?tab=goals" />
      <Stage>
        <div className="flex items-center gap-3">
          <span aria-hidden className="text-3xl">
            {goal.emoji ?? '✨'}
          </span>
          <Title>{goal.title}</Title>
        </div>
        {goal.due_date ? (
          <p className="mt-1.5 text-sm text-muted">
            Hạn {formatDay(goal.due_date)}
          </p>
        ) : null}

        <div className="mt-5">
          <div className="flex items-baseline justify-between text-[13px] text-muted">
            <span>Tiến độ</span>
            <b className="font-semibold text-text">{label}</b>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-soft">
            <span
              className="block h-full rounded-full bg-accent"
              style={{ width: `${Math.round(ratio * 100)}%` }}
            />
          </div>
        </div>

        {goal.kind === 'checklist' ? (
          <>
            <ul className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface divide-y divide-border">
              {goal.goal_steps
                .slice()
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((step) => (
                  <li key={step.id}>
                    <button
                      type="button"
                      onClick={() => void toggleStep(step.id, !step.is_done)}
                      className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                    >
                      <span
                        aria-hidden
                        className={`grid h-6 w-6 flex-none place-items-center rounded-full border text-xs ${
                          step.is_done
                            ? 'border-accent bg-accent text-on-accent'
                            : 'border-border'
                        }`}
                      >
                        {step.is_done ? '✓' : ''}
                      </span>
                      <span
                        className={`min-w-0 flex-1 text-[15px] ${
                          step.is_done
                            ? 'text-muted line-through'
                            : 'text-text'
                        }`}
                      >
                        {step.title}
                      </span>
                    </button>
                  </li>
                ))}
            </ul>

            <form onSubmit={addStep} className="mt-3 flex gap-2">
              <input
                value={stepTitle}
                onChange={(e) => setStepTitle(e.target.value)}
                placeholder="Thêm một bước"
                className={`${input} flex-1`}
              />
              <button
                type="submit"
                disabled={!stepTitle.trim()}
                className="h-12 shrink-0 rounded-2xl border border-border px-4 text-sm font-semibold text-text disabled:opacity-40"
              >
                Thêm
              </button>
            </form>
          </>
        ) : null}

        {goal.kind === 'count' ? (
          <div className="mt-6 flex items-center justify-center gap-6 rounded-2xl border border-border bg-surface p-5">
            <button
              type="button"
              onClick={() => void bumpCount(-1)}
              className="grid h-12 w-12 place-items-center rounded-full border border-border text-xl text-muted"
            >
              −
            </button>
            <b className="text-[34px] font-extrabold text-text tabular-nums">
              {goal.current_count}
            </b>
            <button
              type="button"
              onClick={() => void bumpCount(1)}
              className="grid h-12 w-12 place-items-center rounded-full bg-accent text-xl text-on-accent"
            >
              +
            </button>
          </div>
        ) : null}

        {goal.kind === 'amount' ? (
          <div className="mt-6">
            <div className="rounded-2xl border border-border bg-surface p-4 text-center">
              <p className="text-[24px] font-extrabold text-text">
                {formatVnd(saved)}
              </p>
              <p className="mt-1 text-[13px] text-muted">
                trên {formatVnd(Number(goal.target_minor ?? 0))}
              </p>
            </div>
            <form onSubmit={addContribution} className="mt-3 flex gap-2">
              <input
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(formatAmountInput(e.target.value))}
                placeholder="Nạp thêm bao nhiêu?"
                className={`${input} flex-1 text-right tabular-nums`}
              />
              <button
                type="submit"
                disabled={!amount}
                className="h-12 shrink-0 rounded-2xl bg-accent px-4 text-sm font-semibold text-on-accent disabled:opacity-40"
              >
                Nạp
              </button>
            </form>
            <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
              Nạp quỹ ghi tay — app không tự trừ từ chi tiêu chung. Tiêu chung
              và để dành là hai việc khác nhau.
            </p>
          </div>
        ) : null}
      </Stage>
    </Screen>
  )
}
