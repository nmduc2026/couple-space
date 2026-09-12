import type { ReactNode } from 'react'
import { btn } from '../lib/ui-classes'
import { Link } from 'react-router'

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
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`mx-auto flex w-full max-w-[calc(28rem/var(--ui-scale))] flex-1 flex-col px-5 pb-8 ${className}`}
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
          className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface text-[16px] text-text"
        >
          ←
        </span>
        {label}
      </Link>
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

/** Nhãn trường nhập liệu — chữ nhỏ, in hoa, giãn chữ. */
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
      <span className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">
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
      className={`px-1 text-[11px] font-bold tracking-[0.13em] uppercase ${
        tone === 'danger' ? 'text-accent' : 'text-muted'
      }`}
    >
      {children}
    </h2>
  )
}

/** Nhóm các hàng cài đặt, bo góc chung, kẻ ngăn giữa các hàng. */
export function Group({ children }: { children: ReactNode }) {
  return (
    <div className="mt-2 overflow-hidden rounded-2xl border border-border bg-surface divide-y divide-border">
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

/** Công tắc bật/tắt — thay cho checkbox mặc định của trình duyệt. */
export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${
        checked ? 'bg-accent' : 'bg-border'
      }`}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-all ${
          checked ? 'left-[1.375rem]' : 'left-0.5'
        }`}
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

/** Hộp hỏi lại trượt từ đáy, dùng khi `window.confirm` không đủ —
 *  nó chỉ có hai nút và nút mặc định luôn là "đồng ý", nên không diễn tả
 *  được lựa chọn an toàn mặc định. Ở đây nút đầu tiên mới là mặc định. */
export function ConfirmSheet({
  title,
  body,
  confirmLabel,
  cancelLabel = 'Thôi',
  onConfirm,
  onCancel,
  children,
}: {
  title: string
  body?: ReactNode
  confirmLabel: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  children?: ReactNode
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onCancel}
    >
      <div
        className="w-full rounded-t-3xl border-t border-border bg-bg p-5 pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[17px] font-semibold text-text">{title}</p>
        {body ? (
          <div className="mt-2 text-[13.5px] leading-relaxed text-muted">
            {body}
          </div>
        ) : null}
        {children}
        <div className="mt-5 space-y-2">
          <button type="button" onClick={onConfirm} className={btn.primary}>
            {confirmLabel}
          </button>
          <button type="button" onClick={onCancel} className={btn.ghost}>
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
