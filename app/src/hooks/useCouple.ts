import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { MEDIA_BUCKET } from './usePosts'
import { useSession } from './useSession'
import { PREVIEW, previewCouple } from '../dev/preview'

export type CoupleMember = {
  user_id: string
  nickname: string | null
  joined_at: string
  left_at: string | null
}

export type Couple = {
  id: string
  start_date: string
  /** Link xem được, KÝ LÚC ĐỌC. Không bao giờ lưu link đã ký xuống DB — nó
   *  hết hạn rồi thì không có gì ký lại. */
  cover_url: string | null
  theme: string
  status: 'pending' | 'active' | 'archived'
  invited_name: string | null
  created_by: string
  members: CoupleMember[]
}

async function fetchMyCouple(userId: string): Promise<Couple | null> {
  const { data: membership, error: memErr } = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', userId)
    .is('left_at', null)
    .maybeSingle()

  if (memErr) throw memErr
  if (!membership) return null

  const { data: couple, error: coupleErr } = await supabase
    .from('couples')
    .select(
      'id, start_date, cover_url, cover_path, theme, status, invited_name, created_by, couple_members(user_id, nickname, joined_at, left_at)',
    )
    .eq('id', membership.couple_id)
    .single()

  if (coupleErr) throw coupleErr

  const members = (couple.couple_members as CoupleMember[]).filter(
    (m) => m.left_at == null,
  )

  // Ký lúc đọc. Ảnh bìa nằm ngay đầu Home nên hạn dài hơn ảnh timeline —
  // nhưng vẫn là ký lại mỗi lần tải, không phải link cất trong DB.
  let coverUrl: string | null = couple.cover_url
  if (couple.cover_path) {
    const { data: signed } = await supabase.storage
      .from(MEDIA_BUCKET)
      .createSignedUrl(couple.cover_path as string, 60 * 60 * 12)
    coverUrl = signed?.signedUrl ?? null
  }

  return {
    id: couple.id,
    start_date: couple.start_date,
    cover_url: coverUrl,
    theme: couple.theme,
    status: couple.status,
    invited_name: couple.invited_name,
    created_by: couple.created_by,
    members,
  }
}

export function useCouple() {
  const { user, isLoading: sessionLoading } = useSession()

  const query = useQuery({
    queryKey: ['couple', user?.id],
    enabled: !!user,
    queryFn: () => fetchMyCouple(user!.id),
  })

  if (PREVIEW) {
    return {
      couple: previewCouple(),
      isLoading: false,
      isFetching: false,
      refetch: query.refetch,
      error: null,
    }
  }

  return {
    couple: query.data ?? null,
    isLoading: sessionLoading || (!!user && query.isLoading),
    isFetching: query.isFetching,
    refetch: query.refetch,
    error: query.error,
  }
}
