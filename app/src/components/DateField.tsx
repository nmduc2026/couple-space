import { useRef, useState } from 'react'
import { todayYmd } from '../lib/dateCount'
import { btn } from '../lib/ui-classes'
import { formatDateLong } from '../lib/formatDate'
import { BottomSheet } from './BottomSheet'

/*
 * Ô chọn ngày của riêng app, thay cho `<input type="date">`.
 *
 * Hai lý do phải tự làm, cái thứ hai mới là lý do thật:
 *
 *  1. Bảng lịch của `<input type="date">` do TRÌNH DUYỆT vẽ. CSS chỉ với tới
 *     được tông sáng/tối và màu nhấn; bố cục, phông chữ, nút bấm thì không.
 *     Kết quả là giữa một app đã thiết kế kỹ lại lòi ra một hộp của hệ điều
 *     hành.
 *
 *  2. Nó hiển thị theo NGÔN NGỮ TRÌNH DUYỆT, không theo app. Máy để tiếng Anh
 *     thì ngày 28/07 hiện thành "07/28/2025" — người Việt đọc thành ngày 7
 *     tháng 28. Đây là hiểu nhầm thật, không phải chuyện thẩm mỹ.
 */

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

/** Số ngày trong tháng. Tháng 2 năm nhuận tính bằng `new Date(y, m, 0)`. */
function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

/** Thứ của ngày mùng 1, quy về 0 = Thứ Hai (JS mặc định 0 = Chủ Nhật). */
function firstWeekdayIndex(year: number, month: number) {
  return (new Date(year, month - 1, 1).getDay() + 6) % 7
}

const pad = (n: number) => String(n).padStart(2, '0')
const ymd = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`

export function DateField({
  value,
  onChange,
  min,
  max,
  placeholder = 'Chọn ngày',
  className = '',
  clearable = false,
}: {
  value: string
  onChange: (next: string) => void
  min?: string
  max?: string
  placeholder?: string
  className?: string
  clearable?: boolean
}) {
  const [open, setOpen] = useState(false)
  // Mobile: sau khi chọn ngày, cùng một lượt chạm hay "rơi" xuống nút mở
  // → sheet đóng rồi mở lại ngay. Chặn mở trong ~400ms.
  const blockOpenUntil = useRef(0)

  function closeAfterPick(next: string) {
    onChange(next)
    blockOpenUntil.current = Date.now() + 400
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (Date.now() < blockOpenUntil.current) return
          setOpen(true)
        }}
        className={className}
        aria-haspopup="dialog"
      >
        {value ? formatDateLong(value) : placeholder}
      </button>

      {open ? (
        <CalendarSheet
          value={value}
          min={min}
          max={max}
          clearable={clearable}
          onPick={closeAfterPick}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  )
}

function CalendarSheet({
  value,
  min,
  max,
  clearable,
  onPick,
  onClose,
}: {
  value: string
  min?: string
  max?: string
  clearable: boolean
  onPick: (next: string) => void
  onClose: () => void
}) {
  const today = todayYmd()
  const anchor = value || today
  const [y0, m0] = anchor.split('-').map(Number)
  const [view, setView] = useState({ year: y0, month: m0 })

  const total = daysInMonth(view.year, view.month)
  const lead = firstWeekdayIndex(view.year, view.month)

  // LUÔN vẽ 6 hàng. Tháng có 4, 5 hay 6 hàng tuỳ ngày mùng 1 rơi vào thứ mấy;
  // vẽ đúng số hàng thật thì bấm sang tháng khác là cả hộp cao thấp nhảy lên
  // nhảy xuống, và mấy nút dưới đáy chạy theo.
  const trailing = 6 * 7 - lead - total

  const shiftMonth = (delta: number) => {
    const index = view.year * 12 + (view.month - 1) + delta
    setView({
      year: Math.floor(index / 12),
      month: (index % 12) + 1,
    })
  }

  const outOfRange = (day: string) =>
    (min !== undefined && day < min) || (max !== undefined && day > max)

  return (
    <BottomSheet onClose={onClose} ariaLabel="Chọn ngày">
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Tháng trước"
          onClick={() => shiftMonth(-1)}
          className="grid h-10 w-10 place-items-center rounded-full border border-border text-muted"
        >
          ‹
        </button>
        <b className="flex-1 text-center text-[16px] font-semibold text-text">
          Tháng {view.month}, {view.year}
        </b>
        <button
          type="button"
          aria-label="Tháng sau"
          onClick={() => shiftMonth(1)}
          className="grid h-10 w-10 place-items-center rounded-full border border-border text-muted"
        >
          ›
        </button>
      </div>

      {/* Chọn nhanh năm: bấm từng tháng để lùi 12 năm là không dùng nổi khi
          ngày bắt đầu yêu cách đây vài năm */}
      <div className="mt-3 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => shiftMonth(-12)}
          className="rounded-full border border-border px-3 py-1 text-[12.5px] text-muted"
        >
          − 1 năm
        </button>
        <button
          type="button"
          onClick={() => shiftMonth(12)}
          className="rounded-full border border-border px-3 py-1 text-[12.5px] text-muted"
        >
          + 1 năm
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((w) => (
          <span
            key={w}
            className="py-1 text-[11px] font-bold tracking-wider text-muted uppercase"
          >
            {w}
          </span>
        ))}

        {Array.from({ length: lead }).map((_, i) => (
          <span key={`lead-${i}`} aria-hidden className="h-10" />
        ))}

        {Array.from({ length: total }).map((_, i) => {
          const day = ymd(view.year, view.month, i + 1)
          const selected = day === value
          const isToday = day === today
          const disabled = outOfRange(day)

          return (
            <button
              key={day}
              type="button"
              disabled={disabled}
              onClick={() => onPick(day)}
              aria-current={isToday ? 'date' : undefined}
              className={`grid h-10 place-items-center rounded-xl text-[14px] transition ${
                selected
                  ? 'bg-accent font-bold text-on-accent'
                  : isToday
                    ? 'bg-soft font-semibold text-accent'
                    : 'text-text'
              } ${disabled ? 'pointer-events-none opacity-25' : ''}`}
            >
              {i + 1}
            </button>
          )
        })}

        {Array.from({ length: trailing }).map((_, i) => (
          <span key={`trail-${i}`} aria-hidden className="h-10" />
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {!outOfRange(today) ? (
          <button
            type="button"
            onClick={() => onPick(today)}
            className={btn.outline}
          >
            Hôm nay
          </button>
        ) : null}
        {clearable && value ? (
          <button
            type="button"
            onClick={() => onPick('')}
            className={btn.ghost}
          >
            Xoá ngày
          </button>
        ) : null}
        <button type="button" onClick={onClose} className={btn.ghost}>
          Đóng
        </button>
      </div>
    </BottomSheet>
  )
}
