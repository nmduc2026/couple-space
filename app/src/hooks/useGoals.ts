import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useCouple } from './useCouple'
import { PREVIEW, previewGoals } from '../dev/preview'

export type GoalStep = {
  id: string
  title: string
  is_done: boolean
  sort_order: number
}

export type Goal = {
  id: string
  title: string
  description: string | null
  emoji: string | null
  kind: 'checklist' | 'count' | 'amount'
  target_count: number | null
  target_minor: number | null
  current_count: number
  due_date: string | null
  status: 'active' | 'done' | 'archived'
  celebrated_post_id: string | null
  goal_steps: GoalStep[]
  goal_contributions: { amount_minor: number }[]
}

/** Tiến độ 0–1 và dòng chữ mô tả, tuỳ theo kiểu mục tiêu. */
export function goalProgress(goal: Goal): { ratio: number; label: string } {
  if (goal.kind === 'checklist') {
    const total = goal.goal_steps.length
    const done = goal.goal_steps.filter((s) => s.is_done).length
    if (total === 0) {
      return { ratio: goal.status === 'done' ? 1 : 0, label: 'chưa có bước nào' }
    }
    return { ratio: done / total, label: `${done}/${total} bước` }
  }

  if (goal.kind === 'count') {
    const target = goal.target_count ?? 0
    if (target <= 0) return { ratio: 0, label: `${goal.current_count}` }
    return {
      ratio: Math.min(1, goal.current_count / target),
      label: `${goal.current_count}/${target}`,
    }
  }

  const saved = goal.goal_contributions.reduce(
    (sum, c) => sum + Number(c.amount_minor),
    0,
  )
  const target = Number(goal.target_minor ?? 0)
  if (target <= 0) return { ratio: 0, label: `${saved}` }
  return {
    ratio: Math.min(1, saved / target),
    label: `${Math.round((saved / target) * 100)}%`,
  }
}

export function goalSaved(goal: Goal) {
  return goal.goal_contributions.reduce(
    (sum, c) => sum + Number(c.amount_minor),
    0,
  )
}

export function useGoals() {
  const { couple } = useCouple()
  const query = useQuery({
    queryKey: ['goals', couple?.id],
    enabled: !!couple?.id && !PREVIEW,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goals')
        .select(
          'id, title, description, emoji, kind, target_count, target_minor,' +
            ' current_count, due_date, status, celebrated_post_id,' +
            ' goal_steps(id, title, is_done, sort_order),' +
            ' goal_contributions(amount_minor)',
        )
        .eq('couple_id', couple!.id)
        .is('deleted_at', null)
        .order('position', { ascending: true })
      if (error) throw error
      return (data ?? []) as unknown as Goal[]
    },
  })

  if (PREVIEW) return { goals: previewGoals(), isLoading: false }
  return { goals: query.data ?? [], isLoading: query.isLoading }
}

/** Quá hạn thì IM LẶNG: chỉ đẩy xuống cuối và làm nhạt chữ.
 *  Không nhắc, không tô đỏ — app không biến tình yêu thành KPI. */
export function isOverdue(goal: Goal, today: string) {
  return goal.status === 'active' && !!goal.due_date && goal.due_date < today
}
