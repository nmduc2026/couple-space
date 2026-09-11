import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useCouple } from '../../hooks/useCouple'
import { useSession } from '../../hooks/useSession'
import { MEDIA_BUCKET } from '../../hooks/usePosts'
import { ACTIVITY_LABELS } from '../../lib/activities'
import { todayYmd } from '../../lib/dateCount'
import { compressImage, readExifDate } from '../../lib/image'
import { notifyPartner } from '../../lib/notify'
import { supabase } from '../../lib/supabase'
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

type Picked = {
  file: File
  previewUrl: string
}

const MAX_PHOTOS = 8

export function ComposeScreen() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useSession()
  const { couple } = useCouple()
  const fileInput = useRef<HTMLInputElement>(null)

  const [photos, setPhotos] = useState<Picked[]>([])
  const [caption, setCaption] = useState('')
  const [happenedOn, setHappenedOn] = useState(todayYmd())
  const [placeName, setPlaceName] = useState('')
  const [activity, setActivity] = useState<string | null>(null)
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
      setStatus('error')
      setErrorMessage(postErr?.message ?? 'Không lưu được kỉ niệm.')
      return
    }

    for (const [i, picked] of photos.entries()) {
      setProgress(`Đang tải ảnh ${i + 1}/${photos.length}...`)
      try {
        const { blob, width, height, ext } = await compressImage(picked.file)
        const path = `${couple.id}/${created.id}/${crypto.randomUUID()}.${ext}`
        const { error: upErr } = await supabase.storage
          .from(MEDIA_BUCKET)
          .upload(path, blob, { contentType: blob.type, upsert: false })
        if (upErr) throw upErr

        const { error: mediaErr } = await supabase.from('post_media').insert({
          post_id: created.id,
          couple_id: couple.id,
          storage_path: path,
          width,
          height,
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
              <input
                type="date"
                value={happenedOn}
                max={todayYmd()}
                onChange={(e) => setHappenedOn(e.target.value)}
                className={input}
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
