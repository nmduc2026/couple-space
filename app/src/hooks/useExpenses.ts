import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useCouple } from './useCouple'
import { PREVIEW, previewExpenses } from '../dev/preview'

export type Expense = {
  id: string
  amount_minor: number
  category: string | null
  note: string | null
  spent_on: string
  paid_by: string
  post_id: string | null
}

export type ExpenseSummary = {
  total_minor: number
  outing_count: number
  avg_outing_minor: number
  by_category: Record<string, number>
  by_payer: Record<string, number>
}

/** `month` là ngày bất kỳ trong tháng muốn xem, dạng YYYY-MM-DD. */
export function useExpenses(month: string) {
  const { couple } = useCouple()
  const coupleId = couple?.id

  const list = useQuery({
    queryKey: ['expenses', coupleId, month.slice(0, 7)],
    enabled: !!coupleId && !PREVIEW,
    queryFn: async () => {
      const first = `${month.slice(0, 7)}-01`
      const [y, m] = month.split('-').map(Number)
      const nextMonth =
        m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`

      const { data, error } = await supabase
        .from('expenses')
        .select('id, amount_minor, category, note, spent_on, paid_by, post_id')
        .eq('couple_id', coupleId!)
        .is('deleted_at', null)
        .gte('spent_on', first)
        .lt('spent_on', nextMonth)
        .order('spent_on', { ascending: false })
      if (error) throw error
      return (data ?? []) as Expense[]
    },
  })

  const summary = useQuery({
    queryKey: ['expense_summary', coupleId, month.slice(0, 7)],
    enabled: !!coupleId && !PREVIEW,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('expense_summary', {
        p_couple_id: coupleId!,
        p_month: `${month.slice(0, 7)}-01`,
      })
      if (error) throw error
      const row = Array.isArray(data) ? data[0] : data
      return row as ExpenseSummary
    },
  })

  if (PREVIEW) return previewExpenses(month)

  return {
    expenses: list.data ?? [],
    summary: summary.data ?? null,
    isLoading: list.isLoading,
  }
}
