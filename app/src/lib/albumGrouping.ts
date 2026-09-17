/* Gom bài thành album gợi ý.
 *
 * Album là một CÁCH XEM, không phải bản sao ảnh — xem
 * docs/features/p6-albums-export.md. Vì vậy gợi ý ở đây chỉ là danh sách id
 * bài; lưu thành album thật thì ghi vào `album_posts`, không đụng tới ảnh.
 */

import { ACTIVITY_LABELS } from './activities'

export type PostLike = {
  id: string
  happened_on: string
  activity: string | null
  admin_unit_id: string | null
}

export type Suggestion = {
  /** Khoá ổn định để so với album đã lưu và làm React key. */
  key: string
  title: string
  source: 'auto_trip' | 'auto_activity'
  postIds: string[]
  startOn: string
  endOn: string
}

/** Ít hơn ngần này bài thì chưa thành một album đáng gom. */
const MIN_POSTS = 3

/** Cách nhau quá ngần này ngày thì là hai chuyến khác nhau. */
const TRIP_GAP_DAYS = 2

function daysBetween(a: string, b: string) {
  return Math.round(
    (Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000,
  )
}

/**
 * Gom theo chuyến: cùng tỉnh, các bài liên tiếp cách nhau không quá 2 ngày,
 * ít nhất 3 bài. Cùng luật với `suggested_trips()` ở DB — bản client này
 * dùng khi `admin_unit_id` vừa mới suy ra xong và chưa kịp ghi xuống.
 */
export function groupTrips(
  posts: PostLike[],
  provinceName: (code: string) => string,
): Suggestion[] {
  const byProvince = new Map<string, PostLike[]>()
  for (const p of posts) {
    if (!p.admin_unit_id) continue
    byProvince.set(p.admin_unit_id, [...(byProvince.get(p.admin_unit_id) ?? []), p])
  }

  const out: Suggestion[] = []
  for (const [code, list] of byProvince) {
    const sorted = [...list].sort((a, b) =>
      a.happened_on < b.happened_on ? -1 : 1,
    )

    let run: PostLike[] = []
    const flush = () => {
      if (run.length >= MIN_POSTS) {
        const startOn = run[0].happened_on
        const endOn = run[run.length - 1].happened_on
        out.push({
          key: `trip:${code}:${startOn}`,
          title: `${provinceName(code)} · ${startOn.slice(0, 4)}`,
          source: 'auto_trip',
          postIds: run.map((p) => p.id),
          startOn,
          endOn,
        })
      }
      run = []
    }

    for (const post of sorted) {
      const prev = run[run.length - 1]
      if (prev && daysBetween(prev.happened_on, post.happened_on) > TRIP_GAP_DAYS) {
        flush()
      }
      run.push(post)
    }
    flush()
  }

  return out.sort((a, b) => (a.startOn < b.startOn ? 1 : -1))
}

/**
 * Gom theo hoạt động, trong phạm vi một năm.
 *
 * Không gom theo hoạt động trên toàn bộ lịch sử: "Ăn uống" gộp năm năm lại
 * thành một album 400 bài thì không ai mở. Một năm một album thì còn kể được
 * một câu chuyện.
 */
export function groupActivities(posts: PostLike[]): Suggestion[] {
  const buckets = new Map<string, PostLike[]>()
  for (const p of posts) {
    if (!p.activity) continue
    const key = `${p.activity}:${p.happened_on.slice(0, 4)}`
    buckets.set(key, [...(buckets.get(key) ?? []), p])
  }

  const out: Suggestion[] = []
  for (const [key, list] of buckets) {
    if (list.length < MIN_POSTS) continue
    const [activity, year] = key.split(':')
    const sorted = [...list].sort((a, b) =>
      a.happened_on < b.happened_on ? -1 : 1,
    )
    out.push({
      key: `activity:${key}`,
      title: `${ACTIVITY_LABELS[activity]?.label ?? activity} · ${year}`,
      source: 'auto_activity',
      postIds: sorted.map((p) => p.id),
      startOn: sorted[0].happened_on,
      endOn: sorted[sorted.length - 1].happened_on,
    })
  }

  return out.sort((a, b) => (a.startOn < b.startOn ? 1 : -1))
}
