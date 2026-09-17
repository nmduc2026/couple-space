import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { TopHeader } from '../../components/AppShell'
import { InlineLoading } from '../../components/EmptyState'
import { usePosts } from '../../hooks/usePosts'
import { usePlaceResolution } from '../../hooks/usePlaceResolution'
import { useCommunes, useProvinces } from '../../hooks/useAdminUnits'
import { unitByCode } from '../../lib/adminUnits'
import { FootprintChoropleth } from './FootprintChoropleth'
import { btn } from '../../lib/ui-classes'

const communeModules = import.meta.glob('../../lib/geo/communes/*.geojson')

export function ProvinceMapScreen() {
  const { code = '' } = useParams()
  const { data: provinces = [], isLoading: loadingProv } = useProvinces()
  const province = unitByCode(provinces, code)
  const { data: communes = [] } = useCommunes(province?.id)
  const { posts, isLoading: loadingPosts } = usePosts()
  const { visits, communeVisits, wardsByProvince } = usePlaceResolution(posts)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [geo, setGeo] = useState<any>(null)
  const [geoFailed, setGeoFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    setGeo(null)
    setGeoFailed(false)
    if (!code) return
    const key = `../../lib/geo/communes/${code}.geojson`
    const loader = communeModules[key]
    if (!loader) {
      setGeoFailed(true)
      return
    }
    void loader()
      .then((mod) => {
        if (!cancelled) setGeo((mod as { default: unknown }).default)
      })
      .catch(() => {
        if (!cancelled) setGeoFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [code])

  const visitsByCode = useMemo(() => {
    const m = new Map<string, number>()
    const byId = new Map(communes.map((c) => [c.id, c.code]))
    for (const [id, count] of communeVisits) {
      const c = byId.get(id)
      if (c) m.set(c, count)
    }
    return m
  }, [communes, communeVisits])

  const visitCount = province ? (visits.get(province.id) ?? 0) : 0
  const wards = province ? (wardsByProvince.get(province.id) ?? []) : []
  const center: [number, number] =
    province?.lng != null && province?.lat != null
      ? [province.lng, province.lat]
      : [106.5, 16.2]

  if (loadingProv || loadingPosts) {
    return (
      <>
        <TopHeader title="…" back="/map" />
        <InlineLoading />
      </>
    )
  }

  if (!province) {
    return (
      <>
        <TopHeader title="Không tìm thấy" back="/map" />
        <p className="px-4 py-6 text-muted">Không có tỉnh mã “{code}”.</p>
      </>
    )
  }

  return (
    <>
      <TopHeader title={province.name} back="/map" />
      <div className="flex-1 px-4 py-4">
        <p className="text-[14px] text-muted">
          {visitCount > 0
            ? `${visitCount} kỉ niệm · ${visitsByCode.size} xã/phường đã gắn`
            : 'Chưa có kỉ niệm gắn tỉnh này'}
        </p>

        <div className="mt-3">
          {geoFailed ? (
            <p className="rounded-xl border border-border bg-soft p-4 text-[13px] text-muted">
              Chưa có bản đồ xã cho tỉnh này.
            </p>
          ) : !geo ? (
            <InlineLoading />
          ) : (
            <FootprintChoropleth
              geography={geo}
              visitsByCode={visitsByCode}
              center={center}
              zoom={1.2}
              height={460}
            />
          )}
        </div>

        {wards.length > 0 ? (
          <section className="mt-5">
            <h2 className="text-[14px] font-semibold text-muted">Đã đi trong tỉnh</h2>
            <ul className="mt-2 space-y-2">
              {wards.map((w) => (
                <li
                  key={w.ward ?? '_'}
                  className="rounded-xl border border-border bg-surface px-3.5 py-3"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold text-text">
                      {w.ward ?? 'Chưa rõ phường/xã'}
                    </span>
                    <span className="text-[12px] text-muted">{w.count}</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {w.places.slice(0, 6).map((p) => (
                      <Link
                        key={p.placeName}
                        to={`/timeline?place=${encodeURIComponent(p.placeName)}`}
                        className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted"
                      >
                        {p.placeName}
                      </Link>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <Link to={`/timeline?province=${province.code}`} className={`${btn.outline} mt-5 block text-center`}>
          Xem kỉ niệm tại {province.name}
        </Link>
      </div>
    </>
  )
}
