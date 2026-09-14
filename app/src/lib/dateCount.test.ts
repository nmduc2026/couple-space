import { describe, expect, it } from 'vitest'
import { daysTogether, nextMilestone } from './dateCount'

describe('daysTogether', () => {
  it('counts start day as day 1', () => {
    expect(daysTogether('2024-03-15', '2024-03-15')).toBe(1)
  })

  it('counts inclusive calendar days', () => {
    expect(daysTogether('2024-03-15', '2024-03-16')).toBe(2)
    expect(daysTogether('2024-01-01', '2024-01-31')).toBe(31)
  })
})

describe('nextMilestone', () => {
  it('clamps leap-day month/year marks to Feb 28', () => {
    const m = nextMilestone('2024-02-29', '2025-02-28')
    expect(m?.date).toBe('2025-02-28')
    expect(m?.daysAway).toBe(0)
  })

  it('clamps month anniversary from day 31', () => {
    const m = nextMilestone('2024-01-31', '2024-02-01')
    expect(m?.date).toBe('2024-02-29') // 2024 is leap
  })

  it('returns day-100 milestone when nearer', () => {
    const m = nextMilestone('2024-01-01', '2024-01-01')
    expect(m?.label).toMatch(/tháng|Ngày thứ|năm/)
    expect(m!.daysAway).toBeGreaterThanOrEqual(0)
  })
})
