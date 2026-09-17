import { useEffect, useMemo, useRef, useState } from 'react'
import { geoBounds, geoMercator } from 'd3-geo'
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from 'react-simple-maps'
import islandsGeo from '../../lib/geo/islands-inset.geojson'

type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  geography: any
  visitsByCode: Map<string, number>
  onSelect?: (code: string, name: string) => void
  center?: [number, number]
  zoom?: number
  height?: number
  fillHeight?: boolean
  /** Vẽ Hoàng Sa / Trường Sa cùng projection với đất liền. */
  includeIslands?: boolean
}

/** Chỉ tô khi đã đi — chưa đi để trắng, viền xám. */
const FILL = {
  none: '#ffffff',
  soft: '#f4d0d9',
  mid: '#e392a4',
  hot: '#c2415b',
} as const

const STROKE = {
  idle: '#9a7a86',
  visited: '#8f2f45',
} as const

function fillFor(count: number): string {
  if (count <= 0) return FILL.none
  if (count === 1) return FILL.soft
  if (count === 2) return FILL.mid
  return FILL.hot
}

type GeoProps = {
  code?: string
  name?: string
  parent_code?: string
  kind?: string
}

type MapView = {
  coordinates: [number, number]
  zoom: number
}

const MAP_W = 400
const ZOOM_MIN = 1
const ZOOM_MAX = 8
const ZOOM_STEP = 1.35

/** Tâm mặc định hơi lệch đông — cân đất liền + hai quần đảo. */
const DEFAULT_CENTER: [number, number] = [108.2, 15.8]

function clampZoom(z: number) {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Number(z.toFixed(2))))
}

/** Giữ tâm trong vùng địa lý — zoom càng nhỏ càng khó kéo ra khoảng trống. */
function clampCenter(
  coords: [number, number],
  zoom: number,
  bounds: [[number, number], [number, number]],
  home: [number, number],
): [number, number] {
  if (zoom <= ZOOM_MIN + 0.05) return [home[0], home[1]]
  const [[minX, minY], [maxX, maxY]] = bounds
  // Cho phép lệch biên một chút khi zoom gần; thu hẹp khi zoom nhỏ
  const pad = Math.max(0.02, 0.22 / zoom)
  const lonPad = (maxX - minX) * pad
  const latPad = (maxY - minY) * pad
  return [
    Math.min(maxX + lonPad, Math.max(minX - lonPad, coords[0])),
    Math.min(maxY + latPad, Math.max(minY - latPad, coords[1])),
  ]
}

export function FootprintChoropleth({
  geography,
  visitsByCode,
  onSelect,
  center = DEFAULT_CENTER,
  zoom: zoomProp = 1,
  height = 420,
  fillHeight = false,
  includeIslands = false,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [boxH, setBoxH] = useState(height)
  /** Giữ cả tâm đang xem — nếu chỉ đổi zoom mà center cố định thì map nhảy về giữa nước. */
  const [view, setView] = useState<MapView>({
    coordinates: center,
    zoom: zoomProp,
  })

  useEffect(() => {
    setView({ coordinates: [center[0], center[1]], zoom: zoomProp })
  }, [center[0], center[1], zoomProp])

  useEffect(() => {
    if (!fillHeight) {
      setBoxH(height)
      return
    }
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const h = Math.floor(entry?.contentRect.height ?? 0)
      if (h > 0) setBoxH(h)
    })
    ro.observe(el)
    setBoxH(Math.floor(el.clientHeight) || height)
    return () => ro.disconnect()
  }, [fillHeight, height])

  const mapH = fillHeight ? Math.max(boxH, 280) : height

  const mapGeography = useMemo(() => {
    if (!includeIslands) return geography
    return {
      type: 'FeatureCollection',
      features: [...(geography?.features ?? []), ...islandsGeo.features],
    }
  }, [geography, includeIslands])

  const geoBox = useMemo(
    () => geoBounds(mapGeography) as [[number, number], [number, number]],
    [mapGeography],
  )

  /** fitExtent — đất liền + (tuỳ chọn) Hoàng Sa / Trường Sa. */
  const projection = useMemo(() => {
    const padX = includeIslands ? 4 : 6
    const padY = 6
    return geoMercator().fitExtent(
      [
        [padX, padY],
        [MAP_W - padX, mapH - padY],
      ],
      mapGeography,
    )
  }, [mapGeography, mapH, includeIslands])

  function applyView(coordinates: [number, number], z: number) {
    const zoom = clampZoom(z)
    setView({
      coordinates: clampCenter(coordinates, zoom, geoBox, center),
      zoom,
    })
  }

  function zoomBy(factor: number) {
    setView((v) => {
      const zoom = clampZoom(v.zoom * factor)
      return {
        coordinates: clampCenter(v.coordinates, zoom, geoBox, center),
        zoom,
      }
    })
  }

  return (
    <div
      ref={wrapRef}
      className={`relative overflow-hidden rounded-xl border border-border bg-surface ${
        fillHeight ? 'h-full min-h-[280px]' : ''
      }`}
    >
      <ComposableMap
        projection={projection}
        width={MAP_W}
        height={mapH}
        style={{ width: '100%', height: '100%', background: 'transparent' }}
      >
        <ZoomableGroup
          center={view.coordinates}
          zoom={view.zoom}
          minZoom={ZOOM_MIN}
          maxZoom={ZOOM_MAX}
          translateExtent={[
            [-MAP_W * 0.15, -mapH * 0.15],
            [MAP_W * 1.15, mapH * 1.15],
          ]}
          onMoveEnd={({ coordinates, zoom: z }) => {
            if (!coordinates || typeof z !== 'number') return
            applyView(coordinates, z)
          }}
        >
          <Geographies geography={mapGeography}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const props = (geo.properties ?? {}) as GeoProps
                const isIsland = props.kind === 'island_inset'
                const parentCode = String(props.parent_code ?? '')
                const code = String(props.code ?? '')
                const name = String(props.name ?? code)
                // Đảo tô theo tỉnh cha; chạm → mở tỉnh cha
                const colorCode = isIsland ? parentCode : code
                const selectCode = isIsland ? parentCode : code
                const selectName = isIsland
                  ? parentCode === '48'
                    ? 'Đà Nẵng'
                    : 'Khánh Hòa'
                  : name
                const count = visitsByCode.get(colorCode) ?? 0
                const visited = count > 0
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => onSelect?.(selectCode, selectName)}
                    fill={fillFor(count)}
                    stroke={visited ? STROKE.visited : STROKE.idle}
                    strokeWidth={isIsland ? 0.25 : visited ? 0.45 : 0.35}
                    style={{
                      outline: 'none',
                      cursor: onSelect ? 'pointer' : 'default',
                    }}
                  />
                )
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      <div className="absolute right-2.5 bottom-2.5 z-10 flex flex-col overflow-hidden rounded-xl border border-border bg-surface/95 shadow-sm backdrop-blur-sm">
        <button
          type="button"
          aria-label="Phóng to"
          onClick={() => zoomBy(ZOOM_STEP)}
          disabled={view.zoom >= ZOOM_MAX}
          className="grid h-9 w-9 place-items-center text-[18px] font-medium text-text transition active:bg-soft disabled:opacity-35"
        >
          +
        </button>
        <span aria-hidden className="h-px bg-border" />
        <button
          type="button"
          aria-label="Thu nhỏ"
          onClick={() => zoomBy(1 / ZOOM_STEP)}
          disabled={view.zoom <= ZOOM_MIN}
          className="grid h-9 w-9 place-items-center text-[18px] font-medium text-text transition active:bg-soft disabled:opacity-35"
        >
          −
        </button>
      </div>
    </div>
  )
}
