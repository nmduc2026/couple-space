import { describe, expect, it } from 'vitest'
import {
  guessUnit,
  normalizePlace,
  unitByCode,
  unitByCoords,
  type AdminUnit,
} from './adminUnits'

const FIXTURE: AdminUnit[] = [
  {
    id: 'p-hn',
    code: '01',
    name: 'Hà Nội',
    level: 'province',
    kind: 'thanh_pho',
    parent_id: null,
    zone: 'bac',
    merged_from: null,
    lat: 21.03,
    lng: 105.85,
    sort_order: 1,
  },
  {
    id: 'p-hcm',
    code: '79',
    name: 'TP. Hồ Chí Minh',
    level: 'province',
    kind: 'thanh_pho',
    parent_id: null,
    zone: 'nam',
    merged_from: 'TP HCM, Bình Dương, Bà Rịa - Vũng Tàu',
    lat: 10.78,
    lng: 106.7,
    sort_order: 79,
  },
  {
    id: 'c-badinh',
    code: '00004',
    name: 'Phường Ba Đình',
    level: 'commune',
    kind: 'phuong',
    parent_id: 'p-hn',
    zone: null,
    merged_from: null,
    lat: 21.04,
    lng: 105.84,
    sort_order: 0,
  },
]

describe('normalizePlace', () => {
  it('bỏ dấu', () => {
    expect(normalizePlace('Đà Lạt')).toBe('da lat')
  })
})

describe('guessUnit', () => {
  it('khớp tên tỉnh', () => {
    expect(guessUnit(FIXTURE, 'Hà Nội')?.code).toBe('01')
  })

  it('khớp tên xã', () => {
    expect(guessUnit(FIXTURE, 'Phường Ba Đình')?.id).toBe('c-badinh')
  })

  it('khớp merged_from', () => {
    expect(guessUnit(FIXTURE, 'Bình Dương')?.code).toBe('79')
  })
})

describe('unitByCode / coords', () => {
  it('tìm theo mã', () => {
    expect(unitByCode(FIXTURE, '01')?.name).toBe('Hà Nội')
  })

  it('đoán theo toạ độ Hà Nội', () => {
    expect(unitByCoords(FIXTURE, 21.03, 105.85)?.code).toBe('01')
  })
})
