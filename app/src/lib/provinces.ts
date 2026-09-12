/** 63 tỉnh thành Việt Nam + chuẩn hoá tên người dùng gõ tự do.
 *
 *  `zone` dùng để xếp bản đồ thành ba dải Bắc – Trung – Nam. Đây **không
 *  phải bản đồ địa lý thật**: chưa có file SVG 63 tỉnh, nên phần nhìn hiện
 *  là lưới theo vùng. Xem tasks/phase-06/tasks.md P6-01.
 */

export type Zone = 'bac' | 'trung' | 'nam'

export type Province = {
  code: string
  name: string
  zone: Zone
  /** Toạ độ trung tâm gần đúng — chỉ dùng để tìm tỉnh gần nhất, không
   *  dùng để vẽ. Sai vài km không ảnh hưởng vì việc duy nhất cần trả lời
   *  là "tỉnh nào", và trường hợp lấp lửng thì hàm từ chối đoán. */
  lat: number
  lng: number
  /** Tên khác mà người ta hay gõ */
  aliases?: string[]
}

export const PROVINCES: Province[] = [
  { code: 'HNI', lat: 21.028, lng: 105.854, name: 'Hà Nội', zone: 'bac', aliases: ['ha noi', 'hn', 'thu do'] },
  { code: 'HPG', lat: 20.865, lng: 106.684, name: 'Hải Phòng', zone: 'bac' },
  { code: 'QNH', lat: 21.006, lng: 107.293, name: 'Quảng Ninh', zone: 'bac', aliases: ['ha long', 'halong'] },
  { code: 'BNH', lat: 21.186, lng: 106.076, name: 'Bắc Ninh', zone: 'bac' },
  { code: 'BGG', lat: 21.281, lng: 106.197, name: 'Bắc Giang', zone: 'bac' },
  { code: 'BKN', lat: 22.147, lng: 105.834, name: 'Bắc Kạn', zone: 'bac' },
  { code: 'CBG', lat: 22.666, lng: 106.258, name: 'Cao Bằng', zone: 'bac' },
  { code: 'DBN', lat: 21.386, lng: 103.018, name: 'Điện Biên', zone: 'bac' },
  { code: 'HDG', lat: 20.94, lng: 106.333, name: 'Hải Dương', zone: 'bac' },
  { code: 'HGG', lat: 22.823, lng: 104.984, name: 'Hà Giang', zone: 'bac' },
  { code: 'HNM', lat: 20.583, lng: 105.923, name: 'Hà Nam', zone: 'bac' },
  { code: 'HBH', lat: 20.813, lng: 105.338, name: 'Hoà Bình', zone: 'bac' },
  { code: 'HYN', lat: 20.646, lng: 106.051, name: 'Hưng Yên', zone: 'bac' },
  { code: 'LCU', lat: 22.486, lng: 103.975, name: 'Lào Cai', zone: 'bac', aliases: ['sapa', 'sa pa'] },
  { code: 'LCI', lat: 22.397, lng: 103.47, name: 'Lai Châu', zone: 'bac' },
  { code: 'LSN', lat: 21.854, lng: 106.761, name: 'Lạng Sơn', zone: 'bac' },
  { code: 'NDH', lat: 20.42, lng: 106.168, name: 'Nam Định', zone: 'bac' },
  { code: 'NBH', lat: 20.254, lng: 105.975, name: 'Ninh Bình', zone: 'bac', aliases: ['trang an', 'tam coc'] },
  { code: 'PTO', lat: 21.323, lng: 105.402, name: 'Phú Thọ', zone: 'bac' },
  { code: 'SLA', lat: 21.328, lng: 103.914, name: 'Sơn La', zone: 'bac', aliases: ['moc chau'] },
  { code: 'TBH', lat: 20.45, lng: 106.34, name: 'Thái Bình', zone: 'bac' },
  { code: 'TNN', lat: 21.594, lng: 105.848, name: 'Thái Nguyên', zone: 'bac' },
  { code: 'TQG', lat: 21.823, lng: 105.214, name: 'Tuyên Quang', zone: 'bac' },
  { code: 'VPC', lat: 21.309, lng: 105.604, name: 'Vĩnh Phúc', zone: 'bac' },
  { code: 'YBI', lat: 21.723, lng: 104.911, name: 'Yên Bái', zone: 'bac', aliases: ['mu cang chai'] },

  { code: 'DNG', lat: 16.055, lng: 108.202, name: 'Đà Nẵng', zone: 'trung', aliases: ['da nang', 'dn'] },
  { code: 'TTH', lat: 16.463, lng: 107.59, name: 'Thừa Thiên Huế', zone: 'trung', aliases: ['hue'] },
  { code: 'QNM', lat: 15.574, lng: 108.474, name: 'Quảng Nam', zone: 'trung', aliases: ['hoi an', 'my son'] },
  { code: 'QNI', lat: 15.121, lng: 108.804, name: 'Quảng Ngãi', zone: 'trung', aliases: ['ly son'] },
  { code: 'QBH', lat: 17.469, lng: 106.622, name: 'Quảng Bình', zone: 'trung', aliases: ['phong nha'] },
  { code: 'QTI', lat: 16.745, lng: 107.19, name: 'Quảng Trị', zone: 'trung' },
  { code: 'NAN', lat: 19.234, lng: 104.92, name: 'Nghệ An', zone: 'trung', aliases: ['vinh', 'cua lo'] },
  { code: 'HTH', lat: 18.343, lng: 105.906, name: 'Hà Tĩnh', zone: 'trung' },
  { code: 'THA', lat: 19.807, lng: 105.777, name: 'Thanh Hoá', zone: 'trung', aliases: ['sam son', 'pu luong'] },
  { code: 'BDH', lat: 13.782, lng: 109.219, name: 'Bình Định', zone: 'trung', aliases: ['quy nhon'] },
  { code: 'PYN', lat: 13.088, lng: 109.093, name: 'Phú Yên', zone: 'trung', aliases: ['tuy hoa'] },
  { code: 'KHA', lat: 12.239, lng: 109.196, name: 'Khánh Hoà', zone: 'trung', aliases: ['nha trang'] },
  { code: 'NTN', lat: 11.564, lng: 108.989, name: 'Ninh Thuận', zone: 'trung', aliases: ['phan rang'] },
  { code: 'BTN', lat: 10.933, lng: 108.1, name: 'Bình Thuận', zone: 'trung', aliases: ['mui ne', 'phan thiet'] },
  { code: 'GLI', lat: 13.808, lng: 108.11, name: 'Gia Lai', zone: 'trung', aliases: ['pleiku'] },
  { code: 'KTM', lat: 14.35, lng: 107.995, name: 'Kon Tum', zone: 'trung' },
  { code: 'DLK', lat: 12.71, lng: 108.238, name: 'Đắk Lắk', zone: 'trung', aliases: ['buon ma thuot'] },
  { code: 'DNO', lat: 12.004, lng: 107.688, name: 'Đắk Nông', zone: 'trung' },
  { code: 'LDG', lat: 11.94, lng: 108.458, name: 'Lâm Đồng', zone: 'trung', aliases: ['da lat', 'dalat'] },

  {
    code: 'HCM', lat: 10.776, lng: 106.7,
    name: 'TP. Hồ Chí Minh',
    zone: 'nam',
    aliases: ['tphcm', 'tp hcm', 'ho chi minh', 'sai gon', 'saigon', 'sg', 'hcm'],
  },
  { code: 'BDG', lat: 11.0, lng: 106.657, name: 'Bình Dương', zone: 'nam' },
  { code: 'DNI', lat: 10.945, lng: 106.824, name: 'Đồng Nai', zone: 'nam', aliases: ['bien hoa'] },
  { code: 'BRV', lat: 10.541, lng: 107.243, name: 'Bà Rịa - Vũng Tàu', zone: 'nam', aliases: ['vung tau', 'con dao'] },
  { code: 'TNH', lat: 11.311, lng: 106.098, name: 'Tây Ninh', zone: 'nam' },
  { code: 'BPC', lat: 11.751, lng: 106.723, name: 'Bình Phước', zone: 'nam' },
  { code: 'LAN', lat: 10.543, lng: 106.411, name: 'Long An', zone: 'nam' },
  { code: 'TGG', lat: 10.45, lng: 106.342, name: 'Tiền Giang', zone: 'nam', aliases: ['my tho'] },
  { code: 'BTE', lat: 10.243, lng: 106.375, name: 'Bến Tre', zone: 'nam' },
  { code: 'VLG', lat: 10.254, lng: 105.972, name: 'Vĩnh Long', zone: 'nam' },
  { code: 'TVH', lat: 9.934, lng: 106.345, name: 'Trà Vinh', zone: 'nam' },
  { code: 'DTP', lat: 10.493, lng: 105.688, name: 'Đồng Tháp', zone: 'nam' },
  { code: 'AGG', lat: 10.521, lng: 105.126, name: 'An Giang', zone: 'nam', aliases: ['chau doc'] },
  { code: 'KGG', lat: 10.012, lng: 105.081, name: 'Kiên Giang', zone: 'nam', aliases: ['phu quoc', 'rach gia'] },
  { code: 'CTO', lat: 10.045, lng: 105.747, name: 'Cần Thơ', zone: 'nam' },
  { code: 'HGI', lat: 9.784, lng: 105.47, name: 'Hậu Giang', zone: 'nam' },
  { code: 'STG', lat: 9.603, lng: 105.98, name: 'Sóc Trăng', zone: 'nam' },
  { code: 'BLU', lat: 9.294, lng: 105.724, name: 'Bạc Liêu', zone: 'nam' },
  { code: 'CMU', lat: 9.177, lng: 105.152, name: 'Cà Mau', zone: 'nam' },
]

export const PROVINCE_COUNT = PROVINCES.length

export function provinceByCode(code: string | null | undefined) {
  if (!code) return undefined
  return PROVINCES.find((p) => p.code === code)
}

/** Hạ chữ thường, bỏ dấu, gom khoảng trắng — để so tên gõ tay. */
export function normalizePlace(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Đoán tỉnh/thành từ tên địa điểm tự do.
 *  Trả về null khi không chắc — lúc đó giao diện hỏi người dùng một lần
 *  rồi lưu vào `place_aliases` để lần sau tự nhận. */
export function guessProvince(placeName: string): string | null {
  const needle = normalizePlace(placeName)
  if (!needle) return null

  for (const p of PROVINCES) {
    const names = [normalizePlace(p.name), ...(p.aliases ?? [])]
    for (const candidate of names) {
      // Tên ngắn ("hue", "sg", "dn") phải là toàn bộ chuỗi mới tính.
      // Cho chúng khớp giữa câu thì "quán Huệ Lan" hoá ra Thừa Thiên Huế.
      if (candidate.length <= 4) {
        if (needle === candidate) return p.code
        continue
      }
      // Tên dài thì khớp nguyên cụm, có ranh giới từ hai bên
      const re = new RegExp(`(^|\\s)${candidate}($|\\s)`)
      if (re.test(needle)) return p.code
    }
  }
  return null
}

/** Khoảng cách bình phương, có chỉnh kinh độ theo vĩ độ. Việt Nam nằm quanh
 *  vĩ độ 10–23 nên 1 độ kinh ngắn hơn 1 độ vĩ đáng kể — bỏ qua thì các tỉnh
 *  đồng bằng sông Hồng sát nhau sẽ so sai. */
function distanceSq(aLat: number, aLng: number, bLat: number, bLng: number) {
  const k = Math.cos(((aLat + bLat) / 2) * (Math.PI / 180))
  const dLat = aLat - bLat
  const dLng = (aLng - bLng) * k
  return dLat * dLat + dLng * dLng
}

/**
 * Tỉnh/thành gần toạ độ nhất — dùng cho bài có gắn link Google Maps.
 *
 * Cố ý TỪ CHỐI đoán khi hai tỉnh gần như nhau, hoặc khi điểm nằm quá xa mọi
 * tỉnh (ảnh chụp ở nước ngoài). Tâm tỉnh ở đây là gần đúng, nên đoán bừa lúc
 * lấp lửng sẽ gán sai một cách âm thầm — thà trả null để giao diện hỏi
 * người dùng một lần rồi nhớ vào `place_aliases`.
 */
export function provinceByCoords(
  lat: number | null | undefined,
  lng: number | null | undefined,
): string | null {
  if (typeof lat !== 'number' || typeof lng !== 'number') return null
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

  const ranked = PROVINCES.map((p) => ({
    code: p.code,
    d: distanceSq(lat, lng, p.lat, p.lng),
  })).sort((a, b) => a.d - b.d)

  const [best, second] = ranked
  if (!best) return null

  // Xa hơn ~1.5 độ (~165 km) thì gần như chắc chắn không ở Việt Nam
  if (best.d > 1.5 * 1.5) return null

  // Hơn tỉnh kế tiếp chưa tới 20% thì coi là lấp lửng, không đoán
  if (second && best.d > second.d * 0.8) return null

  return best.code
}
