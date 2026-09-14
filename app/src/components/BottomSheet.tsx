import type { ReactNode } from 'react'

/** Overlay + panel trượt từ đáy — shell chung cho ConfirmSheet, Date/Time, Map. */
export function BottomSheet({
  onClose,
  ariaLabel,
  children,
  panelClassName = '',
  zClass = 'z-50',
}: {
  onClose: () => void
  ariaLabel: string
  children: ReactNode
  /** Thêm class lên panel (ví dụ `flex max-h-sheet flex-col`). */
  panelClassName?: string
  /** Mặc định z-50; Nudge dùng z-40 để nằm dưới tab khi cần. */
  zClass?: string
}) {
  return (
    <div
      className={`fixed inset-0 flex items-end bg-black/40 ${zClass}`}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onClick={onClose}
    >
      <div
        className={`w-full rounded-t-3xl border-t border-border bg-bg p-5 pb-safe ${panelClassName}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
