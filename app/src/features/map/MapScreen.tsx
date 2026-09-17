import { useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { TopHeader } from '../../components/AppShell'
import { EmptyState, InlineLoading } from '../../components/EmptyState'
import { usePosts } from '../../hooks/usePosts'
import { usePlaceResolution } from '../../hooks/usePlaceResolution'
import { useProvinces } from '../../hooks/useAdminUnits'
import { supabase } from '../../lib/supabase'
import { PREVIEW } from '../../dev/preview'
import { type AdminUnit, type AdminZone } from '../../lib/adminUnits'
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

  const visitedList = useMemo(() => {
    return [...visits.entries()]
      .map(([id, count]) => ({
        id,
        count,
        name: byId.get(id)?.name ?? '—',
        code: byId.get(id)?.code ?? '',
      }))
      .filter((row) => row.code)
      .sort(
        (a, b) =>
          b.count - a.count || a.name.localeCompare(b.name, 'vi'),
      )
  }, [visits, byId])

  const visitedCount = visits.size
  const visitTotal = useMemo(
    () => [...visits.values()].reduce((n, c) => n + c, 0),
    [visits],
  )
  const provinceCount = provinces.length || 34
  const hasPlaces =
    visitedCount > 0 || unresolved.length > 0 || foreign > 0

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
        ) : !hasPlaces ? (
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
              <p className="text-[15px] text-text">
                {visitedCount}/{provinceCount} tỉnh thành
                {visitTotal > 0 ? (
                  <span className="text-muted"> · {visitTotal} lần</span>
                ) : null}
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-soft">
                <span
                  className="block h-full rounded-full bg-accent"
                  style={{
                    width: `${provinceCount ? (visitedCount / provinceCount) * 100 : 0}%`,
                  }}
                />
              </div>

              {visitedList.length > 0 ? (
                <ul className="mt-3 max-h-36 space-y-1.5 overflow-y-auto">
                  {visitedList.map((row) => (
                    <li key={row.id}>
                      <Link
                        to={`/map/${row.code}`}
                        className="flex items-baseline justify-between gap-3 rounded-lg px-1 py-0.5 text-[13px] text-text hover:bg-soft"
                      >
                        <span className="min-w-0 truncate">{row.name}</span>
                        <span className="shrink-0 text-muted">
                          {row.count} lần
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}

              {foreign > 0 ? (
                <p className="mt-2 text-[13px] text-muted">
                  {foreign} kỉ niệm ở nước ngoài
                </p>
              ) : null}

              {unresolved.length > 0 ? (
                <div className="mt-3 border-t border-border pt-3">
                  <p className="text-[13px] text-muted">Khác</p>
                  <ul className="mt-2 max-h-28 space-y-1.5 overflow-y-auto">
                    {unresolved.map((row) => {
                      const postId = row.postIds[0]
                      return (
                        <li key={row.alias}>
                          {postId ? (
                            <Link
                              to={`/timeline/${postId}?edit=1`}
                              className="flex items-baseline justify-between gap-3 rounded-lg px-1 py-0.5 text-[13px] text-text hover:bg-soft"
                            >
                              <span className="min-w-0 truncate">
                                {row.placeName}
                              </span>
                              <span className="shrink-0 text-muted">
                                {row.count} lần
                              </span>
                            </Link>
                          ) : (
                            <span className="flex items-baseline justify-between gap-3 px-1 py-0.5 text-[13px] text-muted">
                              <span className="min-w-0 truncate">
                                {row.placeName}
                              </span>
                              <span className="shrink-0">{row.count} lần</span>
                            </span>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ) : null}
            </section>

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
                {unresolved.length > 0 ? (
                  <section className="mt-4">
                    <h2 className="text-[14px] font-semibold text-muted">Khác</h2>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {unresolved.map((row) => {
                        const postId = row.postIds[0]
                        return postId ? (
                          <Link
                            key={row.alias}
                            to={`/timeline/${postId}?edit=1`}
                            className="rounded-full border border-border px-2.5 py-1 text-[12px] text-text"
                          >
                            {row.placeName} · {row.count}
                          </Link>
                        ) : (
                          <span
                            key={row.alias}
                            className="rounded-full border border-border px-2.5 py-1 text-[12px] text-muted"
                          >
                            {row.placeName} · {row.count}
                          </span>
                        )
                      })}
                    </div>
                  </section>
                ) : null}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
