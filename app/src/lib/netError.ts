/* Phân biệt "gửi lại được" với "gửi lại bao nhiêu cũng vậy".
   Để riêng khỏi syncQueue.ts để test được mà không kéo theo client Supabase. */

/** Lấy chuỗi lỗi từ Error, object `{ message }` của Supabase, hoặc giá trị bất kỳ. */
export function errorText(error: unknown): string {
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object' && 'message' in error) {
    const msg = (error as { message: unknown }).message
    if (typeof msg === 'string' && msg.trim()) return msg
  }
  if (typeof error === 'string') return error
  return error == null ? '' : String(error)
}

/** Lỗi mạng thì đáng thử lại; dữ liệu sai thì thử lại bao nhiêu cũng vậy. */
export function isRetriable(error: unknown) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true
  const message = errorText(error)
  return /fetch|network|timeout|Failed to fetch|load failed|NetworkError/i.test(
    message,
  )
}

/** Thông báo tiếng Việt khi lỗi mạng — tránh hiện nguyên "TypeError: Load failed". */
export function networkHint(error: unknown): string {
  if (!isRetriable(error)) return errorText(error) || 'Có lỗi xảy ra.'
  return 'Mạng chập chờn — thử lại, hoặc đợi giây lát rồi đăng tiếp.'
}
