import { useState, type FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { TopHeader } from '../../components/AppShell'
import { useCouple } from '../../hooks/useCouple'
import { useSession } from '../../hooks/useSession'
import { useAgenda } from '../../hooks/useAgenda'
import { todayYmd } from '../../lib/dateCount'
import { formatDay } from '../../lib/formatDate'
import { daysUntil } from '../../lib/recurrence'
import { supabase } from '../../lib/supabase'
import { PREVIEW, previewLetters } from '../../dev/preview'
import { btn, input } from '../../lib/ui-classes'
import { DateField } from '../../components/DateField'

type Letter = {
  id: string
  author_id: string
  title: string
  body: string | null
  open_on: string
}

export function LettersScreen() {
  const queryClient = useQueryClient()
  const { couple } = useCouple()
  const { user } = useSession()
  const { agenda } = useAgenda(6)
  const today = todayYmd()

  const [writing, setWriting] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [openOn, setOpenOn] = useState('')
  const [saving, setSaving] = useState(false)
  const [reading, setReading] = useState<Letter | null>(null)

  const query = useQuery({
    queryKey: ['letters', couple?.id],
    enabled: !!couple?.id && !PREVIEW,
    queryFn: async () => {
      // RLS lo phần che: thư của người kia chưa tới ngày mở sẽ không
      // có trong kết quả, kể cả `body`.
      const { data, error } = await supabase
        .from('letters')
        .select('id, author_id, title, body, open_on')
        .eq('couple_id', couple!.id)
        .order('open_on', { ascending: true })
      if (error) throw error

      const { data: locked } = await supabase.rpc('locked_letters', {
        p_couple_id: couple!.id,
      })

      const rows = (data ?? []) as Letter[]
      const known = new Set(rows.map((r) => r.id))
      const hidden = ((locked ?? []) as Letter[])
        .filter((l) => !known.has(l.id))
        .map((l) => ({ ...l, body: null }))
      return [...rows, ...hidden]
    },
  })

  const letters = PREVIEW ? previewLetters() : (query.data ?? [])
  const upcoming = letters.filter((l) => l.open_on > today)
  const opened = letters.filter((l) => l.open_on <= today)

  const nameOf = (id: string) =>
    couple?.members.find((m) => m.user_id === id)?.nickname ?? '?'

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!title.trim() || !openOn || !couple || !user || PREVIEW) return
    setSaving(true)
    const { error } = await supabase.from('letters').insert({
      couple_id: couple.id,
      author_id: user.id,
      title: title.trim(),
      body,
      open_on: openOn,
    })
    setSaving(false)
    if (error) return
    setTitle('')
    setBody('')
    setOpenOn('')
    setWriting(false)
    await queryClient.invalidateQueries({ queryKey: ['letters'] })
  }

  if (reading) {
    return (
      <div className="flex-1 px-5 py-6">
        <button
          type="button"
          onClick={() => setReading(null)}
          className="text-sm text-muted"
        >
          ‹ Quay lại
        </button>
        <h1 className="mt-5 text-[22px] font-bold text-text">{reading.title}</h1>
        <p className="mt-1 text-[13px] text-muted">
          {nameOf(reading.author_id)} viết · mở ngày {formatDay(reading.open_on)}
        </p>
        <p className="mt-5 text-[15px] leading-[1.75] whitespace-pre-wrap text-text">
          {reading.body}
        </p>
      </div>
    )
  }

  if (writing) {
    return (
      <form onSubmit={submit} className="flex-1 px-4 py-4">
        <button
          type="button"
          onClick={() => setWriting(false)}
          className="text-sm text-muted"
        >
          ‹ Huỷ
        </button>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Tiêu đề"
          maxLength={80}
          className={`${input} mt-4`}
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={10}
          placeholder="Nội dung thư"
          className={`${input} mt-3 h-auto py-3 leading-[1.75]`}
        />

        <p className="mt-4 text-[13px] font-medium text-muted">
          Mở vào ngày
        </p>
        <DateField
          value={openOn}
          min={today}
          placeholder="Ngày mở"
          onChange={setOpenOn}
          className={`${input} mt-2 flex items-center`}
        />

        {agenda.length > 0 ? (
          <div className="mt-2.5 flex flex-wrap gap-2">
            {agenda.slice(0, 4).map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setOpenOn(a.occurs_on)}
                className="rounded-full border border-border px-3 py-1.5 text-[12.5px] text-muted"
              >
                {a.emoji} {a.title}
              </button>
            ))}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={!title.trim() || !openOn || saving}
          className={`${btn.primary} mt-6`}
        >
          {saving ? 'Đang khoá...' : 'Khoá đến ngày mở'}
        </button>
        <p className="mt-2.5 text-center text-[12.5px] leading-relaxed text-muted">
          Sau ngày mở không sửa được.
        </p>
      </form>
    )
  }

  return (
    <>
      <TopHeader
        back="/"
        title="Thư gửi tương lai"
        right={
          <button
            type="button"
            onClick={() => setWriting(true)}
            className="rounded-full bg-accent px-3 py-1 text-sm font-semibold text-on-accent"
          >
            + Viết
          </button>
        }
      />

      <div className="flex-1 px-4 py-4">
        {letters.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <p className="text-5xl" aria-hidden>
              💌
            </p>
            <p className="mt-5 text-[17px] font-semibold text-text">
              Chưa có thư.
            </p>
            <button
              type="button"
              onClick={() => setWriting(true)}
              className={`${btn.primary} mt-7 max-w-[18rem]`}
            >
              Viết thư
            </button>
          </div>
        ) : null}

        {upcoming.length > 0 ? (
          <section>
            <h2 className="text-[14px] font-semibold text-muted">
              Sắp mở
            </h2>
            <ul className="mt-2.5 flex flex-col gap-2.5">
              {upcoming.map((l) => (
                <li
                  key={l.id}
                  className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-surface p-3.5"
                >
                  <span aria-hidden className="text-xl">
                    🔒
                  </span>
                  <div className="min-w-0 flex-1">
                    <b className="block truncate text-[15px] font-semibold text-text">
                      {l.title}
                    </b>
                    <span className="block text-[12.5px] text-muted">
                      {nameOf(l.author_id)} viết · mở {formatDay(l.open_on)}
                    </span>
                  </div>
                  <span className="shrink-0 text-[12.5px] font-medium text-accent">
                    còn {daysUntil(l.open_on, today)} ngày
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {opened.length > 0 ? (
          <section className="mt-6">
            <h2 className="text-[14px] font-semibold text-muted">
              Đã mở
            </h2>
            <ul className="mt-2.5 flex flex-col gap-2.5">
              {opened.map((l) => (
                <li key={l.id}>
                  <button
                    type="button"
                    onClick={() => setReading(l)}
                    className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface p-3.5 text-left"
                  >
                    <span aria-hidden className="text-xl">
                      💌
                    </span>
                    <div className="min-w-0 flex-1">
                      <b className="block truncate text-[15px] font-semibold text-text">
                        {l.title}
                      </b>
                      <span className="block text-[12.5px] text-muted">
                        {nameOf(l.author_id)} viết · {formatDay(l.open_on)}
                      </span>
                    </div>
                    <span aria-hidden className="text-muted">
                      ›
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </>
  )
}
