import { formatAmountInput } from '../lib/money'
import { input } from '../lib/ui-classes'

const VARIANTS = {
  lg: {
    wrap: 'relative',
    field: `${input} h-16 pr-12 text-right text-[28px] font-bold tabular-nums`,
    unit: 'pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-lg text-muted',
  },
  md: {
    wrap: 'relative',
    field: `${input} h-14 pr-10 text-right text-[22px] font-bold tabular-nums`,
    unit: 'pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-muted',
  },
  inline: {
    wrap: 'relative min-w-0 flex-1',
    field: `${input} w-full pr-10 text-right tabular-nums`,
    unit: 'pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm text-muted',
  },
} as const

export function AmountInput({
  value,
  onChange,
  variant = 'md',
  placeholder = '0',
  autoFocus = false,
  className = '',
}: {
  value: string
  onChange: (next: string) => void
  variant?: keyof typeof VARIANTS
  placeholder?: string
  autoFocus?: boolean
  className?: string
}) {
  const v = VARIANTS[variant]
  return (
    <div className={`${v.wrap} ${className}`}>
      <input
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(formatAmountInput(e.target.value))}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={v.field}
      />
      <span className={v.unit}>đ</span>
    </div>
  )
}
