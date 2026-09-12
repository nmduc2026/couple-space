import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { flushQueue, onQueueChange, type Job } from '../lib/syncQueue'
import { PREVIEW } from '../dev/preview'

/** Việc đang chờ gửi + tự gửi lại khi mạng quay lại.
 *  Gắn một lần ở AppShell, đừng gắn nhiều nơi — `flushQueue` tự khoá
 *  nhưng mỗi bản gắn thêm lại đăng ký thêm một listener. */
export function useOutbox() {
  const queryClient = useQueryClient()
  const [jobs, setJobs] = useState<Job[]>([])

  useEffect(() => {
    if (PREVIEW) return
    const stop = onQueueChange(setJobs)

    async function flush() {
      const sent = await flushQueue()
      if (sent > 0) {
        await queryClient.invalidateQueries({ queryKey: ['posts'] })
        await queryClient.invalidateQueries({ queryKey: ['expenses'] })
        await queryClient.invalidateQueries({ queryKey: ['expense_summary'] })
      }
    }

    void flush()
    window.addEventListener('online', () => void flush())
    // Mở lại app từ nền cũng là lúc đáng thử — iOS hay cắt mạng khi khoá máy
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') void flush()
    })

    return () => {
      stop()
    }
  }, [queryClient])

  return {
    pending: jobs,
    pendingPosts: jobs.filter((j) => j.kind === 'post').length,
  }
}
