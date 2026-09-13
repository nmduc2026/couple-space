import { describe, expect, it } from 'vitest'
import { missedDays, shiftDay } from './questionDays'

describe('shiftDay', () => {
  it('lùi qua đầu tháng', () => {
    expect(shiftDay('2026-03-01', -1)).toBe('2026-02-28')
  })
  it('lùi qua năm nhuận', () => {
    expect(shiftDay('2028-03-01', -1)).toBe('2028-02-29')
  })
})

describe('missedDays', () => {
  const since = '2026-01-01'

  it('liệt kê 7 ngày trước, mới nhất trước, bỏ hôm nay', () => {
    const days = missedDays('2026-03-10', [], since)
    expect(days).toHaveLength(7)
    expect(days[0]).toBe('2026-03-09')
    expect(days.at(-1)).toBe('2026-03-03')
    expect(days).not.toContain('2026-03-10')
  })

  it('bỏ ngày đã trả lời', () => {
    const days = missedDays('2026-03-10', ['2026-03-09', '2026-03-07'], since)
    expect(days).not.toContain('2026-03-09')
    expect(days).toContain('2026-03-08')
    expect(days).toHaveLength(5)
  })

  it('không lùi quá ngày đôi này bắt đầu dùng app', () => {
    const days = missedDays('2026-01-04', [], '2026-01-01')
    expect(days).toEqual(['2026-01-03', '2026-01-02', '2026-01-01'])
  })
})
