import { useState, type FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { TopHeader } from '../../components/AppShell'
import { useCouple } from '../../hooks/useCouple'
import { useSession } from '../../hooks/useSession'
import { QUESTIONS, questionIndexFor } from '../../lib/questions'
import { todayYmd } from '../../lib/dateCount'
import { formatDay } from '../../lib/formatDate'
import { supabase } from '../../lib/supabase'
import { notifyPartner } from '../../lib/notify'
import { PREVIEW, previewAnswers } from '../../dev/preview'
import { btn, input } from '../../lib/ui-classes'

type Answer = {
  id: string
  user_id: string
  body: string
  asked_on: string
  created_at: string
  edited_at: string | null
}

export function QuestionScreen() {
  const queryClient = useQueryClient()
  const { couple } = useCouple()
  const { user } = useSession()
  const today = todayYmd()

  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const index = couple ? questionIndexFor(couple.id, today) : 0
  const question = QUESTIONS[index]

  const answersQuery = useQuery({
    queryKey: ['question_answers', couple?.id, today],
    enabled: !!couple?.id && !PREVIEW,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('question_answers')
        .select('id, user_id, body, asked_on, created_at, edited_at')
        .eq('couple_id', couple!.id)
        .eq('asked_on', today)
      if (error) throw error
      return (data ?? []) as Answer[]
    },
  })

  const answers = PREVIEW ? previewAnswers() : (answersQuery.data ?? [])
  const mine = answers.find((a) => a.user_id === user?.id)
  // RLS chỉ trả câu của người kia sau khi mình đã trả lời, nên nếu
  // nó có mặt ở đây thì nghĩa là cả hai đã xong.
  const theirs = answers.find((a) => a.user_id !== user?.id)

  const partnerName =
    couple?.members.find((m) => m.user_id !== user?.id)?.nickname ?? 'Người ấy'
  const myName =
    couple?.members.find((m) => m.user_id === user?.id)?.nickname ?? 'Bạn'

  // Sửa được trong 24 giờ (policy `answers_update` cũng chặn y hệt ở DB).
  // So bằng mốc thời gian dựng một lần lúc mở màn, không gọi Date.now()
  // trong thân render.
  const [mountedAt] = useState(() => Date.now())
  const editable =
    !!mine && mountedAt - new Date(mine.created_at).getTime() < 86_400_000

  async function submit(event: FormEvent) {
    event.preventDefault()
    const body = draft.trim()
    if (!body || !couple || !user || PREVIEW) return
    setSaving(true)

    const { error } = mine
      ? await supabase
          .from('question_answers')
          .update({ body, edited_at: new Date().toISOString() })
          .eq('id', mine.id)
      : await supabase.from('question_answers').insert({
          couple_id: couple.id,
          user_id: user.id,
          question_index: index,
          asked_on: today,
          body,
        })

    setSaving(false)
    if (error) return
    setDraft('')
    setEditing(false)
    await queryClient.invalidateQueries({ queryKey: ['question_answers'] })

    if (!mine) {
      void notifyPartner(couple, user.id, {
        title: 'Couple Space',
        body: `${myName} đã trả lời câu hỏi hôm nay`,
        path: '/question',
      })
    }
  }

  return (
    <>
      <TopHeader title="Câu hỏi mỗi ngày" />

      <div className="flex-1 px-4 py-4">
        <section className="rounded-[1.5rem] bg-soft p-5 text-center">
          <p className="text-[11px] font-bold tracking-[0.13em] text-accent uppercase">
            {formatDay(today)} · {question.tone}
          </p>
          <p className="mt-3 text-[20px] leading-snug font-bold text-balance text-text">
            {question.text}
          </p>
        </section>

        {!mine || editing ? (
          <form onSubmit={submit} className="mt-5">
            <textarea
              value={draft || (editing ? (mine?.body ?? '') : '')}
              onChange={(e) => setDraft(e.target.value)}
              rows={5}
              autoFocus
              placeholder="Câu trả lời của bạn..."
              className={`${input} h-auto py-3 leading-relaxed`}
            />
            <button
              type="submit"
              disabled={!draft.trim() || saving}
              className={`${btn.primary} mt-3`}
            >
              {saving ? 'Đang gửi...' : editing ? 'Lưu lại' : 'Trả lời'}
            </button>
            <p className="mt-2.5 text-center text-[12.5px] leading-relaxed text-muted">
              Trả lời rồi mới thấy câu của {partnerName} — và ngược lại.
            </p>
          </form>
        ) : (
          <div className="mt-5 space-y-3">
            <AnswerCard
              name={myName}
              body={mine.body}
              edited={!!mine.edited_at}
              footer={
                editable ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDraft(mine.body)
                      setEditing(true)
                    }}
                    className="text-[12.5px] font-medium text-accent"
                  >
                    Sửa
                  </button>
                ) : null
              }
            />

            {theirs ? (
              <AnswerCard
                name={partnerName}
                body={theirs.body}
                edited={!!theirs.edited_at}
              />
            ) : (
              <BlurredPlaceholder name={partnerName} />
            )}
          </div>
        )}
      </div>
    </>
  )
}

function AnswerCard({
  name,
  body,
  edited,
  footer,
}: {
  name: string
  body: string
  edited: boolean
  footer?: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-soft text-xs font-bold text-accent">
          {name.slice(0, 1).toUpperCase()}
        </span>
        <b className="text-[13px] text-text">{name}</b>
        {edited ? (
          <span className="text-[11px] text-muted">đã chỉnh</span>
        ) : null}
        {footer ? <span className="ml-auto">{footer}</span> : null}
      </div>
      <p className="mt-2.5 text-[15px] leading-relaxed text-text">{body}</p>
    </div>
  )
}

/** Ô mờ là khối GIẢ có kích thước gần đúng — nội dung thật không hề được
 *  gửi về máy này (RLS chặn), nên không có gì để lộ qua DevTools. */
function BlurredPlaceholder({ name }: { name: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-soft text-xs font-bold text-accent">
          {name.slice(0, 1).toUpperCase()}
        </span>
        <b className="text-[13px] text-text">{name}</b>
      </div>
      <div aria-hidden className="mt-3 space-y-2">
        <span className="block h-3 w-[92%] rounded-full bg-soft" />
        <span className="block h-3 w-[78%] rounded-full bg-soft" />
        <span className="block h-3 w-[45%] rounded-full bg-soft" />
      </div>
      <p className="mt-3 text-center text-[12.5px] text-muted">
        🔒 {name} chưa trả lời hôm nay
      </p>
    </div>
  )
}
