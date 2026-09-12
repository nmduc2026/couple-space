// Đổ dữ liệu mẫu vào Supabase THẬT để thử hết tính năng bằng tay.
//
//   node scripts/seed-demo.mjs            # thêm dữ liệu
//   node scripts/seed-demo.mjs --reset    # xoá dữ liệu seed cũ rồi thêm lại
//
// Cần `SUPABASE_SERVICE_ROLE_KEY` trong môi trường (Dashboard → Settings →
// API). Dùng service role vì hai việc mà khoá thường không làm được: ghi dữ
// liệu thay cho CẢ HAI người, và upload ảnh vào Storage.
//
// KHÔNG commit khoá này. Chạy một lần rồi thôi:
//   SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-demo.mjs
//
// Dữ liệu được dựng có chủ đích để mỗi tính năng có cái để hiện:
//   · hai chuyến đi liền ngày cùng một tỉnh  → album tự gom theo chuyến
//   · một địa điểm không đoán được tỉnh      → hộp thoại hỏi ở Dấu chân
//   · tháng này nhiều khoản hơn tháng trước  → dải nhận xét chi tiêu
//   · sinh nhật cách 5 ngày                  → dải gợi ý + lối tắt wishlist
//   · hai ngày chưa trả lời câu hỏi          → mục "Bỏ lỡ"
//   · một lượt ghé quán hôm qua chưa đánh giá → dải hỏi đánh giá
//   · thư mở năm 2027 và 2036                → cảnh báo ở màn huỷ ghép đôi

import { createClient } from '@supabase/supabase-js'
import WebSocket from 'ws'
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(new URL('.', import.meta.url)))
const RESET = process.argv.includes('--reset')

// ---------------------------------------------------------------- cấu hình

function readEnvFile() {
  const out = {}
  const file = path.join(root, '.env')
  if (!fs.existsSync(file)) return out
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
  return out
}

const env = { ...readEnvFile(), ...process.env }
const URL_ = env.SUPABASE_URL ?? env.VITE_SUPABASE_URL
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

if (!URL_ || !SERVICE_KEY) {
  console.error(`
Thiếu cấu hình.

  SUPABASE_URL              ${URL_ ?? '(không có)'}
  SUPABASE_SERVICE_ROLE_KEY ${SERVICE_KEY ? '(có)' : '(không có)'}

Lấy service role key ở Dashboard → Settings → API → service_role.
Rồi chạy:

  SUPABASE_SERVICE_ROLE_KEY=eyJ... node scripts/seed-demo.mjs
`)
  process.exit(1)
}

const db = createClient(URL_, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  // Node 20 chưa có WebSocket sẵn mà supabase-js luôn dựng realtime client,
  // nên phải đưa transport vào dù script này không dùng realtime lần nào.
  realtime: { transport: WebSocket },
})

// ---------------------------------------------------------------- ngày tháng

const TODAY = new Date()
const ymd = (d) => d.toISOString().slice(0, 10)
/** n ngày trước hôm nay, dạng YYYY-MM-DD. */
const ago = (n) => ymd(new Date(TODAY.getTime() - n * 86_400_000))
const ahead = (n) => ago(-n)
const monthOf = (offset) => {
  const d = new Date(TODAY.getFullYear(), TODAY.getMonth() + offset, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Bản sao của questionIndexFor() trong src/lib/questions.ts.
 *  Hai bản phải ra cùng số, nếu không "Sách hỏi đáp" hiện sai câu hỏi cho
 *  những ngày đã trả lời. Đổi bên kia thì đổi cả bên này. */
const BANK_SIZE = 90
function questionIndexFor(coupleId, day) {
  const [y, m, d] = day.split('-').map(Number)
  const days = Math.floor(Date.UTC(y, m - 1, d) / 86_400_000)
  let hash = 0
  for (const ch of coupleId) hash = (hash * 31 + ch.charCodeAt(0)) % 100_000
  return (((days + hash) % BANK_SIZE) + BANK_SIZE) % BANK_SIZE
}

// ---------------------------------------------------------------- tiện ích

function die(msg) {
  console.error(`\n${msg}\n`)
  process.exit(1)
}

async function insert(table, rows) {
  if (!rows.length) return []

  // PostgREST chèn nhiều dòng một lần thì mọi dòng phải CÙNG bộ cột. Dòng nào
  // thiếu khoá sẽ được điền `null` — đè lên cả `default` của cột, nên cột
  // `not null default 0` sẽ nổ. Bắt ở đây cho lỗi nói đúng chỗ sai.
  const keys = Object.keys(rows[0]).sort().join(',')
  for (const [i, row] of rows.entries()) {
    const k = Object.keys(row).sort().join(',')
    if (k !== keys) {
      die(`Dòng ${i} của \`${table}\` có bộ cột khác dòng đầu.
  dòng 0: ${keys}
  dòng ${i}: ${k}
Mọi dòng phải khai báo đủ cột, thiếu thì ghi null.`)
    }
  }
  // `select()` không tham số chứ không phải `select('id')`: có bảng dùng khoá
  // chính ghép nên không hề có cột `id` (wishlist_marks, album_posts).
  const { data, error } = await db.from(table).insert(rows).select()
  if (error) die(`Lỗi khi ghi vào ${table}: ${error.message}`)
  console.log(`  ${table.padEnd(20)} +${rows.length}`)
  return data ?? []
}

// ---------------------------------------------------------------- ảnh

/** Sinh ảnh WebP y như app sinh (canvas.toDataURL('image/webp')).
 *  Cố ý dùng đúng định dạng đó chứ không phải JPEG: đường xuất PDF phải
 *  giải mã được WebP, và seed bằng JPEG sẽ giấu mất lỗi nếu có. */
async function makePhotos(specs) {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  const out = []
  for (const spec of specs) {
    const dataUrl = await page.evaluate(({ label, a, b }) => {
      const c = document.createElement('canvas')
      c.width = 1200
      c.height = 900
      const x = c.getContext('2d')
      const g = x.createLinearGradient(0, 0, 1200, 900)
      g.addColorStop(0, a)
      g.addColorStop(1, b)
      x.fillStyle = g
      x.fillRect(0, 0, 1200, 900)
      x.fillStyle = 'rgba(255,255,255,0.92)'
      x.font = 'bold 64px system-ui, sans-serif'
      x.fillText(label, 60, 480)
      return c.toDataURL('image/webp', 0.8)
    }, spec)
    out.push(Buffer.from(dataUrl.split(',')[1], 'base64'))
  }
  await browser.close()
  return out
}

const PALETTE = [
  ['#c2415b', '#7c3350'],
  ['#e8a0ae', '#c2415b'],
  ['#4a5d8a', '#3f7d63'],
  ['#a8724a', '#6b4e7d'],
  ['#3f7d63', '#9a6a2f'],
  ['#6b4e7d', '#c2415b'],
]

// ---------------------------------------------------------------- nội dung

/** Bài kỉ niệm. `d` = số ngày trước hôm nay. */
const POSTS = [
  // --- Chuyến Đà Lạt: bốn ngày liền, cùng tỉnh → album tự gom theo chuyến
  { d: 182, cap: 'Lên Đà Lạt. Trời lạnh hơn tụi mình tưởng.', place: 'Đồi chè Cầu Đất', lat: 11.836, lng: 108.531, prov: 'LDG', act: 'travel', photos: 2 },
  { d: 181, cap: 'Cà phê sáng nhìn ra thung lũng.', place: 'Quán cà phê Mê Linh', lat: 11.985, lng: 108.399, prov: 'LDG', act: 'cafe', photos: 1 },
  { d: 180, cap: 'Chợ đêm. Ăn bánh tráng nướng tới no.', place: 'Chợ Đà Lạt', lat: 11.942, lng: 108.437, prov: 'LDG', act: 'food', photos: 2 },
  { d: 179, cap: 'Về rồi. Đã muốn đi lại.', place: 'Ga Đà Lạt', lat: 11.943, lng: 108.455, prov: 'LDG', act: 'travel', photos: 1 },

  // --- Chuyến Vũng Tàu: ba ngày liền → album thứ hai
  { d: 70, cap: 'Biển Vũng Tàu, sáng sớm không một bóng người.', place: 'Bãi Sau Vũng Tàu', lat: 10.341, lng: 107.093, prov: 'BRV', act: 'travel', photos: 2 },
  { d: 69, cap: 'Hải sản. Anh ăn hết phần của em.', place: 'Quán Gành Hào', lat: 10.346, lng: 107.077, prov: 'BRV', act: 'food', photos: 1 },
  { d: 68, cap: 'Leo lên tượng Chúa. Mệt muốn xỉu mà đáng.', place: 'Núi Nhỏ Vũng Tàu', lat: 10.331, lng: 107.086, prov: 'BRV', act: 'travel', photos: 1 },

  // --- Sài Gòn, rải rác
  { d: 260, cap: 'Phim tối thứ sáu.', place: 'CGV Vincom Đồng Khởi', lat: 10.778, lng: 106.702, act: 'movie', photos: 1 },
  { d: 200, cap: 'Lẩu Tứ Xuyên cay xé lưỡi.', place: 'Quán lẩu Tứ Xuyên, TP. Hồ Chí Minh', lat: 10.789, lng: 106.69, act: 'food', photos: 1 },
  { d: 140, cap: 'Cà phê bệt cuối tuần.', place: 'Nhà thờ Đức Bà', lat: 10.78, lng: 106.699, act: 'cafe', photos: 1 },
  { d: 95, cap: 'Sinh nhật em 🎂', place: null, act: 'home', photos: 2 },
  { d: 40, cap: 'Bún chả ở quán quen.', place: 'Bún chả Hàng Quạt, Hà Nội', lat: 21.033, lng: 105.85, act: 'food', photos: 1 },
  { d: 25, cap: 'Tối nay ở nhà, nấu ăn với nhau.', place: null, act: 'home', photos: 1 },
  { d: 12, cap: 'Phim mới, rạp vắng, ngồi hàng cuối.', place: 'CGV Landmark 81', lat: 10.795, lng: 106.722, act: 'movie', photos: 1 },

  // --- Một địa điểm KHÔNG đoán được tỉnh và không có toạ độ.
  //     Đây là bài làm cho hộp thoại "Chưa nhận ra ... ở đâu?" hiện ra.
  { d: 8, cap: 'Quán mới mở gần nhà, ngon bất ngờ.', place: 'Quán Cây Bàng', act: 'food', photos: 1 },
  { d: 3, cap: 'Đi bộ vòng vòng, không làm gì cả.', place: 'Quán Cây Bàng', act: 'cafe', photos: 1 },
]

const EAT_ITEMS = [
  { name: 'Lẩu bò Ba Toa', address: '1 Hoàng Diệu, Đà Lạt', tags: ['lẩu', 'đi chơi'], status: 'tried' },
  { name: 'Bún chả Hàng Quạt', address: '74 Hàng Quạt, Hà Nội', tags: ['rẻ'], status: 'tried' },
  { name: 'Pizza 4P’s', address: 'Lê Thánh Tôn', tags: ['sang'], status: 'tried' },
  { name: 'Quán Gành Hào', address: 'Vũng Tàu', tags: ['hải sản'], status: 'tried' },
  { name: 'Cơm tấm Ba Ghiền', address: 'Phan Xích Long', tags: ['gần nhà', 'rẻ'], status: 'want' },
  { name: 'Bánh xèo Mười Xiềm', address: 'Quận 3', tags: ['gần nhà'], status: 'want' },
  { name: 'Mì cay Sasin', address: 'Nguyễn Trãi', tags: ['cay'], status: 'want' },
  { name: 'Chè Hẻm', address: 'Trần Hưng Đạo', tags: ['ngọt', 'rẻ'], status: 'want' },
]

const QUESTION_ANSWERS = [
  'Lúc em nhắn "về tới nhà chưa" mà anh còn đang kẹt xe.',
  'Hôm đi Đà Lạt, trời lạnh mà em quên áo khoác.',
  'Cái lần hai đứa cãi nhau vì chọn quán rồi cuối cùng ăn mì gói.',
  'Khi em cười lúc xem phim dở tệ.',
  'Buổi sáng đầu tiên thức dậy thấy người kia còn ngủ.',
  'Lúc anh nấu ăn cháy mà vẫn bảo là cố ý.',
  'Đi bộ về nhà lúc nửa đêm, chẳng nói gì cả.',
  'Khi người kia nhớ một chuyện mình tưởng đã quên.',
]

const MOOD_NOTES = [null, 'Hôm nay dễ thở', null, 'Hơi mệt', null, 'Vui', null]

// ---------------------------------------------------------------- chạy

async function main() {
  console.log(`\nSeed vào ${URL_}\n`)

  // --- Tìm space đang hoạt động
  const { data: couples, error: cErr } = await db
    .from('couples')
    .select('id, start_date, couple_members(user_id, nickname, left_at)')
    .eq('status', 'active')
    .order('created_at', { ascending: true })

  if (cErr) die(`Không đọc được bảng couples: ${cErr.message}\n\nĐã chạy \`supabase db push\` chưa?`)

  const couple = (couples ?? []).find(
    (c) => (c.couple_members ?? []).filter((m) => !m.left_at).length === 2,
  )

  if (!couple) {
    die(`Chưa có space nào đủ hai người.

Mở app, đăng nhập bằng CẢ HAI tài khoản và ghép đôi xong đã, rồi chạy lại
script này. Seed cố ý không tự tạo tài khoản: tài khoản do script tạo thì
không đăng nhập được bằng OTP, nên cũng không thử được gì.`)
  }

  const members = couple.couple_members.filter((m) => !m.left_at)
  const [A, B] = members.map((m) => m.user_id)
  const nameA = members[0].nickname ?? 'Người A'
  const nameB = members[1].nickname ?? 'Người B'
  const cid = couple.id

  console.log(`Space  ${cid}`)
  console.log(`Gồm    ${nameA} · ${nameB}\n`)

  if (RESET) {
    console.log('Xoá dữ liệu cũ của space này...')
    // Thứ tự không quan trọng vì đều có `on delete cascade` từ couples,
    // nhưng xoá thẳng từng bảng thì giữ được chính space và thành viên.
    for (
      const t of [
        'album_posts', 'albums', 'pdf_exports', 'wishlist_marks', 'wishlist_items',
        'place_aliases', 'nudges', 'mood_checkins', 'letters', 'question_answers',
        'eat_ratings', 'eat_visits', 'eat_items', 'goal_contributions', 'goal_steps',
        'goals', 'expenses', 'milestone_mutes', 'reminder_sends', 'events',
        'comments', 'reactions', 'post_media', 'posts',
      ]
    ) {
      const { error } = await db.from(t).delete().eq('couple_id', cid)
      if (error) console.log(`  (bỏ qua ${t}: ${error.message})`)
    }
    // Storage xoá theo TỪNG file, không xoá được cả thư mục
    const { data: folders } = await db.storage.from('couple-media').list(cid)
    for (const folder of folders ?? []) {
      const { data: files } = await db.storage
        .from('couple-media')
        .list(`${cid}/${folder.name}`)
      const paths = (files ?? []).map((f) => `${cid}/${folder.name}/${f.name}`)
      if (paths.length) await db.storage.from('couple-media').remove(paths)
    }
    console.log('')
  }

  // ---------------------------------------------------- ảnh + bài kỉ niệm
  const specs = []
  POSTS.forEach((p, i) => {
    for (let n = 0; n < (p.photos ?? 1); n++) {
      const [a, b] = PALETTE[(i + n) % PALETTE.length]
      specs.push({ label: p.place ?? 'Ở nhà', a, b })
    }
  })

  console.log(`Sinh ${specs.length} ảnh WebP...`)
  const photos = await makePhotos(specs)

  console.log('\nGhi dữ liệu:')

  let photoIndex = 0
  const postIds = []
  for (const [i, p] of POSTS.entries()) {
    const author = i % 2 === 0 ? A : B
    const { data: created, error } = await db
      .from('posts')
      .insert({
        couple_id: cid,
        author_id: author,
        caption: p.cap,
        happened_on: ago(p.d),
        place_name: p.place,
        place_lat: p.lat ?? null,
        place_lng: p.lng ?? null,
        // Hai chuyến đi đã gán sẵn tỉnh để album tự gom có cái mà gom ngay.
        // Các bài còn lại để trống, cho màn Dấu chân tự suy ra rồi ghi xuống —
        // đó cũng là một đường cần thử.
        province_code: p.prov ?? null,
        activity: p.act,
      })
      .select('id')
      .single()
    if (error) die(`Lỗi khi tạo bài: ${error.message}`)
    postIds.push(created.id)

    const media = []
    for (let n = 0; n < (p.photos ?? 1); n++) {
      const bytes = photos[photoIndex++]
      const storagePath = `${cid}/${created.id}/${crypto.randomUUID()}.webp`
      const { error: upErr } = await db.storage
        .from('couple-media')
        .upload(storagePath, bytes, { contentType: 'image/webp', upsert: true })
      if (upErr) die(`Lỗi upload ảnh: ${upErr.message}`)
      media.push({
        post_id: created.id,
        couple_id: cid,
        storage_path: storagePath,
        width: 1200,
        height: 900,
        position: n,
      })
    }
    await db.from('post_media').insert(media)
  }
  console.log(`  posts                +${POSTS.length} (kèm ${specs.length} ảnh)`)

  // --- tim và bình luận
  await insert(
    'reactions',
    postIds.slice(0, 10).map((id, i) => ({
      post_id: id,
      couple_id: cid,
      user_id: i % 2 === 0 ? B : A,
      emoji: '❤️',
    })),
  )

  await insert('comments', [
    { post_id: postIds[0], couple_id: cid, author_id: B, body: 'Trời ơi nhớ chuyến này quá' },
    { post_id: postIds[0], couple_id: cid, author_id: A, body: 'Đi lại đi 😌' },
    { post_id: postIds[2], couple_id: cid, author_id: B, body: 'Bánh tráng nướng đỉnh thật' },
    { post_id: postIds[4], couple_id: cid, author_id: A, body: 'Sáng đó dậy sớm ghê' },
    { post_id: postIds[10], couple_id: cid, author_id: A, body: 'Chúc mừng sinh nhật em ❤️' },
  ])

  // ---------------------------------------------------- sự kiện
  await insert('events', [
    // Cách 5 ngày → dải gợi ý "Chuẩn bị quà" + lối tắt wishlist hiện ra
    { couple_id: cid, title: `Sinh nhật ${nameB}`, event_date: ahead(5), recurrence: 'yearly', remind_days_before: [7, 3, 0], emoji: '🎂', created_by: A },
    { couple_id: cid, title: 'Kỉ niệm ngày cưới', event_date: ahead(48), recurrence: 'yearly', remind_days_before: [30, 7, 0], emoji: '💍', created_by: A },
    { couple_id: cid, title: 'Đi Phú Quốc', event_date: ahead(19), recurrence: 'none', remind_days_before: [7, 1], emoji: '✈️', created_by: B },
    { couple_id: cid, title: `Sinh nhật ${nameA}`, event_date: ahead(124), recurrence: 'yearly', remind_days_before: [7, 0], emoji: '🎂', created_by: B },
  ])

  // ---------------------------------------------------- chi tiêu
  // Tháng này NHIỀU hơn tháng trước để dải nhận xét có gì để nói
  const thisMonth = monthOf(0)
  const lastMonth = monthOf(-1)
  const expense = (month, day, amount, category, note, payer) => ({
    couple_id: cid,
    amount_minor: amount,
    category,
    note,
    spent_on: `${month}-${String(day).padStart(2, '0')}`,
    paid_by: payer,
    created_by: payer,
  })

  await insert('expenses', [
    expense(lastMonth, 3, 250_000, 'food', 'Lẩu cuối tuần', A),
    expense(lastMonth, 7, 90_000, 'cafe', 'Cà phê sáng', B),
    expense(lastMonth, 12, 180_000, 'movie', 'Vé phim', A),
    expense(lastMonth, 15, 420_000, 'food', 'Sinh nhật mẹ', B),
    expense(lastMonth, 21, 60_000, 'travel', 'Grab', A),
    expense(lastMonth, 25, 150_000, 'home', 'Đồ dùng', B),

    expense(thisMonth, 2, 320_000, 'food', 'Hải sản Vũng Tàu', A),
    expense(thisMonth, 3, 85_000, 'cafe', 'Cà phê', B),
    expense(thisMonth, 4, 1_200_000, 'travel', 'Vé xe Phú Quốc', A),
    expense(thisMonth, 5, 240_000, 'food', 'Bún chả', B),
    expense(thisMonth, 6, 70_000, 'cafe', 'Trà sữa', A),
    expense(thisMonth, 7, 195_000, 'movie', 'Vé phim + bắp', B),
    expense(thisMonth, 8, 450_000, 'gift', 'Quà sinh nhật', A),
    expense(thisMonth, 9, 130_000, 'food', 'Cơm tấm', B),
    expense(thisMonth, 10, 55_000, 'travel', 'Xăng', A),
    expense(thisMonth, 11, 280_000, 'home', 'Chậu cây', B),
  ])

  // ---------------------------------------------------- mục tiêu
  const [goalTrip, goalFund] = await insert('goals', [
    { couple_id: cid, title: 'Đi Phú Quốc', emoji: '✈️', kind: 'checklist', target_count: null, target_minor: null, current_count: 0, due_date: ahead(19), created_by: A, position: 0 },
    { couple_id: cid, title: 'Quỹ đi Nhật', emoji: '🗾', kind: 'amount', target_count: null, target_minor: 40_000_000, current_count: 0, due_date: null, created_by: B, position: 1 },
    { couple_id: cid, title: 'Học nấu 10 món', emoji: '🍳', kind: 'count', target_count: 10, target_minor: null, current_count: 4, due_date: null, created_by: A, position: 2 },
  ])

  await insert('goal_steps', [
    { goal_id: goalTrip.id, couple_id: cid, title: 'Đặt vé máy bay', is_done: true, done_at: new Date().toISOString(), done_by: A, sort_order: 0 },
    { goal_id: goalTrip.id, couple_id: cid, title: 'Đặt khách sạn', is_done: true, done_at: new Date().toISOString(), done_by: B, sort_order: 1 },
    { goal_id: goalTrip.id, couple_id: cid, title: 'Thuê xe máy', is_done: false, done_at: null, done_by: null, sort_order: 2 },
    { goal_id: goalTrip.id, couple_id: cid, title: 'Mua kem chống nắng', is_done: false, done_at: null, done_by: null, sort_order: 3 },
  ])

  await insert('goal_contributions', [
    { goal_id: goalFund.id, couple_id: cid, user_id: A, amount_minor: 5_000_000, contributed_on: ago(60), note: 'Lương tháng 6' },
    { goal_id: goalFund.id, couple_id: cid, user_id: B, amount_minor: 4_000_000, contributed_on: ago(30), note: 'Thưởng' },
    { goal_id: goalFund.id, couple_id: cid, user_id: A, amount_minor: 3_500_000, contributed_on: ago(5), note: null },
  ])

  // ---------------------------------------------------- ăn gì
  const eatIds = await insert(
    'eat_items',
    EAT_ITEMS.map((e) => ({
      couple_id: cid,
      name: e.name,
      address: e.address,
      tags: e.tags,
      status: e.status,
      added_by: A,
    })),
  )

  const visits = await insert('eat_visits', [
    { couple_id: cid, item_id: eatIds[0].id, visited_on: ago(180) },
    { couple_id: cid, item_id: eatIds[0].id, visited_on: ago(45) },
    { couple_id: cid, item_id: eatIds[1].id, visited_on: ago(40) },
    { couple_id: cid, item_id: eatIds[2].id, visited_on: ago(20) },
    { couple_id: cid, item_id: eatIds[3].id, visited_on: ago(69) },
    // Hôm qua, CỐ Ý chưa đánh giá → dải hỏi đánh giá hiện ra khi mở "Ăn gì?"
    { couple_id: cid, item_id: eatIds[1].id, visited_on: ago(1) },
  ])

  await insert('eat_ratings', [
    { couple_id: cid, visit_id: visits[0].id, user_id: A, verdict: 'love', note: null },
    { couple_id: cid, visit_id: visits[0].id, user_id: B, verdict: 'love', note: null },
    { couple_id: cid, visit_id: visits[2].id, user_id: A, verdict: 'ok', note: null },
    { couple_id: cid, visit_id: visits[3].id, user_id: A, verdict: 'love', note: null },
    // Một chỗ bị chê → vòng quay phải loại nó ra
    { couple_id: cid, visit_id: visits[4].id, user_id: B, verdict: 'nope', note: 'Đắt mà thường' },
  ])

  // ---------------------------------------------------- câu hỏi mỗi ngày
  // Trả lời 20 ngày gần đây, TRỪ ngày thứ 2 và thứ 4 → mục "Bỏ lỡ" có 2 ngày
  const answers = []
  for (let back = 0; back <= 20; back++) {
    if (back === 2 || back === 4) continue
    const day = ago(back)
    const qi = questionIndexFor(cid, day)
    answers.push({
      couple_id: cid, user_id: A, question_index: qi, asked_on: day,
      body: QUESTION_ANSWERS[back % QUESTION_ANSWERS.length],
    })
    // Người kia bỏ lỡ vài ngày — để thấy trạng thái "chỉ một người trả lời"
    if (back % 5 !== 3) {
      answers.push({
        couple_id: cid, user_id: B, question_index: qi, asked_on: day,
        body: QUESTION_ANSWERS[(back + 3) % QUESTION_ANSWERS.length],
      })
    }
  }
  await insert('question_answers', answers)

  // ---------------------------------------------------- thư tương lai
  await insert('letters', [
    { couple_id: cid, author_id: A, title: 'Gửi tụi mình của một năm sau', body: 'Không biết lúc đọc lại cái này hai đứa đang ở đâu. Hy vọng vẫn còn cãi nhau chuyện tối nay ăn gì.', open_on: ago(30), opened_at: new Date().toISOString() },
    { couple_id: cid, author_id: B, title: 'Đọc vào Valentine 2027', body: 'Nếu đang giận nhau thì thôi bỏ qua đi nhé.', open_on: '2027-02-14', opened_at: null },
    { couple_id: cid, author_id: A, title: 'Mười năm nữa', body: 'Chào hai đứa của năm 2036.', open_on: '2036-11-20', opened_at: null },
  ])

  // ---------------------------------------------------- tâm trạng
  const moods = []
  const seq = [4, 5, 3, 4, 4, 2, 5, 4, 3, 5, 4, 4, 5, 3, 4, 5, 5, 4, 3, 4]
  for (let back = 0; back < 40; back++) {
    const day = ago(back)
    moods.push({ couple_id: cid, user_id: A, mood_date: day, mood: seq[back % seq.length], note: MOOD_NOTES[back % MOOD_NOTES.length] })
    if (back % 7 !== 5) {
      moods.push({ couple_id: cid, user_id: B, mood_date: day, mood: seq[(back + 4) % seq.length], note: null })
    }
  }
  await insert('mood_checkins', moods)

  // ---------------------------------------------------- nudge
  await insert('nudges', [
    { couple_id: cid, from_user: A, to_user: B, kind: 'miss' },
    { couple_id: cid, from_user: B, to_user: A, kind: 'home' },
    { couple_id: cid, from_user: A, to_user: B, kind: 'eat' },
  ])

  // ---------------------------------------------------- wishlist
  const wish = await insert('wishlist_items', [
    { couple_id: cid, owner_id: A, title: 'Tai nghe chống ồn', url: 'https://example.com/tai-nghe', note: null, price_hint_minor: 5_900_000 },
    { couple_id: cid, owner_id: A, title: 'Sách "Bắt trẻ đồng xanh"', url: null, note: null, price_hint_minor: 120_000 },
    { couple_id: cid, owner_id: B, title: 'Máy ảnh film', url: null, note: 'Cái nào cũng được, miễn là chụp được', price_hint_minor: 3_200_000 },
    { couple_id: cid, owner_id: B, title: 'Nồi chiên không dầu', url: null, note: null, price_hint_minor: 1_800_000 },
  ])

  // Dấu do NGƯỜI KIA đặt. Chủ wishlist KHÔNG được thấy những dòng này —
  // đó chính là thứ cần kiểm chứng ở P6-48.
  await insert('wishlist_marks', [
    { item_id: wish[0].id, couple_id: cid, marked_by: B, state: 'planned', note: 'Mua dịp sinh nhật' },
    { item_id: wish[2].id, couple_id: cid, marked_by: A, state: 'bought', note: null },
  ])

  // ---------------------------------------------------- tuỳ chọn thông báo
  for (const u of [A, B]) {
    await db.from('notification_prefs').upsert({
      user_id: u,
      daily_day_count: true,
      quiet_hours_from: '23:00',
      quiet_hours_to: '07:00',
    })
  }
  console.log('  notification_prefs   +2 (bật nhắc số ngày mỗi sáng)')

  console.log(`
Xong.

Mở app và thử theo thứ tự này — mỗi mục đã có sẵn dữ liệu để hiện:

  Nhà        số ngày yêu, dịp sắp tới, chi tiêu tháng
  Kỉ niệm    ${POSTS.length} bài, ${specs.length} ảnh, có tim và bình luận
             mở một bài → Sửa / Xoá (bài có gắn chi phí sẽ hỏi lại)
  Kế hoạch   sinh nhật ${nameB} còn 5 ngày → dải gợi ý + lối tắt wishlist
             tab Mục tiêu: checklist, quỹ chung, đếm
  Chi tiêu   tháng này 10 khoản, tháng trước 6 → dải nhận xét so sánh
             chạm một khoản để sửa hoặc xoá
  Câu hỏi    tab "Bỏ lỡ (2)" và tab "Sách" đã có 20 ngày để tìm
  Thư        1 đã mở · 1 mở 2027 · 1 mở 2036
             (Cài đặt → Huỷ ghép đôi sẽ cảnh báo về 2 lá còn khoá)
  Tâm trạng  40 ngày
  Ăn gì      8 quán; dải hỏi đánh giá cho lượt ghé hôm qua
             quán bị chê sẽ không quay ra nữa
  Dấu chân   4 tỉnh; "Quán Cây Bàng" chưa nhận ra → hộp thoại hỏi
  Album      hai chuyến (Đà Lạt, Vũng Tàu) sẽ được gom tự động
             nút PDF → xuất sách ảnh
  Wishlist   đổi tài khoản để kiểm: chủ wishlist KHÔNG thấy dấu của người kia

Chạy lại với --reset nếu muốn làm sạch rồi seed lại.
`)
}

main().catch((err) => die(err instanceof Error ? err.stack : String(err)))
