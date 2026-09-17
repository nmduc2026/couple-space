import { afterEach, describe, expect, it, vi } from 'vitest'
import { errorText, isRetriable, networkHint } from './netError'

function setOnline(value: boolean) {
  vi.stubGlobal('navigator', { onLine: value })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('errorText', () => {
  it('đọc được message từ Error và object kiểu Supabase', () => {
    expect(errorText(new Error('Load failed'))).toBe('Load failed')
    expect(errorText({ message: 'TypeError: Load failed' })).toBe(
      'TypeError: Load failed',
    )
    expect(errorText(null)).toBe('')
  })
})

describe('isRetriable', () => {
  it('mất mạng thì luôn đáng thử lại', () => {
    setOnline(false)
    expect(isRetriable(new Error('duplicate key value'))).toBe(true)
  })

  it('có mạng: lỗi mạng thì thử lại', () => {
    setOnline(true)
    expect(isRetriable(new Error('Failed to fetch'))).toBe(true)
    expect(isRetriable(new Error('network timeout'))).toBe(true)
    expect(isRetriable(new TypeError('Load failed'))).toBe(true)
    // Supabase đôi khi trả plain object, không phải instanceof Error
    expect(isRetriable({ message: 'TypeError: Load failed' })).toBe(true)
  })

  it('có mạng: lỗi dữ liệu thì bỏ, thử lại cũng vậy', () => {
    setOnline(true)
    expect(isRetriable(new Error('new row violates row-level security'))).toBe(
      false,
    )
    expect(isRetriable(null)).toBe(false)
  })
})

describe('networkHint', () => {
  it('đổi lỗi Safari thành câu tiếng Việt', () => {
    setOnline(true)
    expect(networkHint(new TypeError('Load failed'))).toMatch(/Mạng/)
  })
})
