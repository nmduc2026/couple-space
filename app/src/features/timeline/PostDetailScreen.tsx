import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
} from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCouple } from '../../hooks/useCouple'
import { useSession } from '../../hooks/useSession'
import { usePost } from '../../hooks/usePosts'
import { ACTIVITY_LABELS } from '../../lib/activities'
import { supabase } from '../../lib/supabase'
import { notifyPartner } from '../../lib/notify'
import { PREVIEW, previewComments } from '../../dev/preview'
import {
  ConfirmSheet,
  Field,
  Loading,
  Screen,
  Spacer,
  Stage,
  Title,
} from '../../components/ui'
import { PhotoCarousel } from '../../components/PhotoCarousel'
import { AmountInput } from '../../components/AmountInput'
import { DateField } from '../../components/DateField'
import { SegmentedControl } from '../../components/SegmentedControl'
import { IconArrowLeft } from '../../components/icons'
import { btn, input, inputChrome } from '../../lib/ui-classes'
import { todayYmd } from '../../lib/dateCount'
import { formatCommentTime, formatDay, formatPostTime } from '../../lib/formatDate'
import { useKeyboardShell } from '../../hooks/useKeyboardShell'
import {
  categoryFromActivity,
  formatAmountInput,
  formatVnd,
  parseAmountInput,
} from '../../lib/money'

function expenseSaveError(message: string) {
  if (/paid_by/i.test(message) && /null|not-null|not null/i.test(message)) {
    return 'Quỹ chung chưa bật trên database. Chạy migration expense_shared_payer trên Supabase rồi thử lại.'
  }
  return message
}

type Comment = {
  id: string
  author_id: string
  body: string
  created_at: string
}

type LinkedExpense = {
  id: string
  amount_minor: number
  paid_by: string | null
}

type EditDraft = {
  caption: string
  place: string
  day: string
  activity: string | null
  addExpense: boolean
  amount: string
  paidBy: string
  expenseId: string | null
}

export function PostDetailScreen() {
  const { id = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useSession()
  const { couple } = useCouple()
  const { post, isLoading } = usePost(id)

  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [edit, setEdit] = useState<EditDraft | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [editError, setEditError] = useState('')
  const [pendingDelete, setPendingDelete] = useState(false)
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
  const openEditFromUrl = searchParams.get('edit') === '1'
  const editBootstrapped = useRef(false)
  const detailReady = !!post && !editing && !isLoading
  const { shellRef, scrollerRef, keyboardOpen } = useKeyboardShell(detailReady)
  const commentInputRef = useRef<HTMLInputElement>(null)

  /** iOS: focus mặc định sẽ scroll cả trang (giật lên rồi bị kéo xuống).
   *  Chặn gesture rồi focus với preventScroll. */
  /** iOS: focus mặc định sẽ scroll cả trang (giật lên rồi bị kéo xuống).
   *  Chặn gesture rồi focus với preventScroll — chỉ khi chưa focus. */
  function focusCommentWithoutScroll(e: ReactTouchEvent | ReactMouseEvent) {
    if (document.activeElement === commentInputRef.current) return
    e.preventDefault()
    commentInputRef.current?.focus({ preventScroll: true })
  }

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

  const expenseQuery = useQuery({
    queryKey: ['post_expense', id],
    enabled: !!id && !PREVIEW,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('id, amount_minor, paid_by')
        .eq('post_id', id)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return (data as LinkedExpense | null) ?? null
    },
  })

  const comments = PREVIEW ? previewComments() : (commentsQuery.data ?? [])
  const linkedExpense = expenseQuery.data ?? null

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

  // Timeline bấm "Cập nhật" → vào đây với ?edit=1, mở form luôn.
  useEffect(() => {
    editBootstrapped.current = false
  }, [id])

  useEffect(() => {
    if (!openEditFromUrl || !post || !user || editBootstrapped.current) return
    if (!PREVIEW && expenseQuery.isLoading) return

    editBootstrapped.current = true
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('edit')
        return next
      },
      { replace: true },
    )

    if (post.author_id !== user.id) return

    const exp = linkedExpense
    setEditError('')
    setEdit({
      caption: post.caption ?? '',
      place: post.place_name ?? '',
      day: post.happened_on,
      activity: post.activity,
      addExpense: !!exp,
      amount: exp ? formatAmountInput(String(exp.amount_minor)) : '',
      paidBy: exp ? (exp.paid_by == null ? 'shared' : exp.paid_by) : user.id,
      expenseId: exp?.id ?? null,
    })
    setEditing(true)
  }, [
    openEditFromUrl,
    post,
    user,
    linkedExpense,
    expenseQuery.isLoading,
    setSearchParams,
  ])

  if (isLoading) return <Loading />
  if (!post) {
    return (
      <Screen>
        <DetailChrome to="/timeline" />
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
    await queryClient.invalidateQueries({ queryKey: ['posts'] })
    await queryClient.invalidateQueries({ queryKey: ['post', post.id] })
    void notifyPartner(couple, user.id, {
      title: nameOf(user.id),
      body,
      path: `/timeline/${post.id}`,
    })
  }

  /** Form cập nhật giống thêm mới — ảnh giữ nguyên (đổi ảnh = bài khác). */
  async function startEdit() {
    if (!post || !user) return
    setMenuOpen(false)
    setEditError('')

    let exp = linkedExpense
    if (!PREVIEW) {
      const { data } = await supabase
        .from('expenses')
        .select('id, amount_minor, paid_by')
        .eq('post_id', post.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()
      exp = (data as LinkedExpense | null) ?? null
    }

    setEdit({
      caption: post.caption ?? '',
      place: post.place_name ?? '',
      day: post.happened_on,
      activity: post.activity,
      addExpense: !!exp,
      amount: exp ? formatAmountInput(String(exp.amount_minor)) : '',
      paidBy: exp
        ? exp.paid_by == null
          ? 'shared'
          : exp.paid_by
        : user.id,
      expenseId: exp?.id ?? null,
    })
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    setEdit(null)
    setEditError('')
  }

  async function saveEdit(event: FormEvent) {
    event.preventDefault()
    if (!post || !user || !edit || PREVIEW) return
    setSavingEdit(true)
    setEditError('')

    const { error } = await supabase
      .from('posts')
      .update({
        caption: edit.caption.trim() || null,
        place_name: edit.place.trim() || null,
        happened_on: edit.day,
        activity: edit.activity,
        province_code: null,
      })
      .eq('id', post.id)

    if (error) {
      setSavingEdit(false)
      setEditError(error.message)
      return
    }

    const minor = parseAmountInput(edit.amount)
    const paidByDb = edit.paidBy === 'shared' ? null : edit.paidBy || user.id

    if (edit.addExpense && minor > 0) {
      if (edit.expenseId) {
        const { error: expErr } = await supabase
          .from('expenses')
          .update({
            amount_minor: minor,
            paid_by: paidByDb,
            spent_on: edit.day,
            note: edit.place.trim() || edit.caption.trim().slice(0, 40) || null,
            category: categoryFromActivity(edit.activity),
          })
          .eq('id', edit.expenseId)
        if (expErr) {
          setSavingEdit(false)
          setEditError(
            `Đã lưu bài, nhưng chưa sửa được khoản chi: ${expenseSaveError(expErr.message)}`,
          )
          return
        }
      } else {
        const { error: expErr } = await supabase.from('expenses').insert({
          couple_id: post.couple_id,
          post_id: post.id,
          amount_minor: minor,
          category: categoryFromActivity(edit.activity),
          note: edit.place.trim() || edit.caption.trim().slice(0, 40) || null,
          spent_on: edit.day,
          paid_by: paidByDb,
          created_by: user.id,
        })
        if (expErr) {
          setSavingEdit(false)
          setEditError(
            `Đã lưu bài, nhưng chưa ghi được khoản chi: ${expenseSaveError(expErr.message)}`,
          )
          return
        }
      }
    } else if (edit.expenseId && (!edit.addExpense || minor <= 0)) {
      // Tắt chi tiêu / xoá số tiền → soft-delete khoản gắn bài
      await supabase
        .from('expenses')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', edit.expenseId)
    }

    setSavingEdit(false)
    setEditing(false)
    setEdit(null)
    await queryClient.invalidateQueries({ queryKey: ['posts'] })
    await queryClient.invalidateQueries({ queryKey: ['post', post.id] })
    await queryClient.invalidateQueries({ queryKey: ['post_expense', post.id] })
    await queryClient.invalidateQueries({ queryKey: ['expenses'] })
    await queryClient.invalidateQueries({ queryKey: ['expense_summary'] })
  }

  function askRemovePost() {
    if (!post || PREVIEW) return
    setMenuOpen(false)
    setPendingDelete(true)
  }

  /** Xoá bài, luôn giữ khoản chi (chỉ cắt liên kết). */
  async function doRemovePost() {
    if (!post) return
    const stamp = new Date().toISOString()
    await supabase
      .from('posts')
      .update({ deleted_at: stamp })
      .eq('id', post.id)

    await supabase
      .from('expenses')
      .update({ post_id: null })
      .eq('post_id', post.id)
      .is('deleted_at', null)

    await queryClient.invalidateQueries({ queryKey: ['posts'] })
    await queryClient.invalidateQueries({ queryKey: ['expenses'] })
    await queryClient.invalidateQueries({ queryKey: ['expense_summary'] })
    navigate('/timeline', { replace: true })
  }

  const media = post.media

  if (editing && edit) {
    return (
      <Screen>
        <DetailChrome onAction={cancelEdit} actionLabel="Hủy" />
        <form onSubmit={(e) => void saveEdit(e)} className="contents">
          <Stage>
            <Title>Cập nhật kỉ niệm</Title>

            {media.length > 0 ? (
              <div className="mt-4 overflow-hidden rounded-xl">
                <PhotoCarousel
                  items={media}
                  className="aspect-[4/3] w-full"
                  autoPlayMs={0}
                  showArrows={media.length > 1}
                  showDots={media.length > 1}
                  showCounter={false}
                />
              </div>
            ) : null}
            <p className="mt-2 text-[12.5px] text-muted">
              Ảnh giữ nguyên — muốn đổi ảnh thì đăng bài mới.
            </p>

            <div className="mt-5 space-y-4">
              <Field label="Caption">
                <textarea
                  value={edit.caption}
                  onChange={(e) =>
                    setEdit({ ...edit, caption: e.target.value })
                  }
                  rows={3}
                  placeholder="Hôm nay..."
                  disabled={savingEdit}
                  className={`${input} h-auto py-3 leading-relaxed`}
                />
              </Field>

              <Field label="Ngày kỉ niệm">
                <DateField
                  value={edit.day}
                  max={todayYmd()}
                  onChange={(next) => setEdit({ ...edit, day: next })}
                  className={`${inputChrome} flex items-center text-[15px]`}
                />
              </Field>

              <Field label="Địa điểm">
                <input
                  value={edit.place}
                  onChange={(e) => setEdit({ ...edit, place: e.target.value })}
                  placeholder="Địa điểm"
                  disabled={savingEdit}
                  className={input}
                />
              </Field>

              <Field label="Hoạt động">
                <div className="flex flex-wrap gap-2">
                  {Object.entries(ACTIVITY_LABELS).map(([key, meta]) => (
                    <button
                      key={key}
                      type="button"
                      disabled={savingEdit}
                      onClick={() =>
                        setEdit({
                          ...edit,
                          activity: edit.activity === key ? null : key,
                        })
                      }
                      className={`rounded-full border px-3 py-1.5 text-[13px] transition disabled:opacity-40 ${
                        edit.activity === key
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
              disabled={savingEdit}
              onClick={() =>
                setEdit({ ...edit, addExpense: !edit.addExpense })
              }
              className={`mt-4 flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition disabled:opacity-40 ${
                edit.addExpense
                  ? 'border-accent bg-soft'
                  : 'border-border bg-surface'
              }`}
            >
              <span aria-hidden className="text-xl">
                💰
              </span>
              <span className="min-w-0 flex-1">
                <b className="block text-[15px] font-semibold text-text">
                  {edit.expenseId ? 'Chi tiêu gắn bài' : 'Thêm chi tiêu'}
                </b>
              </span>
              <span
                aria-hidden
                className={`grid h-6 w-6 place-items-center rounded-full border text-xs ${
                  edit.addExpense
                    ? 'border-accent bg-accent text-on-accent'
                    : 'border-border'
                }`}
              >
                {edit.addExpense ? '✓' : ''}
              </span>
            </button>

            {edit.addExpense ? (
              <div className="mt-2 space-y-3 rounded-xl border border-accent/30 bg-soft p-3.5">
                <Field label="Số tiền">
                  <AmountInput
                    variant="md"
                    value={edit.amount}
                    onChange={(amount) => setEdit({ ...edit, amount })}
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
                    value={edit.paidBy || user?.id || ''}
                    onChange={(paidBy) => setEdit({ ...edit, paidBy })}
                  />
                </Field>
              </div>
            ) : null}

            {editError ? (
              <p className="mt-3 text-[13px] leading-relaxed text-accent">
                {editError}
              </p>
            ) : null}

            <Spacer />

            <button
              type="submit"
              disabled={savingEdit}
              className={btn.primary}
            >
              {savingEdit ? 'Đang lưu...' : 'Lưu'}
            </button>
          </Stage>
        </form>
      </Screen>
    )
  }

  return (
    <main
      ref={shellRef}
      className="flex h-app flex-col overflow-hidden bg-bg"
    >
      <DetailChrome
        to="/timeline"
        menuOpen={menuOpen}
        onMenuToggle={mine ? () => setMenuOpen((v) => !v) : undefined}
        onMenuClose={() => setMenuOpen(false)}
        onEdit={() => void startEdit()}
        onDelete={askRemovePost}
      />

      <div
        ref={scrollerRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        <div className="flex gap-2.5 px-4 pt-3 pb-2">
          <span
            aria-hidden
            className="grid h-9 w-9 flex-none place-items-center self-start rounded-full bg-soft text-sm font-bold text-accent"
          >
            {nameOf(post.author_id).slice(0, 1).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1 pt-0.5">
            <span className="block truncate text-[14px] leading-none font-semibold text-text">
              {nameOf(post.author_id)}
            </span>
            <span className="mt-1 block text-[12px] leading-none text-muted">
              {formatPostTime(post.created_at)}
            </span>
          </span>
        </div>

        {media.length > 0 ? (
          <PhotoCarousel
            items={media}
            className="aspect-square w-full"
            autoPlayMs={5000}
            showArrows
            showDots
            showCounter
          />
        ) : null}

        <div className="px-4 pt-4">
          {post.caption ? (
            <p className="text-[15px] leading-relaxed text-text">
              {post.caption}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
            <span>{formatDay(post.happened_on)}</span>
            {post.place_name ? <span>📍 {post.place_name}</span> : null}
            {activity ? (
              <span>
                {activity.emoji} {activity.label}
              </span>
            ) : null}
            {linkedExpense ? (
              <span>💰 {formatVnd(linkedExpense.amount_minor)}</span>
            ) : null}
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
                    <b className="text-[13px] text-text">
                      {nameOf(c.author_id)}
                    </b>
                    <span className="text-[11.5px] text-muted">
                      {formatCommentTime(c.created_at)}
                    </span>
                  </span>
                  <p className="text-[14px] leading-relaxed text-text">
                    {c.body}
                  </p>
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
      </div>

      <form
        onSubmit={sendComment}
        className={`flex shrink-0 gap-2 border-t border-border bg-bg px-4 pt-2.5 ${
          keyboardOpen ? 'pb-2' : 'pb-safe'
        }`}
      >
        <input
          ref={commentInputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onTouchEnd={focusCommentWithoutScroll}
          onMouseDown={focusCommentWithoutScroll}
          placeholder="Viết bình luận..."
          enterKeyHint="send"
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
          onConfirm={() => {
            setPendingDelete(false)
            void doRemovePost()
          }}
          onCancel={() => setPendingDelete(false)}
        />
      ) : null}
    </main>
  )
}

/** Thanh trên: quay lại / Hủy + dropdown ⋯ (Cập nhật / Xoá). */
function DetailChrome({
  to,
  onAction,
  actionLabel = 'Hủy',
  menuOpen = false,
  onMenuToggle,
  onMenuClose,
  onEdit,
  onDelete,
}: {
  to?: string
  onAction?: () => void
  actionLabel?: string
  menuOpen?: boolean
  onMenuToggle?: () => void
  onMenuClose?: () => void
  onEdit?: () => void
  onDelete?: () => void
}) {
  const menuBox = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen || !onMenuClose) return
    const onDown = (e: MouseEvent) => {
      if (!menuBox.current?.contains(e.target as Node)) onMenuClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onMenuClose()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen, onMenuClose])

  return (
    <div className="top-safe relative z-20 flex items-center justify-between gap-3 px-4 pb-2">
      {onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-2 text-[14px] font-medium text-muted transition active:scale-95 hover:text-text"
        >
          <span
            aria-hidden
            className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface text-text"
          >
            <IconArrowLeft size={18} />
          </span>
          {actionLabel}
        </button>
      ) : (
        <Link
          to={to ?? '/timeline'}
          className="inline-flex items-center gap-2 text-[14px] font-medium text-muted transition active:scale-95 hover:text-text"
        >
          <span
            aria-hidden
            className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface text-text"
          >
            <IconArrowLeft size={18} />
          </span>
          Quay lại
        </Link>
      )}

      {onMenuToggle ? (
        <div ref={menuBox} className="relative">
          <button
            type="button"
            aria-label="Tuỳ chọn"
            aria-expanded={menuOpen}
            onClick={onMenuToggle}
            className={`grid h-9 w-9 place-items-center rounded-full border bg-surface text-[18px] leading-none text-text active:scale-95 ${
              menuOpen ? 'border-accent' : 'border-border'
            }`}
          >
            ⋯
          </button>
          {menuOpen ? (
            <div
              role="menu"
              className="absolute top-full right-0 z-30 mt-1.5 min-w-[10.5rem] overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-xl"
            >
              <button
                type="button"
                role="menuitem"
                onClick={onEdit}
                className="flex w-full px-3.5 py-2.5 text-left text-[14px] font-medium text-text active:bg-soft"
              >
                Cập nhật
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={onDelete}
                className="flex w-full px-3.5 py-2.5 text-left text-[14px] font-medium text-accent active:bg-soft"
              >
                Xoá
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <span className="h-9 w-9" aria-hidden />
      )}
    </div>
  )
}
