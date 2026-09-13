import { describe, expect, it } from 'vitest'
import {
  PROVINCES,
  PROVINCE_COUNT,
  guessProvince,
  normalizePlace,
  provinceByCode, provinceByCoords } from './provinces'

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

describe('provinceByCoords', () => {
  it('nhận ra thành phố lớn từ toạ độ', () => {
    expect(provinceByCoords(21.0285, 105.8542)).toBe('HNI')
    expect(provinceByCoords(10.7769, 106.7009)).toBe('HCM')
    expect(provinceByCoords(16.0544, 108.2022)).toBe('DNG')
  })

  it('trả null khi thiếu toạ độ', () => {
    expect(provinceByCoords(null, null)).toBeNull()
    expect(provinceByCoords(21.0, undefined)).toBeNull()
    expect(provinceByCoords(NaN, 105.8)).toBeNull()
  })

  it('không đoán bừa khi ở ngoài Việt Nam', () => {
    // Tokyo
    expect(provinceByCoords(35.68, 139.69)).toBeNull()
    // Bangkok
    expect(provinceByCoords(13.75, 100.5)).toBeNull()
  })

  it('từ chối đoán khi hai tỉnh gần như nhau', () => {
    // Điểm giữa Hà Nam và Nam Định
    expect(provinceByCoords(20.5, 106.045)).toBeNull()
  })
})
