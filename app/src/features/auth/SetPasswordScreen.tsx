import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
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
import { PasswordField } from '../../components/PasswordField'
import { btn } from '../../lib/ui-classes'
import { passwordError } from '../../lib/password'

/** Đặt hoặc đổi mật khẩu khi đã đăng nhập — P1-38. */
export function SetPasswordScreen() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
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
          ? 'Mật khẩu mới trùng mật khẩu cũ.'
          : 'Không lưu được mật khẩu. Thử lại sau.',
      )
      return
    }

    toast.success('Đã lưu mật khẩu.')
    navigate('/settings', { replace: true })
  }

  const busy = status === 'loading'

  return (
    <Screen>
      <TopBar to="/settings" />
      <form onSubmit={handleSubmit} className="contents">
        <Stage>
          <Title>Đặt mật khẩu</Title>
          <Sub>Mật khẩu dùng để đăng nhập lần sau.</Sub>

          <div className="mt-6 space-y-4">
            <PasswordField
              label="Mật khẩu mới"
              value={password}
              onChange={(next) => {
                setPassword(next)
                if (status === 'error') setStatus('idle')
              }}
              disabled={busy}
              placeholder="******"
            />
            <PasswordField
              label="Nhập lại"
              value={confirm}
              onChange={(next) => {
                setConfirm(next)
                if (status === 'error') setStatus('idle')
              }}
              disabled={busy}
              placeholder="******"
            />
          </div>

          {status === 'error' ? <ErrorText>{errorMessage}</ErrorText> : null}

          <Spacer />

          <button type="submit" disabled={busy} className={btn.primary}>
            {busy ? 'Đang lưu...' : 'Lưu mật khẩu'}
          </button>
        </Stage>
      </form>
    </Screen>
  )
}
