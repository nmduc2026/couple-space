import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
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
import { passwordError } from '../../lib/password'

/** Đặt hoặc đổi mật khẩu khi đã đăng nhập — P1-38. */
export function SetPasswordScreen() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const problem = passwordError(password, confirm)
    if (problem) {
      setStatus('error')
      setErrorMessage(problem)
      return
    }

    setStatus('loading')
    setErrorMessage('')

    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setStatus('error')
      setErrorMessage(
        error.message.includes('same')
          ? 'Mật khẩu mới trùng mật khẩu cũ. Chọn mật khẩu khác nhé.'
          : 'Không lưu được mật khẩu. Thử lại sau.',
      )
      return
    }

    navigate('/settings', { replace: true, state: { toast: 'Đã lưu mật khẩu.' } })
  }

  const busy = status === 'loading'

  return (
    <Screen>
      <TopBar to="/settings" />
      <form onSubmit={handleSubmit} className="contents">
        <Stage>
          <Title>Đặt mật khẩu</Title>
          <Sub>
            Đặt mật khẩu để đăng nhập vào lần sau.
          </Sub>

          <div className="mt-6 space-y-4">
            <Field label="Mật khẩu mới">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
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
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
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
            <Field label="Nhập lại">
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => {
                    setConfirm(e.target.value)
                    if (status === 'error') setStatus('idle')
                  }}
                  disabled={busy}
                  className={`${input} pr-12`}
                  placeholder="******"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  disabled={busy}
                  aria-label={showConfirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  className="absolute top-1/2 right-2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl text-muted transition hover:text-text active:scale-95 disabled:opacity-50"
                >
                  {showConfirm ? (
                    <IconEyeOff size={20} />
                  ) : (
                    <IconEye size={20} />
                  )}
                </button>
              </div>
            </Field>
          </div>

          {status === 'error' ? <ErrorText>{errorMessage}</ErrorText> : null}

          <Spacer />

          <button type="submit" disabled={busy} className={btn.primary}>
            {busy ? 'Đang lưu...' : 'Lưu'}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => navigate('/settings')}
            className={`${btn.ghost} mt-2`}
          >
            Huỷ
          </button>
        </Stage>
      </form>
    </Screen>
  )
}
