import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCouple } from '../../hooks/useCouple'
import { useSession } from '../../hooks/useSession'
import { supabase } from '../../lib/supabase'
import { PREVIEW } from '../../dev/preview'
import {
  ErrorText,
  Field,
  Screen,
  Spacer,
  Stage,
  Sub,
  Title,
  TopBar,
} from '../../components/ui'
import { btn } from '../../lib/ui-classes'

type Export = {
  id: string
  status: 'queued' | 'running' | 'done' | 'failed'
  storage_path: string | null
  page_count: number | null
  progress: string | null
  error: string | null
  expires_at: string | null
  created_at: string
}

const PAGE_SIZES = [
  ['A5', 'A5 — cỡ sách cầm tay'],
  ['A4', 'A4 — to, rõ ảnh'],
] as const

const DENSITIES = [
  [1, '1 ảnh mỗi trang'],
  [2, '2 ảnh mỗi trang'],
  [4, '4 ảnh mỗi trang'],
] as const

export function ExportPdfScreen() {
  const queryClient = useQueryClient()
  const { couple } = useCouple()
  const { user } = useSession()

  const [pageSize, setPageSize] = useState<'A4' | 'A5'>('A5')
  const [perPage, setPerPage] = useState<1 | 2 | 4>(2)
  const [year, setYear] = useState<number | null>(null)
  const [starting, setStarting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const thisYear = new Date().getFullYear()

  const jobs = useQuery({
    queryKey: ['pdf_exports', couple?.id],
    enabled: !!couple?.id && !PREVIEW,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pdf_exports')
        .select(
          'id, status, storage_path, page_count, progress, error, expires_at, created_at',
        )
        .eq('couple_id', couple!.id)
        .order('created_at', { ascending: false })
        .limit(5)
      if (error) throw error
      return (data ?? []) as Export[]
    },
    // Sinh sách mất hàng chục giây và chạy ở nền — hỏi lại vài giây một lần
    refetchInterval: (q) =>
      (q.state.data ?? []).some((e) => e.status === 'queued' || e.status === 'running')
        ? 4000
        : false,
  })

  const latest = jobs.data?.[0]
  const busy = latest?.status === 'queued' || latest?.status === 'running'

  async function start() {
    if (!couple || !user || PREVIEW) return
    setStarting(true)
    setErrorMessage('')

    // Tạo yêu cầu trước rồi mới gọi function: nếu mạng rớt giữa chừng thì
    // dòng vẫn còn đó để thử lại, không mất dấu.
    const { data, error } = await supabase
      .from('pdf_exports')
      .insert({
        couple_id: couple.id,
        requested_by: user.id,
        page_size: pageSize,
        per_page: perPage,
        year,
      })
      .select('id')
      .single()

    if (error || !data) {
      setStarting(false)
      setErrorMessage(error?.message ?? 'Không tạo được yêu cầu.')
      return
    }

    const { error: fnErr } = await supabase.functions.invoke('export-pdf', {
      body: { export_id: data.id },
    })
    setStarting(false)
    if (fnErr) {
      setErrorMessage('Không bắt đầu được. Thử lại sau một chút.')
      return
    }
    await queryClient.invalidateQueries({ queryKey: ['pdf_exports'] })
  }

  async function download(job: Export) {
    if (!job.storage_path || PREVIEW) return
    const { data, error } = await supabase.storage
      .from('couple-exports')
      .createSignedUrl(job.storage_path, 60 * 60)
    if (error || !data) {
      setErrorMessage('Link đã hết hạn. Xuất lại một bản mới.')
      return
    }
    window.open(data.signedUrl, '_blank')
  }

  return (
    <Screen>
      <TopBar to="/albums" />
      <Stage>
        <Title>Xuất sách ảnh</Title>
          <Sub>
          Xuất trên máy chủ. Link tải hết hạn sau 24 giờ.
        </Sub>

        <div className="mt-6 space-y-4">
          <Field label="Khổ giấy">
            <div className="flex gap-1 rounded-xl border border-border bg-surface p-1">
              {PAGE_SIZES.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPageSize(value)}
                  className={`flex-1 rounded-xl py-2 text-[13px] font-semibold transition ${
                    pageSize === value ? 'bg-accent text-on-accent' : 'text-muted'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Mật độ ảnh">
            <div className="flex gap-1 rounded-xl border border-border bg-surface p-1">
              {DENSITIES.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPerPage(value)}
                  className={`flex-1 rounded-xl py-2 text-[13px] font-semibold transition ${
                    perPage === value ? 'bg-accent text-on-accent' : 'text-muted'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Phạm vi">
            <div className="flex gap-1 rounded-xl border border-border bg-surface p-1">
              {[null, thisYear, thisYear - 1].map((y) => (
                <button
                  key={String(y)}
                  type="button"
                  onClick={() => setYear(y)}
                  className={`flex-1 rounded-xl py-2 text-[13px] font-semibold transition ${
                    year === y ? 'bg-accent text-on-accent' : 'text-muted'
                  }`}
                >
                  {y === null ? 'Tất cả' : y}
                </button>
              ))}
            </div>
          </Field>
        </div>

        {errorMessage ? <ErrorText>{errorMessage}</ErrorText> : null}

        {latest ? <JobRow job={latest} onDownload={() => void download(latest)} /> : null}

        <Spacer />

        <button
          type="button"
          disabled={starting || busy}
          onClick={() => void start()}
          className={btn.primary}
        >
          {busy ? 'Đang sinh sách...' : starting ? 'Đang gửi...' : 'Xuất PDF'}
        </button>
        <p className="mt-2 text-center text-[12px] leading-relaxed text-muted">
          Link tải hết hạn sau 24 giờ.
        </p>
      </Stage>
    </Screen>
  )
}

function JobRow({ job, onDownload }: { job: Export; onDownload: () => void }) {
  if (job.status === 'failed') {
    return (
      <p className="mt-5 rounded-xl border border-border bg-surface p-4 text-[13.5px] leading-relaxed text-muted">
        Lần xuất gần nhất hỏng: {job.error ?? 'không rõ lý do'}. Thử lại.
      </p>
    )
  }

  if (job.status !== 'done') {
    return (
      <p className="mt-5 rounded-xl border border-border bg-soft p-4 text-center text-[13.5px] text-accent">
        {job.progress ?? 'Đang bắt đầu'} — cứ đóng app, xong sẽ có thông báo.
      </p>
    )
  }

  const expired = job.expires_at ? new Date(job.expires_at) < new Date() : false

  return (
    <div className="mt-5 rounded-xl border border-border bg-surface p-4">
      <b className="block text-[15px] font-semibold text-text">
        Sách {job.page_count} trang đã xong
      </b>
      {job.error ? (
        <span className="mt-1 block text-[12.5px] text-muted">{job.error}</span>
      ) : null}
      {expired ? (
        <span className="mt-2 block text-[13px] text-muted">
          Link đã hết hạn — xuất lại một bản mới.
        </span>
      ) : (
        <button
          type="button"
          onClick={onDownload}
          className={`${btn.outline} mt-3`}
        >
          ⬇ Tải về
        </button>
      )}
    </div>
  )
}
