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
      // Toạ độ thật để preview chạy qua đúng đường "tra ngược từ toạ độ"
      lat: 11.836,
      lng: 108.531,
      activity: 'travel',
      days: 3,
      photos: [PHOTOS[0], PHOTOS[1]],
      likes: 1,
      comments: 2,
    },
    {
      caption: 'Quán lẩu mới mở gần nhà, cay xé lưỡi mà ngon.',
      place: 'Lẩu Tứ Xuyên',
      lat: 21.018,
      lng: 105.832,
      activity: 'food',
      days: 9,
      photos: [PHOTOS[2]],
      likes: 1,
      comments: 1,
    },
    {
      caption: 'Đi xem phim tối thứ sáu.',
      place: 'CGV Vincom',
      lat: 10.788,
      lng: 106.702,
      activity: 'movie',
      days: 21,
      photos: [PHOTOS[3]],
      likes: 0,
      comments: 0,
    },
    {
      // Cố ý KHÔNG có toạ độ và tên không chứa tên tỉnh nào — để màn Dấu chân
      // trong preview luôn có một địa điểm "chưa nhận ra", nhờ vậy hộp thoại
      // hỏi tỉnh mới review được bằng `npm run shots`.
      caption: 'Quán mới mở gần nhà, ngon bất ngờ.',
      place: 'Quán Cây Bàng',
      activity: 'food',
      days: 6,
      photos: [PHOTOS[2]],
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
    place_lat: 'lat' in b ? (b.lat as number) : null,
    place_lng: 'lng' in b ? (b.lng as number) : null,
    province_code: null,
    ward: null,
    district: null,
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

/* ---------- Dữ liệu giả cho Phase 3 ---------- */

function inDaysYmd(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function previewAgenda() {
  const mk = (
    id: string,
    title: string,
    emoji: string,
    days: number,
    system = false,
  ) => ({
    id,
    title,
    emoji,
    occurs_on: inDaysYmd(days),
    days_away: days,
    is_system: system,
    recurrence: 'yearly' as const,
  })

  return [
    mk('ev1', 'Sinh nhật Diên', '🎂', 5),
    mk('milestone:Tròn 14 tháng', 'Tròn 14 tháng', '💕', 16, true),
    mk('ev2', 'Đi Đà Nẵng', '✈️', 34),
    mk('milestone:Ngày thứ 500', 'Ngày thứ 500', '💕', 88, true),
    mk('ev3', 'Kỉ niệm ngày cưới ba mẹ', '💍', -12),
  ]
}

/* ---------- Dữ liệu giả cho Phase 4 ---------- */

export function previewExpenses(month: string) {
  const ym = month.slice(0, 7)
  const mk = (
    id: string,
    amount: number,
    category: string,
    note: string,
    day: string,
    payer: string,
    post: string | null = null,
  ) => ({
    id,
    amount_minor: amount,
    category,
    note,
    spent_on: `${ym}-${day}`,
    paid_by: payer,
    post_id: post,
  })

  const expenses = [
    mk('x1', 480_000, 'food', 'Lẩu ở Ba Toa', '09', ME, 'preview-post-1'),
    mk('x2', 120_000, 'cafe', 'Cà phê sáng', '08', PARTNER),
    mk('x3', 260_000, 'movie', 'Vé xem phim', '06', PARTNER),
    mk('x4', 85_000, 'travel', 'Xăng xe', '04', ME),
    mk('x5', 1_200_000, 'gift', 'Quà sinh nhật', '02', ME),
    mk('x6', 320_000, 'food', 'Ăn tối', '01', PARTNER),
  ]

  const total = expenses.reduce((s, e) => s + e.amount_minor, 0)
  const byCategory: Record<string, number> = {}
  const byPayer: Record<string, number> = {}
  for (const e of expenses) {
    byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount_minor
    byPayer[e.paid_by] = (byPayer[e.paid_by] ?? 0) + e.amount_minor
  }

  return {
    expenses,
    summary: {
      total_minor: total,
      outing_count: expenses.length,
      avg_outing_minor: Math.round(total / expenses.length),
      by_category: byCategory,
      by_payer: byPayer,
    },
    isLoading: false,
  }
}

export function previewGoals() {
  return [
    {
      id: 'g1',
      title: 'Đi Đà Lạt mùa hoa',
      description: null,
      emoji: '🌸',
      kind: 'checklist' as const,
      target_count: null,
      target_minor: null,
      current_count: 0,
      due_date: null,
      status: 'active' as const,
      celebrated_post_id: null,
      goal_steps: [
        { id: 's1', title: 'Đặt vé xe', is_done: true, sort_order: 0 },
        { id: 's2', title: 'Đặt homestay', is_done: true, sort_order: 1 },
        { id: 's3', title: 'Lên lịch đi đâu', is_done: false, sort_order: 2 },
        { id: 's4', title: 'Xin nghỉ phép', is_done: false, sort_order: 3 },
      ],
      goal_contributions: [],
    },
    {
      id: 'g2',
      title: 'Xem hết phim Ghibli',
      description: null,
      emoji: '🎬',
      kind: 'count' as const,
      target_count: 22,
      target_minor: null,
      current_count: 9,
      due_date: null,
      status: 'active' as const,
      celebrated_post_id: null,
      goal_steps: [],
      goal_contributions: [],
    },
    {
      id: 'g3',
      title: 'Quỹ mua xe',
      description: null,
      emoji: '🛵',
      kind: 'amount' as const,
      target_count: null,
      target_minor: 30_000_000,
      current_count: 0,
      due_date: '2027-06-30',
      status: 'active' as const,
      celebrated_post_id: null,
      goal_steps: [],
      goal_contributions: [
        { amount_minor: 5_000_000 },
        { amount_minor: 3_500_000 },
      ],
    },
  ]
}

/* ---------- Dữ liệu giả cho Phase 5 ---------- */

export function previewAnswers() {
  const today = new Date().toISOString().slice(0, 10)
  return [
    {
      id: 'a1',
      user_id: ME,
      body: 'Lúc em nhắn "về tới nhà chưa" mà anh còn đang kẹt xe.',
      asked_on: today,
      created_at: new Date().toISOString(),
      edited_at: null,
    },
  ]
}

export function previewMoods() {
  const out: Array<{
    id: string
    user_id: string
    mood_date: string
    mood: number
    note: string | null
  }> = []
  const mine = [4, 3, 5, 4, 2, 4, 5]
  const theirs = [3, 3, 4, 5, 3, 4, 4]
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const ymd = d.toISOString().slice(0, 10)
    out.push({ id: `m${i}a`, user_id: ME, mood_date: ymd, mood: mine[i], note: null })
    out.push({ id: `m${i}b`, user_id: PARTNER, mood_date: ymd, mood: theirs[i], note: null })
  }
  return out
}

export function previewLetters() {
  return [
    {
      id: 'l1',
      author_id: ME,
      title: 'Gửi tụi mình của 5 năm sau',
      body: null,
      open_on: '2031-09-11',
    },
    {
      id: 'l2',
      author_id: PARTNER,
      title: 'Đọc khi nào thấy mệt nhé',
      body: null,
      open_on: '2027-01-01',
    },
    {
      id: 'l3',
      author_id: PARTNER,
      title: 'Ngày đầu tiên tụi mình dọn về chung',
      body:
        'Nếu anh đang đọc cái này thì chắc tụi mình đã qua được đoạn khó nhất rồi. Em viết lúc 2 giờ sáng, mai còn phải đi làm, mà không ngủ được vì vui quá.',
      open_on: '2026-07-01',
    },
  ]
}

/* ---------- Dữ liệu giả cho Phase 6 ---------- */

export function previewWrapped() {
  return {
    year: new Date().getFullYear(),
    posts: 68,
    photos: 214,
    days_with_memory: 52,
    provinces: 7,
    spend_minor: 24_600_000,
    expense_entries: 96,
    eat_visits: 41,
    eat_places: 23,
    goals_done: 4,
    question_days: 88,
    mood_days: 140,
    mood_avg: 4.1,
    top_place: 'Lẩu bò Ba Toa',
    top_place_visits: 6,
  }
}

export function previewWishlist(myId: string) {
  const other = myId === ME ? PARTNER : ME
  return {
    items: [
      {
        id: 'w1',
        owner_id: other,
        title: 'Tai nghe Sony WH-1000XM5',
        url: 'https://example.com/sony-xm5',
        note: null,
        status: 'open' as const,
      },
      {
        id: 'w2',
        owner_id: other,
        title: 'Máy ảnh film Olympus',
        url: null,
        note: null,
        status: 'open' as const,
      },
      {
        id: 'w3',
        owner_id: other,
        title: 'Sách "Người trong muôn nghề"',
        url: null,
        note: null,
        status: 'archived' as const,
      },
      {
        id: 'w4',
        owner_id: myId,
        title: 'Giày chạy bộ',
        url: null,
        note: null,
        status: 'open' as const,
      },
    ],
    marks: [
      { item_id: 'w1', state: 'planned' as const },
      { item_id: 'w3', state: 'bought' as const },
    ],
  }
}
