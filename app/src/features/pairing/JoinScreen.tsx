import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '../../hooks/useSession'
import { supabase } from '../../lib/supabase'
import {
  ErrorText,
  Field,
  Loading,
  Screen,
  Spacer,
  Stage,
  Sub,
  Title,
  TopBar,
} from '../../components/ui'
import { btn, input } from '../../lib/ui-classes'
import { PREVIEW } from '../../dev/preview'

type Peek = {
  inviter_name: string
  inviter_avatar: string | null
  start_date: string
  couple_id: string
}

function formatVnDate(ymd: string) {
  return new Date(`${ymd}T12:00:00`).toLocaleDateString('vi-VN')
}

export function JoinScreen() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAuthenticated, isLoading } = useSession()
  const codeFromUrl = (params.get('code') ?? '').toUpperCase()

  const [code, setCode] = useState(codeFromUrl)
  const [nickname, setNickname] = useState('')
  const [step, setStep] = useState<'code' | 'confirm' | 'nickname'>(
    codeFromUrl ? 'confirm' : 'code',
  )
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (codeFromUrl) {
      sessionStorage.setItem('pendingInviteCode', codeFromUrl)
    }
  }, [codeFromUrl])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      if (code) sessionStorage.setItem('pendingInviteCode', code)
      navigate('/login', { replace: true })
    }
  }, [isAuthenticated, isLoading, code, navigate])

  // Xem trước lời mời — để Query lo vòng đời, không setState trong effect
  const peekQuery = useQuery({
    queryKey: ['peek_invite', code],
    enabled: step === 'confirm' && !!code && isAuthenticated,
    retry: false,
    staleTime: 30_000,
    queryFn: async () => {
      if (PREVIEW) {
        return {
          inviter_name: 'Đức',
          inviter_avatar: null,
          start_date: '2025-07-27',
          couple_id: 'preview',
        } as Peek
      }
      const { data, error } = await supabase.rpc('peek_invite', { p_code: code })
      if (error) throw new Error(error.message)
      const row = Array.isArray(data) ? data[0] : data
      if (!row) throw new Error('Mã mời không đúng hoặc đã hết hạn.')
      return row as Peek
    },
  })

  const peek = peekQuery.data ?? null

  async function lookup(event: FormEvent) {
    event.preventDefault()
    const next = code.trim().toUpperCase()
    sessionStorage.setItem('pendingInviteCode', next)
    setCode(next)
    setStep('confirm')
  }

  async function redeem(event: FormEvent) {
    event.preventDefault()
    setStatus('loading')
    setErrorMessage('')
    const { error } = await supabase.rpc('redeem_invite', {
      p_code: code,
      p_my_nickname: nickname.trim(),
    })
    if (error) {
      setStatus('error')
      setErrorMessage(error.message)
      return
    }
    sessionStorage.removeItem('pendingInviteCode')

    if (peek?.couple_id) {
      const { data: auth } = await supabase.auth.getUser()
      const myId = auth.user?.id
      const { data: members } = await supabase
        .from('couple_members')
        .select('user_id')
        .eq('couple_id', peek.couple_id)
        .is('left_at', null)
      const others = (members ?? [])
        .map((m) => m.user_id as string)
        .filter((id) => id !== myId)
      for (const userId of others) {
        void supabase.functions.invoke('send-notification', {
          body: {
            user_id: userId,
            title: 'Couple Space',
            body: `${nickname.trim()} đã tham gia không gian của hai bạn`,
            path: '/',
          },
        })
      }
    }

    await queryClient.invalidateQueries({ queryKey: ['couple'] })
    navigate('/', { replace: true })
  }

  if (isLoading || !isAuthenticated) {
    return <Loading />
  }

  if (step === 'code') {
    return (
      <Screen>
        <TopBar to="/setup" />
        <form onSubmit={lookup} className="contents">
          <Stage>
            <Title>Nhập mã mời</Title>
            <Sub>Mã gồm 6 ký tự, người ấy gửi cho bạn.</Sub>
            <input
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              placeholder="A7K2M9"
              aria-label="Mã mời"
              className="mt-8 h-16 w-full rounded-2xl border border-border bg-surface text-center text-[26px] font-bold tracking-[0.3em] text-text uppercase outline-none transition placeholder:text-muted/40 focus:border-accent focus:ring-4 focus:ring-accent/15"
            />
            <Spacer />
            <button
              type="submit"
              disabled={code.trim().length < 6}
              className={btn.primary}
            >
              Tiếp tục
            </button>
          </Stage>
        </form>
      </Screen>
    )
  }

  if (step === 'confirm') {
    return (
      <Screen>
        <TopBar to="/setup" label="Không phải tôi" />
        <Stage className="text-center">
          {peekQuery.isPending ? (
            <p className="mt-16 animate-pulse text-sm text-muted">
              Đang kiểm tra mã...
            </p>
          ) : null}

          {peek ? (
            <>
              <div className="mx-auto mt-10 flex h-24 w-24 items-center justify-center rounded-full bg-soft text-3xl font-bold text-accent">
                {(peek.inviter_name ?? '?').slice(0, 1).toUpperCase()}
              </div>
              <p className="mt-6 text-[15px] text-muted">
                <span className="font-semibold text-text">
                  {peek.inviter_name}
                </span>{' '}
                mời bạn vào không gian của hai người
              </p>
              <p className="mt-2 text-sm text-muted">
                Bên nhau từ {formatVnDate(peek.start_date)}
              </p>

              <Spacer />

              <button
                type="button"
                onClick={() => setStep('nickname')}
                className={btn.primary}
              >
                Tham gia
              </button>
            </>
          ) : null}

          {peekQuery.isError ? (
            <>
              <p className="mt-16 text-4xl" aria-hidden>
                🔍
              </p>
              <ErrorText>{peekQuery.error.message}</ErrorText>
              <Spacer />
              <button
                type="button"
                onClick={() => setStep('code')}
                className={btn.outline}
              >
                Nhập mã khác
              </button>
            </>
          ) : null}
        </Stage>
      </Screen>
    )
  }

  return (
    <Screen>
      <div className="top-safe" />
      <form onSubmit={redeem} className="contents">
        <Stage>
          <Title>Gọi bạn là gì?</Title>
          <Sub>Ngày bắt đầu yêu đã có sẵn — không cần nhập lại.</Sub>
          <div className="mt-7">
            <Field label="Biệt danh của bạn">
              <input
                required
                maxLength={24}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Linh"
                className={input}
              />
            </Field>
          </div>
          {status === 'error' ? <ErrorText>{errorMessage}</ErrorText> : null}
          <Spacer />
          <button
            type="submit"
            disabled={status === 'loading'}
            className={btn.primary}
          >
            {status === 'loading' ? 'Đang tham gia...' : 'Vào Couple Space'}
          </button>
        </Stage>
      </form>
    </Screen>
  )
}
