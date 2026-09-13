// Kiểm chứng RLS bằng TOKEN THẬT của từng người, không phải bằng niềm tin.
//
//   SUPABASE_SERVICE_ROLE_KEY=... node scripts/verify-rls.mjs
//
// Đây là P5-06, P5-16 và P6-48 trong tasks/. Ba chỗ này có đặc điểm chung:
// policy viết đúng hay sai thì giao diện trông vẫn y hệt, và chỉ lộ ra khi có
// người gọi thẳng API. Nên phải gọi thẳng API mà kiểm.
//
// Cách lấy phiên: dùng service role tạo magic link cho từng người rồi đổi nó
// lấy access token. Không cần mật khẩu, không cần mở mail.

import { createClient } from '@supabase/supabase-js'
import WebSocket from 'ws'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(new URL('.', import.meta.url)))

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
const ANON = env.SUPABASE_ANON_KEY ?? env.VITE_SUPABASE_PUBLISHABLE_KEY
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

if (!URL_ || !ANON || !SERVICE_KEY) {
  console.error('Thiếu SUPABASE_URL / anon key / SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const realtime = { transport: WebSocket }
const admin = createClient(URL_, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime,
})

/** Mở một phiên thật cho `email`, trả về client đã gắn token của người đó. */
async function sessionFor(email) {
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })
  if (error) throw new Error(`Không tạo được magic link cho ${email}: ${error.message}`)

  const asUser = createClient(URL_, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime,
  })
  // Khi đưa `token_hash` thì KHÔNG được kèm `email` — API từ chối cả gói.
  const { data: session, error: vErr } = await asUser.auth.verifyOtp({
    token_hash: data.properties.hashed_token,
    type: 'magiclink',
  })
  if (vErr) throw new Error(`Không đổi được token cho ${email}: ${vErr.message}`)
  return { client: asUser, userId: session.user.id, email }
}

let failed = 0

function check(label, ok, detail = '') {
  console.log(`  ${ok ? 'ĐẠT ' : 'HỎNG'}  ${label}${detail ? ` — ${detail}` : ''}`)
  if (!ok) failed++
}

async function main() {
  const { data: users } = await admin.auth.admin.listUsers()
  if ((users?.users ?? []).length < 2) {
    console.error('Cần ít nhất hai tài khoản.')
    process.exit(1)
  }

  const { data: couples } = await admin
    .from('couples')
    .select('id, couple_members(user_id, left_at)')
    .eq('status', 'active')
  const couple = (couples ?? []).find(
    (c) => c.couple_members.filter((m) => !m.left_at).length === 2,
  )
  if (!couple) {
    console.error('Chưa có space nào đủ hai người.')
    process.exit(1)
  }

  const ids = couple.couple_members.filter((m) => !m.left_at).map((m) => m.user_id)
  const emailOf = (id) => users.users.find((u) => u.id === id)?.email

  const A = await sessionFor(emailOf(ids[0]))
  const B = await sessionFor(emailOf(ids[1]))

  console.log(`\nSpace ${couple.id}`)
  console.log(`A = ${A.email}`)
  console.log(`B = ${B.email}\n`)

  // ---------------------------------------------------------------- cơ bản
  console.log('Đọc được dữ liệu chung:')
  {
    const { data } = await A.client.from('posts').select('id').is('deleted_at', null)
    check('A đọc được Timeline', (data ?? []).length > 0, `${data?.length ?? 0} bài`)
  }
  {
    const { data } = await B.client.from('posts').select('id').is('deleted_at', null)
    check('B đọc được cùng Timeline', (data ?? []).length > 0, `${data?.length ?? 0} bài`)
  }

  // ---------------------------------------------------------------- P5-06
  console.log('\nP5-06 · Câu trả lời bị che tới khi mình cũng trả lời:')
  {
    // Tìm một ngày mà CHỈ A trả lời
    const { data: all } = await admin
      .from('question_answers')
      .select('asked_on, user_id')
      .eq('couple_id', couple.id)

    const byDay = new Map()
    for (const r of all ?? []) {
      byDay.set(r.asked_on, [...(byDay.get(r.asked_on) ?? []), r.user_id])
    }
    const onlyA = [...byDay.entries()].find(
      ([, list]) => list.length === 1 && list[0] === A.userId,
    )

    if (!onlyA) {
      check('có ngày chỉ một người trả lời để thử', false, 'không tìm thấy — seed lại?')
    } else {
      const [day] = onlyA
      const { data: seenByB } = await B.client
        .from('question_answers')
        .select('user_id, body')
        .eq('asked_on', day)
      check(
        `B KHÔNG thấy câu của A ngày ${day}`,
        (seenByB ?? []).length === 0,
        `trả về ${seenByB?.length ?? 0} dòng`,
      )

      const { data: seenByA } = await A.client
        .from('question_answers')
        .select('user_id')
        .eq('asked_on', day)
      check('A vẫn thấy câu của chính mình', (seenByA ?? []).length === 1)
    }

    // Ngày cả hai đã trả lời thì phải thấy nhau
    const both = [...byDay.entries()].find(([, list]) => list.length === 2)
    if (both) {
      const { data } = await B.client
        .from('question_answers')
        .select('user_id')
        .eq('asked_on', both[0])
      check(
        `cả hai đã trả lời ngày ${both[0]} → B thấy đủ 2 câu`,
        (data ?? []).length === 2,
        `trả về ${data?.length ?? 0}`,
      )
    }
  }

  // ---------------------------------------------------------------- P5-16
  console.log('\nP5-16 · Thư chưa tới ngày mở không trả về nội dung:')
  {
    const { data: locked } = await admin
      .from('letters')
      .select('id, author_id, open_on, title')
      .eq('couple_id', couple.id)
      .gt('open_on', new Date().toISOString().slice(0, 10))

    const mine = (locked ?? []).find((l) => l.author_id === A.userId)
    const theirs = (locked ?? []).find((l) => l.author_id !== A.userId)

    if (theirs) {
      const { data } = await A.client
        .from('letters')
        .select('id, body')
        .eq('id', theirs.id)
      check(
        `A KHÔNG đọc được thư của B khoá tới ${theirs.open_on}`,
        (data ?? []).length === 0,
        `trả về ${data?.length ?? 0} dòng`,
      )
    } else {
      check('có thư của người kia đang khoá để thử', false)
    }

    if (mine) {
      const { data } = await A.client.from('letters').select('id, body').eq('id', mine.id)
      check('A vẫn đọc lại được thư do chính mình viết', (data ?? []).length === 1)
    }

    // Danh sách thư khoá chỉ trả metadata, tuyệt đối không có body
    const { data: meta } = await A.client.rpc('locked_letters', {
      p_couple_id: couple.id,
    })
    const leaks = (meta ?? []).filter((r) => 'body' in r)
    check('locked_letters() không trả cột body', leaks.length === 0)
  }

  // ---------------------------------------------------------------- P6-48
  console.log('\nP6-48 · Chủ wishlist không thấy dấu của người kia:')
  {
    const { data: items } = await admin
      .from('wishlist_items')
      .select('id, owner_id, title')
      .eq('couple_id', couple.id)

    const { data: marks } = await admin
      .from('wishlist_marks')
      .select('item_id, marked_by')
      .eq('couple_id', couple.id)

    check('có sẵn dấu để thử', (marks ?? []).length > 0, `${marks?.length ?? 0} dấu`)

    for (const mark of marks ?? []) {
      const item = (items ?? []).find((i) => i.id === mark.item_id)
      const owner = item.owner_id === A.userId ? A : B
      const marker = mark.marked_by === A.userId ? A : B

      const { data: seenByOwner } = await owner.client
        .from('wishlist_marks')
        .select('item_id')
        .eq('item_id', mark.item_id)
      check(
        `chủ món "${item.title}" không thấy dấu`,
        (seenByOwner ?? []).length === 0,
        `trả về ${seenByOwner?.length ?? 0}`,
      )

      const { data: seenByMarker } = await marker.client
        .from('wishlist_marks')
        .select('item_id')
        .eq('item_id', mark.item_id)
      check('người đặt dấu vẫn thấy dấu của mình', (seenByMarker ?? []).length === 1)
    }

    // Nội dung wishlist thì cả hai đều đọc được — chỉ DẤU mới bị che
    const { data: itemsSeenByA } = await A.client.from('wishlist_items').select('id')
    check(
      'cả hai vẫn đọc được danh sách món',
      (itemsSeenByA ?? []).length === (items ?? []).length,
      `${itemsSeenByA?.length ?? 0}/${items?.length ?? 0}`,
    )
  }

  // ---------------------------------------------------------------- ghi bậy
  console.log('\nKhông ghi được thay người khác:')
  {
    const { error } = await A.client.from('question_answers').insert({
      couple_id: couple.id,
      user_id: B.userId,
      question_index: 1,
      asked_on: new Date().toISOString().slice(0, 10),
      body: 'giả mạo',
    })
    check('A không trả lời hộ B được', !!error, error?.code ?? '')
  }
  {
    // Cửa sổ trả lời bù là 7 ngày — thử trả lời cho ngày mai
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)
    const { error } = await A.client.from('question_answers').insert({
      couple_id: couple.id,
      user_id: A.userId,
      question_index: 1,
      asked_on: tomorrow,
      body: 'đọc trước câu ngày mai',
    })
    check('A không trả lời trước cho ngày mai được', !!error, error?.code ?? '')
  }
  {
    const old = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10)
    const { error } = await A.client.from('question_answers').insert({
      couple_id: couple.id,
      user_id: A.userId,
      question_index: 1,
      asked_on: old,
      body: 'lấp lịch sử',
    })
    check('A không lấp được câu của 30 ngày trước', !!error, error?.code ?? '')
  }

  // ------------------------------------- ghi vào bảng đã tách policy FOR ALL
  //
  // 17 bảng từng có một policy `FOR ALL` bị tách thành INSERT/UPDATE/DELETE
  // riêng. Tách sai một vế thì ĐỌC vẫn chạy bình thường, chỉ GHI mới hỏng —
  // nên phải thử đủ cả ba lệnh bằng phiên thật, không chỉ thử đọc.
  console.log('\nGhi được vào các bảng đã tách policy:')
  {
    const today = new Date().toISOString().slice(0, 10)
    const cases = [
      {
        table: 'eat_items',
        row: { couple_id: couple.id, name: 'Quán thử nghiệm', added_by: A.userId },
        patch: { name: 'Quán thử nghiệm đã sửa' },
      },
      {
        table: 'goals',
        row: {
          couple_id: couple.id,
          title: 'Mục tiêu thử nghiệm',
          created_by: A.userId,
        },
        patch: { title: 'Mục tiêu thử nghiệm đã sửa' },
      },
      {
        table: 'expenses',
        row: {
          couple_id: couple.id,
          amount_minor: 1000,
          spent_on: today,
          paid_by: A.userId,
          created_by: A.userId,
        },
        patch: { amount_minor: 2000 },
      },
      {
        table: 'albums',
        row: {
          couple_id: couple.id,
          title: 'Album thử nghiệm',
          created_by: A.userId,
        },
        patch: { title: 'Album thử nghiệm đã sửa' },
      },
    ]

    for (const c of cases) {
      const { data: made, error: insErr } = await A.client
        .from(c.table)
        .insert(c.row)
        .select('id')
        .single()
      check(`${c.table}: thêm được`, !insErr && !!made, insErr?.message ?? '')
      if (!made) continue

      const { error: updErr } = await A.client
        .from(c.table)
        .update(c.patch)
        .eq('id', made.id)
      check(`${c.table}: sửa được`, !updErr, updErr?.message ?? '')

      const { data: seenByB } = await B.client
        .from(c.table)
        .select('id')
        .eq('id', made.id)
      check(`${c.table}: người kia đọc được`, (seenByB ?? []).length === 1)

      const { error: delErr } = await A.client
        .from(c.table)
        .delete()
        .eq('id', made.id)
      check(`${c.table}: xoá được`, !delErr, delErr?.message ?? '')

      // Dọn sạch kể cả khi xoá bằng quyền người dùng thất bại
      await admin.from(c.table).delete().eq('id', made.id)
    }
  }

  console.log(
    failed === 0
      ? '\nTất cả đều đạt.\n'
      : `\n${failed} mục HỎNG — xem lại policy trước khi dùng thật.\n`,
  )
  process.exit(failed === 0 ? 0 : 1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
