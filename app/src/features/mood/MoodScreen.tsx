import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { TopHeader } from '../../components/AppShell'
import { useCouple } from '../../hooks/useCouple'
import { useSession } from '../../hooks/useSession'
import { todayYmd } from '../../lib/dateCount'
import { supabase } from '../../lib/supabase'
import { notifyPartner } from '../../lib/notify'
import { PREVIEW, previewMoods } from '../../dev/preview'
import { NudgeSheet } from '../nudge/NudgeSheet'
import { MOODS } from '../../lib/moods'


type Checkin = {
  id: string
  user_id: string
  mood_date: string
  mood: number
  note: string | null
}

export function MoodScreen() {
  const queryClient = useQueryClient()
  const { couple } = useCouple()
  const { user } = useSession()
  const today = todayYmd()

  const [range, setRange] = useState<7 | 30>(7)
  const [nudgeOpen, setNudgeOpen] = useState(false)

  const query = useQuery({
    queryKey: ['moods', couple?.id],
    enabled: !!couple?.id && !PREVIEW,
    queryFn: async () => {
      const since = new Date()
      since.setDate(since.getDate() - 30)
      const { data, error } = await supabase
        .from('mood_checkins')
        .select('id, user_id, mood_date, mood, note')
        .eq('couple_id', couple!.id)
        .gte('mood_date', since.toISOString().slice(0, 10))
        .order('mood_date', { ascending: true })
      if (error) throw error
      return (data ?? []) as Checkin[]
    },
  })

  const checkins = PREVIEW ? previewMoods() : (query.data ?? [])
  const mineToday = checkins.find(
    (c) => c.user_id === user?.id && c.mood_date === today,
  )
  const partnerId = couple?.members.find((m) => m.user_id !== user?.id)?.user_id
  const partnerName =
    couple?.members.find((m) => m.user_id !== user?.id)?.nickname ?? 'Người ấy'

  async function checkIn(mood: number) {
    if (!couple || !user || PREVIEW) return
    await supabase.from('mood_checkins').upsert(
      {
        couple_id: couple.id,
        user_id: user.id,
        mood_date: today,
        mood,
      },
      { onConflict: 'couple_id,user_id,mood_date' },
    )
    await queryClient.invalidateQueries({ queryKey: ['moods'] })

    // Chỉ báo người kia khi tâm trạng xuống — và bằng lời nhẹ nhàng,
    // không phải một dòng cảnh báo.
    if (mood <= 2) {
      void notifyPartner(couple, user.id, {
        title: 'Couple Space',
        body: `Hôm nay ${
          couple.members.find((m) => m.user_id === user.id)?.nickname ?? 'người ấy'
        } không được vui lắm`,
        path: '/mood',
      })
    }
  }

  const days = lastDays(range, today)
  const streak = sharedStreak(checkins, couple?.members.length ?? 0, today)
  const insight = buildInsight(checkins, user?.id, partnerId, partnerName)

  return (
    <>
      <TopHeader title="Tâm trạng" back="/" />

      <div className="flex-1 px-4 py-4">
        <section className="rounded-2xl border border-border bg-surface p-4 text-center">
          <p className="text-[13px] text-muted">
            {mineToday ? 'Hôm nay bạn thấy' : 'Hôm nay bạn thấy thế nào?'}
          </p>
          <div className="mt-3 flex justify-between gap-1.5">
            {MOODS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => void checkIn(m.value)}
                aria-label={m.label}
                aria-pressed={mineToday?.mood === m.value}
                className={`flex flex-1 flex-col items-center gap-1 rounded-xl border py-2.5 text-[10.5px] transition ${
                  mineToday?.mood === m.value
                    ? 'border-accent bg-soft font-semibold text-accent'
                    : 'border-transparent text-muted'
                }`}
              >
                <span aria-hidden className="text-2xl">
                  {m.emoji}
                </span>
                {m.label}
              </button>
            ))}
          </div>
          {mineToday ? (
            <p className="mt-2 text-[12.5px] text-muted">
              Chạm lại để đổi — sửa thoải mái trong hôm nay.
            </p>
          ) : null}
        </section>

        <div className="mt-4 flex items-center justify-between">
          <h2 className="text-[11px] font-bold tracking-[0.13em] text-muted uppercase">
            {range} ngày qua
          </h2>
          <div className="flex overflow-hidden rounded-full border border-border">
            {([7, 30] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`px-3 py-1 text-xs ${
                  range === r ? 'bg-accent text-on-accent' : 'text-muted'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <MoodChart
          days={days}
          checkins={checkins}
          myId={user?.id}
          partnerId={partnerId}
        />

        {streak > 0 ? (
          <p className="mt-3 text-center text-[13px] text-muted">
            🔥 Cả hai cùng check-in {streak} ngày liền
          </p>
        ) : null}

        {insight ? (
          <p className="mt-3 rounded-2xl bg-soft p-3.5 text-center text-[13.5px] leading-relaxed text-muted">
            {insight}
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => setNudgeOpen(true)}
          className="mt-5 w-full rounded-2xl border border-border bg-surface py-3 text-[14px] font-semibold text-accent"
        >
          Gửi một cái chạm cho {partnerName}
        </button>
      </div>

      <NudgeSheet open={nudgeOpen} onClose={() => setNudgeOpen(false)} />
    </>
  )
}

function lastDays(count: number, today: string) {
  const out: string[] = []
  const base = new Date(`${today}T12:00:00`)
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(base)
    d.setDate(d.getDate() - i)
    out.push(d.toISOString().slice(0, 10))
  }
  return out
}

/** Streak CHUNG: chỉ tính ngày cả hai cùng check-in.
 *  Đứt thì về 0 và **im lặng tuyệt đối** — không nhắc, không tiếc nuối. */
function sharedStreak(checkins: Checkin[], memberCount: number, today: string) {
  if (memberCount < 2) return 0
  let streak = 0
  const cursor = new Date(`${today}T12:00:00`)
  for (let i = 0; i < 365; i++) {
    const ymd = cursor.toISOString().slice(0, 10)
    const users = new Set(
      checkins.filter((c) => c.mood_date === ymd).map((c) => c.user_id),
    )
    if (users.size >= 2) streak++
    else if (i > 0 || users.size === 0) break
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

/** Câu nhận xét chỉ hiện khi có đủ dữ liệu của CẢ HAI — dưới 5 ngày thì
 *  bất kỳ kết luận nào cũng là đoán mò. */
function buildInsight(
  checkins: Checkin[],
  myId: string | undefined,
  partnerId: string | undefined,
  partnerName: string,
) {
  if (!myId || !partnerId) return null
  const mine = checkins.filter((c) => c.user_id === myId)
  const theirs = checkins.filter((c) => c.user_id === partnerId)
  if (mine.length < 5 || theirs.length < 5) return null

  const avg = (list: Checkin[]) =>
    list.reduce((s, c) => s + c.mood, 0) / list.length
  const diff = avg(mine) - avg(theirs)

  if (Math.abs(diff) < 0.5) {
    return 'Mấy tuần này hai đứa khá đồng điệu.'
  }
  return diff > 0
    ? `Dạo này ${partnerName} xuống hơn bạn một chút. Hỏi thăm một câu xem sao.`
    : `Dạo này bạn xuống hơn ${partnerName} một chút.`
}

function MoodChart({
  days,
  checkins,
  myId,
  partnerId,
}: {
  days: string[]
  checkins: Checkin[]
  myId: string | undefined
  partnerId: string | undefined
}) {
  const find = (ymd: string, userId: string | undefined) =>
    checkins.find((c) => c.mood_date === ymd && c.user_id === userId)

  return (
    <div className="mt-2.5 rounded-2xl border border-border bg-surface p-3.5">
      <div className="flex h-28 items-end gap-1">
        {days.map((ymd) => {
          const a = find(ymd, myId)
          const b = find(ymd, partnerId)
          return (
            <div key={ymd} className="flex flex-1 items-end justify-center gap-[2px]">
              <span
                title={`Bạn: ${a?.mood ?? '—'}`}
                className="w-full max-w-[7px] rounded-t-full bg-accent"
                style={{ height: `${((a?.mood ?? 0) / 5) * 100}%` }}
              />
              <span
                title={`Người ấy: ${b?.mood ?? '—'}`}
                className="w-full max-w-[7px] rounded-t-full bg-ok"
                style={{ height: `${((b?.mood ?? 0) / 5) * 100}%` }}
              />
            </div>
          )
        })}
      </div>
      <div className="mt-3 flex justify-center gap-4 text-[12px] text-muted">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-accent" />
          Bạn
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-ok" />
          Người ấy
        </span>
      </div>
    </div>
  )
}
