import { useEffect, useMemo, useRef, useState } from 'react'
import { IconChevronDown } from './icons'
import { Modal } from './Modal'
import { input, fieldButton } from '../lib/ui-classes'

export type SelectOption = {
  value: string
  label: string
}

/**
 * Ô chọn một giá trị — cùng tinh thần DateField: nút mở Modal,
 * không dùng `<select>` native (trông lệch app, khó style trên iOS).
 */
export function SelectField({
  value,
  options,
  onChange,
  placeholder,
  disabled = false,
  searchable = true,
  clearLabel,
  className = '',
}: {
  value: string
  options: SelectOption[]
  onChange: (next: string) => void
  placeholder: string
  disabled?: boolean
  /** Hiện ô tìm khi danh sách dài (mặc định bật). */
  searchable?: boolean
  /** Nếu có — thêm dòng xoá lựa chọn (value = ''). */
  clearLabel?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const blockOpenUntil = useRef(0)

  function close() {
    blockOpenUntil.current = Date.now() + 400
    setOpen(false)
  }

  const selected = options.find((o) => o.value === value)

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return
          if (Date.now() < blockOpenUntil.current) return
          setOpen(true)
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`${fieldButton} ${
          selected ? 'text-text' : 'text-muted/50'
        } ${className}`}
      >
        <span className="min-w-0 flex-1 truncate">
          {selected?.label ?? placeholder}
        </span>
        <IconChevronDown size={18} className="shrink-0 text-muted" />
      </button>

      {open ? (
        <SelectSheet
          title={placeholder}
          value={value}
          options={options}
          searchable={searchable}
          clearLabel={clearLabel}
          onPick={(next) => {
            onChange(next)
            close()
          }}
          onClose={close}
        />
      ) : null}
    </>
  )
}

function SelectSheet({
  title,
  value,
  options,
  searchable,
  clearLabel,
  onPick,
  onClose,
}: {
  title: string
  value: string
  options: SelectOption[]
  searchable: boolean
  clearLabel?: string
  onPick: (next: string) => void
  onClose: () => void
}) {
  const [q, setQ] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const needle = q.trim().toLowerCase()

  const filtered = useMemo(() => {
    if (!needle) return options
    return options.filter((o) => o.label.toLowerCase().includes(needle))
  }, [options, needle])

  useEffect(() => {
    if (!searchable) return
    // iOS: focus sau một nhịp để Modal kịp mount
    const t = window.setTimeout(() => inputRef.current?.focus(), 50)
    return () => window.clearTimeout(t)
  }, [searchable])

  return (
    <Modal
      onClose={onClose}
      ariaLabel={title}
      panelClassName="!p-0 max-h-[min(85svh,36rem)]"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3.5">
        <h2 className="text-[16px] font-bold text-text">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-[14px] font-medium text-muted"
        >
          Đóng
        </button>
      </div>

      {searchable ? (
        <div className="border-b border-border px-4 py-3">
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm…"
            className={input}
          />
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {clearLabel ? (
          <OptionRow
            active={!value}
            onClick={() => onPick('')}
            muted
          >
            {clearLabel}
          </OptionRow>
        ) : null}
        {filtered.map((o) => (
          <OptionRow
            key={o.value}
            active={o.value === value}
            onClick={() => onPick(o.value)}
          >
            {o.label}
          </OptionRow>
        ))}
        {filtered.length === 0 ? (
          <p className="px-3 py-6 text-center text-[13.5px] text-muted">
            Không có kết quả.
          </p>
        ) : null}
      </div>
    </Modal>
  )
}

function OptionRow({
  children,
  active,
  muted,
  onClick,
}: {
  children: React.ReactNode
  active: boolean
  muted?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-3 text-left text-[15px] transition ${
        active
          ? 'bg-soft font-semibold text-accent'
          : muted
            ? 'text-muted'
            : 'text-text'
      }`}
    >
      <span
        aria-hidden
        className={`grid h-5 w-5 flex-none place-items-center rounded-full border text-[11px] ${
          active
            ? 'border-accent bg-accent text-on-accent'
            : 'border-border text-transparent'
        }`}
      >
        ✓
      </span>
      <span className="min-w-0 flex-1">{children}</span>
    </button>
  )
}
