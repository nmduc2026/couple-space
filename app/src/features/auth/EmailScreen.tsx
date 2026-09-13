import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import {
  ErrorText,
  Field,
  Screen,
  Spacer,
  Stage,
  Sub,
  Title,
  TopBar,
} from '../../components/ui'
import { btn, input } from '../../lib/ui-classes'
import { IconEye, IconEyeOff } from '../../components/icons'

type Mode = 'otp' | 'password'

/** Hai cách đăng nhập luôn hiện (OTP mặc định + mật khẩu nếu đã đặt).
 *  Đặc tả: docs/features/p1-auth.md · task P1-37. */
export function EmailScreen() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<Mode>('otp')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function goHomeAfterLogin() {
    sessionStorage.removeItem('pendingInviteCode')
    await queryClient.invalidateQueries({ queryKey: ['couple'] })
    navigate('/', { replace: true })
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = email.trim()

    if (!trimmed) {
      setStatus('error')
      setErrorMessage('Nhập email.')
      return
    }

    setStatus('loading')
    setErrorMessage('')

    if (mode === 'password') {
      if (!password) {
        setStatus('error')
        setErrorMessage('Nhập mật khẩu.')
        return
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: trimmed,
        password,
      })

      if (error) {
        setStatus('error')
        setErrorMessage('Email hoặc mật khẩu chưa đúng.')
        return
      }

      await goHomeAfterLogin()
      return
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { shouldCreateUser: true },
    })

    if (error) {
      setStatus('error')
      setErrorMessage(
        error.message.includes('rate') || error.status === 429
          ? 'Gửi quá nhiều lần. Đợi vài phút rồi thử lại.'
          : 'Không gửi được mã. Kiểm tra email và thử lại.',
      )
      return
    }

    navigate('/login/otp', { state: { email: trimmed } })
  }

  const busy = status === 'loading'

  return (
    <Screen>
      <TopBar to="/welcome" />
      <form onSubmit={handleSubmit} className="contents">
        <Stage>
          <Title>Email của bạn</Title>
          <Sub>
            {mode === 'password'
              ? 'Nhập mật khẩu để tiếp tục.'
              : 'Hoặc đăng nhập bằng mã OTP.'}
          </Sub>

          <div className="mt-6 flex gap-1 rounded-xl border border-border bg-surface p-1">
            {(
              [
                ['otp', 'Mã OTP'],
                ['password', 'Mật khẩu'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setMode(value)
                  setStatus('idle')
                  if (value === 'otp') setShowPassword(false)
                }}
                className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
                  mode === value
                    ? 'bg-accent text-on-accent'
                    : 'text-muted hover:text-text'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            <Field label="Email">
              <input
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (status === 'error') setStatus('idle')
                }}
                disabled={busy}
                placeholder="email@example.com"
                className={input}
              />
            </Field>

            {mode === 'password' ? (
              <div>
                <Field label="Mật khẩu">
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        if (status === 'error') setStatus('idle')
                      }}
                      disabled={busy}
                      className={`${input} pr-12`}
                      placeholder="******"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      disabled={busy}
                      aria-label={
                        showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'
                      }
                      className="absolute top-1/2 right-2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl text-muted transition hover:text-text active:scale-95 disabled:opacity-50"
                    >
                      {showPassword ? (
                        <IconEyeOff size={20} />
                      ) : (
                        <IconEye size={20} />
                      )}
                    </button>
                  </div>
                </Field>
                <Link
                  to="/login/forgot"
                  state={{ email: email.trim() }}
                  className="mt-2.5 block text-right text-[13px] font-medium text-accent"
                >
                  Quên mật khẩu?
                </Link>
              </div>
            ) : null}
          </div>

          {status === 'error' ? <ErrorText>{errorMessage}</ErrorText> : null}

          <Spacer />

          <button type="submit" disabled={busy} className={btn.primary}>
            {busy
              ? 'Đang xử lý...'
              : mode === 'password'
                ? 'Đăng nhập'
                : 'Tiếp tục'}
          </button>
        </Stage>
      </form>
    </Screen>
  )
}
