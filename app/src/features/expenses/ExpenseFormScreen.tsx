import { useState, type FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useCouple } from '../../hooks/useCouple'
import { useSession } from '../../hooks/useSession'
import { useExpense } from '../../hooks/useExpenses'
import { supabase } from '../../lib/supabase'
import { enqueue, isRetriable } from '../../lib/syncQueue'
import { todayYmd } from '../../lib/dateCount'
import {
  EXPENSE_CATEGORIES,
  formatAmountInput,
  parseAmountInput,
} from '../../lib/money'
import { AmountInput } from '../../components/AmountInput'
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
import { DateField } from '../../components/DateField'
import { SegmentedControl } from '../../components/SegmentedControl'

export function ExpenseFormScreen() {
  const { id } = useParams()
  const editing = !!id
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const queryClient = useQueryClient()
  const { couple } = useCouple()
  const { user } = useSession()
  const existing = useExpense(id)

  const row = existing.data
  // Vào từ màn soạn bài thì danh mục và bài đã được đoán sẵn
  const postId = row?.post_id ?? params.get('post')
  const [draft, setDraft] = useState<{
    amount: string
    note: string
    category: string
    spentOn: string
    paidBy: string
  } | null>(null)

  // Chưa sửa gì thì hiện thẳng dữ liệu đã lưu — không cần effect đồng bộ
  const value = draft ?? {
    amount: row ? formatAmountInput(String(row.amount_minor)) : '',
    note: row?.note ?? params.get('note') ?? '',
    category: row?.category ?? params.get('category') ?? 'food',
    spentOn: row?.spent_on ?? params.get('date') ?? todayYmd(),
    paidBy:
      row == null
        ? (user?.id ?? '')
        : row.paid_by == null
          ? 'shared'
          : row.paid_by,
  }
  const patch = (next: Partial<typeof value>) => setDraft({ ...value, ...next })

  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const payerKey = value.paidBy || user?.id || ''
  const paidByDb = payerKey === 'shared' ? null : payerKey
  const backTo = editing ? '/expenses' : postId ? `/timeline/${postId}` : '/expenses'

  /** Cất khoản chi vào hàng đợi rồi rời màn hình như đã lưu xong. */
  async function queueIt(minor: number) {
    if (!couple || !user) return
    await enqueue({
      kind: 'expense',
      coupleId: couple.id,
      amountMinor: minor,
      category: value.category,
      note: value.note.trim() || null,
      spentOn: value.spentOn,
      paidBy: paidByDb,
      createdBy: user.id,
    })
    navigate(backTo, { replace: true })
  }

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ['expenses'] })
    await queryClient.invalidateQueries({ queryKey: ['expense_summary'] })
    await queryClient.invalidateQueries({ queryKey: ['expense', id] })
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    const minor = parseAmountInput(value.amount)
    if (minor <= 0) {
      setStatus('error')
      setErrorMessage('Nhập số tiền.')
      return
    }
    if (!couple || !user || PREVIEW) return

    setStatus('saving')
    setErrorMessage('')

    const payload = {
      couple_id: couple.id,
      post_id: postId,
      amount_minor: minor,
      category: value.category,
      note: value.note.trim() || null,
      spent_on: value.spentOn,
      paid_by: paidByDb,
      created_by: user.id,
    }

    // Chỉ khoản chi MỚI mới xếp hàng được. Sửa thì không: bản ghi có thể đã
    // bị người kia sửa hoặc xoá trong lúc mình mất mạng, gửi bù sẽ ghi đè mù.
    if (!editing && !navigator.onLine) {
      await queueIt(minor)
      return
    }

    const { error } = editing
      ? await supabase.from('expenses').update(payload).eq('id', id!)
      : await supabase.from('expenses').insert(payload)

    if (error) {
      if (!editing && isRetriable(error)) {
        await queueIt(minor)
        return
      }
      setStatus('error')
      setErrorMessage(error.message)
      return
    }

    await refresh()
    navigate(backTo, { replace: true })
  }

  async function remove() {
    if (!id || PREVIEW) return
    if (!window.confirm('Xoá khoản chi này?')) return
    const { error } = await supabase
      .from('expenses')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
    if (error) {
      setStatus('error')
      setErrorMessage(error.message)
      return
    }
    await refresh()
    navigate('/expenses', { replace: true })
  }

  return (
    <Screen>
      <TopBar to={backTo} label="Huỷ" />
      <form onSubmit={submit} className="contents">
        <Stage>
          <Title>{editing ? 'Sửa khoản chi' : 'Ghi một khoản'}</Title>

          <div className="mt-6">
            <Field label="Số tiền">
              <AmountInput
                variant="lg"
                value={value.amount}
                onChange={(amount) => patch({ amount })}
                autoFocus
              />
            </Field>
          </div>

          <div className="mt-4 space-y-4">
            <Field label="Danh mục">
              <div className="grid grid-cols-4 gap-2">
                {EXPENSE_CATEGORIES.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => patch({ category: c.key })}
                    aria-pressed={value.category === c.key}
                    className={`flex flex-col items-center gap-1 rounded-xl border py-2.5 text-[11.5px] transition ${
                      value.category === c.key
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
                value={value.note}
                onChange={(e) => patch({ note: e.target.value })}
                placeholder="Ghi chú"
                maxLength={80}
                className={input}
              />
            </Field>

            <Field label="Ngày">
              <DateField
                value={value.spentOn}
                max={todayYmd()}
                onChange={(next) => patch({ spentOn: next })}
                className={`${input} flex items-center`}
              />
            </Field>

            <Field label="Người trả">
              <SegmentedControl
                options={[
                  ...(couple?.members ?? []).map((m) => ({
                    value: m.user_id,
                    label: m.nickname ?? 'Người ấy',
                  })),
                  { value: 'shared', label: 'Quỹ chung' },
                ]}
                value={payerKey}
                onChange={(next) => patch({ paidBy: next })}
              />
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

          {editing ? (
            <button
              type="button"
              onClick={() => void remove()}
              className={`${btn.ghost} mt-1`}
            >
              Xoá khoản chi này
            </button>
          ) : null}
        </Stage>
      </form>
    </Screen>
  )
}
