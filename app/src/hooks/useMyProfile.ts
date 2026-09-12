import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useSession } from './useSession'
import { PREVIEW } from '../dev/preview'

export type MyProfile = {
  id: string
  display_name: string | null
  /** Màu nhấn của RIÊNG người này. null = chưa chọn, dùng màu của space. */
  color_theme: string | null
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
        .select('id, display_name, color_theme')
        .eq('id', user!.id)
        .single()
      if (error) throw error
      return data as MyProfile
    },
  })

  return { profile: query.data ?? null, isLoading: query.isLoading }
}
