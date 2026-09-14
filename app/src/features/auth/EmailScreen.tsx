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
import { PasswordField } from '../../components/PasswordField'
import { SegmentedControl } from '../../components/SegmentedControl'
import { btn, input } from '../../lib/ui-classes'

type Mode = 'otp' | 'password'

/** Hai cách đăng nhập luôn hiện (OTP mặc định + mật khẩu nếu đã đặt).
 *  Đặc tả: docs/features/p1-auth.md · task P1-37. */
export function EmailScreen() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<Mode>('otp')
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

          <SegmentedControl
            options={[
              { value: 'otp', label: 'Mã OTP' },
              { value: 'password', label: 'Mật khẩu' },
            ]}
            value={mode}
            onChange={(next) => {
              setMode(next)
              setStatus('idle')
            }}
            className="mt-6"
          />

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
                <PasswordField
                  label="Mật khẩu"
                  value={password}
                  onChange={(next) => {
                    setPassword(next)
                    if (status === 'error') setStatus('idle')
                  }}
                  autoComplete="current-password"
                  disabled={busy}
                  placeholder="******"
                />
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
