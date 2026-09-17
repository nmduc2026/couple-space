import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { TopHeader } from '../../components/AppShell'
import { Modal } from '../../components/Modal'
import { InlineLoading } from '../../components/EmptyState'
import { useCouple } from '../../hooks/useCouple'
import { useMyProfile } from '../../hooks/useMyProfile'
import { useSession } from '../../hooks/useSession'
import {
  useMemberProfile,
  usePartnerNote,
  useProfileStatuses,
} from '../../hooks/useProfileWall'
import { coverGradient } from '../../lib/coupleTheme'
import { compressImage } from '../../lib/image'
import { formatCommentTime } from '../../lib/formatDate'
import { MEDIA_BUCKET } from '../../hooks/usePosts'
import { supabase } from '../../lib/supabase'
import { PREVIEW } from '../../dev/preview'
import { btn, input } from '../../lib/ui-classes'
import { IconSettings } from '../../components/icons'

function initialOf(name: string) {
  const t = name.trim()
  return t ? t.charAt(0).toUpperCase() : '?'
}

export function ProfileScreen() {
  const { userId: paramId } = useParams()
  const queryClient = useQueryClient()
  const { user } = useSession()
  const { couple } = useCouple()
  const { profile: myProfile } = useMyProfile()

  const isOwn = !paramId || paramId === user?.id
  const profileUserId = isOwn ? user?.id : paramId

  const { data: member, isLoading: loadingMember } =
    useMemberProfile(profileUserId)
  const {
    statuses,
    isLoading: loadingStatuses,
    createStatus,
    deleteStatus,
  } = useProfileStatuses(profileUserId)

  // Trên trang đối phương: mình viết về họ. Trên trang mình: đọc note họ viết về mình.
  const partnerId =
    couple?.members.find((m) => m.user_id !== user?.id)?.user_id ?? null
  const editableNote = usePartnerNote(
    isOwn ? null : user?.id,
    isOwn ? null : profileUserId,
  )
  const readableNote = usePartnerNote(
    isOwn ? partnerId : null,
    isOwn ? user?.id : null,
  )

  const myTheme = myProfile?.color_theme ?? couple?.theme
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [avatarMenu, setAvatarMenu] = useState(false)
  const [viewAvatar, setViewAvatar] = useState(false)
  const [composing, setComposing] = useState(false)
  const [draft, setDraft] = useState('')
  const [posting, setPosting] = useState(false)
  const [editingNote, setEditingNote] = useState(false)
  const [noteDraft, setNoteDraft] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  const nickname = member?.nickname ?? '…'
  const avatarUrl = member?.avatar_url ?? null
  const partner = couple?.members.find((m) => m.user_id !== user?.id)

  async function pickAvatar(file: File | undefined) {
    if (!file || !user || !couple || !isOwn || PREVIEW) return
    setUploading(true)
    try {
      const { blob, ext } = await compressImage(file)
      const path = `${couple.id}/avatars/${user.id}.${ext}`
      const { error: upErr } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(path, blob, { contentType: blob.type, upsert: true })
      if (upErr) throw upErr

      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: path })
        .eq('id', user.id)
      if (error) throw error

      await queryClient.invalidateQueries({ queryKey: ['my_profile'] })
      await queryClient.invalidateQueries({
        queryKey: ['member_profile', couple.id, user.id],
      })
      toast.success('Đã đổi ảnh đại diện.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không tải được ảnh.')
    } finally {
      setUploading(false)
    }
  }

  async function submitStatus() {
    if (!draft.trim() || posting) return
    setPosting(true)
    try {
      await createStatus(draft)
      setDraft('')
      setComposing(false)
      toast.success('Đã đăng.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không đăng được.')
    } finally {
      setPosting(false)
    }
  }

  async function submitNote() {
    setSavingNote(true)
    try {
      await editableNote.saveNote(noteDraft)
      setEditingNote(false)
      toast.success('Đã lưu nhận xét.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không lưu được.')
    } finally {
      setSavingNote(false)
    }
  }

  if (!couple || !user) return <InlineLoading />
  if (loadingMember) return <InlineLoading />
  if (!member) {
    return (
      <>
        <TopHeader title="Trang cá nhân" back="/" />
        <p className="px-4 py-8 text-center text-muted">
          Không tìm thấy người này trong space.
        </p>
      </>
    )
  }

  const shownNote = isOwn ? readableNote.note : editableNote.note

  return (
    <>
      <TopHeader
        title={isOwn ? 'Trang cá nhân' : nickname}
        back="/"
        right={
          isOwn ? (
            <Link
              to="/settings"
              aria-label="Cài đặt"
              className="grid h-9 w-9 place-items-center rounded-full text-muted transition active:bg-soft"
            >
              <IconSettings size={18} />
            </Link>
          ) : null
        }
      />

      <div className="flex-1 overflow-y-auto pb-8">
        <div
          className="relative h-40 w-full bg-soft sm:h-48"
          style={
            couple.cover_url
              ? {
                  backgroundImage: `linear-gradient(to bottom, rgba(28,20,25,.12), rgba(28,20,25,.45)), url(${couple.cover_url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : { backgroundImage: coverGradient(myTheme) }
          }
        />

        <div className="relative mx-auto max-w-[calc(28rem/var(--ui-scale))] px-4">
          {/* Avatar chồng cover ít hơn → phần lớn nằm nền trắng; tên căn giữa cạnh avatar. */}
          <div className="-mt-8 flex items-center gap-4">
            <button
              type="button"
              disabled={uploading}
              onClick={() => {
                if (isOwn) setAvatarMenu(true)
                else if (avatarUrl) setViewAvatar(true)
              }}
              aria-label={isOwn ? 'Ảnh đại diện' : `Ảnh của ${nickname}`}
              className="relative z-[1] h-24 w-24 shrink-0 overflow-hidden rounded-full border-[3px] border-bg bg-soft shadow-sm transition active:scale-[0.98] disabled:opacity-60"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="grid h-full w-full place-items-center text-[32px] font-semibold text-muted">
                  {initialOf(nickname)}
                </span>
              )}
            </button>
            <h1 className="min-w-0 flex-1 truncate pt-6 text-[22px] font-semibold leading-tight tracking-tight text-text">
              {nickname}
            </h1>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              void pickAvatar(f)
            }}
          />

          {/* Nhận xét */}
          <section className="mt-5 rounded-xl border border-border bg-surface p-3.5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[14px] font-semibold text-text">
                {isOwn
                  ? `Nhận xét từ ${partner?.nickname?.trim() || 'người ấy'}`
                  : `Nhận xét về ${nickname}`}
              </h2>
              {!isOwn ? (
                <button
                  type="button"
                  className="text-[13px] font-medium text-accent"
                  onClick={() => {
                    setNoteDraft(editableNote.note?.body ?? '')
                    setEditingNote(true)
                  }}
                >
                  {editableNote.note?.body?.trim() ? 'Sửa' : 'Viết'}
                </button>
              ) : null}
            </div>

            {editingNote && !isOwn ? (
              <div className="mt-3 space-y-2">
                <textarea
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  rows={5}
                  maxLength={8000}
                  placeholder={`Viết vài điều về ${nickname}…`}
                  className={`${input} h-auto py-3 leading-relaxed`}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={savingNote}
                    onClick={() => void submitNote()}
                    className={`${btn.primary} flex-1`}
                  >
                    {savingNote ? 'Đang lưu…' : 'Lưu'}
                  </button>
                  <button
                    type="button"
                    disabled={savingNote}
                    onClick={() => setEditingNote(false)}
                    className={`${btn.outline} flex-1`}
                  >
                    Huỷ
                  </button>
                </div>
              </div>
            ) : shownNote?.body?.trim() ? (
              <p className="mt-2 whitespace-pre-wrap text-[14px] leading-relaxed text-text">
                {shownNote.body}
              </p>
            ) : (
              <p className="mt-2 text-[13px] text-muted">
                {isOwn
                  ? 'Chưa có nhận xét nào về bạn.'
                  : 'Chưa viết nhận xét. Nhấn Viết để bắt đầu.'}
              </p>
            )}
          </section>

          {/* Bạn đang nghĩ gì — chỉ trang mình */}
          {isOwn ? (
            <section className="mt-3 rounded-xl border border-border bg-surface p-3">
              <div className="flex items-center gap-2.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-soft text-[14px] font-semibold text-muted">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initialOf(nickname)
                  )}
                </span>
                {composing ? (
                  <div className="min-w-0 flex-1 space-y-2">
                    <textarea
                      autoFocus
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      rows={3}
                      maxLength={2000}
                      placeholder="Bạn đang nghĩ gì?"
                      className={`${input} h-auto py-2.5 leading-relaxed`}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={posting || !draft.trim()}
                        onClick={() => void submitStatus()}
                        className={`${btn.primary} flex-1 !h-10 text-[14px]`}
                      >
                        {posting ? 'Đang đăng…' : 'Đăng'}
                      </button>
                      <button
                        type="button"
                        disabled={posting}
                        onClick={() => {
                          setComposing(false)
                          setDraft('')
                        }}
                        className={`${btn.outline} flex-1 !h-10 text-[14px]`}
                      >
                        Huỷ
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setComposing(true)}
                    className="flex h-10 min-w-0 flex-1 items-center rounded-full bg-soft px-4 text-left text-[14px] text-muted transition active:bg-border/40"
                  >
                    Bạn đang nghĩ gì?
                  </button>
                )}
              </div>
            </section>
          ) : null}

          {/* Feed status của người đang xem */}
          <section className="mt-4">
            <h2 className="text-[14px] font-semibold text-muted">
              {isOwn ? 'Bài của bạn' : `Bài của ${nickname}`}
            </h2>
            {loadingStatuses ? (
              <InlineLoading />
            ) : statuses.length === 0 ? (
              <p className="mt-3 text-[13px] text-muted">Chưa có bài nào.</p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {statuses.map((s) => (
                  <li
                    key={s.id}
                    className="rounded-xl border border-border bg-surface px-3.5 py-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[12.5px] text-muted">
                        {formatCommentTime(s.created_at)}
                      </p>
                      {isOwn ? (
                        <button
                          type="button"
                          className="text-[12px] text-muted"
                          onClick={() => {
                            void deleteStatus(s.id).catch((err) =>
                              toast.error(
                                err instanceof Error
                                  ? err.message
                                  : 'Không xoá được.',
                              ),
                            )
                          }}
                        >
                          Xoá
                        </button>
                      ) : null}
                    </div>
                    <p className="mt-1.5 whitespace-pre-wrap text-[14.5px] leading-relaxed text-text">
                      {s.body}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {avatarMenu ? (
        <Modal onClose={() => setAvatarMenu(false)} ariaLabel="Ảnh đại diện">
          <p className="text-[16px] font-semibold text-text">Ảnh đại diện</p>
          <div className="mt-3 space-y-1">
            {avatarUrl ? (
              <button
                type="button"
                className="flex w-full rounded-xl px-3 py-3 text-left text-[15px] text-text hover:bg-soft"
                onClick={() => {
                  setAvatarMenu(false)
                  setViewAvatar(true)
                }}
              >
                Xem ảnh đại diện
              </button>
            ) : null}
            <button
              type="button"
              className="flex w-full rounded-xl px-3 py-3 text-left text-[15px] text-text hover:bg-soft"
              onClick={() => {
                setAvatarMenu(false)
                fileRef.current?.click()
              }}
            >
              Đổi ảnh đại diện
            </button>
            <button
              type="button"
              className="flex w-full rounded-xl px-3 py-3 text-left text-[15px] text-muted hover:bg-soft"
              onClick={() => setAvatarMenu(false)}
            >
              Huỷ
            </button>
          </div>
        </Modal>
      ) : null}

      {viewAvatar && avatarUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Xem ảnh đại diện"
          onClick={() => setViewAvatar(false)}
        >
          <img
            src={avatarUrl}
            alt=""
            className="max-h-[80svh] max-w-full rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </>
  )
}
