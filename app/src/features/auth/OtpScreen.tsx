import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { supabase } from '../../lib/supabase'
import {
  ErrorText,
  Screen,
  Spacer,
  Stage,
  Sub,
  Title,
  TopBar,
} from '../../components/ui'
import { btn } from '../../lib/ui-classes'
import { PREVIEW } from '../../dev/preview'

type OtpLocationState = {
  email?: string
}

const EMPTY = ['', '', '', '', '', '']

export function OtpScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const email =
    (location.state as OtpLocationState | null)?.email ??
    (PREVIEW ? 'duc@example.com' : undefined)

  const [digits, setDigits] = useState(EMPTY)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [cooldown, setCooldown] = useState(60)
  const inputs = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    if (cooldown <= 0) return
    const id = window.setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => window.clearTimeout(id)
  }, [cooldown])

  if (!email) {
    return <Navigate to="/login" replace />
  }

  const emailAddress = email
  const token = digits.join('')

  async function verify(code: string) {
    if (code.length !== 6) return
    setStatus('loading')
    setErrorMessage('')
    const { error } = await supabase.auth.verifyOtp({
      email: emailAddress,
      token: code,
      type: 'email',
    })
    if (error) {
      setStatus('error')
      setErrorMessage(
        error.message.toLowerCase().includes('expired')
          ? 'Mã đã hết hạn. Hãy gửi lại mã mới.'
          : 'Mã không đúng. Kiểm tra lại nhé.',
      )
      return
    }
    const pendingCode = sessionStorage.getItem('pendingInviteCode')
    if (pendingCode) {
      navigate(`/join?code=${pendingCode}`, { replace: true })
    } else {
      sessionStorage.removeItem('pendingInviteCode')
      navigate('/', { replace: true })
    }
  }

  function setDigitAt(index: number, value: string) {
    const clean = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = clean
    setDigits(next)
    if (clean && index < 5) inputs.current[index + 1]?.focus()
    if (next.every((d) => d) && next.join('').length === 6) {
      void verify(next.join(''))
    }
  }

  function onKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
    if (event.key === 'ArrowLeft' && index > 0) inputs.current[index - 1]?.focus()
    if (event.key === 'ArrowRight' && index < 5) inputs.current[index + 1]?.focus()
  }

  function onPaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault()
    const pasted = event.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6)
    if (!pasted) return
    const next = [...EMPTY]
    pasted.split('').forEach((ch, i) => {
      next[i] = ch
    })
    setDigits(next)
    if (pasted.length === 6) void verify(pasted)
    else inputs.current[pasted.length]?.focus()
  }

  async function resend() {
    if (cooldown > 0) return
    setStatus('loading')
    const { error } = await supabase.auth.signInWithOtp({
      email: emailAddress,
      options: { shouldCreateUser: true },
    })
    setStatus(error ? 'error' : 'idle')
    if (error) {
      setErrorMessage('Không gửi lại được. Thử sau ít phút.')
      return
    }
    setCooldown(60)
    setDigits(EMPTY)
    inputs.current[0]?.focus()
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    await verify(token)
  }

  const busy = status === 'loading'

  return (
    <Screen>
      <TopBar to="/login" />
      <form onSubmit={onSubmit} className="contents">
        <Stage>
          <Title>Nhập mã</Title>
          <Sub>
            Đã gửi tới{' '}
            <span className="font-medium text-text">{emailAddress}</span>
          </Sub>

          <div className="mt-8 flex gap-2">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputs.current[index] = el
                }}
                type="text"
                inputMode="numeric"
                aria-label={`Số thứ ${index + 1}`}
                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                maxLength={1}
                value={digit}
                disabled={busy}
                onChange={(e) => setDigitAt(index, e.target.value)}
                onKeyDown={(e) => onKeyDown(index, e)}
                onPaste={onPaste}
                onFocus={(e) => e.target.select()}
                className={`aspect-[3/4] w-full min-w-0 rounded-xl border bg-surface text-center text-[22px] font-bold text-text outline-none transition disabled:opacity-60 ${
                  digit
                    ? 'border-accent text-accent'
                    : 'border-border focus:border-accent focus:ring-4 focus:ring-accent/15'
                }`}
              />
            ))}
          </div>

          {status === 'error' ? <ErrorText>{errorMessage}</ErrorText> : null}

          <p className="mt-5 text-sm text-muted">
            Không thấy email? Kiểm tra hộp thư rác.
          </p>

          <button
            type="button"
            onClick={() => void resend()}
            disabled={cooldown > 0 || busy}
            className="mt-2 self-start text-sm font-medium text-accent disabled:text-muted"
          >
            {cooldown > 0 ? `Gửi lại mã (${cooldown}s)` : 'Gửi lại mã'}
          </button>

          <Spacer />

          <button
            type="submit"
            disabled={token.length !== 6 || busy}
            className={btn.primary}
          >
            {busy ? 'Đang xác nhận...' : 'Xác nhận'}
          </button>
        </Stage>
      </form>
    </Screen>
  )
}
