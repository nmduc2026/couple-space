/* Chuỗi class dùng lại cho nút và ô nhập.
   Tách khỏi components/ui.tsx để file kia chỉ export component (Fast Refresh). */

const BTN =
  'flex h-13 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45'

export const btn = {
  // Bóng đổ nhẹ thôi. Bản cũ toả rộng 28px làm nút trông như đang phát sáng,
  // nhoè hẳn ra nền — nhất là sau khi cả app đã thu nhỏ.
  primary: `${BTN} bg-accent text-on-accent shadow-[0_6px_14px_-10px_var(--color-accent)]`,
  outline: `${BTN} border border-border bg-surface text-text`,
  ghost: `${BTN} font-medium text-muted`,
  danger: `${BTN} border border-accent bg-transparent text-accent`,
}

/** Viền / padding ô nhập — không gắn cỡ chữ (AmountInput tự set cỡ lớn). */
export const inputChrome =
  'h-12 w-full rounded-xl border border-border bg-surface px-4 text-text outline-none transition placeholder:text-muted/50 focus:border-accent focus:ring-4 focus:ring-accent/15 disabled:opacity-60'

/** Ô nhập thường: 16px — đủ để Safari iOS không phóng trang khi focus. */
export const input = `${inputChrome} text-[16px]`

/** Nút giả ô nhập (DateField, SelectField, …) — cùng cao / cùng cỡ chữ với `input`. */
export const fieldButton = `${input} flex items-center gap-2 text-left`
