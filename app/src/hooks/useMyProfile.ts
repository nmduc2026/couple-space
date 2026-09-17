import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { MEDIA_BUCKET } from './usePosts'
import { useSession } from './useSession'
import { PREVIEW } from '../dev/preview'

export type MyProfile = {
  id: string
  display_name: string | null
  /** URL xem được (đã ký nếu DB lưu path). */
  avatar_url: string | null
  /** Path trong Storage — dùng khi upload/xoá. */
  avatar_path: string | null
  /** Màu nhấn của RIÊNG người này. null = chưa chọn, dùng màu của space. */
  color_theme: string | null
}

function looksLikeHttp(value: string) {
  return /^https?:\/\//i.test(value)
}

async function resolveAvatarUrl(
  raw: string | null,
): Promise<{ url: string | null; path: string | null }> {
  if (!raw) return { url: null, path: null }
  if (looksLikeHttp(raw)) return { url: raw, path: null }
  const { data } = await supabase.storage
    .from(MEDIA_BUCKET)
    .createSignedUrl(raw, 60 * 60 * 12)
  return { url: data?.signedUrl ?? null, path: raw }
}

/**
 * Hồ sơ của chính mình.
 *
 * Màu nhấn nằm ở đây chứ không phải localStorage vì yêu cầu là theo NGƯỜI
 * DÙNG chứ không theo máy: đổi màu trên điện thoại thì mở trên máy tính phải
 * thấy y như vậy. Sáng/tối thì ngược lại — vẫn là lựa chọn theo máy, để trong
 * Zustand.
 */
export function useMyProfile() {
  const { user } = useSession()

  const query = useQuery({
    queryKey: ['my_profile', user?.id],
    enabled: !!user && !PREVIEW,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, color_theme')
        .eq('id', user!.id)
        .single()
      if (error) throw error
      const avatar = await resolveAvatarUrl(data.avatar_url)
      return {
        id: data.id,
        display_name: data.display_name,
        avatar_url: avatar.url,
        avatar_path: avatar.path,
        color_theme: data.color_theme,
      } as MyProfile
    },
  })

  return { profile: query.data ?? null, isLoading: query.isLoading }
}
