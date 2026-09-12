import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useAlbums } from '../../hooks/useAlbums'
import { usePosts } from '../../hooks/usePosts'
import { supabase } from '../../lib/supabase'
import { formatDay } from '../../lib/formatDate'
import { PREVIEW } from '../../dev/preview'
import { Loading, Screen, Stage, Title, TopBar } from '../../components/ui'
import { btn } from '../../lib/ui-classes'

export function AlbumDetailScreen() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { albums, isLoading } = useAlbums()
  const { posts } = usePosts()
  const [editing, setEditing] = useState(false)

  const album = albums.find((a) => a.id === id)

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['albums'] })

  async function rename() {
    if (!album || PREVIEW) return
    const title = window.prompt('Đổi tên album', album.title)?.trim()
    if (!title || title === album.title) return
    await supabase.from('albums').update({ title }).eq('id', album.id)
    await refresh()
  }

  /** Tách một bài khỏi album. Bài vẫn còn nguyên trong Timeline —
   *  album chỉ là cách xem, bỏ khỏi đây không xoá kỉ niệm nào. */
  async function removePost(postId: string) {
    if (!album || PREVIEW) return
    await supabase
      .from('album_posts')
      .delete()
      .eq('album_id', album.id)
      .eq('post_id', postId)

    // Sửa một album tự gom là biến nó thành album của mình: từ đó app
    // không gom đè lên nữa.
    if (album.source !== 'manual') {
      await supabase.from('albums').update({ source: 'manual' }).eq('id', album.id)
    }
    await refresh()
  }

  async function remove() {
    if (!album || PREVIEW) return
    if (!window.confirm('Xoá album này? Kỉ niệm bên trong vẫn còn.')) return
    await supabase
      .from('albums')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', album.id)
    await refresh()
    navigate('/albums', { replace: true })
  }

  if (isLoading) return <Loading />

  if (!album) {
    return (
      <Screen>
        <TopBar to="/albums" />
        <Stage>
          <Title>Không tìm thấy album</Title>
        </Stage>
      </Screen>
    )
  }

  const ordered = [...album.album_posts].sort((a, b) => a.position - b.position)
  const items = ordered
    .map((link) => posts.find((p) => p.id === link.post_id))
    .filter((p): p is NonNullable<typeof p> => !!p)

  return (
    <Screen>
      <TopBar to="/albums" />
      <Stage>
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <Title>{album.title}</Title>
            <p className="mt-1 text-[13px] text-muted">
              {items.length} kỉ niệm
              {album.source === 'manual' ? '' : ' · app tự gom'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void rename()}
            className="shrink-0 pt-1 text-[13px] font-semibold text-accent"
          >
            Đổi tên
          </button>
        </div>

        {items.length === 0 ? (
          <p className="mt-8 text-center text-[14px] leading-relaxed text-muted">
            Album này chưa có kỉ niệm nào.
          </p>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              className="mt-4 self-start text-[13px] font-medium text-muted"
            >
              {editing ? 'Xong' : 'Sửa nội dung'}
            </button>

            <ul className="mt-3 grid grid-cols-3 gap-1.5">
              {items.map((post) => (
                <li key={post.id} className="relative">
                  <Link
                    to={`/timeline/${post.id}`}
                    className="block aspect-square overflow-hidden rounded-xl bg-soft"
                  >
                    {post.media[0]?.url ? (
                      <img
                        src={post.media[0].url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-[10px] text-muted">
                        {formatDay(post.happened_on)}
                      </span>
                    )}
                  </Link>
                  {editing ? (
                    <button
                      type="button"
                      aria-label="Tách khỏi album"
                      onClick={() => void removePost(post.id)}
                      className="absolute top-1 right-1 grid h-6 w-6 place-items-center rounded-full bg-black/55 text-xs text-white"
                    >
                      ✕
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="mt-auto pt-8">
          <button
            type="button"
            onClick={() => void remove()}
            className={btn.ghost}
          >
            Xoá album này
          </button>
          <p className="mt-1 text-center text-[12px] text-muted">
            Kỉ niệm bên trong không bị xoá.
          </p>
        </div>
      </Stage>
    </Screen>
  )
}
