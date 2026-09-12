/* Phân biệt "gửi lại được" với "gửi lại bao nhiêu cũng vậy".
   Để riêng khỏi syncQueue.ts để test được mà không kéo theo client Supabase. */

/** Lỗi mạng thì đáng thử lại; dữ liệu sai thì thử lại bao nhiêu cũng vậy. */
export function isRetriable(error: unknown) {
  if (!navigator.onLine) return true
  const message = error instanceof Error ? error.message : String(error ?? '')
  return /fetch|network|timeout|Failed to fetch|load failed/i.test(message)
}
