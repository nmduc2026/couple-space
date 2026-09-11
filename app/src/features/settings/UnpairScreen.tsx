import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useCouple } from '../../hooks/useCouple'
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

const CONFIRM_PHRASE = 'HUỶ GHÉP'

/** Chấp nhận cả khi gõ không dấu — bàn phím iOS không phải lúc nào cũng sẵn. */
const COMBINING_MARKS = new RegExp('[\\u0300-\\u036f]', 'g')

function matchesConfirm(value: string) {
  const normalized = value
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .replace(/Đ/g, 'D')
  return normalized === 'HUY GHEP'
}

const CONSEQUENCES = [
  'Không gian chuyển sang chỉ đọc, không ai đăng thêm được',
  'Cả hai vẫn xem và tải được toàn bộ kỉ niệm',
  'Không có gì bị xoá ngay',
  'Muốn xoá vĩnh viễn thì cần cả hai cùng xác nhận',
]

export function UnpairScreen() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { couple } = useCouple()
  const [phrase, setPhrase] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const pending = (couple?.members.length ?? 0) < 2

  async function confirmUnpair() {
    if (!couple || !matchesConfirm(phrase)) return
    setStatus('loading')
    const { error } = await supabase.rpc('unpair', { p_couple_id: couple.id })
    if (error) {
      setStatus('error')
      setErrorMessage(error.message)
      return
    }
    await queryClient.invalidateQueries({ queryKey: ['couple'] })
    navigate('/setup', { replace: true })
  }

  return (
    <Screen>
      <TopBar to="/settings" />
      <Stage>
        <Title>Trước khi huỷ ghép đôi</Title>
        <Sub>Tụi mình nói thẳng chuyện sẽ xảy ra.</Sub>

        {pending ? (
          <p className="mt-6 rounded-2xl bg-soft p-4 text-[14px] leading-relaxed text-muted">
            Không gian này chưa có người thứ hai — huỷ là xoá thẳng, không có gì
            để giữ lại.
          </p>
        ) : (
          <ul className="mt-6 space-y-2.5 rounded-2xl bg-soft p-4 text-[14px] leading-relaxed text-muted">
            {CONSEQUENCES.map((line) => (
              <li key={line} className="flex gap-2.5">
                <span aria-hidden className="text-accent">
                  ·
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Nút tải dữ liệu đặt TRƯỚC ô xác nhận — nhiều người bấm huỷ lúc xúc động */}
        <button type="button" disabled className={`${btn.outline} mt-4`}>
          ⬇ Tải toàn bộ dữ liệu về máy (Phase 6)
        </button>

        <Spacer />

        <Field label={`Gõ “${CONFIRM_PHRASE}” để xác nhận`}>
          <input
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            className={input}
          />
        </Field>

        {status === 'error' ? <ErrorText>{errorMessage}</ErrorText> : null}

        <button
          type="button"
          onClick={() => void confirmUnpair()}
          disabled={!matchesConfirm(phrase) || status === 'loading'}
          className={`${btn.danger} mt-4`}
        >
          {status === 'loading' ? 'Đang huỷ...' : 'Huỷ ghép đôi'}
        </button>
      </Stage>
    </Screen>
  )
}
