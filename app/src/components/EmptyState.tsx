import { Link } from 'react-router'
import { btn } from '../lib/ui-classes'

type EmptyAction =
  | { type: 'link'; to: string; label: string }
  | { type: 'button'; label: string; onClick: () => void }

/** Trạng thái trống dạng hero — emoji + tiêu đề (+ CTA tùy chọn). */
export function EmptyState({
  emoji,
  title,
  subtitle,
  action,
  compact = false,
  className = '',
}: {
  emoji: string
  title: string
  subtitle?: string
  action?: EmptyAction
  /** Goals dùng py-14 thay vì py-16 */
  compact?: boolean
  className?: string
}) {
  return (
    <div
      className={`flex flex-col items-center px-6 text-center ${
        compact ? 'py-14' : 'py-16'
      } ${className}`}
    >
      <p className="text-5xl" aria-hidden>
        {emoji}
      </p>
      <p className="mt-5 text-[17px] font-semibold text-text">{title}</p>
      {subtitle ? (
        <p className="mt-2 max-w-[30ch] text-sm leading-relaxed text-muted">
          {subtitle}
        </p>
      ) : null}
      {action?.type === 'link' ? (
        <Link to={action.to} className={`${btn.primary} mt-7 max-w-[18rem]`}>
          {action.label}
        </Link>
      ) : null}
      {action?.type === 'button' ? (
        <button
          type="button"
          onClick={action.onClick}
          className={`${btn.primary} mt-7 max-w-[18rem]`}
        >
          {action.label}
        </button>
      ) : null}
    </div>
  )
}

/** Dòng “Đang tải...” trong list — khác `Loading` full-page. */
export function InlineLoading({ className = '' }: { className?: string }) {
  return (
    <p className={`py-16 text-center text-sm text-muted ${className}`}>
      Đang tải...
    </p>
  )
}
