import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { TopHeader } from '../../components/AppShell'
import { useCouple } from '../../hooks/useCouple'
import { useMyProfile } from '../../hooks/useMyProfile'
import { useSession } from '../../hooks/useSession'
import { coverGradient } from '../../lib/coupleTheme'
import { compressImage } from '../../lib/image'
import { MEDIA_BUCKET } from '../../hooks/usePosts'
import { supabase } from '../../lib/supabase'
import { PREVIEW } from '../../dev/preview'
import { btn } from '../../lib/ui-classes'
import { IconSettings } from '../../components/icons'

function initialOf(name: string) {
  const t = name.trim()
  return t ? t.charAt(0).toUpperCase() : '?'
}

export function ProfileScreen() {
  const queryClient = useQueryClient()
  const { user } = useSession()
  const { couple } = useCouple()
  const { profile, isLoading } = useMyProfile()
  const myTheme = profile?.color_theme ?? couple?.theme
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const me = couple?.members.find((m) => m.user_id === user?.id)
  const nickname = me?.nickname?.trim() || profile?.display_name?.trim() || 'Bạn'

  async function pickAvatar(file: File | undefined) {
    if (!file || !user || !couple || PREVIEW) return
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
      toast.success('Đã đổi ảnh đại diện.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không tải được ảnh.')
    } finally {
      setUploading(false)
    }
  }

  async function removeAvatar() {
    if (!user || PREVIEW) return
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', user.id)
    if (error) {
      toast.error(error.message)
      return
    }
    await queryClient.invalidateQueries({ queryKey: ['my_profile'] })
    toast.success('Đã bỏ ảnh đại diện.')
  }

  return (
    <>
      <TopHeader
        title="Trang cá nhân"
        back="/"
        right={
          <Link
            to="/settings"
            aria-label="Cài đặt"
            className="grid h-9 w-9 place-items-center rounded-full text-muted transition active:bg-soft"
          >
            <IconSettings size={18} />
          </Link>
        }
      />

      <div className="flex-1 overflow-y-auto pb-8">
        <div
          className="relative h-40 w-full bg-soft sm:h-48"
          style={
            couple?.cover_url
              ? {
                  backgroundImage: `linear-gradient(to bottom, rgba(28,20,25,.12), rgba(28,20,25,.45)), url(${couple.cover_url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : { backgroundImage: coverGradient(myTheme) }
          }
        />

        <div className="relative mx-auto max-w-[calc(28rem/var(--ui-scale))] px-4">
          {/* Avatar chồng cover — chạm để đổi, không nhãn “Sửa” */}
          <button
            type="button"
            disabled={uploading || isLoading}
            onClick={() => fileRef.current?.click()}
            aria-label="Đổi ảnh đại diện"
            className="-mt-12 block h-24 w-24 overflow-hidden rounded-full border-[3px] border-bg bg-soft shadow-sm transition active:scale-[0.98] disabled:opacity-60"
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="grid h-full w-full place-items-center text-[32px] font-semibold text-muted">
                {initialOf(nickname)}
              </span>
            )}
          </button>

          <h1 className="mt-3 text-[20px] font-semibold tracking-tight text-text">
            {nickname}
          </h1>

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

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className={`${btn.outline} flex-1`}
            >
              {uploading ? 'Đang tải…' : 'Đổi ảnh'}
            </button>
            {profile?.avatar_url ? (
              <button
                type="button"
                disabled={uploading}
                onClick={() => void removeAvatar()}
                className={`${btn.outline} flex-1`}
              >
                Bỏ ảnh
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </>
  )
}
