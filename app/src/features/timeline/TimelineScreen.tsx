import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { TopHeader } from '../../components/AppShell'
import { EmptyState, InlineLoading } from '../../components/EmptyState'
import { PhotoCarousel } from '../../components/PhotoCarousel'
import { ConfirmSheet } from '../../components/ui'
import { useCouple } from '../../hooks/useCouple'
import {
  groupByMonth,
  useInfinitePosts,
  usePostPlaces,
  usePostYears,
  type Post,
} from '../../hooks/usePosts'
import { useSession } from '../../hooks/useSession'
import { TimelineFilters, type TimeFilter } from './TimelineFilters'
import { ACTIVITY_LABELS } from '../../lib/activities'
import { formatDay, formatPostTime } from '../../lib/formatDate'
import { PREVIEW } from '../../dev/preview'
import { supabase } from '../../lib/supabase'

type View = 'cards' | 'grid'

export function TimelineScreen() {
  const [params, setParams] = useSearchParams()
  const view: View = params.get('view') === 'grid' ? 'grid' : 'cards'
  const [time, setTime] = useState<TimeFilter>({ kind: 'all' })
  const [activities, setActivities] = useState<string[]>([])

  // Lọc theo nơi chốn đến từ màn Dấu chân, nên nằm ở URL chứ không ở state:
  // bấm quay lại rồi vào lại vẫn giữ nguyên chỗ đang xem.
  const province = params.get('province')
  const place = params.get('place')

  const years = usePostYears()
  const { places, provinces } = usePostPlaces()
  const {
    posts,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfinitePosts({
    year: time.kind === 'year' ? time.year : null,
    activities,
    place,
    province,
  })

  // Tải thêm khi chạm đáy. Dùng IntersectionObserver chứ không nghe sự kiện
  // cuộn: trình duyệt tự báo, không phải tính toán ở mỗi khung hình.
  const sentinel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const node = sentinel.current
    if (!node || !hasNextPage) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) void fetchNextPage()
      },
      // Nạp trước khi người dùng chạm đáy hẳn, để cuộn không bị khựng
      { rootMargin: '400px' },
    )
    io.observe(node)
    return () => io.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  /** Nơi chốn nằm ở URL để đi từ Dấu chân sang vẫn giữ được, và để bấm quay
   *  lại là về đúng chỗ cũ. */
  function setPlaceFilter(next: {
    place?: string | null
    province?: string | null
  }) {
    const p = new URLSearchParams(params)
    for (const key of ['place', 'province'] as const) {
      const value = next[key]
      if (value) p.set(key, value)
      else p.delete(key)
    }
    setParams(p, { replace: true })
  }

  function setView(next: View) {
    const p = new URLSearchParams(params)
    if (next === 'grid') p.set('view', 'grid')
    else p.delete('view')
    setParams(p, { replace: true })
  }

  return (
    <>
      <TopHeader
        title="Kỉ niệm"
        right={
          <div className="flex overflow-hidden rounded-full border border-border">
            {(
              [
                ['cards', '☰'],
                ['grid', '▦'],
              ] as const
            ).map(([value, icon]) => (
              <button
                key={value}
                type="button"
                aria-label={value === 'cards' ? 'Dạng thẻ' : 'Dạng lưới'}
                aria-pressed={view === value}
                onClick={() => setView(value)}
                className={`px-3 py-1 text-sm ${
                  view === value
                    ? 'bg-accent text-on-accent'
                    : 'text-muted'
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
        }
      />

      {years.length > 0 ? (
        <TimelineFilters
          years={years}
          time={time}
          onTime={setTime}
          activities={activities}
          onActivities={setActivities}
          places={places}
          provinces={provinces}
          place={place}
          province={province}
          onPlace={setPlaceFilter}
        />
      ) : null}

      <div className="flex-1 px-4 pb-8">
        {isLoading ? (
          <InlineLoading />
        ) : posts.length === 0 ? (
          // `posts` giờ là kết quả ĐÃ LỌC nên luôn rỗng ở nhánh này; `years`
          // lấy từ toàn bộ bài nên mới phân biệt được "chưa có kỉ niệm nào"
          // với "lọc không ra gì".
          years.length > 0 ? (
            <p className="py-20 text-center text-sm text-muted">
              Không có kỉ niệm nào khớp bộ lọc.
            </p>
          ) : (
            <EmptyState
              emoji="📷"
              title="Chưa có kỉ niệm"
              action={{ type: 'link', to: '/compose', label: 'Thêm' }}
            />
          )
        ) : view === 'grid' ? (
          <GridView posts={posts} />
        ) : (
          <CardView posts={posts} />
        )}

        {/* Mốc chạm đáy: thấy nó là nạp trang tiếp theo */}
        <div ref={sentinel} aria-hidden className="h-px" />
        {isFetchingNextPage ? (
          <p className="py-6 text-center text-sm text-muted">Đang tải thêm...</p>
        ) : null}
      </div>
    </>
  )
}

function CardView({ posts }: { posts: Post[] }) {
  return (
    <div>
      {groupByMonth(posts).map((group) => (
        <section key={group.key}>
          <h2 className="sticky top-[calc(env(safe-area-inset-top)+2.9rem)] z-[5] -mx-4 bg-bg/40 px-4 py-2 text-[13.5px] font-semibold tracking-[-0.01em] text-text backdrop-blur-md">
            {group.label}
          </h2>
          <div className="flex flex-col gap-3.5 pb-3">
            {group.posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function PostCard({ post }: { post: Post }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useSession()
  const { couple } = useCouple()
  const activity = post.activity ? ACTIVITY_LABELS[post.activity] : undefined
  const authorName =
    couple?.members.find((m) => m.user_id === post.author_id)?.nickname ?? '?'
  const initial = authorName.slice(0, 1).toUpperCase()
  const mine = post.author_id === user?.id

  const [menuOpen, setMenuOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(false)
  const menuBox = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: MouseEvent) => {
      if (!menuBox.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  async function removePost() {
    if (PREVIEW) return
    const stamp = new Date().toISOString()
    await supabase
      .from('posts')
      .update({ deleted_at: stamp })
      .eq('id', post.id)
    await supabase
      .from('expenses')
      .update({ post_id: null })
      .eq('post_id', post.id)
      .is('deleted_at', null)
    await queryClient.invalidateQueries({ queryKey: ['posts'] })
    await queryClient.invalidateQueries({ queryKey: ['expenses'] })
    await queryClient.invalidateQueries({ queryKey: ['expense_summary'] })
  }

  return (
    <article className="relative rounded-xl border border-border bg-surface">
      <div className="flex gap-2.5 px-3.5 pt-3 pb-2">
        <Link
          to={`/timeline/${post.id}`}
          className="flex min-w-0 flex-1 gap-2.5 transition active:opacity-80"
        >
          <span
            aria-hidden
            className="grid h-9 w-9 flex-none place-items-center self-start rounded-full bg-soft text-sm font-bold text-accent"
          >
            {initial}
          </span>
          <span className="min-w-0 pt-0.5">
            <span className="block truncate text-[14px] leading-none font-semibold text-text">
              {authorName}
            </span>
            <span className="mt-1 block text-[12px] leading-none text-muted">
              {formatPostTime(post.created_at)}
            </span>
          </span>
        </Link>

        {mine ? (
          <div ref={menuBox} className="relative -mt-0.5 -mr-1.5 flex-none self-start">
            <button
              type="button"
              aria-label="Tuỳ chọn"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className={`grid h-8 w-8 place-items-center rounded-full border text-[16px] leading-none text-muted transition active:scale-95 ${
                menuOpen ? 'border-accent text-text' : 'border-transparent'
              }`}
            >
              ⋯
            </button>
            {menuOpen ? (
              <div
                role="menu"
                className="absolute top-full right-0 z-30 mt-1 min-w-[10.5rem] overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-xl"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false)
                    navigate(`/timeline/${post.id}?edit=1`)
                  }}
                  className="flex w-full px-3.5 py-2.5 text-left text-[14px] font-medium text-text active:bg-soft"
                >
                  Cập nhật
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false)
                    setPendingDelete(true)
                  }}
                  className="flex w-full px-3.5 py-2.5 text-left text-[14px] font-medium text-accent active:bg-soft"
                >
                  Xoá
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {post.media.length > 0 ? (
        <PhotoCarousel
          items={post.media}
          className="aspect-[4/3] w-full"
          autoPlayMs={5000}
          showArrows={post.media.length > 1}
          showDots={post.media.length > 1}
          showCounter={post.media.length > 1}
          blockLinkOnGesture
          lazy
          onOpen={() => navigate(`/timeline/${post.id}`)}
        />
      ) : null}

      <Link
        to={`/timeline/${post.id}`}
        className="block transition active:scale-[0.995]"
      >
        <div className="px-3.5 py-3">
          {post.caption ? (
            <p className="mb-1.5 text-[14.5px] leading-relaxed text-text">
              {post.caption}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
            <span>{formatDay(post.happened_on)}</span>
            {post.place_name ? <span>📍 {post.place_name}</span> : null}
            {activity ? (
              <span>
                {activity.emoji} {activity.label}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex gap-4 border-t border-border px-3.5 py-2 text-[13px] text-muted">
          <span className={post.liked_by_me ? 'text-accent' : undefined}>
            {post.liked_by_me ? '❤️' : '🤍'} {post.reaction_count}
          </span>
          <span>💬 {post.comment_count}</span>
        </div>
      </Link>

      {pendingDelete ? (
        <ConfirmSheet
          title="Xoá kỉ niệm này?"
          confirmLabel="Xoá"
          onConfirm={() => {
            setPendingDelete(false)
            void removePost()
          }}
          onCancel={() => setPendingDelete(false)}
        />
      ) : null}
    </article>
  )
}

function GridView({ posts }: { posts: Post[] }) {
  const tiles = posts.flatMap((p) =>
    p.media.map((m) => ({ postId: p.id, media: m })),
  )
  return (
    <div className="grid grid-cols-3 gap-1 py-1">
      {tiles.map(({ postId, media }) => (
        <Link
          key={media.id}
          to={`/timeline/${postId}`}
          className="aspect-square overflow-hidden rounded bg-soft"
        >
          <img
            src={media.url}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </Link>
      ))}
    </div>
  )
}
