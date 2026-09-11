import { describe, expect, it } from 'vitest'
import {
  PROVINCES,
  PROVINCE_COUNT,
  guessProvince,
  normalizePlace,
  provinceByCode,
} from './provinces'

describe('danh sách tỉnh thành', () => {
  it('có đủ 63 tỉnh thành', () => {
    expect(PROVINCE_COUNT).toBe(63)
  })

  it('không có mã trùng', () => {
    const codes = new Set(PROVINCES.map((p) => p.code))
    expect(codes.size).toBe(PROVINCE_COUNT)
  })
})

describe('normalizePlace', () => {
  it('bỏ dấu và hạ chữ thường', () => {
    expect(normalizePlace('Đà Lạt')).toBe('da lat')
    expect(normalizePlace('TP. Hồ Chí Minh')).toBe('tp ho chi minh')
  })

  it('gom khoảng trắng thừa', () => {
    expect(normalizePlace('  Hà   Nội ')).toBe('ha noi')
  })
})

describe('guessProvince', () => {
  it('khớp tên chính thức dù gõ có dấu hay không', () => {
    expect(guessProvince('Đà Nẵng')).toBe('DNG')
    expect(guessProvince('da nang')).toBe('DNG')
  })

  it('khớp tên gọi quen thuộc', () => {
    expect(guessProvince('Sài Gòn')).toBe('HCM')
    expect(guessProvince('Đà Lạt')).toBe('LDG')
    expect(guessProvince('Sapa')).toBe('LCU')
    expect(guessProvince('Phú Quốc')).toBe('KGG')
  })

  it('tìm được tỉnh nằm giữa một địa chỉ dài', () => {
    expect(guessProvince('Quán cà phê số 12, Hoàn Kiếm, Hà Nội')).toBe('HNI')
  })

  it('không khớp bừa khi chỉ trùng một phần từ', () => {
    expect(guessProvince('Hà Nội Phố quán ăn')).toBe('HNI')
    expect(guessProvince('quán Huệ Lan')).toBeNull()
  })

  it('trả null khi không đoán được', () => {
    expect(guessProvince('Tokyo')).toBeNull()
    expect(guessProvince('')).toBeNull()
  })
})

describe('provinceByCode', () => {
  it('tra được tên từ mã', () => {
    expect(provinceByCode('HNI')?.name).toBe('Hà Nội')
    expect(provinceByCode('xxx')).toBeUndefined()
    expect(provinceByCode(null)).toBeUndefined()
  })
})
