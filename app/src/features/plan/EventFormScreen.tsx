import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useCouple } from '../../hooks/useCouple'
import { useSession } from '../../hooks/useSession'
import { useEvent } from '../../hooks/useAgenda'
import { supabase } from '../../lib/supabase'
import { todayYmd } from '../../lib/dateCount'
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
import { suggestedEmoji } from '../../lib/eventSuggestion'
import { DateField } from '../../components/DateField'
import { SegmentedControl } from '../../components/SegmentedControl'

const RECURRENCES = [
  ['none', 'Một lần'],
  ['monthly', 'Hằng tháng'],
  ['yearly', 'Hằng năm'],
] as const

const REMIND_CHOICES = [0, 1, 3, 7, 30]
const EMOJIS = ['🎂', '💍', '✈️', '🎁', '🎬', '🍽️', '🏠', '📅']

export function EventFormScreen() {
  const { id } = useParams()
  const editing = !!id
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { couple } = useCouple()
  const { user } = useSession()
  const existing = useEvent(id)

  const row = existing.data
  const [draft, setDraft] = useState<{
    title: string
    event_date: string
    recurrence: 'none' | 'monthly' | 'yearly'
    remind: number[]
    notes: string
    emoji: string
  } | null>(null)

  // Chưa sửa gì thì hiện thẳng dữ liệu đã lưu — không cần effect đồng bộ
  const value = draft ?? {
    title: row?.title ?? '',
    event_date: row?.event_date ?? todayYmd(),
    recurrence: row?.recurrence ?? 'yearly',
    remind: row?.remind_days_before ?? [3],
    notes: row?.notes ?? '',
    emoji: row?.emoji ?? '📅',
  }
  const patch = (next: Partial<typeof value>) =>
    setDraft({ ...value, ...next })

  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  // Người dùng đã tự bấm chọn biểu tượng thì thôi không đoán nữa
  const [emojiTouched, setEmojiTouched] = useState(false)

  function toggleRemind(days: number) {
    const has = value.remind.includes(days)
    patch({
      remind: has
        ? value.remind.filter((d) => d !== days)
        : [...value.remind, days].sort((a, b) => a - b),
    })
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (PREVIEW) return
    // Trước đây `!couple || !user` cũng lặng lẽ `return` — bấm Lưu mà không có
    // gì xảy ra, không báo gì cả. Im lặng là kiểu hỏng khó tìm nhất.
    if (!couple || !user) {
      setStatus('error')
      setErrorMessage('Chưa tải xong không gian. Thử lại sau một giây.')
      return
    }
    if (!value.title.trim()) {
      setStatus('error')
      setErrorMessage('Đặt tên cho dịp này.')
      return
    }

    setStatus('saving')
    setErrorMessage('')

    const payload = {
      couple_id: couple.id,
      title: value.title.trim(),
      event_date: value.event_date,
      recurrence: value.recurrence,
      remind_days_before: value.remind.length ? value.remind : [3],
      notes: value.notes.trim() || null,
      emoji: value.emoji,
      created_by: user.id,
    }

    const { error } = editing
      ? await supabase.from('events').update(payload).eq('id', id!)
      : await supabase.from('events').insert(payload)

    if (error) {
      setStatus('error')
      setErrorMessage(error.message)
      return
    }

    await queryClient.invalidateQueries({ queryKey: ['agenda'] })
    navigate('/plan', { replace: true })
  }

  async function remove() {
    if (!id || PREVIEW) return
    if (!window.confirm('Xoá dịp này?')) return
    await supabase
      .from('events')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
    await queryClient.invalidateQueries({ queryKey: ['agenda'] })
    navigate('/plan', { replace: true })
  }

  return (
    <Screen>
      <TopBar to="/plan" label="Huỷ" />
      <form onSubmit={submit} className="contents">
        <Stage>
          <Title>{editing ? 'Sửa dịp' : 'Thêm dịp'}</Title>

          <div className="mt-6 space-y-4">
            <Field label="Tên">
              <input
                value={value.title}
                onChange={(e) => {
                  const title = e.target.value
                  const guess = emojiTouched ? null : suggestedEmoji(title)
                  patch(guess ? { title, emoji: guess } : { title })
                }}
                placeholder="Tên sự kiện"
                maxLength={80}
                className={input}
              />
            </Field>

            <Field label="Biểu tượng">
              <div className="flex flex-wrap gap-2">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => {
                      setEmojiTouched(true)
                      patch({ emoji: e })
                    }}
                    aria-pressed={value.emoji === e}
                    className={`grid h-11 w-11 place-items-center rounded-xl border text-xl transition ${
                      value.emoji === e
                        ? 'border-accent bg-soft'
                        : 'border-border'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Ngày">
              <DateField
                value={value.event_date}
                onChange={(next) => patch({ event_date: next })}
                className={`${input} flex items-center`}
              />
            </Field>

            <Field label="Lặp lại">
              <SegmentedControl
                options={RECURRENCES.map(([value, label]) => ({
                  value,
                  label,
                }))}
                value={value.recurrence}
                onChange={(next) => patch({ recurrence: next })}
              />
            </Field>

            <Field
              label="Nhắc trước"
              hint="Chọn được nhiều mốc. Nhắc gửi lúc 9 giờ sáng theo giờ máy mỗi người."
            >
              <div className="flex flex-wrap gap-2">
                {REMIND_CHOICES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleRemind(d)}
                    className={`rounded-full border px-3 py-1.5 text-[13px] transition ${
                      value.remind.includes(d)
                        ? 'border-accent bg-accent font-semibold text-on-accent'
                        : 'border-border text-muted'
                    }`}
                  >
                    {d === 0 ? 'Đúng hôm đó' : `${d} ngày`}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Ghi chú">
              <textarea
                value={value.notes}
                onChange={(e) => patch({ notes: e.target.value })}
                rows={2}
                className={`${input} h-auto py-3 leading-relaxed`}
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
            {status === 'saving' ? 'Đang lưu...' : 'Lưu'}
          </button>

          {editing ? (
            <button
              type="button"
              onClick={() => void remove()}
              className={`${btn.ghost} mt-1`}
            >
              Xoá dịp này
            </button>
          ) : null}
        </Stage>
      </form>
    </Screen>
  )
}
