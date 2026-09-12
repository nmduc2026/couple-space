import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useCouple } from './useCouple'
import { PREVIEW } from '../dev/preview'

export type Album = {
  id: string
  title: string
  source: 'auto_trip' | 'auto_activity' | 'manual'
  cover_post_id: string | null
  album_posts: { post_id: string; position: number }[]
}

export function useAlbums() {
  const { couple } = useCouple()
  const query = useQuery({
    queryKey: ['albums', couple?.id],
    enabled: !!couple?.id && !PREVIEW,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('albums')
        .select('id, title, source, cover_post_id, album_posts(post_id, position)')
        .eq('couple_id', couple!.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as unknown as Album[]
    },
  })

  return { albums: query.data ?? [], isLoading: query.isLoading }
}

/** Lưu một album gợi ý thành album thật.
 *
 *  Chỉ ghi liên kết bài, không đụng tới ảnh — album là cách xem, nên xoá
 *  album về sau không làm mất kỉ niệm nào. */
export async function saveAlbum(
  coupleId: string,
  userId: string,
  title: string,
  source: Album['source'],
  postIds: string[],
) {
  const { data, error } = await supabase
    .from('albums')
    .insert({ couple_id: coupleId, title, source, created_by: userId })
    .select('id')
    .single()
  if (error || !data) throw error ?? new Error('Không tạo được album')

  if (postIds.length > 0) {
    const { error: linkErr } = await supabase.from('album_posts').insert(
      postIds.map((post_id, position) => ({
        album_id: data.id,
        couple_id: coupleId,
        post_id,
        position,
      })),
    )
    if (linkErr) throw linkErr
  }

  return data.id as string
}
