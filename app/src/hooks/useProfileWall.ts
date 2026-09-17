import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { MEDIA_BUCKET } from './usePosts'
import { PREVIEW } from '../dev/preview'
import { useCouple } from './useCouple'

export type MemberProfile = {
  id: string
  display_name: string | null
  avatar_url: string | null
  nickname: string
}

function looksLikeHttp(value: string) {
  return /^https?:\/\//i.test(value)
}

async function signAvatar(raw: string | null): Promise<string | null> {
  if (!raw) return null
  if (looksLikeHttp(raw)) return raw
  const { data } = await supabase.storage
    .from(MEDIA_BUCKET)
    .createSignedUrl(raw, 60 * 60 * 12)
  return data?.signedUrl ?? null
}

/** Hồ sơ một thành viên trong space (mình hoặc người kia). */
export function useMemberProfile(userId: string | null | undefined) {
  const { couple } = useCouple()

  return useQuery({
    queryKey: ['member_profile', couple?.id, userId],
    enabled: !!couple?.id && !!userId && !PREVIEW,
    queryFn: async (): Promise<MemberProfile | null> => {
      const member = couple!.members.find((m) => m.user_id === userId)
      if (!member) return null

      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .eq('id', userId!)
        .maybeSingle()
      if (error) throw error

      return {
        id: userId!,
        display_name: data?.display_name ?? null,
        avatar_url: await signAvatar(data?.avatar_url ?? null),
        nickname:
          member.nickname?.trim() ||
          data?.display_name?.trim() ||
          '…',
      }
    },
  })
}

export type ProfileStatus = {
  id: string
  author_id: string
  body: string
  created_at: string
}

export function useProfileStatuses(authorId: string | null | undefined) {
  const { couple } = useCouple()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['profile_statuses', couple?.id, authorId],
    enabled: !!couple?.id && !!authorId && !PREVIEW,
    queryFn: async (): Promise<ProfileStatus[]> => {
      const { data, error } = await supabase
        .from('profile_statuses')
        .select('id, author_id, body, created_at')
        .eq('couple_id', couple!.id)
        .eq('author_id', authorId!)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return (data ?? []) as ProfileStatus[]
    },
  })

  async function createStatus(body: string) {
    if (!couple?.id || !authorId || PREVIEW) return
    const text = body.trim()
    if (!text) return
    const { error } = await supabase.from('profile_statuses').insert({
      couple_id: couple.id,
      author_id: authorId,
      body: text,
    })
    if (error) throw error
    await queryClient.invalidateQueries({
      queryKey: ['profile_statuses', couple.id, authorId],
    })
  }

  async function deleteStatus(id: string) {
    if (!couple?.id || !authorId || PREVIEW) return
    const { error } = await supabase
      .from('profile_statuses')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('author_id', authorId)
    if (error) throw error
    await queryClient.invalidateQueries({
      queryKey: ['profile_statuses', couple.id, authorId],
    })
  }

  return {
    statuses: query.data ?? [],
    isLoading: query.isLoading,
    createStatus,
    deleteStatus,
  }
}

export type PartnerNote = {
  id: string
  author_id: string
  about_user_id: string
  body: string
  updated_at: string
}

/** Ghi chú của `authorId` viết về `aboutUserId`. */
export function usePartnerNote(
  authorId: string | null | undefined,
  aboutUserId: string | null | undefined,
) {
  const { couple } = useCouple()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['partner_note', couple?.id, authorId, aboutUserId],
    enabled:
      !!couple?.id && !!authorId && !!aboutUserId && authorId !== aboutUserId && !PREVIEW,
    queryFn: async (): Promise<PartnerNote | null> => {
      const { data, error } = await supabase
        .from('partner_notes')
        .select('id, author_id, about_user_id, body, updated_at')
        .eq('couple_id', couple!.id)
        .eq('author_id', authorId!)
        .eq('about_user_id', aboutUserId!)
        .maybeSingle()
      if (error) throw error
      return (data as PartnerNote | null) ?? null
    },
  })

  async function saveNote(body: string) {
    if (!couple?.id || !authorId || !aboutUserId || PREVIEW) return
    const { error } = await supabase.from('partner_notes').upsert(
      {
        couple_id: couple.id,
        author_id: authorId,
        about_user_id: aboutUserId,
        body: body.trim(),
      },
      { onConflict: 'couple_id,author_id,about_user_id' },
    )
    if (error) throw error
    await queryClient.invalidateQueries({
      queryKey: ['partner_note', couple.id, authorId, aboutUserId],
    })
  }

  return {
    note: query.data ?? null,
    isLoading: query.isLoading,
    saveNote,
  }
}
