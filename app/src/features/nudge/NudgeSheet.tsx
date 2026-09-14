import { useState } from 'react'
import { BottomSheet } from '../../components/BottomSheet'
import { useCouple } from '../../hooks/useCouple'
import { useSession } from '../../hooks/useSession'
import { supabase } from '../../lib/supabase'
import { notifyPartner } from '../../lib/notify'
import { PREVIEW } from '../../dev/preview'

const NUDGES = [
  { kind: 'miss', emoji: '🥺', label: 'Nhớ em', body: 'đang nhớ bạn đó' },
  { kind: 'home', emoji: '🏠', label: 'Về chưa?', body: 'hỏi bạn về chưa' },
  { kind: 'eat', emoji: '🍜', label: 'Đi ăn không?', body: 'rủ bạn đi ăn' },
  { kind: 'love', emoji: '❤️', label: 'Thương', body: 'gửi bạn một cái ôm' },
] as const

/** Bảng trượt từ dưới lên. Nudge KHÔNG theo giờ yên lặng — nó là việc
 *  chủ động của người gửi, không phải thông báo tự động. Bù lại thì
 *  cảnh báo trước khi gửi vào khung 23:00–06:00. */
export function NudgeSheet({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { couple } = useCouple()
  const { user } = useSession()
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>(
    'idle',
  )
  const [message, setMessage] = useState('')

  if (!open) return null

  const hour = new Date().getHours()
  const lateNight = hour >= 23 || hour < 6
  const partner = couple?.members.find((m) => m.user_id !== user?.id)
  const myName =
    couple?.members.find((m) => m.user_id === user?.id)?.nickname ?? 'Người ấy'

  async function send(kind: (typeof NUDGES)[number]) {
    if (!couple || !user || !partner) return
    if (lateNight && !window.confirm('Giờ này người ấy có thể đang ngủ. Vẫn gửi?')) {
      return
    }
    if (PREVIEW) {
      setStatus('sent')
      return
    }

    setStatus('sending')
    const { error } = await supabase.from('nudges').insert({
      couple_id: couple.id,
      from_user: user.id,
      to_user: partner.user_id,
      kind: kind.kind,
    })

    if (error) {
      // Policy chặn khi vượt 5 lần/ngày hoặc chưa qua 10 phút
      setStatus('error')
      setMessage(
        'Gửi hơi dày rồi — đợi vài phút, hoặc để mai.',
      )
      return
    }

    // Mất mạng thì thử lại một lần rồi thôi. Không xếp hàng đợi:
    // một cái chạm gửi muộn ba tiếng thì không còn là cái chạm nữa.
    try {
      await notifyPartner(couple, user.id, {
        title: 'Couple Space',
        body: `${myName} ${kind.body} ${kind.emoji}`,
        path: kind.kind === 'eat' ? '/eat/spin' : '/mood',
      })
    } catch {
      await notifyPartner(couple, user.id, {
        title: 'Couple Space',
        body: `${myName} ${kind.body} ${kind.emoji}`,
        path: kind.kind === 'eat' ? '/eat/spin' : '/mood',
      }).catch(() => undefined)
    }

    setStatus('sent')
    window.setTimeout(onClose, 1200)
  }

  return (
    <BottomSheet
      onClose={onClose}
      ariaLabel="Gửi một cái chạm"
      zClass="z-40"
    >
      <span
        aria-hidden
        className="mx-auto mb-4 block h-1 w-10 rounded-full bg-border"
      />
      <h2 className="text-center text-[17px] font-bold text-text">
        Gửi một cái chạm
      </h2>

      {status === 'sent' ? (
        <p className="py-10 text-center text-[15px] text-accent">Đã gửi</p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {NUDGES.map((n) => (
              <button
                key={n.kind}
                type="button"
                disabled={status === 'sending'}
                onClick={() => void send(n)}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-border py-5 text-[14px] font-semibold text-text transition active:scale-95 disabled:opacity-50"
              >
                <span aria-hidden className="text-3xl">
                  {n.emoji}
                </span>
                {n.label}
              </button>
            ))}
          </div>

          {lateNight ? (
            <p className="mt-3 text-center text-[12.5px] text-muted">
              Giờ này người ấy có thể đang ngủ.
            </p>
          ) : null}
          {status === 'error' ? (
            <p className="mt-3 text-center text-[13px] text-accent" role="alert">
              {message}
            </p>
          ) : null}
        </>
      )}

      <button
        type="button"
        onClick={onClose}
        className="mt-4 mb-2 w-full py-3 text-[14px] font-medium text-muted"
      >
        Đóng
      </button>
    </BottomSheet>
  )
}
