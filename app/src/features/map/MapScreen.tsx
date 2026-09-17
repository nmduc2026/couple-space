import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { TopHeader } from '../../components/AppShell'
import { EmptyState, InlineLoading } from '../../components/EmptyState'
import { useCouple } from '../../hooks/useCouple'
import { usePosts } from '../../hooks/usePosts'
import { usePlaceResolution, type Unresolved } from '../../hooks/usePlaceResolution'
import { useProvinces } from '../../hooks/useAdminUnits'
import { supabase } from '../../lib/supabase'
import { PREVIEW } from '../../dev/preview'
import { normalizePlace, type AdminUnit, type AdminZone } from '../../lib/adminUnits'
import { Modal } from '../../components/Modal'
import { btn, input } from '../../lib/ui-classes'
import { FootprintChoropleth } from './FootprintChoropleth'
import provincesGeo from '../../lib/geo/vietnam-provinces.geojson'

const ZONES: Array<{ key: AdminZone; label: string }> = [
  { key: 'bac', label: 'Miền Bắc' },
  { key: 'trung', label: 'Miền Trung' },
  { key: 'nam', label: 'Miền Nam' },
]

type View = 'map' | 'grid'

export function MapScreen() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const view: View = params.get('view') === 'grid' ? 'grid' : 'map'
  const { posts, isLoading } = usePosts()
  const { data: provinces = [] } = useProvinces()
  const { visits, foreign, unresolved, toStamp } = usePlaceResolution(posts)
  const [asking, setAsking] = useState<Unresolved | null>(null)
  const queryClient = useQueryClient()

  const stamped = useRef(false)
  useEffect(() => {
    if (PREVIEW || stamped.current || toStamp.length === 0) return
    stamped.current = true
    async function stamp() {
      const byUnit = new Map<string, string[]>()
      for (const row of toStamp) {
        byUnit.set(row.unitId, [...(byUnit.get(row.unitId) ?? []), row.id])
      }
      for (const [unitId, ids] of byUnit) {
        await supabase.from('posts').update({ admin_unit_id: unitId }).in('id', ids)
      }
      await queryClient.invalidateQueries({ queryKey: ['posts'] })
    }
    void stamp()
  }, [toStamp, queryClient])

  const byId = useMemo(() => {
    const m = new Map<string, AdminUnit>()
    for (const p of provinces) m.set(p.id, p)
    return m
  }, [provinces])

  const visitsByCode = useMemo(() => {
    const m = new Map<string, number>()
    for (const [id, count] of visits) {
      const code = byId.get(id)?.code
      if (code) m.set(code, count)
    }
    return m
  }, [visits, byId])

  const visitedCount = visits.size
  const provinceCount = provinces.length || 34
  const topProvince = [...visits.entries()].sort((a, b) => b[1] - a[1])[0]

  function setView(next: View) {
    const p = new URLSearchParams(params)
    if (next === 'grid') p.set('view', 'grid')
    else p.delete('view')
    setParams(p, { replace: true })
  }

  return (
    <>
      <TopHeader
        title="Dấu chân"
        back="/"
        right={
          <div className="flex overflow-hidden rounded-full border border-border">
            {(
              [
                ['map', '🗺️'],
                ['grid', '▦'],
              ] as const
            ).map(([value, icon]) => (
              <button
                key={value}
                type="button"
                aria-label={value === 'map' ? 'Bản đồ' : 'Dạng lưới'}
                aria-pressed={view === value}
                onClick={() => setView(value)}
                className={`px-3 py-1 text-sm ${
                  view === value ? 'bg-accent text-on-accent' : 'text-muted'
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col px-4 pb-2 pt-3">
        {isLoading ? (
          <InlineLoading />
        ) : visitedCount === 0 && unresolved.length === 0 ? (
          <EmptyState
            emoji="🗺️"
            title="Chưa có địa điểm trên bản đồ."
            action={{
              type: 'link',
              to: posts.length > 0 ? '/timeline' : '/compose',
              label: posts.length > 0 ? 'Mở kỉ niệm' : 'Thêm kỉ niệm',
            }}
          />
        ) : (
          <>
            <section className="shrink-0 rounded-xl border border-border bg-surface p-3.5">
              <p className="text-[28px] leading-tight font-extrabold text-text">
                {visitedCount}
                <span className="text-[16px] font-semibold text-muted">
                  /{provinceCount} tỉnh thành
                </span>
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-soft">
                <span
                  className="block h-full rounded-full bg-accent"
                  style={{
                    width: `${provinceCount ? (visitedCount / provinceCount) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-muted">
                {topProvince ? (
                  <span>
                    Đi nhiều nhất:{' '}
                    <b className="font-semibold text-text">
                      {byId.get(topProvince[0])?.name}
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
                className="mt-2.5 flex w-full shrink-0 items-center gap-3 rounded-xl border border-accent/30 bg-soft p-3 text-left"
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

            {view === 'map' ? (
              <div className="mt-2.5 min-h-0 flex-1">
                <FootprintChoropleth
                  geography={provincesGeo}
                  visitsByCode={visitsByCode}
                  onSelect={(code) => navigate(`/map/${code}`)}
                  fillHeight
                  includeIslands
                />
              </div>
            ) : (
              <div className="mt-2.5 min-h-0 flex-1 overflow-y-auto">
                {ZONES.map((zone) => (
                  <section key={zone.key} className="mt-4 first:mt-1">
                    <h2 className="text-[14px] font-semibold text-muted">
                      {zone.label}
                    </h2>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {provinces
                        .filter((p) => p.zone === zone.key)
                        .map((p) => {
                          const count = visits.get(p.id) ?? 0
                          return count > 0 ? (
                            <Link
                              key={p.id}
                              to={`/map/${p.code}`}
                              className="rounded-full bg-accent px-2.5 py-1 text-[12px] font-semibold text-on-accent"
                            >
                              {p.name} · {count}
                            </Link>
                          ) : (
                            <span
                              key={p.id}
                              className="rounded-full border border-border px-2.5 py-1 text-[12px] text-muted/60"
                            >
                              {p.name}
                            </span>
                          )
                        })}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {asking ? (
        <AskUnit place={asking} provinces={provinces} onDone={() => setAsking(null)} />
      ) : null}
    </>
  )
}

function AskUnit({
  place,
  provinces,
  onDone,
}: {
  place: Unresolved
  provinces: AdminUnit[]
  onDone: () => void
}) {
  const queryClient = useQueryClient()
  const { couple } = useCouple()
  const [q, setQ] = useState('')
  const needle = normalizePlace(q)
  const list = needle
    ? provinces.filter((p) => normalizePlace(p.name).includes(needle))
    : provinces

  async function save(unitId: string | null) {
    if (!couple?.id) return
    await supabase.from('place_aliases').upsert(
      {
        couple_id: couple.id,
        alias: place.alias,
        admin_unit_id: unitId,
        country: unitId ? 'VN' : 'XX',
      },
      { onConflict: 'couple_id,alias' },
    )
    await queryClient.invalidateQueries({ queryKey: ['place_aliases'] })
    await queryClient.invalidateQueries({ queryKey: ['posts'] })
    onDone()
  }

  return (
    <Modal onClose={onDone} ariaLabel="Chọn tỉnh thành">
      <div className="p-4">
        <h2 className="text-[17px] font-bold text-text">
          “{place.placeName}” thuộc đâu?
        </h2>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tên tỉnh"
          className={`${input} mt-3`}
        />
        <div className="mt-3 max-h-72 space-y-1 overflow-y-auto">
          {list.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => void save(p.id)}
              className="flex w-full rounded-xl px-3 py-2.5 text-left text-[14px] text-text hover:bg-soft"
            >
              {p.name}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => void save(null)} className={`${btn.outline} mt-3 w-full`}>
          Nước ngoài
        </button>
      </div>
    </Modal>
  )
}
