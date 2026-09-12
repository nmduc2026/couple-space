import { afterEach, describe, expect, it, vi } from 'vitest'
import { isRetriable } from './netError'

function setOnline(value: boolean) {
  vi.stubGlobal('navigator', { onLine: value })
}

afterEach(() => {
  vi.unstubAllGlobals()
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
  })

  it('có mạng: lỗi dữ liệu thì bỏ, thử lại cũng vậy', () => {
    setOnline(true)
    expect(isRetriable(new Error('new row violates row-level security'))).toBe(
      false,
    )
    expect(isRetriable(null)).toBe(false)
  })
})
