import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { TopHeader } from '../../components/AppShell'
import { useCouple } from '../../hooks/useCouple'
import { useSession } from '../../hooks/useSession'
import { supabase } from '../../lib/supabase'
import { PREVIEW } from '../../dev/preview'
import { useEatItems, useEatStats, type EatItem } from '../../hooks/useEatItems'
import { formatShortVnd } from '../../lib/money'
import { RatingPrompt } from './RatingPrompt'
import { btn, input } from '../../lib/ui-classes'

type Tab = 'want' | 'tried'

export function EatScreen() {
  const [params, setParams] = useSearchParams()
  const queryClient = useQueryClient()
  const { couple } = useCouple()
  const { user } = useSession()
  const { items, isLoading } = useEatItems()
  const stats = useEatStats()

  const tab: Tab = params.get('tab') === 'tried' ? 'tried' : 'want'
  // Nhận link chia sẻ từ app khác (TikTok, Maps) qua share_target của PWA:
  // link đến thẳng trong URL nên dùng làm giá trị khởi tạo, không cần effect.
  const [name, setName] = useState(
    () => params.get('text') ?? params.get('url') ?? '',
  )
  const [saving, setSaving] = useState(false)

  const list = items.filter((i) => i.status === tab)

  function setTab(next: Tab) {
    const p = new URLSearchParams(params)
    if (next === 'tried') p.set('tab', 'tried')
    else p.delete('tab')
    setParams(p, { replace: true })
  }

  /** Thêm nhanh: một ô nhập, Enter là xong. Link dán vào thì tách ra cột riêng. */
  async function quickAdd(event: FormEvent) {
    event.preventDefault()
    const raw = name.trim()
    if (!raw || !couple || !user || PREVIEW) return
    setSaving(true)

    const urlMatch = raw.match(/https?:\/\/\S+/)
    const url = urlMatch?.[0] ?? null
    const label = raw.replace(url ?? '', '').trim() || 'Quán mới'
    const isMap = url?.includes('map') || url?.includes('goo.gl')

    const { error } = await supabase.from('eat_items').insert({
      couple_id: couple.id,
      name: label,
      map_url: isMap ? url : null,
      source_url: isMap ? null : url,
      added_by: user.id,
    })
    setSaving(false)
    if (error) return
    setName('')
    await queryClient.invalidateQueries({ queryKey: ['eat_items'] })
  }

  async function setStatus(item: EatItem, status: EatItem['status']) {
    if (PREVIEW) return
    await supabase.from('eat_items').update({ status }).eq('id', item.id)
    await queryClient.invalidateQueries({ queryKey: ['eat_items'] })
  }

  return (
    <>
      <TopHeader title="Tối nay ăn gì?" />

      <div className="px-4 pt-3">
        <Link to="/eat/spin" className={btn.primary}>
          🎲 Quay đi, khỏi cãi nhau
        </Link>

        <RatingPrompt />

        <form onSubmit={quickAdd} className="mt-3 flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Thêm quán — dán cả link cũng được"
            className={`${input} flex-1`}
          />
          <button
            type="submit"
            disabled={!name.trim() || saving}
            className="h-12 shrink-0 rounded-2xl border border-border px-4 text-sm font-semibold text-text disabled:opacity-40"
          >
            Thêm
          </button>
        </form>

        <div className="mt-4 flex gap-1 rounded-2xl border border-border bg-surface p-1">
          {(
            [
              ['want', 'Muốn thử'],
              ['tried', 'Đã đi'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
                tab === value
                  ? 'bg-accent text-on-accent'
                  : 'text-muted hover:text-text'
              }`}
            >
              {label} ({items.filter((i) => i.status === value).length})
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 py-3">
        {isLoading ? (
          <p className="py-12 text-center text-sm text-muted">Đang tải...</p>
        ) : list.length === 0 ? (
          <p className="py-16 text-center text-sm leading-relaxed text-muted">
            {tab === 'want'
              ? 'Chưa có quán nào trong danh sách.\nThấy quán ngon ở đâu thì quăng link vào đây.'
              : 'Chưa đi quán nào cả.'}
          </p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {list.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3.5"
              >
                <Link
                  to={`/eat/${item.id}`}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <span aria-hidden className="text-2xl">
                    🍽️
                  </span>
                  <span className="min-w-0 flex-1">
                    <b className="block truncate text-[15px] font-semibold text-text">
                      {item.name}
                    </b>
                    <ItemSubtitle item={item} stat={stats.get(item.id)} />
                    {item.tags.length ? (
                      <span className="mt-1 flex flex-wrap gap-1">
                        {item.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-full bg-soft px-2 py-0.5 text-[11px] text-accent"
                          >
                            {t}
                          </span>
                        ))}
                      </span>
                    ) : null}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() =>
                    void setStatus(item, tab === 'want' ? 'tried' : 'want')
                  }
                  className="shrink-0 text-[13px] font-semibold text-accent"
                >
                  {tab === 'want' ? 'Đã đi' : 'Muốn lại'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}

/** Dòng phụ dưới tên quán: ưu tiên số liệu tự tính, không có thì mới
 *  rơi về địa chỉ — số lần ăn hữu ích hơn địa chỉ khi đang chọn chỗ. */
function ItemSubtitle({
  item,
  stat,
}: {
  item: EatItem
  stat?: { visit_count: number; avg_spend_minor: number | null; love_count: number; nope_count: number }
}) {
  const bits: string[] = []
  if (stat?.visit_count) bits.push(`${stat.visit_count} lần`)
  if (stat?.avg_spend_minor) {
    bits.push(`~${formatShortVnd(Number(stat.avg_spend_minor))}`)
  }
  if (stat?.love_count) bits.push('😍'.repeat(Math.min(stat.love_count, 2)))
  if (stat?.nope_count) bits.push('😕')

  if (bits.length === 0) {
    return item.address ? (
      <span className="block truncate text-[12.5px] text-muted">
        {item.address}
      </span>
    ) : null
  }

  return (
    <span className="block truncate text-[12.5px] text-muted">
      {bits.join(' · ')}
    </span>
  )
}
