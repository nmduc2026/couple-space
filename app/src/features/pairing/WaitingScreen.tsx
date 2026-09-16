import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useCouple } from '../../hooks/useCouple'
import { buildInviteShare, shareInvite } from '../../lib/inviteShare'
import { supabase } from '../../lib/supabase'
import { Screen, Spacer, Stage, Sub, Title } from '../../components/ui'
import { btn } from '../../lib/ui-classes'

type WaitingState = { inviteCode?: string }

export function WaitingScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const { couple, refetch } = useCouple()
  const initialCode = (location.state as WaitingState | null)?.inviteCode
  const [copied, setCopied] = useState(false)

  const inviteQuery = useQuery({
    queryKey: ['invite', couple?.id],
    enabled: !!couple?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invites')
        .select('code')
        .eq('couple_id', couple!.id)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data?.code as string | undefined
    },
  })

  const code = initialCode ?? inviteQuery.data
  const partnerName = couple?.invited_name ?? 'người ấy'

  useEffect(() => {
    if (!couple?.id) return
    const channel = supabase
      .channel(`couple-members-${couple.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'couple_members',
          filter: `couple_id=eq.${couple.id}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['couple'] })
          void refetch()
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [couple?.id, queryClient, refetch])

  useEffect(() => {
    if (couple && couple.members.length >= 2) {
      navigate('/', { replace: true })
    }
  }, [couple, navigate])

  async function copyCode() {
    if (!code) return
    await navigator.clipboard.writeText(code)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Screen>
      <div className="top-safe" />
      <Stage>
        <Title>Gửi lời mời cho {partnerName}</Title>
        <Sub>Đang chờ người ấy vào.</Sub>

        <button
          type="button"
          onClick={() => void copyCode()}
          disabled={!code}
          className="mt-8 w-full rounded-xl bg-soft py-6 text-[38px] font-extrabold tracking-[0.16em] text-accent transition active:scale-[0.99] disabled:opacity-60"
        >
          {code ?? '······'}
        </button>
        <p className="mt-2 text-center text-xs text-muted">
          {copied ? 'Đã sao chép mã' : 'Bấm để sao chép · hết hạn sau 7 ngày'}
        </p>

        {code ? (
          <p className="mt-5 rounded-xl border border-dashed border-border bg-surface p-4 text-[13.5px] leading-relaxed text-muted">
            “{buildInviteShare(code).text}”
          </p>
        ) : null}

        <Spacer />

        <button
          type="button"
          onClick={() => {
            if (!code) return
            void shareInvite(code)
              .then(() => {
                toast.success('Đã copy link mời.')
              })
              .catch(() => {
                toast.error('Không copy được. Thử lại.')
              })
          }}
          disabled={!code}
          className={btn.primary}
        >
          Copy link mời
        </button>
        <Link to="/" className={`${btn.ghost} mt-1`}>
          Vào Trang chủ
        </Link>
      </Stage>
    </Screen>
  )
}
