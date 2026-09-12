import { describe, expect, it } from 'vitest'
import { wrappedSeason } from './wrappedSeason'

describe('wrappedSeason', () => {
  it('im lặng suốt phần còn lại của năm', () => {
    expect(wrappedSeason('2026-06-30').visible).toBe(false)
    expect(wrappedSeason('2026-12-14').visible).toBe(false)
  })

  it('hiện từ đúng 15/12, số liệu chưa chốt', () => {
    const s = wrappedSeason('2026-12-15')
    expect(s).toEqual({ visible: true, year: 2026, final: false })
  })

  it('ngày 31/12 vẫn là tạm tính', () => {
    expect(wrappedSeason('2026-12-31').final).toBe(false)
  })

  it('sang tháng 1 thì tổng kết năm trước và đã chốt', () => {
    expect(wrappedSeason('2027-01-05')).toEqual({
      visible: true,
      year: 2026,
      final: true,
    })
  })

  it('hết tháng 1 thì thôi', () => {
    expect(wrappedSeason('2027-02-01').visible).toBe(false)
  })
})
