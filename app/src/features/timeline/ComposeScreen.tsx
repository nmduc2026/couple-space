import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useCouple } from '../../hooks/useCouple'
import { useSession } from '../../hooks/useSession'
import { MEDIA_BUCKET } from '../../hooks/usePosts'
import { ACTIVITY_LABELS } from '../../lib/activities'
import {
  categoryFromActivity,
  formatAmountInput,
  parseAmountInput,
} from '../../lib/money'
import { todayYmd } from '../../lib/dateCount'
import { compressImage, readExifDate } from '../../lib/image'
import { notifyPartner } from '../../lib/notify'
import { supabase } from '../../lib/supabase'
import { enqueue, isRetriable, type QueuedPhoto } from '../../lib/syncQueue'
import {
  ErrorText,
  Field,
  Screen,
  Spacer,
  Stage,
  Title,
  TopBar,
} from '../../components/ui'
import { btn, input } from '../../lib/ui-classes'
import { DateField } from '../../components/DateField'

type Picked = {
  file: File
  previewUrl: string
}

const MAX_PHOTOS = 8

export function ComposeScreen() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const queryClient = useQueryClient()
  const { user } = useSession()
  const { couple } = useCouple()
  const fileInput = useRef<HTMLInputElement>(null)

  const [photos, setPhotos] = useState<Picked[]>([])
  // Vào từ màn chúc mừng mục tiêu thì caption đã điền sẵn
  const [caption, setCaption] = useState(() => params.get('caption') ?? '')
  const [happenedOn, setHappenedOn] = useState(todayYmd())
  // Vào từ vòng quay "Ăn gì?" thì tên quán và hoạt động đã điền sẵn
  const [placeName, setPlaceName] = useState(() => params.get('place') ?? '')
  const [activity, setActivity] = useState<string | null>(
    () => params.get('activity'),
  )
  const [addExpense, setAddExpense] = useState(false)
  // Ghi chi phí NGAY TẠI ĐÂY chứ không đẩy sang màn khác: đăng kỉ niệm và ghi
  // khoản chi là một việc trong đầu người dùng, tách làm hai màn thì nửa số
  // lần sẽ bỏ dở ở màn thứ hai.
  const [amount, setAmount] = useState('')
  const [paidBy, setPaidBy] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [progress, setProgress] = useState('')

  useEffect(() => {
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.previewUrl))
    }
  }, [photos])

  async function pickFiles(files: FileList | null) {
    if (!files?.length) return
    const picked = Array.from(files)
      .slice(0, MAX_PHOTOS - photos.length)
      .map((file) => ({ file, previewUrl: URL.createObjectURL(file) }))

    // Ngày chụp lấy từ EXIF của ảnh đầu tiên — đỡ một lần gõ
    if (photos.length === 0 && picked[0]) {
      const exif = await readExifDate(picked[0].file)
      if (exif) setHappenedOn(exif)
    }
    setPhotos((prev) => [...prev, ...picked])
  }

  /** Cất bài vào hàng đợi và rời màn hình như thể đã đăng xong —
   *  dưới góc nhìn người dùng thì việc đã làm xong, chỉ là chưa gửi. */
  async function queueIt(ready: QueuedPhoto[]) {
    if (!couple || !user) return
    await enqueue({
      kind: 'post',
      coupleId: couple.id,
      authorId: user.id,
      caption: caption.trim() || null,
      happenedOn,
      placeName: placeName.trim() || null,
      activity,
      photos: ready,
    })
    setProgress('')
    navigate('/timeline', { replace: true })
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!couple || !user) return
    if (!caption.trim() && photos.length === 0) {
      setStatus('error')
      setErrorMessage('Thêm một tấm ảnh hoặc viết vài chữ đã nhé.')
      return
    }

    setStatus('saving')
    setErrorMessage('')

    // Nén trước khi làm bất cứ việc gì khác: hàng đợi phải giữ bản đã nén,
    // không phải File gốc 8 MB — nếu không thì lưu vài bài là đầy máy.
    let ready: QueuedPhoto[]
    try {
      ready = []
      for (const [i, picked] of photos.entries()) {
        setProgress(`Đang xử lý ảnh ${i + 1}/${photos.length}...`)
        ready.push(await compressImage(picked.file))
      }
    } catch {
      setStatus('error')
      setProgress('')
      setErrorMessage('Không đọc được một tấm ảnh. Thử bỏ tấm đó ra nhé.')
      return
    }

    if (!navigator.onLine) {
      await queueIt(ready)
      return
    }

    const { data: created, error: postErr } = await supabase
      .from('posts')
      .insert({
        couple_id: couple.id,
        author_id: user.id,
        caption: caption.trim() || null,
        happened_on: happenedOn,
        place_name: placeName.trim() || null,
        activity,
      })
      .select('id')
      .single()

    if (postErr || !created) {
      // Mất mạng giữa chừng thì xếp hàng, không bắt người dùng gõ lại
      if (isRetriable(postErr)) {
        await queueIt(ready)
        return
      }
      setStatus('error')
      setProgress('')
      setErrorMessage(postErr?.message ?? 'Không lưu được kỉ niệm.')
      return
    }

    for (const [i, photo] of ready.entries()) {
      setProgress(`Đang tải ảnh ${i + 1}/${ready.length}...`)
      try {
        const path = `${couple.id}/${created.id}/${crypto.randomUUID()}.${photo.ext}`
        const { error: upErr } = await supabase.storage
          .from(MEDIA_BUCKET)
          .upload(path, photo.blob, {
            contentType: photo.blob.type,
            upsert: false,
          })
        if (upErr) throw upErr

        const { error: mediaErr } = await supabase.from('post_media').insert({
          post_id: created.id,
          couple_id: couple.id,
          storage_path: path,
          width: photo.width,
          height: photo.height,
          position: i,
        })
        if (mediaErr) throw mediaErr
      } catch (err) {
        setStatus('error')
        setProgress('')
        setErrorMessage(
          err instanceof Error
            ? `Ảnh ${i + 1} tải lên thất bại: ${err.message}`
            : `Ảnh ${i + 1} tải lên thất bại.`,
        )
        return
      }
    }

    setProgress('')
    await queryClient.invalidateQueries({ queryKey: ['posts'] })

    const myName =
      couple.members.find((m) => m.user_id === user.id)?.nickname ?? 'Người ấy'
    void notifyPartner(couple, user.id, {
      title: 'Couple Space',
      body:
        photos.length > 1
          ? `${myName} vừa thêm ${photos.length} tấm ảnh mới`
          : `${myName} vừa thêm một kỉ niệm`,
      path: `/timeline/${created.id}`,
    })

    // Khoản chi ghi cùng lúc với bài. Hỏng ở bước này thì KHÔNG huỷ bài —
    // kỉ niệm đã đăng rồi, bắt làm lại từ đầu là mất cả ảnh vừa tải lên.
    const minor = parseAmountInput(amount)
    if (addExpense && minor > 0) {
      const { error: expErr } = await supabase.from('expenses').insert({
        couple_id: couple.id,
        post_id: created.id,
        amount_minor: minor,
        // Danh mục đoán sẵn theo hoạt động của bài — 🍜 thì là ăn uống
        category: categoryFromActivity(activity),
        note: placeName.trim() || caption.trim().slice(0, 40) || null,
        spent_on: happenedOn,
        paid_by: paidBy || user.id,
        created_by: user.id,
      })
      if (expErr) {
        setStatus('error')
        setErrorMessage(
          `Kỉ niệm đã đăng, nhưng chưa ghi được khoản chi: ${expErr.message}`,
        )
        return
      }
      await queryClient.invalidateQueries({ queryKey: ['expenses'] })
      await queryClient.invalidateQueries({ queryKey: ['expense_summary'] })
    }

    navigate(`/timeline/${created.id}`, { replace: true })
  }

  const busy = status === 'saving'

  return (
    <Screen>
      <TopBar to="/timeline" label="Huỷ" />
      <form onSubmit={submit} className="contents">
        <Stage>
          <Title>Thêm kỉ niệm</Title>

          <div className="mt-5 grid grid-cols-4 gap-2">
            {photos.map((p, i) => (
              <div
                key={p.previewUrl}
                className="relative aspect-square overflow-hidden rounded-xl bg-soft"
              >
                <img
                  src={p.previewUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  aria-label={`Bỏ ảnh ${i + 1}`}
                  onClick={() =>
                    setPhotos((prev) => prev.filter((_, idx) => idx !== i))
                  }
                  className="absolute top-1 right-1 grid h-6 w-6 place-items-center rounded-full bg-black/55 text-xs text-white"
                >
                  ✕
                </button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS ? (
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="grid aspect-square place-items-center rounded-xl border border-dashed border-border text-2xl text-muted"
              >
                +
              </button>
            ) : null}
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => void pickFiles(e.target.files)}
          />
          <p className="mt-2 text-xs text-muted">
            Ảnh được nén về cạnh 1600px trước khi tải lên.
          </p>

          <div className="mt-5 space-y-4">
            <Field label="Caption">
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={3}
                placeholder="Hôm nay tụi mình..."
                className={`${input} h-auto py-3 leading-relaxed`}
              />
            </Field>

            <Field label="Ngày xảy ra">
              <DateField
                value={happenedOn}
                max={todayYmd()}
                onChange={setHappenedOn}
                className={`${input} flex items-center`}
              />
            </Field>

            <Field label="Địa điểm">
              <input
                value={placeName}
                onChange={(e) => setPlaceName(e.target.value)}
                placeholder="Không bắt buộc"
                className={input}
              />
            </Field>

            <Field label="Hoạt động">
              <div className="flex flex-wrap gap-2">
                {Object.entries(ACTIVITY_LABELS).map(([key, meta]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActivity(activity === key ? null : key)}
                    className={`rounded-full border px-3 py-1.5 text-[13px] transition ${
                      activity === key
                        ? 'border-accent bg-accent font-semibold text-on-accent'
                        : 'border-border text-muted'
                    }`}
                  >
                    {meta.emoji} {meta.label}
                  </button>
                ))}
              </div>
            </Field>
          </div>

          <button
            type="button"
            onClick={() => setAddExpense((v) => !v)}
            className={`mt-4 flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
              addExpense ? 'border-accent bg-soft' : 'border-border bg-surface'
            }`}
          >
            <span aria-hidden className="text-xl">
              💰
            </span>
            <span className="min-w-0 flex-1">
              <b className="block text-[15px] font-semibold text-text">
                Thêm chi phí
              </b>
              <small className="block text-[12.5px] text-muted">
                Ghi luôn khoản chi cho buổi này
              </small>
            </span>
            <span
              aria-hidden
              className={`grid h-6 w-6 place-items-center rounded-full border text-xs ${
                addExpense
                  ? 'border-accent bg-accent text-on-accent'
                  : 'border-border'
              }`}
            >
              {addExpense ? '✓' : ''}
            </span>
          </button>

          {addExpense ? (
            <div className="mt-2 space-y-3 rounded-2xl border border-accent/30 bg-soft p-3.5">
              <Field label="Số tiền">
                <div className="relative">
                  <input
                    inputMode="numeric"
                    value={amount}
                    onChange={(e) => setAmount(formatAmountInput(e.target.value))}
                    placeholder="0"
                    className={`${input} h-14 pr-10 text-right text-[22px] font-bold tabular-nums`}
                  />
                  <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-muted">
                    đ
                  </span>
                </div>
              </Field>

              <Field label="Ai trả" hint="Chỉ để thống kê — app không tính nợ.">
                <div className="flex gap-1 rounded-2xl border border-border bg-surface p-1">
                  {(couple?.members ?? []).map((m) => (
                    <button
                      key={m.user_id}
                      type="button"
                      onClick={() => setPaidBy(m.user_id)}
                      className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
                        (paidBy || user?.id) === m.user_id
                          ? 'bg-accent text-on-accent'
                          : 'text-muted'
                      }`}
                    >
                      {m.nickname ?? 'Người ấy'}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          ) : null}

          {status === 'error' ? <ErrorText>{errorMessage}</ErrorText> : null}
          {progress ? (
            <p className="mt-3 text-sm text-muted">{progress}</p>
          ) : null}

          <Spacer />

          <button type="submit" disabled={busy} className={btn.primary}>
            {busy ? 'Đang đăng...' : 'Đăng'}
          </button>
        </Stage>
      </form>
    </Screen>
  )
}
