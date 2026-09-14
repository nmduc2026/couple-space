import { useEffect, useRef, useState } from 'react'
import { btn } from '../lib/ui-classes'
import { BottomSheet } from './BottomSheet'

/*
 * Ô chọn giờ của riêng app, thay cho `<input type="time">`.
 *
 * Cùng lý do với DateField: bảng chọn giờ do trình duyệt vẽ, CSS không với
 * tới. Thêm một điểm nữa — máy để tiếng Anh thì nó hiện 12 giờ kèm AM/PM,
 * trong khi phần còn lại của app nói "9 giờ sáng", "giờ yên lặng 23:00–07:00".
 *
 * Giá trị vào/ra là chuỗi "HH:MM" 24 giờ, đúng kiểu cột `time` của Postgres.
 * Chuỗi rỗng nghĩa là chưa đặt.
 */

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
/** Bước 5 phút: giờ yên lặng không ai đặt 23:07. */
const MINUTES = Array.from({ length: 12 }, (_, i) =>
  String(i * 5).padStart(2, '0'),
)

export function TimeField({
  value,
  onChange,
  label,
  placeholder = '--:--',
  className = '',
}: {
  value: string
  onChange: (next: string) => void
  label: string
  placeholder?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={label}
        className={`${className} ${value ? '' : 'text-muted'}`}
      >
        {value ? value.slice(0, 5) : placeholder}
      </button>

      {open ? (
        <TimeSheet
          value={value}
          label={label}
          onPick={(next) => {
            onChange(next)
            setOpen(false)
          }}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  )
}

function TimeSheet({
  value,
  label,
  onPick,
  onClose,
}: {
  value: string
  label: string
  onPick: (next: string) => void
  onClose: () => void
}) {
  const [hour, setHour] = useState(value ? value.slice(0, 2) : '22')
  // Làm tròn xuống bội số của 5 để giá trị cũ lẻ phút vẫn khớp một ô
  const [minute, setMinute] = useState(() => {
    if (!value) return '00'
    const m = Number(value.slice(3, 5))
    return String(Math.floor(m / 5) * 5).padStart(2, '0')
  })

  // Cuộn tới giá trị đang chọn khi mở. Không có bước này thì mở ra thấy
  // "22:00" mà danh sách vẫn đứng ở 00 — người dùng tưởng nó chưa nhận.
  const hourRef = useRef<HTMLDivElement>(null)
  const minuteRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    for (const ref of [hourRef, minuteRef]) {
      const active = ref.current?.querySelector('[data-active="true"]')
      active?.scrollIntoView({ block: 'center' })
    }
    // chỉ chạy một lần lúc mở; cuộn lại sau mỗi lần bấm là giật màn hình
  }, [])

  const column =
    'flex-1 max-h-56 overflow-y-auto rounded-xl border border-border bg-surface p-1'
  const cell = (active: boolean) =>
    `w-full rounded-xl py-2.5 text-center text-[15px] tabular-nums transition ${
      active ? 'bg-accent font-bold text-on-accent' : 'text-text'
    }`

  return (
    <BottomSheet onClose={onClose} ariaLabel={label}>
      <p className="text-[17px] font-semibold text-text">{label}</p>
      <p className="mt-1 text-[26px] font-extrabold tabular-nums text-accent">
        {hour}:{minute}
      </p>

      <div className="mt-4 flex gap-2">
        <div ref={hourRef} className={column}>
          {HOURS.map((h) => (
            <button
              key={h}
              type="button"
              data-active={h === hour}
              onClick={() => setHour(h)}
              className={cell(h === hour)}
            >
              {h}
            </button>
          ))}
        </div>
        <div ref={minuteRef} className={column}>
          {MINUTES.map((m) => (
            <button
              key={m}
              type="button"
              data-active={m === minute}
              onClick={() => setMinute(m)}
              className={cell(m === minute)}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <button
          type="button"
          onClick={() => onPick(`${hour}:${minute}`)}
          className={btn.primary}
        >
          Chọn {hour}:{minute}
        </button>
        {value ? (
          <button
            type="button"
            onClick={() => onPick('')}
            className={btn.ghost}
          >
            Bỏ đặt giờ
          </button>
        ) : null}
        <button type="button" onClick={onClose} className={btn.ghost}>
          Đóng
        </button>
      </div>
    </BottomSheet>
  )
}
