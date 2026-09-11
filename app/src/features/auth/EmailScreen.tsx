import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
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

type Mode = 'otp' | 'password'

/** Đăng nhập mật khẩu chỉ là lối tắt lúc dev (user tạo tay trên Supabase).
 *  Bản build thật chỉ có OTP — đúng đặc tả P1-12. */
const DEV_PASSWORD_LOGIN = import.meta.env.DEV

export function EmailScreen() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<Mode>(DEV_PASSWORD_LOGIN ? 'password' : 'otp')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
      setErrorMessage('Nhập email trước nhé.')
      return
    }

    setStatus('loading')
    setErrorMessage('')

    if (mode === 'password') {
      if (!password) {
        setStatus('error')
        setErrorMessage('Nhập mật khẩu đã đặt lúc tạo user trên Supabase.')
        return
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: trimmed,
        password,
      })

      if (error) {
        setStatus('error')
        setErrorMessage(
          'Đăng nhập thất bại. Kiểm tra email/mật khẩu, hoặc dùng tab OTP.',
        )
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
            Tụi mình gửi một mã 6 số để xác nhận. Không cần mật khẩu, không cần
            nhớ gì thêm.
          </Sub>

          {DEV_PASSWORD_LOGIN ? (
            <div className="mt-6 flex gap-1 rounded-2xl border border-border bg-surface p-1">
              {(
                [
                  ['password', 'Mật khẩu'],
                  ['otp', 'Mã OTP'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setMode(value)
                    setStatus('idle')
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
          ) : null}

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
                placeholder="ten@email.com"
                className={input}
              />
            </Field>

            {mode === 'password' ? (
              <Field label="Mật khẩu">
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (status === 'error') setStatus('idle')
                  }}
                  disabled={busy}
                  className={input}
                />
              </Field>
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
