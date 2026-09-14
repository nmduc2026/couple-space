import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { supabase } from '../../lib/supabase'
import {
  ErrorText,
  Loading,
  Screen,
  Spacer,
  Stage,
  Sub,
  Title,
} from '../../components/ui'
import { PasswordField } from '../../components/PasswordField'
import { btn } from '../../lib/ui-classes'
import { passwordError } from '../../lib/password'

/**
 * Mở từ link email quên mật khẩu (redirectTo `/login/reset`).
 * Supabase gắn phiên recovery vào URL — không đặt route này trong GuestOnly,
 * nếu không sẽ bị đá về Home trước khi kịp đổi mật khẩu.
 */
export function ResetPasswordScreen() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [hasSession, setHasSession] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let alive = true

    void supabase.auth.getSession().then(({ data }) => {
      if (!alive) return
      if (data.session) {
        setHasSession(true)
        setReady(true)
      }
    })

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!alive) return
      // INITIAL_SESSION / SIGNED_IN / PASSWORD_RECOVERY đều có thể mang phiên từ link
      if (session) {
        setHasSession(true)
        setReady(true)
      } else if (event === 'INITIAL_SESSION') {
        setReady(true)
      }
    })

    const timeout = window.setTimeout(() => {
      if (alive) setReady(true)
    }, 2500)

    return () => {
      alive = false
      window.clearTimeout(timeout)
      sub.subscription.unsubscribe()
    }
  }, [])

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
        'Không đặt được mật khẩu. Link có thể đã hết hạn — gửi lại từ Quên mật khẩu.',
      )
      return
    }

    navigate('/', { replace: true })
  }

  if (!ready) return <Loading />

  if (!hasSession) {
    return (
      <Screen>
        <Stage className="justify-center">
          <Title>Link không còn hiệu lực</Title>
          <Sub>Link hết hạn hoặc đã dùng. Gửi lại.</Sub>
          <Spacer />
          <Link to="/login/forgot" className={btn.primary}>
            Gửi lại
          </Link>
          <Link to="/login" className={`${btn.ghost} mt-2`}>
            Về đăng nhập
          </Link>
        </Stage>
      </Screen>
    )
  }

  const busy = status === 'loading'

  return (
    <Screen>
      <Stage>
        <Title>Mật khẩu mới</Title>
        <Sub>Mật khẩu dùng để đăng nhập lần sau.</Sub>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-1 flex-col">
          <div className="space-y-4">
            <PasswordField
              label="Mật khẩu mới"
              value={password}
              onChange={(next) => {
                setPassword(next)
                if (status === 'error') setStatus('idle')
              }}
              disabled={busy}
            />
            <PasswordField
              label="Nhập lại"
              value={confirm}
              onChange={(next) => {
                setConfirm(next)
                if (status === 'error') setStatus('idle')
              }}
              disabled={busy}
            />
          </div>

          {status === 'error' ? <ErrorText>{errorMessage}</ErrorText> : null}

          <Spacer />

          <button type="submit" disabled={busy} className={btn.primary}>
            {busy ? 'Đang lưu...' : 'Lưu mật khẩu'}
          </button>
        </form>
      </Stage>
    </Screen>
  )
}
