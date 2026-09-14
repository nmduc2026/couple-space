import { supabase } from './supabase'
import type { Couple } from '../hooks/useCouple'

type Payload = {
  title: string
  body: string
  path?: string
}

/** Gửi push cho (những) người còn lại trong space.
 *
 *  Cố ý không `await`: push là gia vị, không phải điều kiện sống — thất bại
 *  ở đây không được phép chặn thao tác chính. Xem AGENTS.md mục 6.5.
 */
export async function notifyPartner(
  couple: Couple | null,
  myUserId: string,
  payload: Payload,
) {
  if (!couple) return
  const others = couple.members
    .filter((m) => m.user_id !== myUserId && m.left_at == null)
    .map((m) => m.user_id)

  await Promise.allSettled(
    others.map((userId) =>
      supabase.functions.invoke('send-notification', {
        body: { user_id: userId, ...payload },
      }),
    ),
  )
}
