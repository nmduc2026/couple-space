import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { todayYmd } from '../../lib/dateCount'
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

export function SetupScreen() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [startDate, setStartDate] = useState('')
  const [myNickname, setMyNickname] = useState('')
  const [partnerNickname, setPartnerNickname] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setStatus('loading')
    setErrorMessage('')

    const { data, error } = await supabase.rpc('create_couple', {
      p_start_date: startDate,
      p_my_nickname: myNickname.trim(),
      p_partner_nickname: partnerNickname.trim(),
      p_theme: 'rose',
    })

    if (error) {
      setStatus('error')
      setErrorMessage(error.message)
      return
    }

    await queryClient.invalidateQueries({ queryKey: ['couple'] })
    const row = Array.isArray(data) ? data[0] : data
    navigate('/waiting', { state: { inviteCode: row?.invite_code } })
  }

  return (
    <Screen>
      <TopBar to="/setup" />
      <form onSubmit={onSubmit} className="contents">
        <Stage>
          <Title>Kể tụi mình nghe</Title>
          <Sub>Mấy thông tin này dùng khắp app, sửa lại lúc nào cũng được.</Sub>

          <div className="mt-7 space-y-4">
            <Field label="Ngày bắt đầu yêu" hint="Ngày này được tính là ngày thứ 1.">
              <input
                type="date"
                required
                max={todayYmd()}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={input}
              />
            </Field>

            <Field label="Gọi bạn là">
              <input
                required
                maxLength={24}
                value={myNickname}
                onChange={(e) => setMyNickname(e.target.value)}
                placeholder="Minh"
                className={input}
              />
            </Field>

            <Field label="Gọi người ấy là">
              <input
                required
                maxLength={24}
                value={partnerNickname}
                onChange={(e) => setPartnerNickname(e.target.value)}
                placeholder="Linh"
                className={input}
              />
            </Field>

            <Field label="Ảnh đại diện">
              <div className="flex h-12 items-center rounded-2xl border border-dashed border-border px-4 text-[15px] text-muted">
                Thêm sau — ảnh mở ở Phase 2
              </div>
            </Field>
          </div>

          {status === 'error' ? <ErrorText>{errorMessage}</ErrorText> : null}

          <Spacer />

          <button
            type="submit"
            disabled={status === 'loading'}
            className={btn.primary}
          >
            {status === 'loading' ? 'Đang tạo...' : 'Tạo không gian'}
          </button>
        </Stage>
      </form>
    </Screen>
  )
}
