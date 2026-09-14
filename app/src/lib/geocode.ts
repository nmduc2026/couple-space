import { guessProvince, provinceByCoords } from './provinces'

/*
 * Lấy vị trí máy rồi tra ngược ra địa chỉ tiếng Việt.
 *
 * Dùng Nominatim của OpenStreetMap: miễn phí, không cần khoá API, trả đúng
 * số nhà / đường / phường / tỉnh bằng tiếng Việt. Google Geocoding cũng làm
 * được nhưng cần khoá và có tính tiền — thừa cho một app hai người dùng.
 *
 * Điều kiện dùng của Nominatim: tối đa 1 lượt/giây, không gọi hàng loạt. Ở đây
 * mỗi lần đăng bài người dùng bấm một lần, nên không chạm tới giới hạn. Dữ
 * liệu là của OpenStreetMap, ghi nguồn ở màn soạn bài.
 */

export type ResolvedAddress = {
  lat: number
  lng: number
  /** Chuỗi ngắn để làm tên địa điểm: "79 Phố Đinh Tiên Hoàng" */
  shortName: string
  /** Địa chỉ đầy đủ để hiện lại nguyên văn */
  address: string
  ward: string | null
  district: string | null
  /** Mã tỉnh trong lib/provinces.ts, null nếu không khớp (nước ngoài chẳng hạn) */
  provinceCode: string | null
}

const ENDPOINT = 'https://nominatim.openstreetmap.org/reverse'

/** Vị trí máy. Trình duyệt hỏi quyền, người dùng từ chối thì ném lỗi có chữ. */
export function currentPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Máy này không hỗ trợ định vị.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        // Nói rõ lý do: "không lấy được vị trí" thì người dùng không biết sửa gì
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

/** Toạ độ → địa chỉ. Tra không ra thì vẫn trả toạ độ, không ném lỗi. */
export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<ResolvedAddress> {
  const fallback: ResolvedAddress = {
    lat,
    lng,
    shortName: '',
    address: '',
    ward: null,
    district: null,
    provinceCode: provinceByCoords(lat, lng),
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

    return {
      lat,
      lng,
      shortName,
      address,
      ward,
      district,
      // Khớp tên tỉnh trước vì nó chính xác hơn; không ra thì mới đoán theo
      // toạ độ như màn Dấu chân vẫn làm
      provinceCode: guessProvince(provinceName) ?? provinceByCoords(lat, lng),
    }
  } catch {
    return fallback
  }
}
