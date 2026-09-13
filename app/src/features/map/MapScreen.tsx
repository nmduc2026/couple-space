import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { TopHeader } from '../../components/AppShell'
import { usePosts } from '../../hooks/usePosts'
import { useCouple } from '../../hooks/useCouple'
import {
  usePlaceResolution,
  type Unresolved,
  type WardGroup,
} from '../../hooks/usePlaceResolution'
import { supabase } from '../../lib/supabase'
import { PREVIEW } from '../../dev/preview'
import {
  PROVINCES,
  PROVINCE_COUNT,
  normalizePlace,
  provinceByCode,
  type Zone,
} from '../../lib/provinces'
import { btn, input } from '../../lib/ui-classes'

const ZONES: Array<{ key: Zone; label: string }> = [
  { key: 'bac', label: 'Miền Bắc' },
  { key: 'trung', label: 'Miền Trung' },
  { key: 'nam', label: 'Miền Nam' },
]

export function MapScreen() {
  const { posts, isLoading } = usePosts()
  const { visits, foreign, unresolved, toStamp, wardsByProvince } =
    usePlaceResolution(posts)
  const [asking, setAsking] = useState<Unresolved | null>(null)
  // Chạm vào một tỉnh thì mở ra mức chi tiết hơn: những nơi CỤ THỂ đã đi
  // trong tỉnh đó
  const [drill, setDrill] = useState<string | null>(null)
  const queryClient = useQueryClient()

  // Ghi tỉnh đã xác định ngược vào bài. Không có bước này thì
  // `suggested_trips()` (gom album theo chuyến) không bao giờ có dữ liệu.
  const stamped = useRef(false)
  useEffect(() => {
    if (PREVIEW || stamped.current || toStamp.length === 0) return
    stamped.current = true

    async function stamp() {
      const byCode = new Map<string, string[]>()
      for (const row of toStamp) {
        byCode.set(row.code, [...(byCode.get(row.code) ?? []), row.id])
      }
      for (const [code, ids] of byCode) {
        await supabase.from('posts').update({ province_code: code }).in('id', ids)
      }
      await queryClient.invalidateQueries({ queryKey: ['posts'] })
    }

    void stamp()
  }, [toStamp, queryClient])

  const visitedCount = visits.size
  const topProvince = [...visits.entries()].sort((a, b) => b[1] - a[1])[0]

  return (
    <>
      <TopHeader title="Dấu chân" back="/" />

      <div className="flex-1 px-4 py-4">
        {isLoading ? (
          <p className="py-16 text-center text-sm text-muted">Đang tải...</p>
        ) : visitedCount === 0 ? (
          <EmptyState hasPosts={posts.length > 0} />
        ) : (
          <>
            <section className="rounded-2xl border border-border bg-surface p-4">
              <p className="text-[30px] leading-tight font-extrabold text-text">
                {visitedCount}
                <span className="text-[17px] font-semibold text-muted">
                  /{PROVINCE_COUNT} tỉnh thành
                </span>
              </p>
              <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-soft">
                <span
                  className="block h-full rounded-full bg-accent"
                  style={{
                    width: `${(visitedCount / PROVINCE_COUNT) * 100}%`,
                  }}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-muted">
                {topProvince ? (
                  <span>
                    Đi nhiều nhất:{' '}
                    <b className="font-semibold text-text">
                      {provinceByCode(topProvince[0])?.name}
                    </b>{' '}
                    ({topProvince[1]} lần)
                  </span>
                ) : null}
                {foreign > 0 ? (
                  <span>
                    <b className="font-semibold text-text">{foreign}</b> kỉ niệm
                    ở nước ngoài
                  </span>
                ) : null}
              </div>
            </section>

            {unresolved.length > 0 ? (
              <button
                type="button"
                onClick={() => setAsking(unresolved[0])}
                className="mt-3 flex w-full items-center gap-3 rounded-2xl border border-accent/30 bg-soft p-3.5 text-left"
              >
                <span aria-hidden className="text-xl">
                  📍
                </span>
                <span className="min-w-0 flex-1 text-[13.5px] leading-relaxed text-text">
                  Chọn tỉnh cho “{unresolved[0].placeName}”
                  {unresolved.length > 1
                    ? ` và ${unresolved.length - 1} nơi nữa`
                    : ''}
                  .
                </span>
                <span aria-hidden className="shrink-0 text-muted">
                  ›
                </span>
              </button>
            ) : null}

            {ZONES.map((zone) => (
              <section key={zone.key} className="mt-5">
                <h2 className="text-[14px] font-semibold text-muted">
                  {zone.label}
                </h2>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {PROVINCES.filter((p) => p.zone === zone.key).map((p) => {
                    const count = visits.get(p.code) ?? 0
                    return count > 0 ? (
                      <button
                        key={p.code}
                        type="button"
                        onClick={() => setDrill(p.code)}
                        className="rounded-full bg-accent px-2.5 py-1 text-[12px] font-semibold text-on-accent"
                      >
                        {p.name} · {count}
                      </button>
                    ) : (
                      <span
                        key={p.code}
                        className="rounded-full border border-border px-2.5 py-1 text-[12px] text-muted/60"
                      >
                        {p.name}
                      </span>
                    )
                  })}
                </div>
              </section>
            ))}
          </>
        )}
      </div>

      {drill ? (
        <ProvinceDrill
          code={drill}
          wards={wardsByProvince.get(drill) ?? []}
          onClose={() => setDrill(null)}
        />
      ) : null}

      {asking ? (
        <AskProvince
          place={asking}
          onDone={() => setAsking(null)}
        />
      ) : null}
    </>
  )
}

/** Hỏi đúng một lần cho mỗi tên địa điểm, rồi lưu vào `place_aliases`.
 *  Lưu theo tên đã chuẩn hoá nên "Đà Lạt" và "da lat" tính là một. */
function AskProvince({
  place,
  onDone,
}: {
  place: Unresolved
  onDone: () => void
}) {
  const queryClient = useQueryClient()
  const { couple } = useCouple()
  const [term, setTerm] = useState('')
  const [saving, setSaving] = useState(false)

  const needle = normalizePlace(term)
  const matches = needle
    ? PROVINCES.filter((p) => normalizePlace(p.name).includes(needle))
    : PROVINCES

  // Gom theo miền như trên bản đồ: 63 dòng phẳng thì phải đọc từng cái một
  const zones: Array<[Zone, string]> = [
    ['bac', 'Miền Bắc'],
    ['trung', 'Miền Trung'],
    ['nam', 'Miền Nam'],
  ]

  async function save(provinceCode: string | null) {
    if (!couple || PREVIEW) return onDone()
    setSaving(true)
    await supabase.from('place_aliases').insert({
      couple_id: couple.id,
      alias: place.alias,
      province_code: provinceCode,
      country: provinceCode ? 'VN' : 'XX',
    })
    setSaving(false)
    await queryClient.invalidateQueries({ queryKey: ['place_aliases'] })
    await queryClient.invalidateQueries({ queryKey: ['posts'] })
    onDone()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-label="Chọn tỉnh thành"
      onClick={onDone}
    >
      <div
        className="flex max-h-sheet w-full flex-col rounded-t-3xl border-t border-border bg-bg p-5 pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* `flex-none` cho phần đầu: không có nó thì flex bóp dẹt cả ô tìm
            kiếm lẫn tiêu đề để nhường chỗ cho danh sách dài bên dưới. */}
        <div className="flex-none">
          <p className="text-[17px] font-semibold text-text">
            “{place.placeName}” ở đâu?
          </p>
          <p className="mt-1 text-[13px] text-muted">
            {place.count > 1 ? `${place.count} kỉ niệm · ` : ''}Trả lời một lần,
            lần sau app tự nhận.
          </p>

          <div className="relative mt-4">
            <span
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted"
            >
              🔍
            </span>
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Tên tỉnh"
              autoFocus
              className={`${input} pl-10`}
            />
          </div>
        </div>

        <div className="mt-3 min-h-0 flex-1 overflow-y-auto rounded-2xl border border-border bg-surface">
          {matches.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm leading-relaxed text-muted">
              Không có tỉnh nào tên như vậy.
              <br />
              Ở nước ngoài thì chọn nút bên dưới.
            </p>
          ) : (
            zones.map(([zone, label]) => {
              const inZone = matches.filter((p) => p.zone === zone)
              if (inZone.length === 0) return null
              return (
                <div key={zone}>
                  <p className="sticky top-0 z-10 bg-surface px-4 pt-3 pb-1.5 text-[13px] font-medium text-muted">
                    {label}
                  </p>
                  {inZone.map((p) => (
                    <button
                      key={p.code}
                      type="button"
                      disabled={saving}
                      onClick={() => void save(p.code)}
                      className="w-full px-4 py-3 text-left text-[15px] text-text transition active:bg-soft disabled:opacity-50"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )
            })
          )}
        </div>

        <div className="mt-3 flex-none space-y-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => void save(null)}
            className={btn.outline}
          >
            🌏 Ở nước ngoài
          </button>
          <button type="button" onClick={onDone} className={btn.ghost}>
            Để sau
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Mức chi tiết bên trong một tỉnh: phường/xã, rồi tới từng địa điểm.
 *
 * Phường/xã chỉ có với bài tạo bằng nút "Lấy vị trí hiện tại" — lúc đó app tra
 * ngược toạ độ ra địa chỉ thật. Bài gõ tay thì không suy ra được phường từ
 * "Quán Cây Bàng", nên gom vào một nhóm riêng ở cuối thay vì đoán bừa.
 */
function ProvinceDrill({
  code,
  wards,
  onClose,
}: {
  code: string
  wards: WardGroup[]
  onClose: () => void
}) {
  const [openWard, setOpenWard] = useState<string | null>(null)
  const name = provinceByCode(code)?.name ?? code
  const total = wards.reduce((n, w) => n + w.count, 0)
  const named = wards.filter((w) => w.ward !== null).length

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-label={name}
      onClick={onClose}
    >
      <div
        className="flex max-h-sheet w-full flex-col rounded-t-3xl border-t border-border bg-bg p-5 pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-none">
          <p className="text-[17px] font-semibold text-text">{name}</p>
          <p className="mt-1 text-[13px] text-muted">
            {named > 0 ? `${named} phường/xã · ` : ''}
            {total} kỉ niệm
          </p>
        </div>

        <div className="mt-3 min-h-0 flex-1 overflow-y-auto rounded-2xl border border-border bg-surface">
          {wards.map((w) => {
            const key = w.ward ?? ''
            const isOpen = openWard === key
            return (
              <div key={key} className="border-b border-border last:border-b-0">
                <button
                  type="button"
                  onClick={() => setOpenWard(isOpen ? null : key)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left"
                >
                  <span aria-hidden>{w.ward ? '🏘️' : '📍'}</span>
                  <span className="min-w-0 flex-1">
                    <b className="block truncate text-[15px] font-medium text-text">
                      {w.ward ?? 'Chưa rõ phường/xã'}
                    </b>
                    {w.ward ? null : (
                      <small className="block text-[11.5px] text-muted">
                        Bài gõ địa điểm bằng tay
                      </small>
                    )}
                  </span>
                  <span className="shrink-0 text-[12.5px] text-muted">
                    {w.count}
                  </span>
                  <span aria-hidden className="shrink-0 text-muted">
                    {isOpen ? '▾' : '▸'}
                  </span>
                </button>

                {isOpen ? (
                  <ul className="bg-bg/60 px-2 pb-2">
                    {w.places.map((p) => (
                      <li key={p.placeName}>
                        <Link
                          to={`/timeline?place=${encodeURIComponent(p.placeName)}`}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[14px] text-text"
                        >
                          <span aria-hidden className="text-[12px]">
                            📍
                          </span>
                          <span className="min-w-0 flex-1 truncate">
                            {p.placeName}
                          </span>
                          <span className="shrink-0 text-[12px] text-muted">
                            {p.count} lần
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            )
          })}
        </div>

        <div className="mt-3 flex-none space-y-2">
          <Link to={`/timeline?province=${code}`} className={btn.outline}>
            Xem tất cả kỉ niệm ở {name}
          </Link>
          <button type="button" onClick={onClose} className={btn.ghost}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ hasPosts }: { hasPosts: boolean }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <p className="text-5xl" aria-hidden>
        🗺️
      </p>
      <p className="mt-5 text-[17px] font-semibold text-text">
        Chưa có địa điểm trên bản đồ.
      </p>
      <Link
        to={hasPosts ? '/timeline' : '/compose'}
        className={`${btn.primary} mt-7 max-w-[18rem]`}
      >
        {hasPosts ? 'Mở kỉ niệm' : 'Thêm kỉ niệm'}
      </Link>
    </div>
  )
}
