/** Tab dạng segment — OTP/MK, Plan, Eat, Wishlist… */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = '',
}: {
  options: Array<{ value: T; label: string }>
  value: T
  onChange: (next: T) => void
  className?: string
}) {
  return (
    <div
      className={`flex gap-1 rounded-xl border border-border bg-surface p-1 ${className}`}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
            value === option.value
              ? 'bg-accent text-on-accent'
              : 'text-muted hover:text-text'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
