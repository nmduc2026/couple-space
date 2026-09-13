import { describe, expect, it } from 'vitest'
import { countdownLabel, daysUntil, nextOccurrence } from './recurrence'

describe('nextOccurrence — hằng năm', () => {
  it('giữ nguyên ngày khi không lặp', () => {
    expect(nextOccurrence('2026-03-15', 'none', '2027-01-01')).toBe('2026-03-15')
  })

  it('nhảy sang năm sau khi đã qua', () => {
    expect(nextOccurrence('2024-03-15', 'yearly', '2026-09-11')).toBe(
      '2027-03-15',
    )
  })

  it('trả về chính hôm nay nếu rơi đúng hôm nay', () => {
    expect(nextOccurrence('2020-09-11', 'yearly', '2026-09-11')).toBe(
      '2026-09-11',
    )
  })

  // P3-25: sự kiện 29/2 ở năm không nhuận
  it('kẹp 29/2 về 28/2 ở năm không nhuận', () => {
    expect(nextOccurrence('2024-02-29', 'yearly', '2026-01-01')).toBe(
      '2026-02-28',
    )
  })

  it('quay lại đúng 29/2 ở năm nhuận tiếp theo', () => {
    expect(nextOccurrence('2024-02-29', 'yearly', '2028-01-01')).toBe(
      '2028-02-29',
    )
  })
})

describe('nextOccurrence — hằng tháng', () => {
  // P3-26: ngày 31 ở tháng 30 ngày và tháng 2
  it('kẹp ngày 31 về 30 ở tháng 30 ngày', () => {
    expect(nextOccurrence('2026-01-31', 'monthly', '2026-04-05')).toBe(
      '2026-04-30',
    )
  })

  it('kẹp ngày 31 về 28 ở tháng 2 năm thường', () => {
    expect(nextOccurrence('2026-01-31', 'monthly', '2026-02-01')).toBe(
      '2026-02-28',
    )
  })

  it('không ghi đè ngày gốc — tháng có 31 ngày vẫn ra 31', () => {
    expect(nextOccurrence('2026-01-31', 'monthly', '2026-05-01')).toBe(
      '2026-05-31',
    )
  })

  it('không nhảy lùi trước ngày gốc', () => {
    expect(nextOccurrence('2027-06-10', 'monthly', '2026-01-01')).toBe(
      '2027-06-10',
    )
  })
})

describe('daysUntil', () => {
  it('đếm đúng số ngày còn lại', () => {
    expect(daysUntil('2026-09-21', '2026-09-11')).toBe(10)
  })

  it('hôm nay là 0', () => {
    expect(daysUntil('2026-09-11', '2026-09-11')).toBe(0)
  })

  it('ngày đã qua là số âm', () => {
    expect(daysUntil('2026-09-01', '2026-09-11')).toBe(-10)
  })

  // Không được lệch khi bước qua mốc đổi giờ mùa hè ở múi giờ khác
  it('vẫn đúng khi vượt qua mốc đổi giờ', () => {
    expect(daysUntil('2026-03-30', '2026-03-28')).toBe(2)
  })
})

describe('countdownLabel', () => {
  it('nói tiếng người', () => {
    expect(countdownLabel(0)).toBe('Hôm nay')
    expect(countdownLabel(1)).toBe('Ngày mai')
    expect(countdownLabel(12)).toBe('còn 12 ngày')
    expect(countdownLabel(-3)).toBe('3 ngày trước')
  })
})
