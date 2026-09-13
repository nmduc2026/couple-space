import { useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TopHeader } from '../../components/AppShell'
import { useCouple } from '../../hooks/useCouple'
import { useMyProfile } from '../../hooks/useMyProfile'
import { daysTogether, todayYmd } from '../../lib/dateCount'
import { wrappedSeason } from '../../lib/wrappedSeason'
import { coupleThemeByKey, coverGradient } from '../../lib/coupleTheme'
import { formatShortVnd } from '../../lib/money'
import { supabase } from '../../lib/supabase'
import { PREVIEW, previewWrapped } from '../../dev/preview'
import { btn } from '../../lib/ui-classes'

type Stats = Record<string, number | string | null>

type Line = {
  key: string
  label: string
  value: string
  emoji: string
}

export function WrappedScreen() {
  const { couple } = useCouple()
  const { profile } = useMyProfile()
  const myTheme = profile?.color_theme ?? couple?.theme
  // Tháng 1 vẫn xem tổng kết của năm vừa qua, không phải năm mới rỗng không
  const season = wrappedSeason(todayYmd())
  const year = season.visible ? season.year : new Date().getFullYear()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pngUrl, setPngUrl] = useState<string | null>(null)
  const [off, setOff] = useState<Set<string>>(new Set())

  const query = useQuery({
    queryKey: ['wrapped', couple?.id, year],
    enabled: !!couple?.id && !PREVIEW,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('wrapped_stats', {
        p_couple_id: couple!.id,
        p_year: year,
      })
      if (error) throw error
      return data as Stats
    },
  })

  const stats = PREVIEW ? previewWrapped() : query.data
  const together = couple ? daysTogether(couple.start_date) : 0

  // Cặp mới quen: dưới 30 ngày thì chưa có gì để tổng kết.
  if (together < 30) {
    return (
      <>
        <TopHeader title={`Tổng kết ${year}`} back="/" />
        <div className="flex-1 px-6 py-16 text-center">
          <p className="text-5xl" aria-hidden>
            🌱
          </p>
          <p className="mt-5 text-[17px] font-semibold text-text">
            Chưa đủ dữ liệu.
          </p>
        </div>
      </>
    )
  }

  const lines = buildLines(stats, together)
  const shown = lines.filter((l) => !off.has(l.key))

  async function makeImage() {
    const canvas = canvasRef.current
    if (!canvas || !couple) return
    drawCard(canvas, {
      year,
      names: couple.members.map((m) => m.nickname ?? '').filter(Boolean),
      lines: shown,
      cover: coupleThemeByKey(myTheme).cover,
    })
    const url = canvas.toDataURL('image/png')
    setPngUrl(url)

    const blob = await (await fetch(url)).blob()
    const file = new File([blob], `couple-space-${year}.png`, {
      type: 'image/png',
    })
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: `Tổng kết ${year}` })
    }
  }

  return (
    <>
      <TopHeader title={`Tổng kết ${year}`} back="/" />

      <div className="flex-1 px-4 py-4">
        {season.visible && !season.final ? (
          <p className="mb-3 rounded-2xl border border-border bg-surface px-4 py-2.5 text-center text-[12.5px] text-muted">
            Tạm tính · chốt 31/12.
          </p>
        ) : null}

        {lines.length === 0 ? (
          <p className="py-16 text-center text-sm leading-relaxed text-muted">
            Năm nay chưa có đủ dữ liệu để tổng kết.
          </p>
        ) : (
          <>
            {/* Bản xem trước dựng từ cùng một danh sách với ảnh xuất ra,
                nên cái nhìn thấy đúng là cái sẽ gửi đi. */}
            {/* Bản xem trước và ảnh xuất ra phải dùng CÙNG một bộ màu, nếu
                không thì cái nhìn thấy khác cái gửi đi */}
            <section
              className="overflow-hidden rounded-[1.5rem] px-6 py-8 text-center text-white"
              style={{ backgroundImage: coverGradient(myTheme) }}
            >
              <p className="text-[11px] font-bold tracking-[0.2em] uppercase opacity-90">
                Couple Space · {year}
              </p>
              <p className="mt-1 text-[15px] font-semibold">
                {couple?.members.map((m) => m.nickname).join(' 🤍 ')}
              </p>
              <ul className="mt-6 space-y-3 text-left">
                {shown.map((l) => (
                  <li key={l.key} className="flex items-center gap-3">
                    <span aria-hidden className="text-xl">
                      {l.emoji}
                    </span>
                    <span className="flex-1 text-[14px] opacity-90">
                      {l.label}
                    </span>
                    <b className="text-[19px] font-extrabold">{l.value}</b>
                  </li>
                ))}
              </ul>
              <p className="mt-7 text-[13.5px] leading-relaxed opacity-95">
                {closingLine(stats, together)}
              </p>
            </section>

            <h2 className="mt-6 text-[14px] font-semibold text-muted">
              Chọn thứ muốn khoe
            </h2>
            <ul className="mt-2 overflow-hidden rounded-2xl border border-border bg-surface divide-y divide-border">
              {lines.map((l) => (
                <li
                  key={l.key}
                  className="flex items-center gap-3 px-4 py-3 text-[14px]"
                >
                  <span aria-hidden>{l.emoji}</span>
                  <span className="min-w-0 flex-1 truncate text-text">
                    {l.label}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={!off.has(l.key)}
                    aria-label={l.label}
                    onClick={() =>
                      setOff((prev) => {
                        const next = new Set(prev)
                        if (next.has(l.key)) next.delete(l.key)
                        else next.add(l.key)
                        return next
                      })
                    }
                    className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                      off.has(l.key) ? 'bg-border' : 'bg-accent'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition-all ${
                        off.has(l.key) ? 'left-0.5' : 'left-[1.375rem]'
                      }`}
                    />
                  </button>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => void makeImage()}
              className={`${btn.primary} mt-5`}
            >
              Tạo ảnh chia sẻ
            </button>

            {pngUrl ? (
              <div className="mt-4 text-center">
                <img
                  src={pngUrl}
                  alt={`Tổng kết ${year}`}
                  className="mx-auto rounded-2xl border border-border"
                />
                <p className="mt-2 text-[12.5px] text-muted">
                  Nhấn giữ vào ảnh để lưu về máy.
                </p>
              </div>
            ) : null}

            <canvas ref={canvasRef} hidden />
          </>
        )}
      </div>
    </>
  )
}

/** Chỉ dựng dòng cho nhóm CÓ dữ liệu thật. Hiện số 0 còn tệ hơn im lặng. */
function buildLines(stats: Stats | undefined, together: number): Line[] {
  if (!stats) return []
  const n = (k: string) => Number(stats[k] ?? 0)
  const young = together < 180
  const lines: Line[] = []

  if (n('posts') > 0) {
    lines.push({
      key: 'posts',
      emoji: '📷',
      label: young ? 'Ngày có kỉ niệm' : 'Kỉ niệm đã lưu',
      value: String(young ? n('days_with_memory') : n('posts')),
    })
  }
  if (n('photos') > 0) {
    lines.push({
      key: 'photos',
      emoji: '🖼️',
      label: 'Tấm ảnh',
      value: String(n('photos')),
    })
  }
  if (n('provinces') > 0) {
    lines.push({
      key: 'provinces',
      emoji: '🗺️',
      label: 'Tỉnh thành đã đi',
      value: String(n('provinces')),
    })
  }
  if (n('eat_visits') > 0) {
    lines.push({
      key: 'eat',
      emoji: '🍜',
      label: 'Bữa ăn ngoài',
      value: String(n('eat_visits')),
    })
  }
  if (n('spend_minor') > 0) {
    lines.push({
      key: 'spend',
      emoji: '💰',
      label: 'Đã tiêu cùng nhau',
      value: formatShortVnd(n('spend_minor')),
    })
  }
  if (n('goals_done') > 0) {
    lines.push({
      key: 'goals',
      emoji: '✨',
      label: 'Mục tiêu hoàn thành',
      value: String(n('goals_done')),
    })
  }
  if (n('question_days') > 0) {
    lines.push({
      key: 'questions',
      emoji: '💭',
      label: 'Ngày cùng trả lời câu hỏi',
      value: String(n('question_days')),
    })
  }
  if (stats['top_place']) {
    lines.push({
      key: 'top_place',
      emoji: '🏆',
      label: 'Quán ruột',
      value: String(stats['top_place']),
    })
  }
  return lines
}

/** Câu kết viết bằng văn. Không bao giờ so sánh theo hướng tiêu cực —
 *  không có "ít hơn năm ngoái", không có "chỉ", không có "mới chỉ". */
function closingLine(stats: Stats | undefined, together: number): string {
  if (!stats) return ''
  const days = Number(stats['days_with_memory'] ?? 0)
  const provinces = Number(stats['provinces'] ?? 0)

  if (together < 180) {
    return days > 0
      ? `Mới quen nhau mà đã có ${days} ngày đáng nhớ rồi.`
      : 'Mọi chuyện chỉ mới bắt đầu thôi.'
  }
  if (provinces >= 5) {
    return `${provinces} tỉnh thành, và vẫn còn cả một danh sách chưa đi.`
  }
  if (days >= 50) {
    return `${days} ngày có chuyện để kể. Năm sau còn dài.`
  }
  return 'Một năm nữa đi cùng nhau.'
}

/** Vẽ ảnh chia sẻ bằng Canvas — cùng danh sách `lines` với bản xem trước. */
function drawCard(
  canvas: HTMLCanvasElement,
  data: {
    year: number
    names: string[]
    lines: Line[]
    cover: [string, string, string]
  },
) {
  const W = 1080
  const H = 1350
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const grad = ctx.createLinearGradient(0, 0, W, H)
  grad.addColorStop(0, data.cover[0])
  grad.addColorStop(0.55, data.cover[1])
  grad.addColorStop(1, data.cover[2])
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.font = '600 34px "Be Vietnam Pro", system-ui, sans-serif'
  ctx.globalAlpha = 0.9
  ctx.fillText(`COUPLE SPACE · ${data.year}`, W / 2, 150)
  ctx.globalAlpha = 1
  ctx.font = '700 52px "Be Vietnam Pro", system-ui, sans-serif'
  ctx.fillText(data.names.join('  🤍  '), W / 2, 230)

  ctx.textAlign = 'left'
  let y = 380
  for (const line of data.lines.slice(0, 7)) {
    ctx.font = '400 40px "Be Vietnam Pro", system-ui, sans-serif'
    ctx.globalAlpha = 0.9
    ctx.fillText(`${line.emoji}  ${line.label}`, 110, y)
    ctx.globalAlpha = 1
    ctx.textAlign = 'right'
    ctx.font = '800 52px "Be Vietnam Pro", system-ui, sans-serif'
    ctx.fillText(line.value, W - 110, y)
    ctx.textAlign = 'left'
    y += 110
  }

  ctx.textAlign = 'center'
  ctx.globalAlpha = 0.85
  ctx.font = '400 34px "Be Vietnam Pro", system-ui, sans-serif'
  ctx.fillText('couple-space', W / 2, H - 90)
}
