import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useCouple } from './useCouple'
import { PREVIEW, previewPosts } from '../dev/preview'

export const MEDIA_BUCKET = 'couple-media'

export type PostMedia = {
  id: string
  storage_path: string
  width: number | null
  height: number | null
  position: number
  /** Link ký tạm, sinh lúc đọc — bucket là private nên không có URL cố định */
  url?: string
}

export type Post = {
  id: string
  couple_id: string
  author_id: string
  caption: string | null
  happened_on: string
  place_name: string | null
  place_lat: number | null
  place_lng: number | null
  /** Tỉnh/thành đã chốt cho bài này, nếu có. Bản đồ tin cột này trước hết. */
  province_code: string | null
  activity: string | null
  created_at: string
  media: PostMedia[]
  reaction_count: number
  liked_by_me: boolean
  comment_count: number
}

type Row = {
  id: string
  couple_id: string
  author_id: string
  caption: string | null
  happened_on: string
  place_name: string | null
  place_lat: number | null
  place_lng: number | null
  province_code: string | null
  activity: string | null
  created_at: string
  post_media: Omit<PostMedia, 'url'>[]
  reactions: { user_id: string }[]
  comments: { id: string }[]
}

/** Đổi đường dẫn trong Storage thành link xem được, theo lô một lần gọi. */
export async function signMedia(paths: string[], ttlSeconds = 3600) {
  if (paths.length === 0) return new Map<string, string>()
  const { data, error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .createSignedUrls(paths, ttlSeconds)
  if (error) throw error
  const map = new Map<string, string>()
  for (const row of data ?? []) {
    if (row.path && row.signedUrl) map.set(row.path, row.signedUrl)
  }
  return map
}

function toPost(row: Row, urls: Map<string, string>, myId: string): Post {
  return {
    id: row.id,
    couple_id: row.couple_id,
    author_id: row.author_id,
    caption: row.caption,
    happened_on: row.happened_on,
    place_name: row.place_name,
    place_lat: row.place_lat,
    place_lng: row.place_lng,
    province_code: row.province_code,
    activity: row.activity,
    created_at: row.created_at,
    media: [...row.post_media]
      .sort((a, b) => a.position - b.position)
      .map((m) => ({ ...m, url: urls.get(m.storage_path) })),
    reaction_count: row.reactions.length,
    liked_by_me: row.reactions.some((r) => r.user_id === myId),
    comment_count: row.comments.length,
  }
}

export async function fetchPosts(coupleId: string, myId: string) {
  const { data, error } = await supabase
    .from('posts')
    .select(
      'id, couple_id, author_id, caption, happened_on, place_name,' +
        ' place_lat, place_lng, province_code, activity, created_at,' +
        ' post_media(id, storage_path, width, height, position),' +
        ' reactions(user_id), comments(id)',
    )
    .eq('couple_id', coupleId)
    .is('deleted_at', null)
    .order('happened_on', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  const rows = (data ?? []) as unknown as Row[]
  const urls = await signMedia(
    rows.flatMap((r) => r.post_media.map((m) => m.storage_path)),
  )
  return rows.map((r) => toPost(r, urls, myId))
}

export function usePosts() {
  const { couple } = useCouple()
  const coupleId = couple?.id
  const myId = couple?.members[0]?.user_id ?? ''

  const query = useQuery({
    queryKey: ['posts', coupleId],
    enabled: !!coupleId && !PREVIEW,
    queryFn: () => fetchPosts(coupleId!, myId),
  })

  if (PREVIEW) {
    return { posts: previewPosts(), isLoading: false, error: null }
  }

  return {
    posts: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  }
}

/** Gom bài theo tháng để timeline có tiêu đề dính. */
export function groupByMonth(posts: Post[]) {
  const groups: Array<{ key: string; label: string; posts: Post[] }> = []
  for (const post of posts) {
    const key = post.happened_on.slice(0, 7)
    let group = groups.find((g) => g.key === key)
    if (!group) {
      const [y, m] = key.split('-')
      group = { key, label: `Tháng ${Number(m)}, ${y}`, posts: [] }
      groups.push(group)
    }
    group.posts.push(post)
  }
  return groups
}
