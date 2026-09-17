import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Modal } from './Modal'
import { IconArrowLeft } from './icons'

/* Ngôn ngữ thiết kế lấy từ docs/design/frontend/ui/prototype.html.
   Sửa ở đây, mọi màn hình đổi theo — đừng chép chuỗi class đi nơi khác. */

/** Khung một màn hình: nền, chiều cao đầy màn, vùng an toàn dưới đáy. */
export function Screen({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <main className={`flex min-h-app flex-col bg-bg pb-safe ${className}`}>
      {children}
    </main>
  )
}

/** Cột nội dung giữa màn, giới hạn bề ngang trên máy rộng. */
export function Stage({
  children,
  className = '',
  pad = 'px-5',
}: {
  children: ReactNode
  className?: string
  /** Settings dùng px-4 cho sát hơn với hàng Group. */
  pad?: 'px-5' | 'px-4'
}) {
  return (
    <div
      className={`mx-auto flex w-full max-w-[calc(28rem/var(--ui-scale))] flex-1 flex-col ${pad} pb-8 ${className}`}
    >
      {children}
    </div>
  )
}

/** Thanh trên cùng có nút quay lại.
 *
 *  Mũi tên nằm trong một vòng tròn có viền: chữ "Quay lại" hay "Huỷ" đứng
 *  trơ một mình trông giống nhãn hơn là nút bấm, và vùng chạm của chữ thì
 *  hẹp hơn ngón tay. */
export function TopBar({ to, label = 'Quay lại' }: { to: string; label?: string }) {
  return (
    <div className="top-safe px-4 pb-2">
      <Link
        to={to}
        className="inline-flex items-center gap-2 text-[14px] font-medium text-muted transition active:scale-95 hover:text-text"
      >
        <span
          aria-hidden
          className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface text-text"
        >
          <IconArrowLeft size={18} />
        </span>
        {label}
      </Link>
    </div>
  )
}

/**
 * Header form: mũi tên (không chữ Huỷ) cùng hàng với tiêu đề.
 * Dùng cho soạn bài / sửa khoản / sửa dịp — tránh title tách hàng dưới TopBar.
 */
export function FormHeader({
  title,
  to,
  onBack,
  backLabel = 'Huỷ',
}: {
  title: string
  to?: string
  onBack?: () => void
  backLabel?: string
}) {
  const backClass = 'shrink-0 transition active:scale-95'
  const icon = (
    <span
      aria-hidden
      className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface text-text"
    >
      <IconArrowLeft size={18} />
    </span>
  )

  return (
    <div
      className="top-safe flex items-center gap-3 px-4 pb-3"
      style={{ ['--top-safe-extra' as string]: '1.35rem' }}
    >
      {onBack ? (
        <button
          type="button"
          aria-label={backLabel}
          onClick={onBack}
          className={backClass}
        >
          {icon}
        </button>
      ) : (
        <Link to={to ?? '/'} aria-label={backLabel} className={backClass}>
          {icon}
        </Link>
      )}
      <h1 className="min-w-0 flex-1 text-[23px] font-semibold tracking-[-0.02em] text-text">
        {title}
      </h1>
    </div>
  )
}

export function Title({ children }: { children: ReactNode }) {
  return (
    <h1 className="text-[23px] font-bold tracking-[-0.02em] text-balance text-text">
      {children}
    </h1>
  )
}

export function Sub({ children }: { children: ReactNode }) {
  return <p className="mt-1.5 text-sm leading-relaxed text-muted">{children}</p>
}

/** Nhãn trường nhập liệu.
 *
 *  Trước đây in hoa và giãn chữ. Kiểu đó đọc chậm hơn hẳn với tiếng Việt vì
 *  dấu bị đẩy lên cao và các chữ IN HOA mất đường viền trên dưới vốn giúp mắt
 *  nhận ra từ. Chữ thường, cỡ nhỏ, màu nhạt đã đủ nói "đây là nhãn". */
export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="text-[13px] font-medium text-muted">
        {label}
      </span>
      <div className="mt-2">{children}</div>
      {hint ? <span className="mt-1.5 block text-xs text-muted">{hint}</span> : null}
    </label>
  )
}

/** Tiêu đề một nhóm trong Cài đặt. */
export function SectionLabel({
  children,
  tone = 'muted',
}: {
  children: ReactNode
  tone?: 'muted' | 'danger'
}) {
  return (
    <h2
      className={`px-1 text-[13px] font-semibold ${
        tone === 'danger' ? 'text-accent' : 'text-muted'
      }`}
    >
      {children}
    </h2>
  )
}

/** Nhóm các hàng cài đặt, bo góc chung, kẻ ngăn giữa các hàng. */
export function Group({
  children,
  className = 'mt-2',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-border bg-surface divide-y divide-border ${className}`}
    >
      {children}
    </div>
  )
}

export function Row({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`px-4 py-3.5 ${className}`}>{children}</div>
}

/** Công tắc bật/tắt — thay cho checkbox mặc định của trình duyệt.
 *  Transition chỉ bật sau khi đã paint xong frame đầu (double rAF):
 *  một lần rAF vẫn chạy trước paint → trình duyệt animate từ vị trí
 *  mặc định (tắt) → bật dù `checked` vốn đã là true. */
export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
}) {
  const [motion, setMotion] = useState(false)
  useEffect(() => {
    let inner = 0
    const outer = window.requestAnimationFrame(() => {
      inner = window.requestAnimationFrame(() => setMotion(true))
    })
    return () => {
      window.cancelAnimationFrame(outer)
      window.cancelAnimationFrame(inner)
    }
  }, [])

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full ${
        motion ? 'transition-colors' : ''
      } ${checked ? 'bg-accent' : 'bg-border'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-sm ${
          motion ? 'transition-transform' : ''
        } ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  )
}

/** Thông báo lỗi trong form. */
export function ErrorText({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 text-sm text-accent" role="alert">
      {children}
    </p>
  )
}

/** Đẩy phần còn lại xuống đáy màn hình. */
export function Spacer() {
  return <div className="min-h-4 flex-1" />
}

/** Màn chờ dùng chung cho mọi chỗ đang tải dữ liệu. */
export function Loading({ text = 'Đang tải...' }: { text?: string }) {
  return (
    <main className="flex min-h-app items-center justify-center bg-bg">
      <p className="animate-pulse text-sm text-muted">{text}</p>
    </main>
  )
}

/**
 * Hộp xác nhận dùng chung (popup giữa màn).
 * Hai nút một hàng: Xác nhận | Hủy.
 */
export function ConfirmSheet({
  title,
  body,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  onConfirm,
  onCancel,
  children,
}: {
  title: string
  body?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  children?: ReactNode
}) {
  return (
    <Modal onClose={onCancel} ariaLabel={title}>
      <p className="text-[17px] font-semibold text-text">{title}</p>
      {body ? (
        <div className="mt-2 text-[13.5px] leading-relaxed text-muted">
          {body}
        </div>
      ) : null}
      {children}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onConfirm}
          className="flex h-10 flex-1 items-center justify-center rounded-xl bg-accent text-[14px] font-semibold text-on-accent transition active:scale-[0.98]"
        >
          {confirmLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex h-10 flex-1 items-center justify-center rounded-xl border border-border bg-surface text-[14px] font-semibold text-text transition active:scale-[0.98]"
        >
          {cancelLabel}
        </button>
      </div>
    </Modal>
  )
}

/** Alias rõ nghĩa — cùng `ConfirmSheet`. */
export const ConfirmDialog = ConfirmSheet
