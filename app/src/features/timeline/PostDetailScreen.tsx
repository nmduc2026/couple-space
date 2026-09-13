import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCouple } from '../../hooks/useCouple'
import { useSession } from '../../hooks/useSession'
import { usePost } from '../../hooks/usePosts'
import { ACTIVITY_LABELS } from '../../lib/activities'
import { supabase } from '../../lib/supabase'
import { notifyPartner } from '../../lib/notify'
import { PREVIEW, previewComments } from '../../dev/preview'
import { ConfirmSheet, Loading, Screen, TopBar } from '../../components/ui'
import { btn, input } from '../../lib/ui-classes'
import { todayYmd } from '../../lib/dateCount'
import { formatCommentTime, formatDay } from '../../lib/formatDate'
import { formatVnd } from '../../lib/money'
import { DateField } from '../../components/DateField'

type Comment = {
  id: string
  author_id: string
  body: string
  created_at: string
}

export function PostDetailScreen() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useSession()
  const { couple } = useCouple()
  const { post, isLoading } = usePost(id)

  const [index, setIndex] = useState(0)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [editing, setEditing] = useState(false)
  const [edit, setEdit] = useState({ caption: '', place: '', day: '' })
  const [savingEdit, setSavingEdit] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<
    Array<{ id: string; amount_minor: number }> | null
  >(null)
  // Thả tim phản hồi lạc quan: `override` là ý muốn của người dùng,
  // null nghĩa là chưa bấm gì nên cứ tin dữ liệu server.
  const [override, setOverride] = useState<boolean | null>(null)
  const liked = override ?? post?.liked_by_me ?? false
  const likeCount =
    (post?.reaction_count ?? 0) +
    (override === null || override === post?.liked_by_me
      ? 0
      : override
        ? 1
        : -1)

  const commentsQuery = useQuery({
    queryKey: ['comments', id],
    enabled: !!id && !PREVIEW,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('id, author_id, body, created_at')
        .eq('post_id', id)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as Comment[]
    },
  })

  const comments = PREVIEW ? previewComments() : (commentsQuery.data ?? [])

  // Bình luận của người kia hiện ngay, không phải tải lại
  useEffect(() => {
    if (!id || PREVIEW) return
    const channel = supabase
      .channel(`post-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${id}`,
        },
        () => void queryClient.invalidateQueries({ queryKey: ['comments', id] }),
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [id, queryClient])

  if (isLoading) return <Loading />
  if (!post) {
    return (
      <Screen>
        <TopBar to="/timeline" />
        <p className="px-5 py-20 text-center text-sm text-muted">
          Không tìm thấy kỉ niệm này.
        </p>
      </Screen>
    )
  }

  const nameOf = (userId: string) =>
    couple?.members.find((m) => m.user_id === userId)?.nickname ?? '?'
  const activity = post.activity ? ACTIVITY_LABELS[post.activity] : undefined
  const mine = post.author_id === user?.id

  /** Thả tim phản hồi lạc quan: đổi giao diện trước, gọi server sau. */
  async function toggleLike() {
    if (!post || !user || PREVIEW) return
    const next = !liked
    setOverride(next)

    if (next) {
      const { error } = await supabase.from('reactions').insert({
        post_id: post.id,
        couple_id: post.couple_id,
        user_id: user.id,
      })
      if (error) {
        setOverride(null)
        return
      }
      void notifyPartner(couple, user.id, {
        title: 'Couple Space',
        body: `${nameOf(user.id)} đã thả tim một kỉ niệm`,
        path: `/timeline/${post.id}`,
      })
    } else {
      await supabase
        .from('reactions')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', user.id)
    }

    // Số tim và `liked_by_me` nằm trong truy vấn ['posts'], không phải ở đây.
    // Không làm mới nó thì Timeline vẫn hiện số cũ, VÀ lần thả tim sau đọc
    // phải `liked_by_me` cũ nên lại INSERT — đụng khoá duy nhất rồi tự huỷ,
    // thành ra "thả tim lần hai không được".
    await queryClient.invalidateQueries({ queryKey: ['posts'] })
    await queryClient.invalidateQueries({ queryKey: ['post', post.id] })
  }

  async function sendComment(event: FormEvent) {
    event.preventDefault()
    const body = draft.trim()
    if (!body || !post || !user || PREVIEW) return
    setSending(true)
    const { error } = await supabase.from('comments').insert({
      post_id: post.id,
      couple_id: post.couple_id,
      author_id: user.id,
      body,
    })
    setSending(false)
    if (error) return
    setDraft('')
    await queryClient.invalidateQueries({ queryKey: ['comments', post.id] })
    // `comment_count` nằm trong ['posts'] (danh sách) lẫn ['post', id] (bài này)
    await queryClient.invalidateQueries({ queryKey: ['posts'] })
    await queryClient.invalidateQueries({ queryKey: ['post', post.id] })
    void notifyPartner(couple, user.id, {
      title: nameOf(user.id),
      body,
      path: `/timeline/${post.id}`,
    })
  }

  /** Sửa phần chữ của bài. Ảnh thì không sửa được ở đây — đổi ảnh là một
   *  bài khác, và giữ nguyên tim với bình luận cũ thì sai. */
  function startEdit() {
    if (!post) return
    setEdit({
      caption: post.caption ?? '',
      place: post.place_name ?? '',
      day: post.happened_on,
    })
    setEditing(true)
  }

  async function saveEdit() {
    if (!post || PREVIEW) return
    setSavingEdit(true)
    const { error } = await supabase
      .from('posts')
      .update({
        caption: edit.caption.trim() || null,
        place_name: edit.place.trim() || null,
        happened_on: edit.day,
        // Đổi địa điểm thì tỉnh cũ không còn đúng — để bản đồ suy lại
        province_code: null,
      })
      .eq('id', post.id)
    setSavingEdit(false)
    if (error) return
    setEditing(false)
    await queryClient.invalidateQueries({ queryKey: ['posts'] })
    await queryClient.invalidateQueries({ queryKey: ['post', post.id] })
  }

  /** Bài này có khoản chi gắn kèm không — hỏi trước khi xoá thì mới biết
   *  có phải hỏi tiếp về khoản chi hay không. */
  async function linkedExpenses() {
    if (!id || PREVIEW) return []
    const { data } = await supabase
      .from('expenses')
      .select('id, amount_minor')
      .eq('post_id', id)
      .is('deleted_at', null)
    return data ?? []
  }

  async function askRemovePost() {
    if (!post || PREVIEW) return
    const linked = await linkedExpenses()
    if (linked.length === 0) {
      if (!window.confirm('Xoá kỉ niệm này?')) return
      await doRemovePost(false)
      return
    }
    setPendingDelete(linked)
  }

  /** Khoản chi là dữ liệu thống kê độc lập với bài — xoá bài không được
   *  âm thầm làm hụt tổng chi của tháng. Vì vậy mặc định là GIỮ. */
  async function doRemovePost(alsoRemoveExpenses: boolean) {
    if (!post) return
    const stamp = new Date().toISOString()
    await supabase
      .from('posts')
      .update({ deleted_at: stamp })
      .eq('id', post.id)

    if (alsoRemoveExpenses) {
      await supabase
        .from('expenses')
        .update({ deleted_at: stamp })
        .eq('post_id', post.id)
        .is('deleted_at', null)
    } else {
      // Giữ khoản chi nhưng cắt liên kết, nếu không nó trỏ tới bài đã xoá
      await supabase
        .from('expenses')
        .update({ post_id: null })
        .eq('post_id', post.id)
        .is('deleted_at', null)
    }

    await queryClient.invalidateQueries({ queryKey: ['posts'] })
    await queryClient.invalidateQueries({ queryKey: ['expenses'] })
    await queryClient.invalidateQueries({ queryKey: ['expense_summary'] })
    navigate('/timeline', { replace: true })
  }

  const media = post.media
  const current = media[Math.min(index, media.length - 1)]

  return (
    <main className="flex min-h-app flex-col bg-bg pb-safe">
      <TopBar to="/timeline" />

      {current ? (
        <div className="relative aspect-square w-full bg-soft">
          <img
            src={current.url}
            alt=""
            className="h-full w-full object-cover"
          />
          {media.length > 1 ? (
            <>
              <button
                type="button"
                aria-label="Ảnh trước"
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                className="absolute inset-y-0 left-0 w-1/4"
              />
              <button
                type="button"
                aria-label="Ảnh sau"
                onClick={() =>
                  setIndex((i) => Math.min(media.length - 1, i + 1))
                }
                className="absolute inset-y-0 right-0 w-1/4"
              />
              <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
                {media.map((m, i) => (
                  <span
                    key={m.id}
                    className={`h-1.5 rounded-full transition-all ${
                      i === index ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      <div className="px-4 pt-4">
        {editing ? (
          <div className="space-y-2.5">
            <textarea
              value={edit.caption}
              onChange={(e) => setEdit({ ...edit, caption: e.target.value })}
              rows={3}
              placeholder="Viết chú thích..."
              className={`${input} h-auto py-3 leading-relaxed`}
            />
            <input
              value={edit.place}
              onChange={(e) => setEdit({ ...edit, place: e.target.value })}
              placeholder="Địa điểm"
              className={input}
            />
            <DateField
              value={edit.day}
              max={todayYmd()}
              onChange={(next) => setEdit({ ...edit, day: next })}
              className={`${input} flex items-center`}
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={savingEdit}
                onClick={() => void saveEdit()}
                className={btn.primary}
              >
                {savingEdit ? 'Đang lưu...' : 'Lưu'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className={btn.ghost}
              >
                Huỷ
              </button>
            </div>
          </div>
        ) : null}

        {!editing && post.caption ? (
          <p className="text-[15px] leading-relaxed text-text">{post.caption}</p>
        ) : null}
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted" hidden={editing}>
          <span>{formatDay(post.happened_on)}</span>
          {post.place_name ? <span>📍 {post.place_name}</span> : null}
          {activity ? (
            <span>
              {activity.emoji} {activity.label}
            </span>
          ) : null}
          <span>· {nameOf(post.author_id)} đăng</span>
        </div>

        <div className="mt-4 flex items-center gap-4 border-y border-border py-2.5">
          <button
            type="button"
            onClick={() => void toggleLike()}
            className={`text-sm ${liked ? 'text-accent' : 'text-muted'}`}
          >
            {liked ? '❤️' : '🤍'} {likeCount}
          </button>
          <span className="text-sm text-muted">💬 {comments.length}</span>
          {mine ? (
            <>
              <button
                type="button"
                onClick={startEdit}
                className="ml-auto text-sm text-muted"
              >
                Sửa
              </button>
              <button
                type="button"
                onClick={() => void askRemovePost()}
                className="text-sm text-muted"
              >
                Xoá
              </button>
            </>
          ) : null}
        </div>

        <div className="pb-4">
          {comments.map((c) => (
            <div
              key={c.id}
              className="flex items-start gap-2.5 border-b border-border py-3"
            >
              <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-soft text-xs font-bold text-accent">
                {nameOf(c.author_id).slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0">
                <span className="flex items-baseline gap-2">
                  <b className="text-[13px] text-text">{nameOf(c.author_id)}</b>
                  <span className="text-[11.5px] text-muted">
                    {formatCommentTime(c.created_at)}
                  </span>
                </span>
                <p className="text-[14px] leading-relaxed text-text">{c.body}</p>
              </div>
            </div>
          ))}
          {comments.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">
              Chưa có bình luận nào.
            </p>
          ) : null}
        </div>
      </div>

      <form
        onSubmit={sendComment}
        className="pb-safe sticky bottom-0 mt-auto flex gap-2 border-t border-border bg-bg/95 px-4 pt-2.5 backdrop-blur"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Viết bình luận..."
          className={`${input} flex-1`}
        />
        <button
          type="submit"
          disabled={!draft.trim() || sending}
          className="h-12 shrink-0 rounded-xl bg-accent px-4 text-sm font-semibold text-on-accent disabled:opacity-40"
        >
          Gửi
        </button>
      </form>

      {pendingDelete ? (
        <ConfirmSheet
          title="Xoá kỉ niệm này?"
          body={
            <>
              Bài này có{' '}
              <b className="font-semibold text-text">
                {pendingDelete.length} khoản chi
              </b>{' '}
              gắn kèm, tổng{' '}
              <b className="font-semibold text-text">
                {formatVnd(
                  pendingDelete.reduce((sum, e) => sum + e.amount_minor, 0),
                )}
              </b>
              . Giữ lại thì thống kê tháng vẫn đúng, chỉ mất ảnh.
            </>
          }
          confirmLabel="Xoá bài, giữ khoản chi"
          cancelLabel="Thôi, không xoá"
          onConfirm={() => {
            setPendingDelete(null)
            void doRemovePost(false)
          }}
          onCancel={() => setPendingDelete(null)}
        >
          <button
            type="button"
            onClick={() => {
              setPendingDelete(null)
              void doRemovePost(true)
            }}
            className="mt-4 w-full text-[13px] font-medium text-muted underline underline-offset-4"
          >
            Xoá cả khoản chi
          </button>
        </ConfirmSheet>
      ) : null}
    </main>
  )
}
