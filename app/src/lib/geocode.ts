import type { AdminUnit } from './adminUnits'
import { guessUnit, unitByCoords } from './adminUnits'

/*
 * Lấy vị trí máy rồi tra ngược ra địa chỉ tiếng Việt.
 *
 * Dùng Nominatim của OpenStreetMap: miễn phí, không cần khoá API, trả đúng
 * số nhà / đường / phường / tỉnh bằng tiếng Việt.
 */

export type ResolvedAddress = {
  lat: number
  lng: number
  shortName: string
  address: string
  ward: string | null
  district: string | null
  /** admin_units.id — tỉnh hoặc xã nếu đoán được */
  adminUnitId: string | null
}

const ENDPOINT = 'https://nominatim.openstreetmap.org/reverse'

export function currentPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Máy này không hỗ trợ định vị.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new Error('Bạn chưa cho phép app dùng vị trí.'))
        } else if (err.code === err.TIMEOUT) {
          reject(new Error('Tìm vị trí lâu quá. Thử lại ngoài trời.'))
        } else {
          reject(new Error('Không lấy được vị trí.'))
        }
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 },
    )
  })
}

type NominatimAddress = {
  house_number?: string
  road?: string
  suburb?: string
  quarter?: string
  village?: string
  town?: string
  city_district?: string
  county?: string
  district?: string
  city?: string
  state?: string
}

function resolveUnit(
  units: AdminUnit[],
  placeText: string,
  lat: number,
  lng: number,
): AdminUnit | null {
  return (
    guessUnit(units, placeText) ??
    unitByCoords(units, lat, lng, 'commune') ??
    unitByCoords(units, lat, lng, 'province')
  )
}

/** Toạ độ → địa chỉ. `units` từ DB để gắn admin_unit_id. */
export async function reverseGeocode(
  lat: number,
  lng: number,
  units: AdminUnit[] = [],
): Promise<ResolvedAddress> {
  const byCoords = units.length
    ? resolveUnit(units, '', lat, lng)
    : null
  const fallback: ResolvedAddress = {
    lat,
    lng,
    shortName: '',
    address: '',
    ward: null,
    district: null,
    adminUnitId: byCoords?.id ?? null,
  }

  try {
    const url =
      `${ENDPOINT}?lat=${lat}&lon=${lng}&format=jsonv2&addressdetails=1&zoom=18`
    const res = await fetch(url, { headers: { 'Accept-Language': 'vi' } })
    if (!res.ok) return fallback

    const json = (await res.json()) as {
      display_name?: string
      address?: NominatimAddress
    }
    const a = json.address ?? {}

    const ward = a.suburb ?? a.quarter ?? a.village ?? a.town ?? null
    const district = a.city_district ?? a.county ?? a.district ?? null
    const provinceName = a.city ?? a.state ?? ''

    const shortName =
      [a.house_number, a.road].filter(Boolean).join(' ') || ward || provinceName

    const address =
      [shortName, ward, district, provinceName].filter(Boolean).join(', ') ||
      (json.display_name ?? '')

    const guessed = units.length
      ? resolveUnit(
          units,
          [ward, district, provinceName].filter(Boolean).join(' '),
          lat,
          lng,
        )
      : null

    return {
      lat,
      lng,
      shortName,
      address,
      ward,
      district,
      adminUnitId: guessed?.id ?? null,
    }
  } catch {
    return fallback
  }
}
