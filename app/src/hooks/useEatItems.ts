import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useCouple } from './useCouple'
import { useSession } from './useSession'
import { PREVIEW, previewEatItems } from '../dev/preview'

export type EatStats = {
  item_id: string
  visit_count: number
  last_visited_on: string | null
  avg_spend_minor: number | null
  love_count: number
  nope_count: number
}

export type EatItem = {
  id: string
  name: string
  address: string | null
  map_url: string | null
  source_url: string | null
  tags: string[]
  status: 'want' | 'tried' | 'archived'
}

export function useEatItems() {
  const { couple } = useCouple()
  const query = useQuery({
    queryKey: ['eat_items', couple?.id],
    enabled: !!couple?.id && !PREVIEW,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('eat_items')
        .select('id, name, address, map_url, source_url, tags, status')
        .eq('couple_id', couple!.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as EatItem[]
    },
  })

  if (PREVIEW) {
    return { items: previewEatItems() as EatItem[], isLoading: false }
  }
  return { items: query.data ?? [], isLoading: query.isLoading }
}

/** Thống kê tự tính của từng quán — số lần ăn, giá trung bình, khen/chê.
 *  View `eat_item_stats` gộp sẵn ở DB nên client không phải đếm. */
export function useEatStats() {
  const { couple } = useCouple()
  const query = useQuery({
    queryKey: ['eat_item_stats', couple?.id],
    enabled: !!couple?.id && !PREVIEW,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('eat_item_stats')
        .select('item_id, visit_count, last_visited_on, avg_spend_minor, love_count, nope_count')
        .eq('couple_id', couple!.id)
      if (error) throw error
      const map = new Map<string, EatStats>()
      for (const row of (data ?? []) as EatStats[]) map.set(row.item_id, row)
      return map
    },
  })
  return query.data ?? new Map<string, EatStats>()
}

export type PendingRating = {
  visit_id: string
  item_id: string
  item_name: string
  visited_on: string
}

/**
 * Lượt ghé mà MÌNH chưa đánh giá, trong hai ngày gần nhất.
 *
 * Giới hạn hai ngày chính là luật "hôm sau nhắc một lần rồi thôi" —
 * quá hạn thì dải hỏi tự biến mất chứ không nài thêm.
 */
export function usePendingRatings() {
  const { couple } = useCouple()
  const { user } = useSession()

  const query = useQuery({
    queryKey: ['pending_ratings', couple?.id, user?.id],
    enabled: !!couple?.id && !!user?.id && !PREVIEW,
    queryFn: async () => {
      const since = new Date(Date.now() - 2 * 86_400_000)
        .toISOString()
        .slice(0, 10)

      const { data, error } = await supabase
        .from('eat_visits')
        .select('id, visited_on, eat_items(id, name), eat_ratings(user_id)')
        .eq('couple_id', couple!.id)
        .gte('visited_on', since)
        .order('visited_on', { ascending: false })
      if (error) throw error

      type Row = {
        id: string
        visited_on: string
        eat_items: { id: string; name: string } | null
        eat_ratings: { user_id: string }[]
      }

      return ((data ?? []) as unknown as Row[])
        .filter((v) => !v.eat_ratings.some((r) => r.user_id === user!.id))
        .map((v) => ({
          visit_id: v.id,
          item_id: v.eat_items?.id ?? '',
          item_name: v.eat_items?.name ?? 'Quán',
          visited_on: v.visited_on,
        })) as PendingRating[]
    },
  })

  if (PREVIEW) return []
  return query.data ?? []
}
