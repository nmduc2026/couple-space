import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { TopHeader } from '../../components/AppShell'
import { InlineLoading } from '../../components/EmptyState'
import { QuickAddRow } from '../../components/QuickAddRow'
import { SegmentedControl } from '../../components/SegmentedControl'
import { useCouple } from '../../hooks/useCouple'
import { useSession } from '../../hooks/useSession'
import { supabase } from '../../lib/supabase'
import { PREVIEW } from '../../dev/preview'
import { useEatItems, useEatStats, type EatItem } from '../../hooks/useEatItems'
import { formatShortVnd } from '../../lib/money'
import { RatingPrompt } from './RatingPrompt'
import { btn } from '../../lib/ui-classes'

type Tab = 'want' | 'picked' | 'tried'

export function EatScreen() {
  const [params, setParams] = useSearchParams()
  const queryClient = useQueryClient()
  const { couple } = useCouple()
  const { user } = useSession()
  const { items, isLoading } = useEatItems()
  const stats = useEatStats()

  const tabParam = params.get('tab')
  const tab: Tab =
    tabParam === 'tried' || tabParam === 'picked' ? tabParam : 'want'
  // Nhận link chia sẻ từ app khác (TikTok, Maps) qua share_target của PWA:
  // link đến thẳng trong URL nên dùng làm giá trị khởi tạo, không cần effect.
  const [name, setName] = useState(
    () => params.get('text') ?? params.get('url') ?? '',
  )
  const [saving, setSaving] = useState(false)

  const list = items.filter((i) => i.status === tab)

  function setTab(next: Tab) {
    const p = new URLSearchParams(params)
    if (next === 'want') p.delete('tab')
    else p.set('tab', next)
    setParams(p, { replace: true })
  }

  /** Thêm nhanh: một ô nhập, Enter là xong. Link dán vào thì tách ra cột riêng. */
  async function quickAdd() {
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
      status: tab === 'tried' ? 'tried' : tab === 'picked' ? 'picked' : 'want',
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
    // Đánh dấu đã đi thật → ghi một lượt ghé để hỏi đánh giá / thống kê
    if (status === 'tried' && couple) {
      await supabase.from('eat_visits').insert({
        couple_id: couple.id,
        item_id: item.id,
      })
      await queryClient.invalidateQueries({ queryKey: ['pending_ratings'] })
      await queryClient.invalidateQueries({ queryKey: ['eat_item_stats'] })
    }
    await queryClient.invalidateQueries({ queryKey: ['eat_items'] })
  }

  const actionLabel =
    tab === 'want' ? 'Đã chọn' : tab === 'picked' ? 'Đã đi' : 'Muốn thử lại'
  const actionNext: EatItem['status'] =
    tab === 'want' ? 'picked' : tab === 'picked' ? 'tried' : 'want'

  return (
    <>
      <TopHeader title="Tối nay ăn gì?" back="/" />

      <div className="px-4 pt-3">
        <Link to="/eat/spin" className={btn.primary}>
          Chọn quán ngẫu nhiên
        </Link>

        <RatingPrompt />

        <QuickAddRow
          value={name}
          onChange={setName}
          onSubmit={quickAdd}
          placeholder="Tên quán hoặc link"
          disabled={saving}
          className="mt-3"
        />

        <SegmentedControl
          options={[
            {
              value: 'want',
              label: `Muốn thử (${items.filter((i) => i.status === 'want').length})`,
            },
            {
              value: 'picked',
              label: `Đã chọn (${items.filter((i) => i.status === 'picked').length})`,
            },
            {
              value: 'tried',
              label: `Đã đi (${items.filter((i) => i.status === 'tried').length})`,
            },
          ]}
          value={tab}
          onChange={setTab}
          className="mt-4"
        />
      </div>

      <div className="flex-1 px-4 py-3">
        {isLoading ? (
          <InlineLoading />
        ) : list.length === 0 ? (
          <p className="py-16 text-center text-sm leading-relaxed text-muted">
            {tab === 'want'
              ? 'Chưa có quán nào để quay.'
              : tab === 'picked'
                ? 'Chưa chốt quán nào từ vòng quay.'
                : 'Chưa đi quán nào.'}
          </p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {list.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3.5"
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
                  onClick={() => void setStatus(item, actionNext)}
                  className="shrink-0 text-[13px] font-semibold text-accent"
                >
                  {actionLabel}
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
