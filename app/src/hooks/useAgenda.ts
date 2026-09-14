import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useCouple } from './useCouple'
import { PREVIEW, previewAgenda } from '../dev/preview'

export type AgendaItem = {
  id: string
  title: string
  emoji: string | null
  occurs_on: string
  days_away: number
  is_system: boolean
  recurrence: 'none' | 'monthly' | 'yearly'
}

export type EventRow = {
  id: string
  title: string
  event_date: string
  recurrence: 'none' | 'monthly' | 'yearly'
  remind_days_before: number[]
  notes: string | null
  emoji: string | null
}

/** Sự kiện người dùng + mốc hệ thống, trộn thành một danh sách theo ngày. */
export function useAgenda(limit = 20) {
  const { couple } = useCouple()
  const query = useQuery({
    queryKey: ['agenda', couple?.id, limit],
    enabled: !!couple?.id && !PREVIEW,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('upcoming_agenda', {
        p_couple_id: couple!.id,
        p_limit: limit,
      })
      if (error) throw error
      return (data ?? []) as AgendaItem[]
    },
  })

  if (PREVIEW) return { agenda: previewAgenda(), isLoading: false }
  return { agenda: query.data ?? [], isLoading: query.isLoading }
}

export function useEvent(id: string | undefined) {
  return useQuery({
    queryKey: ['event', id],
    enabled: !!id && !PREVIEW,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, event_date, recurrence, remind_days_before, notes, emoji')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as EventRow
    },
  })
}
