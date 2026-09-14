import { type FormEvent } from 'react'
import { input } from '../lib/ui-classes'

/** Hàng nhanh: ô nhập + nút Thêm — Eat / Goals / Wishlist. */
export function QuickAddRow({
  value,
  onChange,
  onSubmit,
  placeholder,
  submitLabel = 'Thêm',
  disabled = false,
  className = '',
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void | Promise<void>
  placeholder: string
  submitLabel?: string
  disabled?: boolean
  className?: string
}) {
  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    void onSubmit()
  }

  return (
    <form onSubmit={handleSubmit} className={`flex gap-2 ${className}`}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${input} flex-1`}
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="h-12 shrink-0 rounded-xl border border-border px-4 text-sm font-semibold text-text disabled:opacity-40"
      >
        {submitLabel}
      </button>
    </form>
  )
}
