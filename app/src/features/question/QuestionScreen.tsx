import { useMemo, useState, type FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { TopHeader } from '../../components/AppShell'
import { useCouple } from '../../hooks/useCouple'
import { useSession } from '../../hooks/useSession'
import { QUESTIONS, questionIndexFor } from '../../lib/questions'
import { missedDays } from '../../lib/questionDays'
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

type Tab = 'today' | 'missed' | 'book'

/** Bỏ dấu để tìm "ky niem" cũng ra "kỉ niệm" — gõ tiếng Việt có dấu
 *  trên bàn phím iOS lúc đang vội là việc không ai muốn làm. */
function plain(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
}

export function QuestionScreen() {
  const queryClient = useQueryClient()
  const { couple } = useCouple()
  const { user } = useSession()
  const today = todayYmd()

  const [tab, setTab] = useState<Tab>('today')

  // Một truy vấn cho cả ba mục. RLS đã che câu của người kia ở những ngày
  // mình chưa trả lời, nên tải hết về vẫn không lộ gì.
  const historyQuery = useQuery({
    queryKey: ['question_answers', couple?.id],
    enabled: !!couple?.id && !PREVIEW,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('question_answers')
        .select('id, user_id, body, asked_on, created_at, edited_at')
        .eq('couple_id', couple!.id)
        .order('asked_on', { ascending: false })
      if (error) throw error
      return (data ?? []) as Answer[]
    },
  })

  const history = PREVIEW ? previewAnswers() : (historyQuery.data ?? [])
  const myAnswerDates = history
    .filter((a) => a.user_id === user?.id)
    .map((a) => a.asked_on)

  const missed = couple ? missedDays(today, myAnswerDates, couple.start_date) : []

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ['question_answers'] })

  return (
    <>
      <TopHeader title="Câu hỏi mỗi ngày" back="/" />

      <div className="px-4 pt-3">
        <div className="flex gap-1 rounded-2xl border border-border bg-surface p-1">
          {(
            [
              ['today', 'Hôm nay'],
              ['missed', missed.length ? `Bỏ lỡ (${missed.length})` : 'Bỏ lỡ'],
              ['book', 'Sách'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
                tab === value ? 'bg-accent text-on-accent' : 'text-muted'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 py-4">
        {tab === 'today' ? (
          <DayQuestion
            day={today}
            answers={history.filter((a) => a.asked_on === today)}
            onSaved={refresh}
          />
        ) : null}

        {tab === 'missed' ? (
          <MissedList days={missed} history={history} onSaved={refresh} />
        ) : null}

        {tab === 'book' ? <Book history={history} /> : null}
      </div>
    </>
  )
}

/** Câu hỏi của MỘT ngày: ô trả lời, hoặc hai câu trả lời. Dùng cho cả
 *  "Hôm nay" lẫn từng ngày trong mục "Bỏ lỡ". */
function DayQuestion({
  day,
  answers,
  onSaved,
  compact = false,
}: {
  day: string
  answers: Answer[]
  onSaved: () => void | Promise<unknown>
  compact?: boolean
}) {
  const { couple } = useCouple()
  const { user } = useSession()
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const index = couple ? questionIndexFor(couple.id, day) : 0
  const question = QUESTIONS[index]

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
          asked_on: day,
          body,
        })

    setSaving(false)
    if (error) return
    setDraft('')
    setEditing(false)
    await onSaved()

    if (!mine) {
      void notifyPartner(couple, user.id, {
        title: 'Couple Space',
        body: `${myName} đã trả lời câu hỏi ${
          day === todayYmd() ? 'hôm nay' : `ngày ${formatDay(day)}`
        }`,
        path: '/question',
      })
    }
  }

  return (
    <>
      <section
        className={
          compact
            ? 'rounded-2xl bg-soft p-4'
            : 'rounded-[1.5rem] bg-soft p-5 text-center'
        }
      >
        <p className="text-[13px] font-medium text-accent">
          {formatDay(day)} · {question.tone}
        </p>
        <p
          className={`leading-snug font-bold text-balance text-text ${
            compact ? 'mt-2 text-[16px]' : 'mt-3 text-[20px]'
          }`}
        >
          {question.text}
        </p>
      </section>

      {!mine || editing ? (
        <form onSubmit={submit} className="mt-4">
          <textarea
            value={draft || (editing ? (mine?.body ?? '') : '')}
            onChange={(e) => setDraft(e.target.value)}
            rows={compact ? 3 : 5}
            autoFocus={!compact}
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
          {compact ? null : (
            <p className="mt-2.5 text-center text-[12.5px] leading-relaxed text-muted">
              Trả lời rồi mới thấy câu của {partnerName} — và ngược lại.
            </p>
          )}
        </form>
      ) : (
        <div className="mt-4 space-y-3">
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
            <BlurredPlaceholder name={partnerName} day={day} />
          )}
        </div>
      )}
    </>
  )
}

/** Những ngày còn trả lời bù được. Mỗi ngày mở ra là một câu hỏi thật,
 *  không phải danh sách chết. */
function MissedList({
  days,
  history,
  onSaved,
}: {
  days: string[]
  history: Answer[]
  onSaved: () => void | Promise<unknown>
}) {
  const { couple } = useCouple()
  const [open, setOpen] = useState<string | null>(days[0] ?? null)

  if (days.length === 0) {
    return (
      <div className="flex flex-col items-center px-6 py-16 text-center">
        <p className="text-5xl" aria-hidden>
          ✅
        </p>
        <p className="mt-5 text-[17px] font-semibold text-text">
          Không bỏ lỡ ngày nào
        </p>
        <p className="mt-2 max-w-[30ch] text-sm leading-relaxed text-muted">
          Câu chưa trả lời của bảy ngày gần nhất sẽ hiện ở đây. Quá bảy ngày
          thì thôi — không nợ nần gì cả.
        </p>
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {days.map((day) => {
        const index = couple ? questionIndexFor(couple.id, day) : 0
        const isOpen = open === day
        return (
          <li
            key={day}
            className="overflow-hidden rounded-2xl border border-border bg-surface"
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : day)}
              className="flex w-full items-center gap-3 p-3.5 text-left"
            >
              <div className="min-w-0 flex-1">
                <b className="block text-[13px] font-semibold text-accent">
                  {formatDay(day)}
                </b>
                <span className="mt-0.5 block truncate text-[14px] text-text">
                  {QUESTIONS[index].text}
                </span>
              </div>
              <span aria-hidden className="shrink-0 text-muted">
                {isOpen ? '▾' : '▸'}
              </span>
            </button>
            {isOpen ? (
              <div className="border-t border-border p-3.5">
                <DayQuestion
                  day={day}
                  answers={history.filter((a) => a.asked_on === day)}
                  onSaved={onSaved}
                  compact
                />
              </div>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}

/** Sách hỏi đáp — giá trị tăng dần theo thời gian, nên phải tìm được. */
function Book({ history }: { history: Answer[] }) {
  const { couple } = useCouple()
  const { user } = useSession()
  const [term, setTerm] = useState('')

  const nameOf = (id: string) =>
    couple?.members.find((m) => m.user_id === id)?.nickname ??
    (id === user?.id ? 'Bạn' : 'Người ấy')

  const entries = useMemo(() => {
    const byDay = new Map<string, Answer[]>()
    for (const a of history) {
      byDay.set(a.asked_on, [...(byDay.get(a.asked_on) ?? []), a])
    }

    const needle = plain(term.trim())
    return [...byDay.entries()]
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([day, answers]) => ({
        day,
        answers,
        question: couple ? QUESTIONS[questionIndexFor(couple.id, day)] : null,
      }))
      .filter(({ question, answers }) => {
        if (!needle) return true
        const hay = plain(
          `${question?.text ?? ''} ${answers.map((a) => a.body).join(' ')}`,
        )
        return hay.includes(needle)
      })
  }, [history, term, couple])

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center px-6 py-16 text-center">
        <p className="text-5xl" aria-hidden>
          📖
        </p>
        <p className="mt-5 text-[17px] font-semibold text-text">Sách còn trắng</p>
        <p className="mt-2 max-w-[30ch] text-sm leading-relaxed text-muted">
          Mỗi ngày trả lời một câu. Sau một năm chỗ này là một cuốn sách thật.
        </p>
      </div>
    )
  }

  return (
    <>
      <input
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Tìm trong sách..."
        className={input}
      />

      {entries.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted">
          Không có câu nào khớp “{term.trim()}”.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-4">
          {entries.map(({ day, answers, question }) => (
            <li
              key={day}
              className="rounded-2xl border border-border bg-surface p-4"
            >
              <p className="text-[13px] font-medium text-accent">
                {formatDay(day)}
              </p>
              <p className="mt-1.5 text-[15px] leading-snug font-semibold text-text">
                {question?.text}
              </p>
              <div className="mt-3 space-y-2.5 border-t border-border pt-3">
                {answers.map((a) => (
                  <div key={a.id}>
                    <b className="text-[12.5px] text-muted">
                      {nameOf(a.user_id)}
                    </b>
                    <p className="mt-0.5 text-[14.5px] leading-relaxed text-text">
                      {a.body}
                    </p>
                  </div>
                ))}
                {answers.length === 1 ? (
                  <p className="text-[12.5px] text-muted">
                    🔒 Chỉ một người trả lời ngày này.
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
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
        {edited ? <span className="text-[11px] text-muted">đã chỉnh</span> : null}
        {footer ? <span className="ml-auto">{footer}</span> : null}
      </div>
      <p className="mt-2.5 text-[15px] leading-relaxed text-text">{body}</p>
    </div>
  )
}

/** Ô mờ là khối GIẢ có kích thước gần đúng — nội dung thật không hề được
 *  gửi về máy này (RLS chặn), nên không có gì để lộ qua DevTools. */
function BlurredPlaceholder({ name, day }: { name: string; day: string }) {
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
        🔒 {name} chưa trả lời {day === todayYmd() ? 'hôm nay' : 'ngày này'}
      </p>
    </div>
  )
}
