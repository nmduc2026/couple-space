import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCouple } from '../../hooks/useCouple'
import { useMyProfile } from '../../hooks/useMyProfile'
import { useSession } from '../../hooks/useSession'
import { todayYmd } from '../../lib/dateCount'
import { enablePush, isStandalonePwa } from '../../lib/push'
import { supabase } from '../../lib/supabase'
import { notifyPartner } from '../../lib/notify'
import { useUiStore, type Theme } from '../../lib/store'
import {
  Group,
  Row,
  SectionLabel,
  Switch,
  TopBar,
} from '../../components/ui'
import { btn } from '../../lib/ui-classes'
import { DateField } from '../../components/DateField'
import { COUPLE_THEMES } from '../../lib/coupleTheme'
import { compressImage } from '../../lib/image'
import { MEDIA_BUCKET } from '../../hooks/usePosts'
import { TimeField } from '../../components/TimeField'

/** [cột trong notification_prefs, nhãn, giá trị mặc định] */
const NOTIFY_TOGGLES: Array<[string, string, boolean]> = [
  ['partner_joined', 'Người ấy đã tham gia', true],
  ['new_post', 'Kỉ niệm mới', true],
  ['reactions', 'Tim và bình luận', true],
  ['event_reminders', 'Nhắc dịp đặc biệt', true],
  ['daily_day_count', 'Nhắc số ngày mỗi sáng', false],
]

const THEMES: Array<[Theme, string]> = [
  ['system', 'Theo máy'],
  ['light', 'Sáng'],
  ['dark', 'Tối'],
]

/** Ô nhập nằm bên phải một hàng cài đặt — không viền, canh phải. */
const rowInput =
  'flex min-w-0 flex-1 items-center bg-transparent text-right text-[15px] text-text outline-none focus:text-accent'

/** Ô giờ thì không giãn: hai ô đứng cạnh nhau trong cùng một hàng. */
const rowTimeInput =
  'bg-transparent text-right text-[15px] text-text outline-none focus:text-accent'

export function SettingsScreen() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useSession()
  const { couple, refetch } = useCouple()
  const theme = useUiStore((s) => s.theme)
  const setTheme = useUiStore((s) => s.setTheme)

  // Bản nháp = null nghĩa là chưa sửa gì, hiển thị thẳng giá trị đã lưu.
  // Nhờ vậy không cần useEffect đồng bộ state theo dữ liệu server.
  const [draftStartDate, setDraftStartDate] = useState<string | null>(null)
  const [draftNickname, setDraftNickname] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const { profile } = useMyProfile()
  const myTheme = profile?.color_theme ?? couple?.theme
  const coverInput = useRef<HTMLInputElement>(null)

  const prefsQuery = useQuery({
    queryKey: ['notification_prefs', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_prefs')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })

  // Toast tự tắt để không đọng lại giữa các thao tác
  useEffect(() => {
    if (!message) return
    const id = window.setTimeout(() => setMessage(''), 2600)
    return () => window.clearTimeout(id)
  }, [message])

  const savedStartDate = couple?.start_date ?? ''
  const savedNickname =
    couple?.members.find((m) => m.user_id === user?.id)?.nickname ?? ''
  const startDate = draftStartDate ?? savedStartDate
  const myNickname = draftNickname ?? savedNickname
  const dirty =
    !!couple &&
    (startDate !== savedStartDate || myNickname.trim() !== savedNickname)

  async function saveProfile(event: FormEvent) {
    event.preventDefault()
    if (!couple || !user) return

    // Đặc tả mục 3: biệt danh rỗng thì chặn. Không ai bị gọi bằng khoảng trắng.
    if (!myNickname.trim()) {
      setMessage('Biệt danh không được để trống.')
      return
    }

    const startDateChanged = startDate !== savedStartDate
    setSaving(true)
    setMessage('')

    const { error: coupleErr } = await supabase
      .from('couples')
      .update({ start_date: startDate })
      .eq('id', couple.id)
    if (coupleErr) {
      setSaving(false)
      setMessage(coupleErr.message)
      return
    }

    const { error: memberErr } = await supabase
      .from('couple_members')
      .update({ nickname: myNickname.trim() })
      .eq('couple_id', couple.id)
      .eq('user_id', user.id)
    if (memberErr) {
      setSaving(false)
      setMessage(memberErr.message)
      return
    }

    await queryClient.invalidateQueries({ queryKey: ['couple'] })
    await refetch()

    // Đặc tả mục 3: đổi ngày bắt đầu yêu thì phải báo người kia. Đây là con số
    // cảm xúc nhất trong app — đổi âm thầm sẽ gây hiểu lầm.
    if (startDateChanged) {
      const myName =
        couple.members.find((m) => m.user_id === user.id)?.nickname ?? 'Người ấy'
      void notifyPartner(couple, user.id, {
        title: 'Couple Space',
        body: `${myName} đã đổi ngày bắt đầu yêu`,
        path: '/settings',
      })
    }

    setDraftStartDate(null)
    setDraftNickname(null)
    setSaving(false)
    setMessage('Đã lưu.')
  }

  /** Ghi kèm múi giờ máy mỗi lần lưu — server cần nó để gửi nhắc đúng
   *  9 giờ sáng theo giờ người nhận, không phải 9 giờ UTC. */
  async function savePrefs(patch: Record<string, unknown>) {
    if (!user) return
    const { error } = await supabase.from('notification_prefs').upsert({
      user_id: user.id,
      time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      ...patch,
    })
    if (error) {
      setMessage(error.message)
      return
    }
    await prefsQuery.refetch()
  }

  /** Ảnh bìa dùng chung đường nén với ảnh kỉ niệm, và nằm cùng bucket —
   *  quy tắc phân quyền ở đó đã dựa trên thư mục đầu là `couple_id`. */
  async function pickCover(file: File | undefined) {
    if (!file || !couple) return
    setUploadingCover(true)
    setMessage('')
    try {
      const { blob, ext } = await compressImage(file)
      const path = `${couple.id}/cover/${crypto.randomUUID()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(path, blob, { contentType: blob.type, upsert: false })
      if (upErr) throw upErr

      // Lưu ĐƯỜNG DẪN, không lưu link đã ký. Link ký có hạn; cất nó vào DB là
      // hẹn giờ cho ảnh bìa tự biến mất. `useCouple` ký lại mỗi lần đọc.
      const { error } = await supabase
        .from('couples')
        .update({ cover_path: path, cover_url: null })
        .eq('id', couple.id)
      if (error) throw error

      await queryClient.invalidateQueries({ queryKey: ['couple'] })
      await refetch()
      setMessage('Đã đổi ảnh bìa.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Không tải được ảnh.')
    } finally {
      setUploadingCover(false)
    }
  }

  async function removeCover() {
    if (!couple) return
    await supabase
      .from('couples')
      .update({ cover_path: null, cover_url: null })
      .eq('id', couple.id)
    await queryClient.invalidateQueries({ queryKey: ['couple'] })
    await refetch()
    setMessage('Đã bỏ ảnh bìa.')
  }

  /** Màu nhấn là lựa chọn của RIÊNG người này — lưu ở `profiles`, không phải
   *  ở `couples`. Hai người gu khác nhau thì mỗi người một màu. */
  async function pickTheme(key: string) {
    if (!user) return
    const { error } = await supabase
      .from('profiles')
      .update({ color_theme: key })
      .eq('id', user.id)
    if (error) {
      setMessage(error.message)
      return
    }
    await queryClient.invalidateQueries({ queryKey: ['my_profile'] })
  }

  async function onEnablePush() {
    try {
      await enablePush()
      setMessage('Đã bật thông báo trên máy này.')
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : 'Không bật được thông báo.',
      )
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    queryClient.clear()
    navigate('/welcome', { replace: true })
  }

  return (
    <main className="min-h-app bg-bg pb-safe">
      <TopBar to="/" />
      <div className="mx-auto w-full max-w-[calc(28rem/var(--ui-scale))] px-4 pb-16">
        <h1 className="px-1 pt-1 pb-5 text-[23px] font-bold tracking-[-0.02em] text-text">
          Cài đặt
        </h1>

        <form onSubmit={saveProfile}>
          <SectionLabel>Không gian của chúng ta</SectionLabel>
          <Group>
            <Row className="flex items-center justify-between gap-3">
              <span className="text-[15px] text-text">Ngày bắt đầu yêu</span>
              <DateField
                max={todayYmd()}
                value={startDate}
                onChange={setDraftStartDate}
                className={`${rowInput} justify-end`}
              />
            </Row>
            <Row className="flex items-center justify-between gap-3">
              <span className="shrink-0 text-[15px] text-text">Gọi bạn là</span>
              <input
                maxLength={24}
                value={myNickname}
                onChange={(e) => setDraftNickname(e.target.value)}
                placeholder="Biệt danh"
                className={rowInput}
              />
            </Row>
            <Row className="flex items-center justify-between gap-3">
              <span className="shrink-0 text-[15px] text-text">Ảnh bìa</span>
              <span className="flex items-center gap-3">
                {couple?.cover_url ? (
                  <img
                    src={couple.cover_url}
                    alt=""
                    className="h-10 w-16 rounded-lg object-cover"
                  />
                ) : null}
                <button
                  type="button"
                  disabled={uploadingCover}
                  onClick={() => coverInput.current?.click()}
                  className="text-[14px] font-medium text-accent disabled:opacity-50"
                >
                  {uploadingCover
                    ? 'Đang tải...'
                    : couple?.cover_url
                      ? 'Đổi'
                      : 'Chọn ảnh'}
                </button>
                {couple?.cover_url ? (
                  <button
                    type="button"
                    onClick={() => void removeCover()}
                    className="text-[14px] text-muted"
                  >
                    Bỏ
                  </button>
                ) : null}
              </span>
              <input
                ref={coverInput}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  void pickCover(e.target.files?.[0])
                  e.target.value = ''
                }}
              />
            </Row>
          </Group>

          {dirty ? (
            <button
              type="submit"
              disabled={saving}
              className={`${btn.primary} mt-3`}
            >
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          ) : null}
        </form>

        <div className="mt-7">
          <SectionLabel>Giao diện</SectionLabel>
          <div className="mt-2 flex gap-1 rounded-2xl border border-border bg-surface p-1">
            {THEMES.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
                  theme === value
                    ? 'bg-accent text-on-accent'
                    : 'text-muted hover:text-text'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <p className="mt-4 px-1 text-[12.5px] text-muted">
            Màu nhấn của riêng bạn. Người kia chọn màu khác cũng được.
          </p>
          <div className="mt-2 flex gap-2">
            {COUPLE_THEMES.map((t) => {
              const active = (myTheme ?? 'rose') === t.key
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => void pickTheme(t.key)}
                  aria-label={t.label}
                  aria-pressed={active}
                  className={`grid h-11 flex-1 place-items-center rounded-xl border-2 transition ${
                    active ? 'border-accent' : 'border-transparent'
                  }`}
                  style={{ background: t.swatch }}
                >
                  {active ? (
                    <span aria-hidden className="text-[15px] text-white">
                      ✓
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-7">
          <SectionLabel>Thông báo</SectionLabel>
          <Group>
            {NOTIFY_TOGGLES.map(([key, label, fallback]) => (
              <Row
                key={key}
                className="flex items-center justify-between gap-3"
              >
                <span className="text-[15px] text-text">{label}</span>
                <Switch
                  label={label}
                  checked={
                    (prefsQuery.data?.[key] as boolean | undefined) ?? fallback
                  }
                  onChange={(next) => void savePrefs({ [key]: next })}
                />
              </Row>
            ))}

            <Row className="flex items-center justify-between gap-3">
              <span className="shrink-0 text-[15px] text-text">
                Giờ yên lặng
              </span>
              <span className="flex items-center gap-1.5">
                <TimeField
                  label="Bắt đầu giờ yên lặng"
                  value={prefsQuery.data?.quiet_hours_from ?? ''}
                  onChange={(next) =>
                    void savePrefs({ quiet_hours_from: next || null })
                  }
                  className={rowTimeInput}
                />
                <span className="text-muted">–</span>
                <TimeField
                  label="Kết thúc giờ yên lặng"
                  value={prefsQuery.data?.quiet_hours_to ?? ''}
                  onChange={(next) =>
                    void savePrefs({ quiet_hours_to: next || null })
                  }
                  className={rowTimeInput}
                />
              </span>
            </Row>

            <Row>
              <button
                type="button"
                onClick={() => void onEnablePush()}
                className="text-[15px] font-medium text-accent"
              >
                Bật thông báo trên máy này
              </button>
              {!isStandalonePwa() ? (
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                  Trên iPhone phải mở từ icon đã cài: Safari → Chia sẻ → Thêm vào
                  Màn hình chính.
                </p>
              ) : null}
            </Row>
          </Group>
          <p className="mt-2 px-1 text-[12.5px] leading-relaxed text-muted">
            Nhắc gửi lúc 9 giờ sáng theo giờ máy bạn. Rơi vào giờ yên lặng thì
            hoãn tới lúc hết, không bỏ.
          </p>
        </div>

        <div className="mt-7">
          <SectionLabel>Tài khoản</SectionLabel>
          <Group>
            <Row className="flex items-center justify-between gap-3">
              <span className="text-[15px] text-text">Email</span>
              <span className="truncate text-sm text-muted">{user?.email}</span>
            </Row>
            <Row>
              <button
                type="button"
                onClick={() => void signOut()}
                className="text-[15px] font-medium text-text"
              >
                Đăng xuất
              </button>
            </Row>
          </Group>
        </div>

        <div className="mt-10">
          <SectionLabel tone="danger">Vùng nguy hiểm</SectionLabel>
          <Link to="/settings/unpair" className={`${btn.danger} mt-2`}>
            Huỷ ghép đôi
          </Link>
        </div>
      </div>

      {message ? (
        <p
          role="status"
          className="pb-safe fixed inset-x-0 bottom-0 mx-auto max-w-[calc(28rem/var(--ui-scale))] px-4"
        >
          <span className="block rounded-2xl bg-text px-4 py-3 text-center text-sm text-bg shadow-lg">
            {message}
          </span>
        </p>
      ) : null}
    </main>
  )
}
