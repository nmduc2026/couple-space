/* Hàng đợi đồng bộ: việc người dùng đã làm xong nhưng mạng chưa gửi được.
 *
 * Đi chơi thường là lúc mạng kém nhất, mà cũng chính là lúc đăng ảnh —
 * xem docs/features/p2-timeline.md mục 6. Vì vậy mất mạng là đường đi
 * thường gặp, không phải ca biên: bài vẫn "đăng xong" dưới góc nhìn người
 * dùng, chỉ mang trạng thái chờ gửi.
 */

import { supabase } from './supabase'
import { idbAll, idbDelete, idbPut, OUTBOX } from './idb'
import { MEDIA_BUCKET } from '../hooks/usePosts'
import { isRetriable } from './netError'

export { isRetriable }

export type QueuedPhoto = {
  blob: Blob
  width: number
  height: number
  ext: string
}

export type PostJob = {
  id: string
  kind: 'post'
  queuedAt: number
  attempts: number
  coupleId: string
  authorId: string
  caption: string | null
  happenedOn: string
  placeName: string | null
  activity: string | null
  photos: QueuedPhoto[]
}

export type ExpenseJob = {
  id: string
  kind: 'expense'
  queuedAt: number
  attempts: number
  coupleId: string
  amountMinor: number
  category: string
  note: string | null
  spentOn: string
  paidBy: string
  createdBy: string
}

export type Job = PostJob | ExpenseJob

/** `Omit` trên một union sẽ gộp về các khoá chung — phải cho nó phân phối
 *  qua từng nhánh, nếu không `photos` và `amountMinor` biến mất. */
type NewJob = Job extends infer T
  ? T extends Job
    ? Omit<T, 'id' | 'queuedAt' | 'attempts'>
    : never
  : never

/** Bỏ cuộc sau ngần này lần — tránh một việc hỏng chặn cả hàng đợi mãi mãi. */
const MAX_ATTEMPTS = 8

type Listener = (jobs: Job[]) => void
const listeners = new Set<Listener>()

async function announce() {
  const jobs = await idbAll<Job>(OUTBOX)
  for (const fn of listeners) fn(jobs)
}

export function onQueueChange(fn: Listener) {
  listeners.add(fn)
  void announce()
  return () => listeners.delete(fn)
}

export async function enqueue(job: NewJob) {
  const full = {
    ...job,
    id: crypto.randomUUID(),
    queuedAt: Date.now(),
    attempts: 0,
  } as Job
  await idbPut(OUTBOX, full)
  await announce()
  return full
}

export async function queuedJobs() {
  return idbAll<Job>(OUTBOX)
}

async function sendPost(job: PostJob) {
  const { data: created, error } = await supabase
    .from('posts')
    .insert({
      couple_id: job.coupleId,
      author_id: job.authorId,
      caption: job.caption,
      happened_on: job.happenedOn,
      place_name: job.placeName,
      activity: job.activity,
    })
    .select('id')
    .single()
  if (error || !created) throw error ?? new Error('Không tạo được bài')

  for (const [i, photo] of job.photos.entries()) {
    const path = `${job.coupleId}/${created.id}/${crypto.randomUUID()}.${photo.ext}`
    const { error: upErr } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(path, photo.blob, { contentType: photo.blob.type, upsert: false })
    if (upErr) throw upErr

    const { error: mediaErr } = await supabase.from('post_media').insert({
      post_id: created.id,
      couple_id: job.coupleId,
      storage_path: path,
      width: photo.width,
      height: photo.height,
      position: i,
    })
    if (mediaErr) throw mediaErr
  }
}

async function sendExpense(job: ExpenseJob) {
  const { error } = await supabase.from('expenses').insert({
    couple_id: job.coupleId,
    amount_minor: job.amountMinor,
    category: job.category,
    note: job.note,
    spent_on: job.spentOn,
    paid_by: job.paidBy,
    created_by: job.createdBy,
  })
  if (error) throw error
}

let flushing = false

/** Gửi lại mọi việc đang chờ. Trả về số việc đã gửi xong. */
export async function flushQueue(): Promise<number> {
  if (flushing || !navigator.onLine) return 0
  flushing = true
  let sent = 0
  try {
    // Gửi theo đúng thứ tự xếp hàng — timeline mới đọc ra đúng trình tự
    const jobs = (await idbAll<Job>(OUTBOX)).sort((a, b) => a.queuedAt - b.queuedAt)
    for (const job of jobs) {
      try {
        if (job.kind === 'post') await sendPost(job)
        else await sendExpense(job)
        await idbDelete(OUTBOX, job.id)
        sent++
      } catch (err) {
        if (isRetriable(err) && job.attempts + 1 < MAX_ATTEMPTS) {
          await idbPut(OUTBOX, { ...job, attempts: job.attempts + 1 })
          // Mạng vẫn hỏng thì những việc sau cũng hỏng — dừng, để lần sau
          if (!navigator.onLine) break
        } else {
          // Hỏng vì dữ liệu, hoặc đã thử quá nhiều: bỏ, không giữ mãi
          await idbDelete(OUTBOX, job.id)
        }
      }
    }
  } finally {
    flushing = false
    await announce()
  }
  return sent
}
