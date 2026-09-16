import type { ReactNode } from 'react'

/**
 * Popup giữa màn hình — shell chung cho ConfirmSheet, Date/Time, Map, Nudge.
 * Thay cho BottomSheet (trượt từ đáy).
 */
export function Modal({
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
      className={`fixed inset-0 flex items-center justify-center bg-black/40 px-4 ${zClass}`}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onClick={onClose}
    >
      <div
        className={`flex max-h-[min(85svh,40rem)] w-full max-w-[calc(28rem/var(--ui-scale))] flex-col overflow-hidden rounded-2xl border border-border bg-bg p-5 shadow-xl ${panelClassName}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

/** @deprecated Dùng `Modal` — giữ alias để import cũ không gãy. */
export const BottomSheet = Modal
