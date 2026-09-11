import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useCouple } from '../../hooks/useCouple'
import { useSession } from '../../hooks/useSession'
import { daysTogether, nextMilestone } from '../../lib/dateCount'
import { shareInvite } from '../../lib/inviteShare'
import { supabase } from '../../lib/supabase'
import { Loading } from '../../components/ui'
import { usePosts } from '../../hooks/usePosts'
import { useAgenda } from '../../hooks/useAgenda'
import { countdownLabel } from '../../lib/recurrence'
import { useExpenses } from '../../hooks/useExpenses'
import { goalProgress, useGoals } from '../../hooks/useGoals'
import { formatShortVnd } from '../../lib/money'
import { todayYmd } from '../../lib/dateCount'

/** Ảnh bìa mặc định khi đôi chưa đặt ảnh riêng — lấy từ prototype. */
const DEFAULT_COVER =
  'linear-gradient(150deg, #e8a0ae, #c2415b 55%, #7c3350)'

export function HomeScreen() {
  const { user } = useSession()
  const { couple, refetch, isLoading, isFetching } = useCouple()
  const { posts } = usePosts()
  const { agenda } = useAgenda(2)
  const { summary } = useExpenses(`${todayYmd().slice(0, 7)}-01`)
  const { goals } = useGoals()
  const activeGoal = goals.find((g) => g.status === 'active')
  const [offline, setOffline] = useState(!navigator.onLine)
  const [inviteCode, setInviteCode] = useState<string | null>(null)

  useEffect(() => {
    const on = () => setOffline(false)
    const off = () => setOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  useEffect(() => {
    if (!couple || couple.members.length >= 2) return
    void supabase
      .from('invites')
      .select('code')
      .eq('couple_id', couple.id)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setInviteCode(data?.code ?? null))
  }, [couple])

  useEffect(() => {
    if (!couple?.id) return
    const channel = supabase
      .channel(`home-members-${couple.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'couple_members',
          filter: `couple_id=eq.${couple.id}`,
        },
        () => {
          void refetch()
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [couple?.id, refetch])

  if (isLoading || !couple) {
    return <Loading />
  }

  const me = couple.members.find((m) => m.user_id === user?.id)
  const partner = couple.members.find((m) => m.user_id !== user?.id)
  const leftName = me?.nickname ?? 'Bạn'
  const rightName = partner?.nickname ?? couple.invited_name ?? '...'
  const days = daysTogether(couple.start_date)
  const milestone = nextMilestone(couple.start_date)
  const waiting = couple.members.length < 2

  return (
    <div className="flex-1">
      <header
        className="top-safe relative flex min-h-[44svh] flex-col justify-end px-5 pb-7 text-center text-white"
        style={
          couple.cover_url
            ? {
                backgroundImage: `linear-gradient(to bottom, rgba(28,20,25,.15), rgba(28,20,25,.62)), url(${couple.cover_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : { backgroundImage: DEFAULT_COVER }
        }
      >
        <Link
          to="/settings"
          aria-label="Cài đặt"
          className="absolute right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-lg backdrop-blur-sm transition active:scale-95"
          style={{ top: 'calc(env(safe-area-inset-top) + 0.5rem)' }}
        >
          ⚙
        </Link>

        <p className="text-[15px] font-semibold opacity-95">
          {leftName} <span aria-hidden>🤍</span> {rightName}
        </p>
        <p className="mt-0.5 text-[62px] leading-[0.95] font-extrabold tracking-[-0.04em] tabular-nums">
          {days}
        </p>
        <p className="text-[13px] opacity-90">ngày bên nhau</p>
        {milestone ? (
          <p className="mx-auto mt-2.5 rounded-full bg-white/20 px-3 py-1 text-xs backdrop-blur-sm">
            còn {milestone.daysAway} ngày nữa là{' '}
            {milestone.label.toLowerCase()}
          </p>
        ) : null}
      </header>

      <div className="mx-auto w-full max-w-md px-4 pt-4 pb-6">
        {offline ? (
          <p className="mb-3 rounded-xl bg-soft px-4 py-2.5 text-center text-xs text-muted">
            Đang ngoại tuyến — đang xem dữ liệu đã lưu
          </p>
        ) : null}

        {waiting ? (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-soft px-4 py-3">
            <p className="text-[13.5px] text-muted">
              Đang chờ{' '}
              <span className="font-semibold text-text">{rightName}</span> tham
              gia
            </p>
            <button
              type="button"
              disabled={!inviteCode}
              className="shrink-0 text-[13.5px] font-semibold text-accent disabled:opacity-50"
              onClick={() => inviteCode && void shareInvite(inviteCode)}
            >
              Mời lại
            </button>
          </div>
        ) : null}

        <Link
          to="/eat"
          className="flex w-full items-center gap-3.5 rounded-2xl border border-border bg-surface p-3.5 text-left"
        >
          <span aria-hidden className="text-2xl">
            🍜
          </span>
          <span className="min-w-0">
            <b className="block text-[15px] font-semibold text-text">
              Tối nay ăn gì?
            </b>
            <small className="block text-[12.5px] text-muted">
              Quay một cái cho khỏi cãi nhau
            </small>
          </span>
          <span aria-hidden className="ml-auto text-muted">
            ›
          </span>
        </Link>

        {agenda.length > 0 ? (
          <section className="mt-6">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[11px] font-bold tracking-[0.13em] text-muted uppercase">
                Sắp tới
              </h2>
              <Link to="/plan" className="text-[11.5px] text-accent">
                Xem tất cả
              </Link>
            </div>
            <ul className="mt-2.5 flex flex-col gap-2">
              {agenda.slice(0, 2).map((item) => (
                <li key={item.id}>
                  <Link
                    to="/plan"
                    className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3.5"
                  >
                    <span aria-hidden className="text-xl">
                      {item.emoji ?? '📅'}
                    </span>
                    <b className="min-w-0 flex-1 truncate text-[15px] font-semibold text-text">
                      {item.title}
                    </b>
                    <span className="shrink-0 text-[13px] font-medium text-accent">
                      {countdownLabel(item.days_away)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {summary && summary.outing_count > 0 ? (
          <Link
            to="/expenses"
            className="mt-6 flex items-center gap-4 rounded-2xl border border-border bg-surface p-4"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-bold tracking-[0.13em] text-muted uppercase">
                Tháng này
              </span>
              <span className="mt-1 block text-[13.5px] text-muted">
                <b className="text-[17px] font-bold text-text">
                  {summary.outing_count}
                </b>{' '}
                khoản ·{' '}
                <b className="text-[17px] font-bold text-text">
                  {formatShortVnd(summary.total_minor)}
                </b>
              </span>
            </span>
            <span aria-hidden className="text-muted">
              ›
            </span>
          </Link>
        ) : null}

        {activeGoal ? (
          <Link
            to={`/plan/goals/${activeGoal.id}`}
            className="mt-3 block rounded-2xl border border-border bg-surface p-4"
          >
            <span className="block text-[11px] font-bold tracking-[0.13em] text-muted uppercase">
              Mục tiêu
            </span>
            <span className="mt-1.5 flex items-center gap-2">
              <span aria-hidden>{activeGoal.emoji ?? '✨'}</span>
              <b className="min-w-0 flex-1 truncate text-[15px] font-semibold text-text">
                {activeGoal.title}
              </b>
              <span className="shrink-0 text-[12.5px] text-muted tabular-nums">
                {goalProgress(activeGoal).label}
              </span>
            </span>
            <span className="mt-2 block h-[7px] overflow-hidden rounded-full bg-soft">
              <span
                className="block h-full rounded-full bg-accent"
                style={{
                  width: `${Math.round(goalProgress(activeGoal).ratio * 100)}%`,
                }}
              />
            </span>
          </Link>
        ) : null}

        <section className="mt-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[11px] font-bold tracking-[0.13em] text-muted uppercase">
              Kỉ niệm gần đây
            </h2>
            {posts.length > 0 ? (
              <Link to="/timeline" className="text-[11.5px] text-accent">
                Xem tất cả
              </Link>
            ) : null}
          </div>

          {posts.length === 0 ? (
            <p className="py-8 text-center text-[13.5px] leading-relaxed text-muted">
              {waiting
                ? `Khi ${rightName} vào, tụi mình mở khoá dòng thời gian và mọi thứ còn lại.`
                : 'Chưa có kỉ niệm nào. Bấm nút + để thêm tấm đầu tiên.'}
            </p>
          ) : (
            <div className="mt-2.5 grid grid-cols-4 gap-1.5">
              {posts
                .flatMap((p) => p.media.map((m) => ({ postId: p.id, m })))
                .slice(0, 4)
                .map(({ postId, m }) => (
                  <Link
                    key={m.id}
                    to={`/timeline/${postId}`}
                    className="aspect-square overflow-hidden rounded-xl bg-soft"
                  >
                    <img
                      src={m.url}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </Link>
                ))}
            </div>
          )}
        </section>

        <div className="mt-7 flex justify-center">
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="rounded-full border border-border px-4 py-2 text-xs font-medium text-muted transition active:scale-95 disabled:opacity-50"
          >
            {isFetching ? 'Đang tải lại...' : 'Tải lại'}
          </button>
        </div>
      </div>
  </div>
  )
}
