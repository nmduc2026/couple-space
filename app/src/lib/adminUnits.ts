/** Danh mục đơn vị hành chính (tỉnh / xã) — dữ liệu từ DB, hàm thuần ở đây. */

export type AdminLevel = 'province' | 'commune'
export type AdminZone = 'bac' | 'trung' | 'nam'

export type AdminUnit = {
  id: string
  code: string
  name: string
  level: AdminLevel
  kind: string | null
  parent_id: string | null
  zone: AdminZone | null
  merged_from: string | null
  lat: number | null
  lng: number | null
  sort_order: number
}

/** Hạ chữ thường, bỏ dấu, gom khoảng trắng — để so tên gõ tay. */
export function normalizePlace(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function unitById(
  units: AdminUnit[],
  id: string | null | undefined,
): AdminUnit | undefined {
  if (!id) return undefined
  return units.find((u) => u.id === id)
}

export function unitByCode(
  units: AdminUnit[],
  code: string | null | undefined,
): AdminUnit | undefined {
  if (!code) return undefined
  return units.find((u) => u.code === code)
}

/** Leo lên tỉnh nếu đang là xã. */
export function provinceOf(
  units: AdminUnit[],
  unit: AdminUnit | null | undefined,
): AdminUnit | undefined {
  if (!unit) return undefined
  if (unit.level === 'province') return unit
  return unitById(units, unit.parent_id)
}

export function provinceIdOf(
  units: AdminUnit[],
  unitId: string | null | undefined,
): string | null {
  const unit = unitById(units, unitId)
  const prov = provinceOf(units, unit)
  return prov?.id ?? null
}

export function communesOf(units: AdminUnit[], provinceId: string): AdminUnit[] {
  return units
    .filter((u) => u.level === 'commune' && u.parent_id === provinceId)
    .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
}

export function provincesOnly(units: AdminUnit[]): AdminUnit[] {
  return units
    .filter((u) => u.level === 'province')
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, 'vi'))
}

/**
 * Đoán đơn vị từ tên địa điểm tự do.
 * Ưu tiên khớp xã (tên dài hơn), rồi tỉnh; kèm mảnh merged_from.
 */
export function guessUnit(
  units: AdminUnit[],
  placeName: string,
): AdminUnit | null {
  const needle = normalizePlace(placeName)
  if (!needle) return null

  const score = (u: AdminUnit): number => {
    const candidates = [normalizePlace(u.name)]
    if (u.merged_from) {
      for (const part of u.merged_from.split(/,| và | & /i)) {
        const n = normalizePlace(part)
        if (n.length >= 4) candidates.push(n)
      }
    }
    let best = 0
    for (const candidate of candidates) {
      if (!candidate) continue
      if (candidate.length <= 4) {
        if (needle === candidate) best = Math.max(best, candidate.length)
        continue
      }
      const re = new RegExp(`(^|\\s)${escapeRe(candidate)}($|\\s)`)
      if (re.test(needle)) best = Math.max(best, candidate.length)
    }
    return best
  }

  // Xã trước (tên cụ thể hơn), rồi tỉnh
  const communes = units.filter((u) => u.level === 'commune')
  const provinces = units.filter((u) => u.level === 'province')
  let best: AdminUnit | null = null
  let bestScore = 0
  for (const u of [...communes, ...provinces]) {
    const s = score(u)
    if (s > bestScore) {
      bestScore = s
      best = u
    }
  }
  return bestScore > 0 ? best : null
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function distanceSq(aLat: number, aLng: number, bLat: number, bLng: number) {
  const k = Math.cos(((aLat + bLat) / 2) * (Math.PI / 180))
  const dLat = aLat - bLat
  const dLng = (aLng - bLng) * k
  return dLat * dLat + dLng * dLng
}

/** Đơn vị gần toạ độ nhất (ưu tiên tỉnh; từ chối khi lấp lửng / ngoài VN). */
export function unitByCoords(
  units: AdminUnit[],
  lat: number | null | undefined,
  lng: number | null | undefined,
  level: AdminLevel = 'province',
): AdminUnit | null {
  if (typeof lat !== 'number' || typeof lng !== 'number') return null
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

  const pool = units.filter(
    (u) => u.level === level && u.lat != null && u.lng != null,
  )
  const ranked = pool
    .map((u) => ({
      unit: u,
      d: distanceSq(lat, lng, u.lat!, u.lng!),
    }))
    .sort((a, b) => a.d - b.d)

  const [best, second] = ranked
  if (!best) return null
  if (best.d > 1.5 * 1.5) return null
  if (second && best.d > second.d * 0.8) return null
  return best.unit
}
