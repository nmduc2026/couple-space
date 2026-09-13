import { useState, type FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { TopHeader } from '../../components/AppShell'
import { useCouple } from '../../hooks/useCouple'
import { useSession } from '../../hooks/useSession'
import { supabase } from '../../lib/supabase'
import { PREVIEW, previewWishlist } from '../../dev/preview'
import { input } from '../../lib/ui-classes'

type Item = {
  id: string
  owner_id: string
  title: string
  url: string | null
  note: string | null
  status: 'open' | 'archived'
}

type Mark = {
  item_id: string
  state: 'planned' | 'bought'
}

export function WishlistScreen() {
  const queryClient = useQueryClient()
  const { couple } = useCouple()
  const { user } = useSession()

  const [tab, setTab] = useState<'mine' | 'theirs'>('theirs')
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)

  const itemsQuery = useQuery({
    queryKey: ['wishlist', couple?.id],
    enabled: !!couple?.id && !PREVIEW,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wishlist_items')
        .select('id, owner_id, title, url, note, status')
        .eq('couple_id', couple!.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as Item[]
    },
  })

  // RLS chỉ trả về dấu của CHÍNH mình. Chủ wishlist gọi query này cũng
  // chỉ nhận về mảng rỗng — không có đường nào thấy dấu của người kia.
  const marksQuery = useQuery({
    queryKey: ['wishlist_marks', user?.id],
    enabled: !!user?.id && !PREVIEW,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wishlist_marks')
        .select('item_id, state')
        .eq('marked_by', user!.id)
      if (error) throw error
      return (data ?? []) as Mark[]
    },
  })

  const fixture = PREVIEW ? previewWishlist(user?.id ?? '') : null
  const items = fixture ? fixture.items : (itemsQuery.data ?? [])
  const marks = fixture ? fixture.marks : (marksQuery.data ?? [])

  const mine = items.filter((i) => i.owner_id === user?.id)
  const theirs = items.filter((i) => i.owner_id !== user?.id)
  const list = tab === 'mine' ? mine : theirs

  const markOf = (itemId: string) =>
    marks.find((m) => m.item_id === itemId)?.state

  // Món người kia đã bỏ nhưng mình đã trót đánh dấu — cảnh báo chỉ hiện
  // ở máy mình, chủ wishlist không biết gì.
  const stale = theirs.filter((i) => i.status === 'archived' && markOf(i.id))

  async function addItem(event: FormEvent) {
    event.preventDefault()
    const raw = title.trim()
    if (!raw || !couple || !user || PREVIEW) return
    setSaving(true)
    const urlMatch = raw.match(/https?:\/\/\S+/)
    const url = urlMatch?.[0] ?? null
    const { error } = await supabase.from('wishlist_items').insert({
      couple_id: couple.id,
      owner_id: user.id,
      title: raw.replace(url ?? '', '').trim() || 'Món mới',
      url,
    })
    setSaving(false)
    if (error) return
    setTitle('')
    await queryClient.invalidateQueries({ queryKey: ['wishlist'] })
  }

  async function setMark(itemId: string, state: 'planned' | 'bought' | null) {
    if (!couple || !user || PREVIEW) return
    if (state === null) {
      await supabase
        .from('wishlist_marks')
        .delete()
        .eq('item_id', itemId)
        .eq('marked_by', user.id)
    } else {
      await supabase.from('wishlist_marks').upsert({
        item_id: itemId,
        couple_id: couple.id,
        marked_by: user.id,
        state,
      })
    }
    await queryClient.invalidateQueries({ queryKey: ['wishlist_marks'] })
  }

  async function archive(itemId: string) {
    if (PREVIEW) return
    await supabase.rpc('archive_wish', { p_item_id: itemId })
    await queryClient.invalidateQueries({ queryKey: ['wishlist'] })
  }

  return (
    <>
      <TopHeader title="Wishlist quà" back="/" />

      <div className="px-4 pt-3">
        <div className="flex gap-1 rounded-2xl border border-border bg-surface p-1">
          {(
            [
              ['theirs', 'Của người ấy'],
              ['mine', 'Của mình'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
                tab === value ? 'bg-accent text-on-accent' : 'text-muted'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'mine' ? (
          <form onSubmit={addItem} className="mt-3 flex gap-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tên món hoặc link"
              className={`${input} flex-1`}
            />
            <button
              type="submit"
              disabled={!title.trim() || saving}
              className="h-12 shrink-0 rounded-2xl border border-border px-4 text-sm font-semibold text-text disabled:opacity-40"
            >
              Thêm
            </button>
          </form>
        ) : null}
      </div>

      <div className="flex-1 px-4 py-3">
        {tab === 'theirs' && stale.length > 0 ? (
          <p className="mb-3 rounded-2xl bg-soft p-3.5 text-[13.5px] leading-relaxed text-muted">
            ⚠️ {stale.length} món bạn đã đánh dấu vừa được bỏ khỏi wishlist.
            Kiểm tra lại trước khi mua.
          </p>
        ) : null}

        {list.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-5xl" aria-hidden>
              🎁
            </p>
            <p className="mt-5 text-[17px] font-semibold text-text">
              {tab === 'mine' ? 'Chưa có món nào.' : 'Người ấy chưa ghi món nào.'}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {list.map((item) => (
              <li
                key={item.id}
                className={`rounded-2xl border border-border bg-surface p-3.5 ${
                  item.status === 'archived' ? 'opacity-55' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <span aria-hidden className="text-xl">
                    🎁
                  </span>
                  <div className="min-w-0 flex-1">
                    <b className="block text-[15px] font-semibold text-text">
                      {item.title}
                    </b>
                    {item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block truncate text-[12.5px] text-accent"
                      >
                        {item.url}
                      </a>
                    ) : null}
                    {item.status === 'archived' ? (
                      <span className="text-[12px] text-muted">
                        đã bỏ khỏi danh sách
                      </span>
                    ) : null}
                  </div>

                  {tab === 'mine' && item.status === 'open' ? (
                    <button
                      type="button"
                      onClick={() => void archive(item.id)}
                      className="shrink-0 text-[12.5px] text-muted"
                    >
                      Bỏ
                    </button>
                  ) : null}
                </div>

                {tab === 'theirs' ? (
                  <div className="mt-3 flex gap-1.5">
                    {(
                      [
                        ['planned', 'Định mua'],
                        ['bought', 'Mua rồi'],
                      ] as const
                    ).map(([state, label]) => (
                      <button
                        key={state}
                        type="button"
                        onClick={() =>
                          void setMark(
                            item.id,
                            markOf(item.id) === state ? null : state,
                          )
                        }
                        className={`flex-1 rounded-xl border py-2 text-[13px] font-semibold transition ${
                          markOf(item.id) === state
                            ? 'border-accent bg-accent text-on-accent'
                            : 'border-border text-muted'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {tab === 'mine' ? (
          <p className="mt-6 px-2 text-center text-[12.5px] leading-relaxed text-muted">
            Người ấy không thấy bạn đã xem gì.
          </p>
        ) : null}
      </div>
    </>
  )
}
