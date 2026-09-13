import { useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router'
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

/** Gửi email đặt lại mật khẩu. Màn nhập mật khẩu mới từ link = P1-39 (reset). */
export function ForgotPasswordScreen() {
  const location = useLocation()
  const preset = (location.state as { email?: string } | null)?.email ?? ''
  const [email, setEmail] = useState(preset)
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>(
    'idle',
  )
  const [errorMessage, setErrorMessage] = useState('')

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

    const redirectTo = `${window.location.origin}/login/reset`
    const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo,
    })

    if (error) {
      setStatus('error')
      setErrorMessage(
        error.message.includes('rate') || error.status === 429
          ? 'Gửi quá nhiều lần. Đợi vài phút rồi thử lại.'
          : 'Không gửi được. Kiểm tra email và thử lại.',
      )
      return
    }

    setStatus('sent')
  }

  const busy = status === 'loading'

  return (
    <Screen>
      <TopBar to="/login" />
      <form onSubmit={handleSubmit} className="contents">
        <Stage>
          <Title>Quên mật khẩu</Title>
          <Sub>Tụi mình gửi một đường dẫn để đặt mật khẩu mới.</Sub>

          {status === 'sent' ? (
            <p className="mt-6 rounded-2xl border border-border bg-soft px-4 py-3.5 text-[14px] leading-relaxed text-text">
              Nếu email này có trong hệ thống, bạn sẽ nhận được đường dẫn trong
              vài phút. Không thấy? Kiểm tra hộp thư rác.
            </p>
          ) : (
            <div className="mt-6">
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
            </div>
          )}

          {status === 'error' ? <ErrorText>{errorMessage}</ErrorText> : null}

          <Spacer />

          {status === 'sent' ? (
            <Link to="/login" className={btn.primary}>
              Quay lại đăng nhập
            </Link>
          ) : (
            <>
              <button type="submit" disabled={busy} className={btn.primary}>
                {busy ? 'Đang gửi...' : 'Gửi đường dẫn'}
              </button>
              <Link to="/login" className={`${btn.ghost} mt-2`}>
                Quay lại
              </Link>
            </>
          )}
        </Stage>
      </form>
    </Screen>
  )
}
