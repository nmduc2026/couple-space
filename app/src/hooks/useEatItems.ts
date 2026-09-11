import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useCouple } from './useCouple'
import { PREVIEW, previewEatItems } from '../dev/preview'

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
