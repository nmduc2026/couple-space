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
  /** Tên khác mà người ta hay gõ */
  aliases?: string[]
}

export const PROVINCES: Province[] = [
  { code: 'HNI', name: 'Hà Nội', zone: 'bac', aliases: ['ha noi', 'hn', 'thu do'] },
  { code: 'HPG', name: 'Hải Phòng', zone: 'bac' },
  { code: 'QNH', name: 'Quảng Ninh', zone: 'bac', aliases: ['ha long', 'halong'] },
  { code: 'BNH', name: 'Bắc Ninh', zone: 'bac' },
  { code: 'BGG', name: 'Bắc Giang', zone: 'bac' },
  { code: 'BKN', name: 'Bắc Kạn', zone: 'bac' },
  { code: 'CBG', name: 'Cao Bằng', zone: 'bac' },
  { code: 'DBN', name: 'Điện Biên', zone: 'bac' },
  { code: 'HDG', name: 'Hải Dương', zone: 'bac' },
  { code: 'HGG', name: 'Hà Giang', zone: 'bac' },
  { code: 'HNM', name: 'Hà Nam', zone: 'bac' },
  { code: 'HBH', name: 'Hoà Bình', zone: 'bac' },
  { code: 'HYN', name: 'Hưng Yên', zone: 'bac' },
  { code: 'LCU', name: 'Lào Cai', zone: 'bac', aliases: ['sapa', 'sa pa'] },
  { code: 'LCI', name: 'Lai Châu', zone: 'bac' },
  { code: 'LSN', name: 'Lạng Sơn', zone: 'bac' },
  { code: 'NDH', name: 'Nam Định', zone: 'bac' },
  { code: 'NBH', name: 'Ninh Bình', zone: 'bac', aliases: ['trang an', 'tam coc'] },
  { code: 'PTO', name: 'Phú Thọ', zone: 'bac' },
  { code: 'SLA', name: 'Sơn La', zone: 'bac', aliases: ['moc chau'] },
  { code: 'TBH', name: 'Thái Bình', zone: 'bac' },
  { code: 'TNN', name: 'Thái Nguyên', zone: 'bac' },
  { code: 'TQG', name: 'Tuyên Quang', zone: 'bac' },
  { code: 'VPC', name: 'Vĩnh Phúc', zone: 'bac' },
  { code: 'YBI', name: 'Yên Bái', zone: 'bac', aliases: ['mu cang chai'] },

  { code: 'DNG', name: 'Đà Nẵng', zone: 'trung', aliases: ['da nang', 'dn'] },
  { code: 'TTH', name: 'Thừa Thiên Huế', zone: 'trung', aliases: ['hue'] },
  { code: 'QNM', name: 'Quảng Nam', zone: 'trung', aliases: ['hoi an', 'my son'] },
  { code: 'QNI', name: 'Quảng Ngãi', zone: 'trung', aliases: ['ly son'] },
  { code: 'QBH', name: 'Quảng Bình', zone: 'trung', aliases: ['phong nha'] },
  { code: 'QTI', name: 'Quảng Trị', zone: 'trung' },
  { code: 'NAN', name: 'Nghệ An', zone: 'trung', aliases: ['vinh', 'cua lo'] },
  { code: 'HTH', name: 'Hà Tĩnh', zone: 'trung' },
  { code: 'THA', name: 'Thanh Hoá', zone: 'trung', aliases: ['sam son', 'pu luong'] },
  { code: 'BDH', name: 'Bình Định', zone: 'trung', aliases: ['quy nhon'] },
  { code: 'PYN', name: 'Phú Yên', zone: 'trung', aliases: ['tuy hoa'] },
  { code: 'KHA', name: 'Khánh Hoà', zone: 'trung', aliases: ['nha trang'] },
  { code: 'NTN', name: 'Ninh Thuận', zone: 'trung', aliases: ['phan rang'] },
  { code: 'BTN', name: 'Bình Thuận', zone: 'trung', aliases: ['mui ne', 'phan thiet'] },
  { code: 'GLI', name: 'Gia Lai', zone: 'trung', aliases: ['pleiku'] },
  { code: 'KTM', name: 'Kon Tum', zone: 'trung' },
  { code: 'DLK', name: 'Đắk Lắk', zone: 'trung', aliases: ['buon ma thuot'] },
  { code: 'DNO', name: 'Đắk Nông', zone: 'trung' },
  { code: 'LDG', name: 'Lâm Đồng', zone: 'trung', aliases: ['da lat', 'dalat'] },

  {
    code: 'HCM',
    name: 'TP. Hồ Chí Minh',
    zone: 'nam',
    aliases: ['tphcm', 'tp hcm', 'ho chi minh', 'sai gon', 'saigon', 'sg', 'hcm'],
  },
  { code: 'BDG', name: 'Bình Dương', zone: 'nam' },
  { code: 'DNI', name: 'Đồng Nai', zone: 'nam', aliases: ['bien hoa'] },
  { code: 'BRV', name: 'Bà Rịa - Vũng Tàu', zone: 'nam', aliases: ['vung tau', 'con dao'] },
  { code: 'TNH', name: 'Tây Ninh', zone: 'nam' },
  { code: 'BPC', name: 'Bình Phước', zone: 'nam' },
  { code: 'LAN', name: 'Long An', zone: 'nam' },
  { code: 'TGG', name: 'Tiền Giang', zone: 'nam', aliases: ['my tho'] },
  { code: 'BTE', name: 'Bến Tre', zone: 'nam' },
  { code: 'VLG', name: 'Vĩnh Long', zone: 'nam' },
  { code: 'TVH', name: 'Trà Vinh', zone: 'nam' },
  { code: 'DTP', name: 'Đồng Tháp', zone: 'nam' },
  { code: 'AGG', name: 'An Giang', zone: 'nam', aliases: ['chau doc'] },
  { code: 'KGG', name: 'Kiên Giang', zone: 'nam', aliases: ['phu quoc', 'rach gia'] },
  { code: 'CTO', name: 'Cần Thơ', zone: 'nam' },
  { code: 'HGI', name: 'Hậu Giang', zone: 'nam' },
  { code: 'STG', name: 'Sóc Trăng', zone: 'nam' },
  { code: 'BLU', name: 'Bạc Liêu', zone: 'nam' },
  { code: 'CMU', name: 'Cà Mau', zone: 'nam' },
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
