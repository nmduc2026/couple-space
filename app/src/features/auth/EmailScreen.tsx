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

type FieldErrors = {
  email?: string
  password?: string
}

/** Hai cách đăng nhập luôn hiện (OTP mặc định + mật khẩu nếu đã đặt).
 *  Đặc tả: docs/features/p1-auth.md · task P1-37. */
export function EmailScreen() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<Mode>('otp')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')

  async function goHomeAfterLogin() {
    sessionStorage.removeItem('pendingInviteCode')
    await queryClient.invalidateQueries({ queryKey: ['couple'] })
    navigate('/', { replace: true })
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = email.trim()
    const next: FieldErrors = {}

    if (!trimmed) next.email = 'Nhập email.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      next.email = 'Email chưa đúng định dạng.'
    }

    if (mode === 'password' && !password) next.password = 'Nhập mật khẩu.'

    if (next.email || next.password) {
      setFieldErrors(next)
      setFormError('')
      setStatus('error')
      return
    }

    setStatus('loading')
    setFieldErrors({})
    setFormError('')

    if (mode === 'password') {
      const { error } = await supabase.auth.signInWithPassword({
        email: trimmed,
        password,
      })

      if (error) {
        setStatus('error')
        setFormError('Email hoặc mật khẩu chưa đúng.')
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
      setFormError(
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
      <form onSubmit={handleSubmit} noValidate className="contents">
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
              setFieldErrors({})
              setFormError('')
            }}
            className="mt-6"
          />

          <div className="mt-6 space-y-4">
            <div>
              <Field label="Email">
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (fieldErrors.email) {
                      setFieldErrors((prev) => ({ ...prev, email: undefined }))
                    }
                    if (formError) {
                      setFormError('')
                      setStatus('idle')
                    }
                  }}
                  disabled={busy}
                  placeholder="email@example.com"
                  aria-invalid={!!fieldErrors.email}
                  className={input}
                />
              </Field>
              {fieldErrors.email ? (
                <ErrorText>{fieldErrors.email}</ErrorText>
              ) : null}
            </div>

            {mode === 'password' ? (
              <div>
                <PasswordField
                  label="Mật khẩu"
                  value={password}
                  onChange={(next) => {
                    setPassword(next)
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        password: undefined,
                      }))
                    }
                    if (formError) {
                      setFormError('')
                      setStatus('idle')
                    }
                  }}
                  autoComplete="current-password"
                  disabled={busy}
                  placeholder="******"
                />
                {fieldErrors.password ? (
                  <ErrorText>{fieldErrors.password}</ErrorText>
                ) : null}
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

          {formError ? <ErrorText>{formError}</ErrorText> : null}

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
