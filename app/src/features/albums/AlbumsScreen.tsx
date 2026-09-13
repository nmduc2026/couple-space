import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { TopHeader } from '../../components/AppShell'
import { useCouple } from '../../hooks/useCouple'
import { useSession } from '../../hooks/useSession'
import { usePosts, type Post } from '../../hooks/usePosts'
import { useAlbums, saveAlbum } from '../../hooks/useAlbums'
import {
  groupActivities,
  groupTrips,
  type Suggestion,
} from '../../lib/albumGrouping'
import { provinceByCode } from '../../lib/provinces'
import { formatDay } from '../../lib/formatDate'
import { PREVIEW } from '../../dev/preview'
import { btn } from '../../lib/ui-classes'

export function AlbumsScreen() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { couple } = useCouple()
  const { user } = useSession()
  const { posts, isLoading } = usePosts()
  const { albums } = useAlbums()
  const [saving, setSaving] = useState<string | null>(null)

  const suggestions = useMemo(() => {
    const provinceName = (code: string) => provinceByCode(code)?.name ?? code
    return [...groupTrips(posts, provinceName), ...groupActivities(posts)]
  }, [posts])

  // Gợi ý đã lưu rồi thì không mời lưu lại nữa. So bằng tiêu đề vì đó là
  // thứ duy nhất còn lại sau khi album được lưu.
  const savedTitles = new Set(albums.map((a) => a.title))
  const fresh = suggestions.filter((s) => !savedTitles.has(s.title))

  const coverOf = (postIds: string[]) =>
    posts.find((p) => postIds.includes(p.id) && p.media.length > 0)

  async function keep(s: Suggestion) {
    if (!couple || !user || PREVIEW) return
    setSaving(s.key)
    try {
      const id = await saveAlbum(couple.id, user.id, s.title, s.source, s.postIds)
      await queryClient.invalidateQueries({ queryKey: ['albums'] })
      navigate(`/albums/${id}`)
    } finally {
      setSaving(null)
    }
  }

  async function createEmpty() {
    if (!couple || !user || PREVIEW) return
    const title = window.prompt('Tên album?')?.trim()
    if (!title) return
    const id = await saveAlbum(couple.id, user.id, title, 'manual', [])
    await queryClient.invalidateQueries({ queryKey: ['albums'] })
    navigate(`/albums/${id}`)
  }

  return (
    <>
      <TopHeader
        back="/"
        title="Album"
        right={
          <>
            <Link
              to="/albums/export"
              className="rounded-full border border-border px-3 py-1 text-sm font-semibold text-accent"
            >
              PDF
            </Link>
            <button
              type="button"
              onClick={() => void createEmpty()}
              className="rounded-full bg-accent px-3 py-1 text-sm font-semibold text-on-accent"
            >
              + Tạo
            </button>
          </>
        }
      />

      <div className="flex-1 px-4 py-4">
        {isLoading ? (
          <p className="py-16 text-center text-sm text-muted">Đang tải...</p>
        ) : albums.length === 0 && fresh.length === 0 ? (
          <EmptyState hasPosts={posts.length > 0} />
        ) : (
          <>
            {albums.length > 0 ? (
              <ul className="grid grid-cols-2 gap-3">
                {albums.map((a) => (
                  <li key={a.id}>
                    <Link to={`/albums/${a.id}`} className="block">
                      <Cover post={coverOf(a.album_posts.map((p) => p.post_id))} />
                      <b className="mt-1.5 block truncate text-[14px] font-semibold text-text">
                        {a.title}
                      </b>
                      <span className="block text-[12px] text-muted">
                        {a.album_posts.length} kỉ niệm
                        {a.source === 'manual' ? '' : ' · tự gom'}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}

            {fresh.length > 0 ? (
              <section className={albums.length > 0 ? 'mt-7' : ''}>
                <h2 className="text-[14px] font-semibold text-muted">
                  Gợi ý nhóm
                </h2>
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
                  Chưa lưu — giữ lại cái nào đúng.
                </p>
                <ul className="mt-3 flex flex-col gap-2.5">
                  {fresh.map((s) => (
                    <li
                      key={s.key}
                      className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3"
                    >
                      <Cover post={coverOf(s.postIds)} small />
                      <div className="min-w-0 flex-1">
                        <b className="block truncate text-[14.5px] font-semibold text-text">
                          {s.title}
                        </b>
                        <span className="block text-[12px] text-muted">
                          {s.postIds.length} kỉ niệm ·{' '}
                          {s.startOn === s.endOn
                            ? formatDay(s.startOn)
                            : `${formatDay(s.startOn)} – ${formatDay(s.endOn)}`}
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={saving === s.key}
                        onClick={() => void keep(s)}
                        className="shrink-0 rounded-full border border-border px-3 py-1.5 text-[13px] font-semibold text-accent disabled:opacity-50"
                      >
                        Giữ lại
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </>
        )}
      </div>
    </>
  )
}

function Cover({ post, small = false }: { post?: Post; small?: boolean }) {
  const url = post?.media[0]?.url
  const size = small
    ? 'h-14 w-14 flex-none rounded-xl'
    : 'aspect-square w-full rounded-2xl'

  return url ? (
    <img src={url} alt="" className={`${size} bg-soft object-cover`} />
  ) : (
    <span className={`${size} grid place-items-center bg-soft text-2xl`}>
      <span aria-hidden>🖼️</span>
    </span>
  )
}

function EmptyState({ hasPosts }: { hasPosts: boolean }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <p className="text-5xl" aria-hidden>
        🖼️
      </p>
      <p className="mt-5 text-[17px] font-semibold text-text">
        Chưa có album.
      </p>
      <Link
        to={hasPosts ? '/timeline' : '/compose'}
        className={`${btn.primary} mt-7 max-w-[18rem]`}
      >
        {hasPosts ? 'Xem kỉ niệm' : 'Thêm kỉ niệm'}
      </Link>
    </div>
  )
}
