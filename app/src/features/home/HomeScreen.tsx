import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useCouple } from '../../hooks/useCouple'
import { useMyProfile } from '../../hooks/useMyProfile'
import { useSession } from '../../hooks/useSession'
import { daysTogether, nextMilestone } from '../../lib/dateCount'
import { shareInvite } from '../../lib/inviteShare'
import { supabase } from '../../lib/supabase'
import { Loading, Group, Row } from '../../components/ui'
import { useRecentPosts } from '../../hooks/usePosts'
import { useAgenda } from '../../hooks/useAgenda'
import { countdownLabel } from '../../lib/recurrence'
import { useExpenses } from '../../hooks/useExpenses'
import { goalProgress, useGoals } from '../../hooks/useGoals'
import { formatShortVnd } from '../../lib/money'
import { todayYmd } from '../../lib/dateCount'
import { wrappedSeason } from '../../lib/wrappedSeason'
import { coverGradient } from '../../lib/coupleTheme'
import {
  IconAlbum,
  IconBowl,
  IconCalendar,
  IconChevronRight,
  IconDice,
  IconGift,
  IconLetter,
  IconMap,
  IconMood,
  IconQuestion,
  IconSettings,
  IconSparkle,
  IconTarget,
} from '../../components/icons'

export function HomeScreen() {
  const { user } = useSession()
  const { couple, refetch, isLoading, isFetching } = useCouple()
  const { profile } = useMyProfile()
  const myTheme = profile?.color_theme ?? couple?.theme
  const posts = useRecentPosts(6)
  const { agenda } = useAgenda(2)
  const { summary } = useExpenses(`${todayYmd().slice(0, 7)}-01`)
  const { goals } = useGoals()
  const activeGoal = goals.find((g) => g.status === 'active')
  const [offline, setOffline] = useState(!navigator.onLine)
  const season = wrappedSeason(todayYmd())
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
        className="top-safe relative flex min-h-[calc(44svh/var(--ui-scale))] flex-col justify-end px-5 pb-7 text-center text-white"
        style={
          couple.cover_url
            ? {
                backgroundImage: `linear-gradient(to bottom, rgba(28,20,25,.15), rgba(28,20,25,.62)), url(${couple.cover_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : // Chưa đặt ảnh bìa thì dùng gradient theo màu của space
              { backgroundImage: coverGradient(myTheme) }
        }
      >
        <Link
          to="/settings"
          aria-label="Cài đặt"
          className="absolute right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm transition active:scale-95"
          style={{ top: 'calc(env(safe-area-inset-top) + 0.5rem)' }}
        >
          <IconSettings size={19} />
        </Link>

        <p className="text-[15px] font-semibold opacity-95">
          {leftName} <span aria-hidden className="opacity-60">&amp;</span>{' '}
          {rightName}
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

      <div className="mx-auto w-full max-w-[calc(28rem/var(--ui-scale))] px-4 pt-4 pb-6">
        {offline ? (
          <p className="mb-3 rounded-xl bg-soft px-4 py-2.5 text-center text-xs text-muted">
            Đang ngoại tuyến — đang xem dữ liệu đã lưu
          </p>
        ) : null}

        {waiting ? (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-soft px-4 py-3">
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

        {season.visible ? (
          <Link
            to="/wrapped"
            className="mb-3 flex items-center gap-3 rounded-xl border border-accent/30 bg-soft p-4"
          >
            <IconSparkle size={22} className="shrink-0 text-accent" />
            <span className="min-w-0 flex-1">
              <b className="block text-[15px] font-semibold text-text">
                Tổng kết {season.year} đã sẵn sàng
              </b>
              <span className="block text-[12.5px] text-muted">
                {season.final
                  ? `Xem tổng kết ${season.year}`
                  : 'Tạm tính · chốt 31/12'}
              </span>
            </span>
            <IconChevronRight size={17} className="shrink-0 text-muted" />
          </Link>
        ) : null}

        {/* Một khối chung, không phải tám thẻ rời.
            Trước đây mỗi lối tắt là một thẻ có viền riêng. Tám cái hộp giống
            hệt nhau xếp thành lưới làm màn hình vụn ra, mà viền thì vẽ thêm
            tám đường kẻ chẳng phân biệt được gì — chúng nó vốn là một nhóm,
            nên vẽ một khung cho cả nhóm. */}
        <nav className="grid grid-cols-4 gap-y-1 overflow-hidden rounded-xl border border-border bg-surface py-2">
          {[
            { to: '/question', Icon: IconQuestion, label: 'Câu hỏi' },
            { to: '/mood', Icon: IconMood, label: 'Tâm trạng' },
            { to: '/letters', Icon: IconLetter, label: 'Thư' },
            { to: '/eat/spin', Icon: IconDice, label: 'Quay ăn' },
            { to: '/map', Icon: IconMap, label: 'Dấu chân' },
            { to: '/wishlist', Icon: IconGift, label: 'Wishlist' },
            { to: '/wrapped', Icon: IconSparkle, label: 'Tổng kết' },
            { to: '/albums', Icon: IconAlbum, label: 'Album' },
          ].map(({ to, Icon, label }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center gap-1.5 rounded-xl py-2.5 text-[11.5px] font-medium text-muted transition active:scale-95"
            >
              <Icon size={22} className="text-accent" />
              {label}
            </Link>
          ))}
        </nav>

        <Link
          to="/eat"
          className="mt-3 flex w-full items-center gap-3.5 rounded-xl border border-border bg-surface p-3.5 text-left"
        >
          <IconBowl size={22} className="shrink-0 text-accent" />
          <span className="min-w-0">
            <b className="block text-[15px] font-semibold text-text">
              Tối nay ăn gì?
            </b>
            <small className="block text-[12.5px] text-muted">
              Chọn quán / món tối nay
            </small>
          </span>
          <IconChevronRight size={17} className="ml-auto shrink-0 text-muted" />
        </Link>

        {agenda.length > 0 ? (
          <section className="mt-6">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[14px] font-semibold text-text">
                Sắp tới
              </h2>
              <Link to="/plan" className="text-[11.5px] text-accent">
                Xem tất cả
              </Link>
            </div>
            {/* Cùng một danh sách thì vẽ một khung, ngăn nhau bằng đường kẻ.
                Mỗi mục một thẻ viền riêng làm chúng nó trông như những thứ
                chẳng liên quan gì tới nhau. */}
            <Group className="mt-2.5">
              {agenda.slice(0, 2).map((item) => (
                <Row key={item.id}>
                  <Link to="/plan" className="flex items-center gap-3">
                    {item.emoji ? (
                      <span aria-hidden className="text-xl">
                        {item.emoji}
                      </span>
                    ) : (
                      <IconCalendar size={20} className="text-muted" />
                    )}
                    <b className="min-w-0 flex-1 truncate text-[15px] font-semibold text-text">
                      {item.title}
                    </b>
                    <span className="shrink-0 text-[13px] font-medium text-accent">
                      {countdownLabel(item.days_away)}
                    </span>
                  </Link>
                </Row>
              ))}
            </Group>
          </section>
        ) : null}

        {summary && summary.outing_count > 0 ? (
          <Link
            to="/expenses"
            className="mt-6 flex items-center gap-4 rounded-xl border border-border bg-surface p-4"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-medium text-muted">
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
            <IconChevronRight size={17} className="shrink-0 text-muted" />
          </Link>
        ) : null}

        {activeGoal ? (
          <Link
            to={`/plan/goals/${activeGoal.id}`}
            className="mt-3 block rounded-xl border border-border bg-surface p-4"
          >
            <span className="block text-[13px] font-medium text-muted">
              Mục tiêu
            </span>
            <span className="mt-1.5 flex items-center gap-2">
              {activeGoal.emoji ? (
                <span aria-hidden>{activeGoal.emoji}</span>
              ) : (
                <IconTarget size={18} className="text-muted" />
              )}
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
            <h2 className="text-[14px] font-semibold text-text">
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
                ? `Đang chờ ${rightName} tham gia.`
                : 'Chưa có kỉ niệm.'}
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
