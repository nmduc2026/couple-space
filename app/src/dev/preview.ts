import type { Session, User } from '@supabase/supabase-js'
import type { Couple } from '../hooks/useCouple'

/** Chế độ xem thử: bật bằng `?preview=1`, chỉ có trong bản dev.
 *  Dùng để chụp màn hình từng màn mà không cần đăng nhập Supabase thật. */
export const PREVIEW =
  import.meta.env.DEV &&
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).has('preview')

/** `?preview=1&solo=1` → space mới có một người, để xem trạng thái đang chờ. */
export const PREVIEW_SOLO =
  PREVIEW && new URLSearchParams(window.location.search).has('solo')

const ME = '11111111-1111-1111-1111-111111111111'
const PARTNER = '22222222-2222-2222-2222-222222222222'

export const previewUser = {
  id: ME,
  email: 'duc@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2026-01-01T00:00:00Z',
} as unknown as User

export const previewSession = {
  access_token: 'preview',
  refresh_token: 'preview',
  expires_in: 3600,
  token_type: 'bearer',
  user: previewUser,
} as unknown as Session

/** Ngày bắt đầu yêu giả lập: lùi lại 412 ngày cho khớp con số ở prototype. */
function startDateDaysAgo(days: number) {
  const d = new Date()
  d.setDate(d.getDate() - (days - 1))
  return d.toISOString().slice(0, 10)
}

export function previewCouple(): Couple {
  return {
    id: '33333333-3333-3333-3333-333333333333',
    start_date: startDateDaysAgo(412),
    cover_url: null,
    theme: 'rose',
    status: 'active',
    invited_name: 'Diên',
    created_by: ME,
    members: PREVIEW_SOLO
      ? [
          {
            user_id: ME,
            nickname: 'Đức',
            joined_at: '2026-01-01T00:00:00Z',
            left_at: null,
          },
        ]
      : [
          {
            user_id: ME,
            nickname: 'Đức',
            joined_at: '2026-01-01T00:00:00Z',
            left_at: null,
          },
          {
            user_id: PARTNER,
            nickname: 'Diên',
            joined_at: '2026-01-02T00:00:00Z',
            left_at: null,
          },
        ],
  }
}

/* ---------- Dữ liệu giả cho Phase 2 ---------- */

/** Ảnh giả: SVG gradient nhúng thẳng, để ảnh chụp màn hình trông như app thật. */
function fakePhoto(from: string, to: string, emoji: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>
    </linearGradient></defs>
    <rect width="800" height="600" fill="url(#g)"/>
    <text x="400" y="340" font-size="150" text-anchor="middle">${emoji}</text>
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

const PHOTOS = [
  fakePhoto('#f0c27b', '#c2415b', '🌇'),
  fakePhoto('#a8c8e8', '#4a5d8a', '🏖️'),
  fakePhoto('#f5d5a8', '#a8724a', '🍜'),
  fakePhoto('#c9b6d8', '#6b4e7d', '🎬'),
  fakePhoto('#9fcfb4', '#3f7d63', '🌿'),
  fakePhoto('#f2b8c0', '#9a3f55', '🎂'),
]

function daysAgoYmd(days: number) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

export function previewPosts() {
  const base = [
    {
      caption: 'Hoàng hôn ở Đà Lạt. Diên bảo trời đẹp hơn ảnh.',
      place: 'Đồi chè Cầu Đất',
      activity: 'travel',
      days: 3,
      photos: [PHOTOS[0], PHOTOS[1]],
      likes: 1,
      comments: 2,
    },
    {
      caption: 'Quán lẩu mới mở gần nhà, cay xé lưỡi mà ngon.',
      place: 'Lẩu Tứ Xuyên',
      activity: 'food',
      days: 9,
      photos: [PHOTOS[2]],
      likes: 1,
      comments: 1,
    },
    {
      caption: 'Đi xem phim tối thứ sáu.',
      place: 'CGV Vincom',
      activity: 'movie',
      days: 21,
      photos: [PHOTOS[3]],
      likes: 0,
      comments: 0,
    },
    {
      caption: 'Sinh nhật Diên 🎂',
      place: null,
      activity: 'home',
      days: 46,
      photos: [PHOTOS[5], PHOTOS[4]],
      likes: 1,
      comments: 3,
    },
  ]

  return base.map((b, i) => ({
    id: `preview-post-${i}`,
    couple_id: 'preview',
    author_id: i % 2 === 0 ? ME : PARTNER,
    caption: b.caption,
    happened_on: daysAgoYmd(b.days),
    place_name: b.place,
    activity: b.activity,
    created_at: new Date().toISOString(),
    media: b.photos.map((url, p) => ({
      id: `preview-media-${i}-${p}`,
      storage_path: `preview/${i}/${p}`,
      width: 800,
      height: 600,
      position: p,
      url,
    })),
    reaction_count: b.likes,
    liked_by_me: b.likes > 0 && i % 2 === 1,
    comment_count: b.comments,
  }))
}

export function previewComments() {
  return [
    {
      id: 'c1',
      author_id: PARTNER,
      body: 'Trời hôm đó đẹp thật á 🥰',
      created_at: new Date(Date.now() - 3_600_000).toISOString(),
    },
    {
      id: 'c2',
      author_id: ME,
      body: 'Lần sau đi sớm hơn để kịp hoàng hôn nha.',
      created_at: new Date(Date.now() - 1_800_000).toISOString(),
    },
  ]
}

export function previewEatItems() {
  const mk = (
    id: string,
    name: string,
    address: string,
    status: 'want' | 'tried',
    tags: string[],
  ) => ({
    id,
    couple_id: 'preview',
    kind: 'place' as const,
    name,
    address,
    map_url: null,
    source_url: null,
    tags,
    note: null,
    status,
    added_by: ME,
    created_at: new Date().toISOString(),
  })

  return [
    mk('e1', 'Lẩu bò Ba Toa', '12 Nguyễn Huệ', 'want', ['lẩu', 'gần nhà']),
    mk('e2', 'Bún chả Hương Liên', '24 Lê Văn Hưu', 'want', ['rẻ']),
    mk('e3', 'Pizza 4P’s', 'Lê Thánh Tôn', 'want', ['sang']),
    mk('e4', 'Cơm tấm Ba Ghiền', '84 Đặng Văn Ngữ', 'tried', ['cơm']),
    mk('e5', 'Phở Thìn', '13 Lò Đúc', 'tried', ['sáng']),
  ]
}
