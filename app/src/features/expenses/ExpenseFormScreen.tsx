import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useCouple } from '../../hooks/useCouple'
import { useSession } from '../../hooks/useSession'
import { supabase } from '../../lib/supabase'
import { todayYmd } from '../../lib/dateCount'
import {
  EXPENSE_CATEGORIES,
  formatAmountInput,
  parseAmountInput,
} from '../../lib/money'
import { PREVIEW } from '../../dev/preview'
import {
  ErrorText,
  Field,
  Screen,
  Spacer,
  Stage,
  Title,
  TopBar,
} from '../../components/ui'
import { btn, input } from '../../lib/ui-classes'

export function ExpenseFormScreen() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const queryClient = useQueryClient()
  const { couple } = useCouple()
  const { user } = useSession()

  // Vào từ màn soạn bài thì danh mục và bài đã được đoán sẵn
  const postId = params.get('post')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState(params.get('note') ?? '')
  const [category, setCategory] = useState(params.get('category') ?? 'food')
  const [spentOn, setSpentOn] = useState(params.get('date') ?? todayYmd())
  const [paidBy, setPaidBy] = useState(user?.id ?? '')
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const payer = paidBy || user?.id || ''

  async function submit(event: FormEvent) {
    event.preventDefault()
    const minor = parseAmountInput(amount)
    if (minor <= 0) {
      setStatus('error')
      setErrorMessage('Nhập số tiền đã nhé.')
      return
    }
    if (!couple || !user || PREVIEW) return

    setStatus('saving')
    const { error } = await supabase.from('expenses').insert({
      couple_id: couple.id,
      post_id: postId,
      amount_minor: minor,
      category,
      note: note.trim() || null,
      spent_on: spentOn,
      paid_by: payer,
      created_by: user.id,
    })

    if (error) {
      setStatus('error')
      setErrorMessage(error.message)
      return
    }

    await queryClient.invalidateQueries({ queryKey: ['expenses'] })
    await queryClient.invalidateQueries({ queryKey: ['expense_summary'] })
    navigate(postId ? `/timeline/${postId}` : '/expenses', { replace: true })
  }

  return (
    <Screen>
      <TopBar to="/expenses" label="Huỷ" />
      <form onSubmit={submit} className="contents">
        <Stage>
          <Title>Ghi một khoản</Title>

          <div className="mt-6">
            <Field label="Số tiền">
              <div className="relative">
                <input
                  // inputMode numeric: iPhone mở bàn phím số, không phải bàn phím chữ
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => setAmount(formatAmountInput(e.target.value))}
                  placeholder="0"
                  autoFocus
                  className={`${input} h-16 pr-12 text-right text-[28px] font-bold tabular-nums`}
                />
                <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-lg text-muted">
                  đ
                </span>
              </div>
            </Field>
          </div>

          <div className="mt-4 space-y-4">
            <Field label="Danh mục">
              <div className="grid grid-cols-4 gap-2">
                {EXPENSE_CATEGORIES.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setCategory(c.key)}
                    aria-pressed={category === c.key}
                    className={`flex flex-col items-center gap-1 rounded-xl border py-2.5 text-[11.5px] transition ${
                      category === c.key
                        ? 'border-accent bg-soft font-semibold text-accent'
                        : 'border-border text-muted'
                    }`}
                  >
                    <span aria-hidden className="text-lg">
                      {c.emoji}
                    </span>
                    {c.label}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Nội dung">
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ăn lẩu ở Ba Toa"
                maxLength={80}
                className={input}
              />
            </Field>

            <Field label="Ngày">
              <input
                type="date"
                value={spentOn}
                max={todayYmd()}
                onChange={(e) => setSpentOn(e.target.value)}
                className={input}
              />
            </Field>

            <Field
              label="Ai trả"
              hint="Chỉ để thống kê — app không tính ai nợ ai."
            >
              <div className="flex gap-1 rounded-2xl border border-border bg-surface p-1">
                {(couple?.members ?? []).map((m) => (
                  <button
                    key={m.user_id}
                    type="button"
                    onClick={() => setPaidBy(m.user_id)}
                    className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
                      payer === m.user_id
                        ? 'bg-accent text-on-accent'
                        : 'text-muted'
                    }`}
                  >
                    {m.nickname ?? 'Người ấy'}
                  </button>
                ))}
              </div>
            </Field>
          </div>

          {status === 'error' ? <ErrorText>{errorMessage}</ErrorText> : null}

          <Spacer />

          <button
            type="submit"
            disabled={status === 'saving'}
            className={btn.primary}
          >
            {status === 'saving' ? 'Đang lưu...' : 'Lưu khoản chi'}
          </button>
        </Stage>
      </form>
    </Screen>
  )
}
