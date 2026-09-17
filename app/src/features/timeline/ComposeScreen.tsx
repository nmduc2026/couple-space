import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useCouple } from '../../hooks/useCouple'
import { useSession } from '../../hooks/useSession'
import { MEDIA_BUCKET } from '../../hooks/usePosts'
import { ACTIVITY_LABELS } from '../../lib/activities'
import {
  categoryFromActivity,
  parseAmountInput,
} from '../../lib/money'
import { AmountInput } from '../../components/AmountInput'
import { todayYmd } from '../../lib/dateCount'
import { compressImage, readExifDate } from '../../lib/image'
import { notifyPartner } from '../../lib/notify'
import { supabase } from '../../lib/supabase'
import { currentPosition, reverseGeocode, type ResolvedAddress } from '../../lib/geocode'
import { enqueue, isRetriable, type QueuedPhoto } from '../../lib/syncQueue'
import { errorText, networkHint } from '../../lib/netError'
import {
  ErrorText,
  Field,
  FormHeader,
  Screen,
  Spacer,
  Stage,
} from '../../components/ui'
import { btn, input, inputChrome } from '../../lib/ui-classes'
import { MAX_PHOTOS } from '../../lib/maxPhotos'
import { DateField } from '../../components/DateField'
import { SegmentedControl } from '../../components/SegmentedControl'

type Picked = {
  file: File
  previewUrl: string
}

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
  // Địa chỉ có cấu trúc, chỉ có khi người dùng bấm "Lấy vị trí hiện tại"
  const [located, setLocated] = useState<ResolvedAddress | null>(null)
  const [locating, setLocating] = useState(false)
  const [locateError, setLocateError] = useState('')
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
  const [picking, setPicking] = useState(false)
  const [pickHint, setPickHint] = useState('')

  useEffect(() => {
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.previewUrl))
    }
  }, [photos])

  async function pickFiles(files: FileList | null) {
    if (!files?.length) return
    const incoming = Array.from(files)
    const room = MAX_PHOTOS - photos.length
    if (room <= 0) {
      setPickHint(`Tối đa ${MAX_PHOTOS} ảnh mỗi bài.`)
      return
    }
    if (incoming.length > room) {
      setPickHint(
        `Bạn chọn ${incoming.length} ảnh — chỉ lấy ${room} ảnh đầu (tối đa ${MAX_PHOTOS}/bài).`,
      )
    } else {
      setPickHint('')
    }

    setPicking(true)
    // Cho UI kịp hiện “Đang thêm ảnh…” trước khi decode preview.
    await new Promise((r) => window.setTimeout(r, 0))
    try {
      const picked = incoming.slice(0, room).map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      }))

      if (photos.length === 0 && picked[0]) {
        const exif = await readExifDate(picked[0].file)
        if (exif) setHappenedOn(exif)
      }
      setPhotos((prev) => [...prev, ...picked])
    } finally {
      setPicking(false)
      if (fileInput.current) fileInput.current.value = ''
    }
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

  /** Lấy vị trí máy rồi tra ngược ra địa chỉ, điền sẵn vào ô Địa điểm.
   *  Người dùng vẫn sửa lại tên được — "79 Phố Đinh Tiên Hoàng" đúng về địa
   *  chỉ nhưng "Cà phê Giảng" mới là thứ sau này họ nhớ ra. */
  async function fillFromLocation() {
    setLocating(true)
    setLocateError('')
    try {
      const { lat, lng } = await currentPosition()
      const found = await reverseGeocode(lat, lng)
      setLocated(found)
      if (found.shortName && !placeName.trim()) setPlaceName(found.shortName)
      if (!found.address) {
        setLocateError('Đã lấy được vị trí nhưng chưa tra ra địa chỉ.')
      }
    } catch (err) {
      setLocateError(
        err instanceof Error ? err.message : 'Không lấy được vị trí.',
      )
    } finally {
      setLocating(false)
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!couple || !user) return
    if (!caption.trim() && photos.length === 0) {
      setStatus('error')
      setErrorMessage('Thêm một tấm ảnh hoặc viết vài chữ.')
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
      setErrorMessage('Không đọc được một tấm ảnh. Thử bỏ tấm đó ra.')
      return
    }

    if (!navigator.onLine) {
      await queueIt(ready)
      return
    }

    // Theo dõi xem bài đã tạo trên server chưa — tránh enqueue nhân đôi
    // khi mạng đứt lúc đang tải ảnh.
    let createdId: string | null = null

    try {
      const { data: created, error: postErr } = await supabase
        .from('posts')
        .insert({
          couple_id: couple.id,
          author_id: user.id,
          caption: caption.trim() || null,
          happened_on: happenedOn,
          place_name: placeName.trim() || null,
          place_lat: located?.lat ?? null,
          place_lng: located?.lng ?? null,
          province_code: located?.provinceCode ?? null,
          ward: located?.ward ?? null,
          district: located?.district ?? null,
          address: located?.address || null,
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
        setErrorMessage(errorText(postErr) || 'Không lưu được kỉ niệm.')
        return
      }

      createdId = created.id

      for (const [i, photo] of ready.entries()) {
        setProgress(`Đang tải ảnh ${i + 1}/${ready.length}...`)
        const path = `${couple.id}/${created.id}/${crypto.randomUUID()}.${photo.ext}`
        const { error: upErr } = await supabase.storage
          .from(MEDIA_BUCKET)
          .upload(path, photo.blob, {
            contentType: photo.blob.type,
            upsert: false,
          })
        if (upErr) {
          if (isRetriable(upErr)) {
            // Bài đã tạo — không enqueue lại (sẽ bị nhân đôi). Báo rõ để thử lại.
            setStatus('error')
            setProgress('')
            setErrorMessage(
              'Mạng chập chờn lúc tải ảnh. Bài có thể đã hiện trên timeline — mở lại kiểm tra rồi đăng tiếp phần còn thiếu nếu cần.',
            )
            await queryClient.invalidateQueries({ queryKey: ['posts'] })
            return
          }
          setStatus('error')
          setProgress('')
          setErrorMessage(
            `Ảnh ${i + 1} tải lên thất bại: ${errorText(upErr) || 'không rõ lý do'}`,
          )
          return
        }

        const { error: mediaErr } = await supabase.from('post_media').insert({
          post_id: created.id,
          couple_id: couple.id,
          storage_path: path,
          width: photo.width,
          height: photo.height,
          position: i,
        })
        if (mediaErr) {
          if (isRetriable(mediaErr)) {
            setStatus('error')
            setProgress('')
            setErrorMessage(
              'Mạng chập chờn lúc gắn ảnh vào bài. Thử mở timeline xem bài đã lên chưa.',
            )
            await queryClient.invalidateQueries({ queryKey: ['posts'] })
            return
          }
          setStatus('error')
          setProgress('')
          setErrorMessage(
            `Ảnh ${i + 1} lưu thất bại: ${errorText(mediaErr) || 'không rõ lý do'}`,
          )
          return
        }
      }

      setProgress('')
      await queryClient.invalidateQueries({ queryKey: ['posts'] })

      const myName =
        couple.members.find((m) => m.user_id === user.id)?.nickname ??
        'Người ấy'
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
          paid_by: paidBy === 'shared' ? null : paidBy || user.id,
          created_by: user.id,
        })
        if (expErr) {
          setStatus('error')
          setErrorMessage(
            /paid_by/i.test(expErr.message) &&
              /null|not-null|not null/i.test(expErr.message)
              ? 'Kỉ niệm đã đăng. Quỹ chung chưa bật trên database — chạy migration expense_shared_payer trên Supabase rồi sửa khoản chi.'
              : `Kỉ niệm đã đăng, nhưng chưa ghi được khoản chi: ${expErr.message}`,
          )
          return
        }
        await queryClient.invalidateQueries({ queryKey: ['expenses'] })
        await queryClient.invalidateQueries({ queryKey: ['expense_summary'] })
      }

      navigate(`/timeline/${created.id}`, { replace: true })
    } catch (err) {
      // Safari hay ném TypeError: Load failed thay vì trả { error }.
      if (isRetriable(err) && !createdId) {
        await queueIt(ready)
        return
      }
      setStatus('error')
      setProgress('')
      if (isRetriable(err) && createdId) {
        setErrorMessage(
          'Mạng chập chờn. Bài có thể đã lên timeline — mở lại kiểm tra trước khi đăng lại.',
        )
        await queryClient.invalidateQueries({ queryKey: ['posts'] })
        return
      }
      setErrorMessage(
        networkHint(err) ||
          (errorText(err)
            ? `Không đăng được: ${errorText(err)}`
            : 'Không đăng được kỉ niệm.'),
      )
    }
  }

  const busy = status === 'saving'
  const blocked = busy || picking

  return (
    <Screen>
      <FormHeader to="/timeline" title="Thêm kỉ niệm" />
      <form onSubmit={submit} className="contents">
        <Stage>
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
                  disabled={blocked}
                  onClick={() =>
                    setPhotos((prev) => prev.filter((_, idx) => idx !== i))
                  }
                  className="absolute top-1 right-1 grid h-6 w-6 place-items-center rounded-full bg-black/55 text-xs text-white disabled:opacity-40"
                >
                  ✕
                </button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS ? (
              <button
                type="button"
                disabled={blocked}
                onClick={() => fileInput.current?.click()}
                className="grid aspect-square place-items-center rounded-xl border border-dashed border-border text-2xl text-muted disabled:opacity-40"
              >
                +
              </button>
            ) : null}
          </div>
          <p className="mt-2 text-[12.5px] text-muted">
            {photos.length}/{MAX_PHOTOS} ảnh
            {picking ? ' · Đang thêm ảnh…' : ''}
          </p>
          {pickHint ? (
            <p className="mt-1 text-[12.5px] text-accent">{pickHint}</p>
          ) : null}
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => void pickFiles(e.target.files)}
          />
          <div className="mt-5 space-y-4">
            <Field label="Caption">
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={3}
                placeholder="Hôm nay..."
                disabled={blocked}
                className={`${input} h-auto py-3 leading-relaxed`}
              />
            </Field>

            <Field label="Ngày kỉ niệm">
              <DateField
                value={happenedOn}
                max={todayYmd()}
                onChange={setHappenedOn}
                className={`${inputChrome} flex items-center text-[15px]`}
              />
            </Field>

            <Field label="Địa điểm">
              <input
                value={placeName}
                onChange={(e) => setPlaceName(e.target.value)}
                placeholder="Địa điểm"
                disabled={blocked}
                className={input}
              />
              <button
                type="button"
                onClick={() => void fillFromLocation()}
                disabled={locating || blocked}
                className="mt-2 flex w-full items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-[13.5px] text-accent disabled:opacity-50"
              >
                <span aria-hidden>📍</span>
                {locating ? 'Đang tìm vị trí...' : 'Lấy vị trí hiện tại'}
              </button>

              {located?.address ? (
                <p className="mt-2 rounded-xl bg-soft px-3.5 py-2.5 text-[12.5px] leading-relaxed text-text">
                  {located.address}
                  <span className="mt-1 block text-[11px] text-muted">
                    Từ bản đồ
                  </span>
                </p>
              ) : null}
              {locateError ? (
                <p className="mt-2 text-[12.5px] text-accent">{locateError}</p>
              ) : null}
            </Field>

            <Field label="Hoạt động">
              <div className="flex flex-wrap gap-2">
                {Object.entries(ACTIVITY_LABELS).map(([key, meta]) => (
                  <button
                    key={key}
                    type="button"
                    disabled={blocked}
                    onClick={() => setActivity(activity === key ? null : key)}
                    className={`rounded-full border px-3 py-1.5 text-[13px] transition disabled:opacity-40 ${
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
            disabled={blocked}
            onClick={() => setAddExpense((v) => !v)}
            className={`mt-4 flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition disabled:opacity-40 ${
              addExpense ? 'border-accent bg-soft' : 'border-border bg-surface'
            }`}
          >
            <span aria-hidden className="text-xl">
              💰
            </span>
            <span className="min-w-0 flex-1">
              <b className="block text-[15px] font-semibold text-text">
                Thêm chi tiêu
              </b>
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
            <div className="mt-2 space-y-3 rounded-xl border border-accent/30 bg-soft p-3.5">
              <Field label="Số tiền">
                <AmountInput
                  variant="md"
                  value={amount}
                  onChange={setAmount}
                />
              </Field>

              <Field label="Người thanh toán">
                <SegmentedControl
                  options={[
                    ...(couple?.members ?? []).map((m) => ({
                      value: m.user_id,
                      label: m.nickname ?? 'Người ấy',
                    })),
                    { value: 'shared', label: 'Quỹ chung' },
                  ]}
                  value={paidBy || user?.id || ''}
                  onChange={setPaidBy}
                />
              </Field>
            </div>
          ) : null}

          {status === 'error' ? <ErrorText>{errorMessage}</ErrorText> : null}

          <Spacer />

          <button type="submit" disabled={blocked} className={btn.primary}>
            {busy ? progress || 'Đang đăng...' : 'Đăng'}
          </button>
        </Stage>
      </form>

      {busy ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/35 px-8"
          role="status"
          aria-live="polite"
        >
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface px-5 py-6 text-center shadow-lg">
            <p className="text-[15px] font-semibold text-text">
              {progress || 'Đang đăng kỉ niệm…'}
            </p>
            <p className="mt-2 text-[13px] text-muted">
              Đừng tắt app — đang xử lý và tải ảnh lên.
            </p>
          </div>
        </div>
      ) : null}
    </Screen>
  )
}
