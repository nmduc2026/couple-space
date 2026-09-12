import { describe, expect, it } from 'vitest'
import { shouldSuggest, suggestedTask } from './eventSuggestion'

describe('suggestedTask', () => {
  it('đoán việc từ tên dịp, không phụ thuộc dấu', () => {
    expect(suggestedTask('Sinh nhật Diên')).toBe('Chuẩn bị quà cho Sinh nhật Diên')
    expect(suggestedTask('Kỉ niệm 1 năm')).toBe('Đặt bàn cho Kỉ niệm 1 năm')
    expect(suggestedTask('ĐI ĐÀ LẠT')).toBe('Đặt vé cho ĐI ĐÀ LẠT')
  })

  it('không đoán bừa khi tên không gợi gì', () => {
    expect(suggestedTask('Họp lớp')).toBeNull()
  })
})

describe('shouldSuggest', () => {
  it('chỉ gợi ý trong vòng 14 ngày tới', () => {
    expect(shouldSuggest(0)).toBe(true)
    expect(shouldSuggest(14)).toBe(true)
    expect(shouldSuggest(15)).toBe(false)
    expect(shouldSuggest(-1)).toBe(false)
  })
})
