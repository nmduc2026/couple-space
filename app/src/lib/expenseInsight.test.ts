import { describe, expect, it } from 'vitest'
import { expenseInsight, type InsightInput } from './expenseInsight'

const base: InsightInput = {
  byCategory: { food: 300_000 },
  outingCount: 3,
  totalMinor: 300_000,
  previous: null,
  biggest: null,
}

describe('expenseInsight', () => {
  it('không nói gì khi tháng rỗng', () => {
    expect(expenseInsight({ ...base, outingCount: 0 })).toBeNull()
  })

  it('chào tháng đầu tiên khi chưa có tháng trước', () => {
    expect(expenseInsight(base)).toContain('Tháng đầu tiên')
  })

  it('coi tháng trước rỗng như chưa có tháng trước', () => {
    const s = expenseInsight({
      ...base,
      previous: { outingCount: 0, totalMinor: 0 },
    })
    expect(s).toContain('Tháng đầu tiên')
  })

  it('so số khoản với tháng trước', () => {
    const more = expenseInsight({
      ...base,
      outingCount: 12,
      previous: { outingCount: 8, totalMinor: 100 },
    })
    expect(more).toBe('Tháng này ghi 12 khoản — nhiều hơn tháng trước 4')

    const less = expenseInsight({
      ...base,
      outingCount: 5,
      previous: { outingCount: 8, totalMinor: 100 },
    })
    expect(less).toContain('ít hơn tháng trước 3')
  })

  it('số khoản bằng nhau thì so tiền', () => {
    const s = expenseInsight({
      ...base,
      outingCount: 3,
      totalMinor: 500_000,
      previous: { outingCount: 3, totalMinor: 300_000 },
    })
    expect(s).toContain('nhiều hơn 200.000 đ')
  })

  it('giống hệt tháng trước thì kể khoản lớn nhất', () => {
    const s = expenseInsight({
      ...base,
      previous: { outingCount: 3, totalMinor: 300_000 },
      biggest: { note: 'Lẩu Ba Toa', category: 'food', amountMinor: 180_000 },
    })
    expect(s).toBe('Khoản lớn nhất tháng này: Lẩu Ba Toa — 180.000 đ')
  })

  it('khoản lớn nhất không có ghi chú thì lấy tên danh mục', () => {
    const s = expenseInsight({
      ...base,
      previous: { outingCount: 3, totalMinor: 300_000 },
      biggest: { note: '  ', category: 'cafe', amountMinor: 50_000 },
    })
    expect(s).toContain('Cà phê')
  })
})
