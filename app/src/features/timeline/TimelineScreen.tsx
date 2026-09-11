import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { TopHeader } from '../../components/AppShell'
import { groupByMonth, usePosts, type Post } from '../../hooks/usePosts'
import { ACTIVITY_LABELS } from '../../lib/activities'
import { btn } from '../../lib/ui-classes'
import { formatDay } from '../../lib/formatDate'

type View = 'cards' | 'grid'

export function TimelineScreen() {
  const [params, setParams] = useSearchParams()
  const view: View = params.get('view') === 'grid' ? 'grid' : 'cards'
  const { posts, isLoading } = usePosts()
  const [activity, setActivity] = useState<string | null>(null)
  const [year, setYear] = useState<string | null>(null)

  const years = useMemo(
    () =>
      [...new Set(posts.map((p) => p.happened_on.slice(0, 4)))].sort().reverse(),
    [posts],
  )

  const filtered = useMemo(
    () =>
      posts.filter(
        (p) =>
          (!activity || p.activity === activity) &&
          (!year || p.happened_on.startsWith(year)),
      ),
    [posts, activity, year],
  )

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

      {posts.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none]">
          <Chip active={!activity && !year} onClick={() => {
            setActivity(null)
            setYear(null)
          }}>
            Tất cả
          </Chip>
          {years.map((y) => (
            <Chip
              key={y}
              active={year === y}
              onClick={() => setYear(year === y ? null : y)}
            >
              {y}
            </Chip>
          ))}
          {Object.entries(ACTIVITY_LABELS).map(([key, meta]) => (
            <Chip
              key={key}
              active={activity === key}
              onClick={() => setActivity(activity === key ? null : key)}
            >
              {meta.emoji} {meta.label}
            </Chip>
          ))}
        </div>
      ) : null}

      <div className="flex-1 px-4 pb-8">
        {isLoading ? (
          <p className="py-16 text-center text-sm text-muted">Đang tải...</p>
        ) : filtered.length === 0 ? (
          <EmptyState hasPosts={posts.length > 0} />
        ) : view === 'grid' ? (
          <GridView posts={filtered} />
        ) : (
          <CardView posts={filtered} />
        )}
      </div>
    </>
  )
}

function Chip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1 text-xs transition ${
        active
          ? 'border-accent bg-accent font-semibold text-on-accent'
          : 'border-border text-muted'
      }`}
    >
      {children}
    </button>
  )
}

function EmptyState({ hasPosts }: { hasPosts: boolean }) {
  if (hasPosts) {
    return (
      <p className="py-20 text-center text-sm text-muted">
        Không có kỉ niệm nào khớp bộ lọc.
      </p>
    )
  }
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <p className="text-5xl" aria-hidden>
        📷
      </p>
      <p className="mt-5 text-[17px] font-semibold text-text">
        Kỉ niệm đầu tiên của hai đứa nằm ở đây nè
      </p>
      <p className="mt-2 max-w-[30ch] text-sm leading-relaxed text-muted">
        Một tấm ảnh, một dòng caption. Người kia sẽ nhận được thông báo ngay.
      </p>
      <Link to="/compose" className={`${btn.primary} mt-7 max-w-[18rem]`}>
        Thêm kỉ niệm đầu tiên
      </Link>
    </div>
  )
}

function CardView({ posts }: { posts: Post[] }) {
  return (
    <div>
      {groupByMonth(posts).map((group) => (
        <section key={group.key}>
          <h2 className="sticky top-[calc(env(safe-area-inset-top)+2.9rem)] z-[5] bg-bg/90 py-2.5 text-[11px] font-bold tracking-[0.13em] text-muted uppercase backdrop-blur">
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
  const cover = post.media[0]
  const activity = post.activity ? ACTIVITY_LABELS[post.activity] : undefined

  return (
    <Link
      to={`/timeline/${post.id}`}
      className="block overflow-hidden rounded-[17px] border border-border bg-surface transition active:scale-[0.995]"
    >
      {cover ? (
        <div className="relative aspect-[4/3] bg-soft">
          <img
            src={cover.url}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
          {post.media.length > 1 ? (
            <span className="absolute right-2.5 bottom-2.5 rounded-full bg-black/55 px-2.5 py-0.5 text-[11.5px] text-white">
              1/{post.media.length}
            </span>
          ) : null}
        </div>
      ) : null}

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
