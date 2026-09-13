import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router'
import { useCouple } from '../../hooks/useCouple'
import { useEatItems, useEatStats } from '../../hooks/useEatItems'
import { supabase } from '../../lib/supabase'
import { formatVnd } from '../../lib/money'
import { formatDay } from '../../lib/formatDate'
import { PREVIEW } from '../../dev/preview'
import { Loading, Screen, Stage, Title, TopBar } from '../../components/ui'
import { verdictOf } from '../../lib/eatVerdicts'

type VisitRow = {
  id: string
  visited_on: string
  eat_ratings: { user_id: string; verdict: string; note: string | null }[]
}

/** Chi tiết một quán: mọi con số ở đây đều TỰ TÍNH từ lượt ghé, chi tiêu
 *  và đánh giá — không có trường nào bắt người dùng điền. Đó là phần
 *  thưởng của việc đã có Timeline và Chi tiêu từ trước. */
export function EatDetailScreen() {
  const { id = '' } = useParams()
  const { couple } = useCouple()
  const { items, isLoading } = useEatItems()
  const stats = useEatStats()

  const item = items.find((i) => i.id === id)
  const stat = stats.get(id)

  const visitsQuery = useQuery({
    queryKey: ['eat_visits', id],
    enabled: !!id && !!couple?.id && !PREVIEW,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('eat_visits')
        .select('id, visited_on, eat_ratings(user_id, verdict, note)')
        .eq('item_id', id)
        .order('visited_on', { ascending: false })
      if (error) throw error
      return (data ?? []) as unknown as VisitRow[]
    },
  })

  const visits = visitsQuery.data ?? []

  const nameOf = (userId: string) =>
    couple?.members.find((m) => m.user_id === userId)?.nickname ?? '?'

  if (isLoading) return <Loading />

  if (!item) {
    return (
      <Screen>
        <TopBar to="/eat" />
        <Stage>
          <Title>Không tìm thấy quán</Title>
          <p className="mt-2 text-sm text-muted">
            Có thể nó đã bị xoá khỏi danh sách.
          </p>
        </Stage>
      </Screen>
    )
  }

  const link = item.map_url ?? item.source_url

  return (
    <Screen>
      <TopBar to="/eat" />
      <Stage>
        <Title>{item.name}</Title>
        {item.address ? (
          <p className="mt-1 text-[14px] text-muted">{item.address}</p>
        ) : null}

        {item.tags.length ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {item.tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-soft px-2.5 py-1 text-[12px] text-accent"
              >
                {t}
              </span>
            ))}
          </div>
        ) : null}

        <dl className="mt-5 grid grid-cols-3 gap-2">
          <Stat label="Số lần ăn" value={String(stat?.visit_count ?? 0)} />
          <Stat
            label="Trung bình"
            value={
              stat?.avg_spend_minor
                ? formatVnd(Number(stat.avg_spend_minor))
                : '—'
            }
          />
          <Stat
            label="Lần cuối"
            value={
              stat?.last_visited_on ? formatDay(stat.last_visited_on) : 'Chưa đi'
            }
          />
        </dl>

        {stat && stat.nope_count > 0 ? (
          <p className="mt-3 rounded-xl border border-border bg-surface p-3.5 text-[13px] leading-relaxed text-muted">
            Đã bị đánh dấu “thôi” — không đưa vào vòng quay.
          </p>
        ) : null}

        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className="mt-3 block rounded-xl border border-border bg-surface p-3.5 text-[14px] font-medium text-accent"
          >
            {item.map_url ? '📍 Mở bản đồ' : '🔗 Mở link gốc'}
          </a>
        ) : null}

        <h2 className="mt-6 text-[14px] font-semibold text-muted">
          Những lần đã đi
        </h2>

        {visits.length === 0 ? (
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            Chưa ghi lần nào. Quay ra quán này rồi bấm Chốt thì nó xuất hiện ở
            đây.
          </p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {visits.map((v) => (
              <li
                key={v.id}
                className="rounded-xl border border-border bg-surface p-3.5"
              >
                <b className="text-[14px] font-medium text-text">
                  {formatDay(v.visited_on)}
                </b>
                {v.eat_ratings.length === 0 ? (
                  <p className="mt-1 text-[12.5px] text-muted">
                    Chưa ai đánh giá
                  </p>
                ) : (
                  <ul className="mt-1.5 space-y-1">
                    {v.eat_ratings.map((r) => (
                      <li
                        key={r.user_id}
                        className="text-[13px] text-muted"
                      >
                        <span aria-hidden>{verdictOf(r.verdict)?.emoji}</span>{' '}
                        {nameOf(r.user_id)} — {verdictOf(r.verdict)?.label}
                        {r.note ? `: ${r.note}` : ''}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </Stage>
    </Screen>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3 text-center">
      <dt className="text-[12.5px] font-medium text-muted">
        {label}
      </dt>
      <dd className="mt-1 text-[15px] font-semibold text-text">{value}</dd>
    </div>
  )
}
