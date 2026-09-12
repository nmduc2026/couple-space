import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
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
  /** Phường/xã và quận/huyện — chỉ có khi bài được tạo bằng "Lấy vị trí". */
  ward: string | null
  district: string | null
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
  ward: string | null
  district: string | null
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
    ward: row.ward,
    district: row.district,
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
        ' place_lat, place_lng, province_code, ward, district, activity, created_at,' +
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

export type PostFilters = {
  /** Năm, dạng "2026". Rỗng nghĩa là mọi lúc. */
  year?: string | null
  /** Khoá hoạt động. Rỗng nghĩa là mọi hoạt động. */
  activities?: string[]
  /** Tên địa điểm khớp chính xác, đến từ màn Dấu chân. */
  place?: string | null
  /** Mã tỉnh. Dựa vào `posts.province_code`, cột này do màn Dấu chân ghi. */
  province?: string | null
}

const PAGE_SIZE = 12

const SELECT =
  'id, couple_id, author_id, caption, happened_on, place_name,' +
  ' place_lat, place_lng, province_code, ward, district, activity, created_at,' +
  ' post_media(id, storage_path, width, height, position),' +
  ' reactions(user_id), comments(id)'

/**
 * Timeline theo trang, mới nhất trước.
 *
 * Vì sao không lọc ở client như trước: lọc sau khi đã tải thì chỉ lọc được
 * trong những trang đã tải về — chọn "năm 2025" khi mới tải 12 bài của 2026 sẽ
 * ra danh sách rỗng dù dữ liệu có thật. Lọc phải nằm cùng chỗ với phân trang.
 */
export function useInfinitePosts(filters: PostFilters) {
  const { couple } = useCouple()
  const coupleId = couple?.id
  const myId = couple?.members[0]?.user_id ?? ''

  const { year, place, province } = filters
  const activities = filters.activities ?? []
  // Mảng vào queryKey phải ổn định, nếu không mỗi lần render là một khoá mới
  const activityKey = [...activities].sort().join(',')

  const query = useInfiniteQuery({
    queryKey: ['posts', coupleId, { year, activityKey, place, province }],
    enabled: !!coupleId && !PREVIEW,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      let q = supabase
        .from('posts')
        .select(SELECT)
        .eq('couple_id', coupleId!)
        .is('deleted_at', null)

      if (year) {
        q = q.gte('happened_on', `${year}-01-01`).lte('happened_on', `${year}-12-31`)
      }
      if (activities.length > 0) q = q.in('activity', activities)
      if (place) q = q.eq('place_name', place)
      if (province) q = q.eq('province_code', province)

      const { data, error } = await q
        .order('happened_on', { ascending: false })
        .order('created_at', { ascending: false })
        .range(pageParam, pageParam + PAGE_SIZE - 1)

      if (error) throw error
      const rows = (data ?? []) as unknown as Row[]
      const urls = await signMedia(
        rows.flatMap((r) => r.post_media.map((m) => m.storage_path)),
      )
      return rows.map((r) => toPost(r, urls, myId))
    },
    getNextPageParam: (lastPage, allPages) =>
      // Trang cuối chưa đầy nghĩa là hết dữ liệu
      lastPage.length < PAGE_SIZE
        ? undefined
        : allPages.reduce((n, page) => n + page.length, 0),
  })

  if (PREVIEW) {
    const all = previewPosts().filter(
      (p) =>
        (!year || p.happened_on.startsWith(year)) &&
        (activities.length === 0 || activities.includes(p.activity ?? '')) &&
        (!place || p.place_name?.trim() === place),
    )
    return {
      posts: all,
      isLoading: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: () => {},
    }
  }

  return {
    posts: (query.data?.pages ?? []).flat(),
    isLoading: query.isLoading,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
  }
}

/** Những năm có kỉ niệm. Chỉ lấy đúng cột ngày nên nhẹ, không cần phân trang. */
export function usePostYears() {
  const { couple } = useCouple()
  const query = useQuery({
    queryKey: ['post_years', couple?.id],
    enabled: !!couple?.id && !PREVIEW,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('happened_on')
        .eq('couple_id', couple!.id)
        .is('deleted_at', null)
        .order('happened_on', { ascending: false })
      if (error) throw error
      return [
        ...new Set((data ?? []).map((r) => (r.happened_on as string).slice(0, 4))),
      ]
    },
  })

  if (PREVIEW) {
    return [...new Set(previewPosts().map((p) => p.happened_on.slice(0, 4)))]
  }
  return query.data ?? []
}

/** Những nơi đã đi, để làm bộ lọc trên Timeline mà không phải tải hết bài.
 *  Chỉ lấy ba cột nên nhẹ. */
export function usePostPlaces() {
  const { couple } = useCouple()
  const query = useQuery({
    queryKey: ['post_places', couple?.id],
    enabled: !!couple?.id && !PREVIEW,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('place_name, province_code')
        .eq('couple_id', couple!.id)
        .is('deleted_at', null)
        .not('place_name', 'is', null)
      if (error) throw error

      const rows = (data ?? []) as Array<{
        place_name: string | null
        province_code: string | null
      }>
      const places = new Map<string, number>()
      const provinces = new Map<string, number>()
      for (const r of rows) {
        const name = r.place_name?.trim()
        if (name) places.set(name, (places.get(name) ?? 0) + 1)
        if (r.province_code) {
          provinces.set(r.province_code, (provinces.get(r.province_code) ?? 0) + 1)
        }
      }
      const sort = (m: Map<string, number>) =>
        [...m.entries()]
          .map(([key, count]) => ({ key, count }))
          .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))

      return { places: sort(places), provinces: sort(provinces) }
    },
  })

  if (PREVIEW) {
    const names = [
      ...new Set(
        previewPosts()
          .map((p) => p.place_name?.trim())
          .filter((n): n is string => !!n),
      ),
    ]
    return {
      places: names.map((key) => ({ key, count: 1 })),
      provinces: [] as Array<{ key: string; count: number }>,
    }
  }
  return query.data ?? { places: [], provinces: [] }
}

/** Vài bài mới nhất — cho khối "Kỉ niệm gần đây" ở Home.
 *  Home chỉ hiện 4 ảnh mà trước đây tải TOÀN BỘ bài về để cắt lấy 4. */
export function useRecentPosts(limit = 4) {
  const { couple } = useCouple()
  const coupleId = couple?.id
  const myId = couple?.members[0]?.user_id ?? ''

  const query = useQuery({
    queryKey: ['posts', coupleId, { recent: limit }],
    enabled: !!coupleId && !PREVIEW,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(SELECT)
        .eq('couple_id', coupleId!)
        .is('deleted_at', null)
        .order('happened_on', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      const rows = (data ?? []) as unknown as Row[]
      const urls = await signMedia(
        rows.flatMap((r) => r.post_media.map((m) => m.storage_path)),
      )
      return rows.map((r) => toPost(r, urls, myId))
    },
  })

  if (PREVIEW) return previewPosts().slice(0, limit)
  return query.data ?? []
}

/** Một bài theo id. Màn chi tiết trước đây duyệt cả danh sách để tìm đúng
 *  một bài — tải về hàng trăm bài để dùng một. */
export function usePost(id: string | undefined) {
  const { couple } = useCouple()
  const myId = couple?.members[0]?.user_id ?? ''

  const query = useQuery({
    queryKey: ['post', id],
    enabled: !!id && !PREVIEW,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(SELECT)
        .eq('id', id!)
        .is('deleted_at', null)
        .maybeSingle()
      if (error) throw error
      if (!data) return null
      const row = data as unknown as Row
      const urls = await signMedia(row.post_media.map((m) => m.storage_path))
      return toPost(row, urls, myId)
    },
  })

  if (PREVIEW) return { post: previewPosts().find((p) => p.id === id) ?? null, isLoading: false }
  return { post: query.data ?? null, isLoading: query.isLoading }
}
