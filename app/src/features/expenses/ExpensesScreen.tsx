import { useState } from 'react'
import { Link } from 'react-router'
import { TopHeader } from '../../components/AppShell'
import { useCouple } from '../../hooks/useCouple'
import { shiftMonth, useExpenses } from '../../hooks/useExpenses'
import { expenseInsight } from '../../lib/expenseInsight'
import {
  categoryOf,
  formatShortVnd,
  formatVnd,
  EXPENSE_CATEGORIES,
} from '../../lib/money'
import { todayYmd } from '../../lib/dateCount'
import { btn } from '../../lib/ui-classes'

export function ExpensesScreen() {
  const [month, setMonth] = useState(() => `${todayYmd().slice(0, 7)}-01`)
  const { couple } = useCouple()
  const { expenses, summary, previous, isLoading } = useExpenses(month)

  // Khoản lớn nhất tháng dùng làm câu dự phòng khi hai tháng giống hệt nhau
  const biggest = expenses.reduce<(typeof expenses)[number] | null>(
    (max, e) => (!max || e.amount_minor > max.amount_minor ? e : max),
    null,
  )
  const insight = expenseInsight({
    byCategory: summary?.by_category ?? {},
    outingCount: summary?.outing_count ?? 0,
    totalMinor: summary?.total_minor ?? 0,
    previous: previous
      ? { outingCount: previous.outing_count, totalMinor: previous.total_minor }
      : null,
    biggest: biggest
      ? {
          note: biggest.note,
          category: biggest.category,
          amountMinor: biggest.amount_minor,
        }
      : null,
  })

  const [y, m] = month.split('-').map(Number)
  const isThisMonth = month.slice(0, 7) === todayYmd().slice(0, 7)
  const nameOf = (id: string) =>
    couple?.members.find((mem) => mem.user_id === id)?.nickname ?? '?'

  return (
    <>
      <TopHeader
        title="Chi tiêu"
        right={
          <Link
            to="/expenses/new"
            className="rounded-full bg-accent px-3 py-1 text-sm font-semibold text-on-accent"
          >
            + Ghi
          </Link>
        }
      />

      <div className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          aria-label="Tháng trước"
          onClick={() => setMonth(`${shiftMonth(month.slice(0, 7), -1)}-01`)}
          className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted"
        >
          ‹
        </button>
        <b className="text-[15px] font-semibold text-text">
          Tháng {m}, {y}
        </b>
        <button
          type="button"
          aria-label="Tháng sau"
          disabled={isThisMonth}
          onClick={() => setMonth(`${shiftMonth(month.slice(0, 7), 1)}-01`)}
          className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted disabled:opacity-30"
        >
          ›
        </button>
      </div>

      <div className="flex-1 px-4 pb-8">
        {isLoading ? (
          <p className="py-16 text-center text-sm text-muted">Đang tải...</p>
        ) : expenses.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <section className="rounded-2xl border border-border bg-surface p-4">
              <p className="text-[13px] font-medium text-muted">
                Tổng chi
              </p>
              <p className="mt-1 text-[30px] leading-tight font-extrabold tracking-[-0.02em] text-text">
                {formatVnd(summary?.total_minor ?? 0)}
              </p>

              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-muted">
                {Object.entries(summary?.by_payer ?? {}).map(([id, total]) => (
                  <span key={id}>
                    {nameOf(id)} trả{' '}
                    <b className="font-semibold text-text">
                      {formatShortVnd(Number(total))}
                    </b>
                  </span>
                ))}
                <span>
                  {summary?.outing_count ?? 0} khoản · trung bình{' '}
                  <b className="font-semibold text-text">
                    {formatShortVnd(summary?.avg_outing_minor ?? 0)}
                  </b>
                </span>
              </div>
            </section>

            {insight ? (
              <p className="mt-3 rounded-2xl border border-border bg-soft px-4 py-3 text-[13.5px] leading-relaxed text-text">
                {insight}
              </p>
            ) : null}

            <CategoryChart byCategory={summary?.by_category ?? {}} />

            <ul className="mt-5 flex flex-col gap-2">
              {expenses.map((e) => {
                const cat = categoryOf(e.category)
                return (
                  <li key={e.id}>
                    <Link
                      to={`/expenses/${e.id}`}
                      className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3.5"
                    >
                      <span aria-hidden className="text-xl">
                        {cat.emoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <b className="block truncate text-[15px] font-medium text-text">
                          {e.note || cat.label}
                        </b>
                        <span className="block text-[12.5px] text-muted">
                          {e.spent_on.slice(8)}/{e.spent_on.slice(5, 7)} ·{' '}
                          {nameOf(e.paid_by)} trả
                          {e.post_id ? ' · 📷' : ''}
                        </span>
                      </div>
                      <b className="shrink-0 text-[15px] font-semibold text-text tabular-nums">
                        {formatShortVnd(e.amount_minor)}
                      </b>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>
    </>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <p className="text-5xl" aria-hidden>
        🧾
      </p>
      <p className="mt-5 text-[17px] font-semibold text-text">
        Chưa có chi tiêu.
      </p>
      <Link to="/expenses/new" className={`${btn.primary} mt-7 max-w-[18rem]`}>
        Thêm
      </Link>
    </div>
  )
}

/** Biểu đồ tròn bằng conic-gradient — không kéo thêm thư viện vẽ. */
function CategoryChart({ byCategory }: { byCategory: Record<string, number> }) {
  const entries = EXPENSE_CATEGORIES.map((c) => ({
    ...c,
    total: Number(byCategory[c.key] ?? 0),
  })).filter((c) => c.total > 0)

  const total = entries.reduce((sum, c) => sum + c.total, 0)
  if (total === 0) return null

  // Mỗi lát bắt đầu ở tổng luỹ kế của các lát trước
  const stops = entries.map((c, i) => {
    const before = entries.slice(0, i).reduce((sum, e) => sum + e.total, 0)
    const start = (before / total) * 360
    const end = ((before + c.total) / total) * 360
    return `${c.color} ${start}deg ${end}deg`
  })

  return (
    <section className="mt-4 flex items-center gap-5 rounded-2xl border border-border bg-surface p-4">
      <span
        aria-hidden
        className="grid h-24 w-24 flex-none place-items-center rounded-full"
        style={{ background: `conic-gradient(${stops.join(', ')})` }}
      >
        <span className="h-12 w-12 rounded-full bg-surface" />
      </span>
      <ul className="min-w-0 flex-1 space-y-1.5">
        {entries.map((c) => (
          <li key={c.key} className="flex items-center gap-2 text-[13px]">
            <span
              aria-hidden
              className="h-2.5 w-2.5 flex-none rounded-full"
              style={{ background: c.color }}
            />
            <span className="min-w-0 flex-1 truncate text-muted">{c.label}</span>
            <b className="font-medium text-text tabular-nums">
              {Math.round((c.total / total) * 100)}%
            </b>
          </li>
        ))}
      </ul>
    </section>
  )
}
