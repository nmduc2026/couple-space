import type { Session, User } from '@supabase/supabase-js'
import type { Couple } from '../hooks/useCouple'

/** Chế độ xem thử: bật bằng `?preview=1`, chỉ có trong bản dev.
 *  Dùng để chụp màn hình từng màn mà không cần đăng nhập Supabase thật. */
export const PREVIEW =
  import.meta.env.DEV &&
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).has('preview')

/** `?preview=1&solo=1` → space mới có một người, để xem trạng thái đang chờ. */
export const PREVIEW_SOLO =
  PREVIEW && new URLSearchParams(window.location.search).has('solo')

const ME = '11111111-1111-1111-1111-111111111111'
const PARTNER = '22222222-2222-2222-2222-222222222222'

export const previewUser = {
  id: ME,
  email: 'duc@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2026-01-01T00:00:00Z',
} as unknown as User

export const previewSession = {
  access_token: 'preview',
  refresh_token: 'preview',
  expires_in: 3600,
  token_type: 'bearer',
  user: previewUser,
} as unknown as Session

/** Ngày bắt đầu yêu giả lập: lùi lại 412 ngày cho khớp con số ở prototype. */
function startDateDaysAgo(days: number) {
  const d = new Date()
  d.setDate(d.getDate() - (days - 1))
  return d.toISOString().slice(0, 10)
}

export function previewCouple(): Couple {
  return {
    id: '33333333-3333-3333-3333-333333333333',
    start_date: startDateDaysAgo(412),
    cover_url: null,
    theme: 'rose',
    status: 'active',
    invited_name: 'Diên',
    created_by: ME,
    members: PREVIEW_SOLO
      ? [
          {
            user_id: ME,
            nickname: 'Đức',
            joined_at: '2026-01-01T00:00:00Z',
            left_at: null,
          },
        ]
      : [
          {
            user_id: ME,
            nickname: 'Đức',
            joined_at: '2026-01-01T00:00:00Z',
            left_at: null,
          },
          {
            user_id: PARTNER,
            nickname: 'Diên',
            joined_at: '2026-01-02T00:00:00Z',
            left_at: null,
          },
        ],
  }
}
