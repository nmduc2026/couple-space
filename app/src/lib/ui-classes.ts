/* Chuỗi class dùng lại cho nút và ô nhập.
   Tách khỏi components/ui.tsx để file kia chỉ export component (Fast Refresh). */

const BTN =
  'flex h-13 w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45'

export const btn = {
  primary: `${BTN} bg-accent text-on-accent shadow-[0_12px_28px_-14px_var(--color-accent)]`,
  outline: `${BTN} border border-border bg-surface text-text`,
  ghost: `${BTN} font-medium text-muted`,
  danger: `${BTN} border border-accent bg-transparent text-accent`,
}

export const input =
  'h-12 w-full rounded-2xl border border-border bg-surface px-4 text-[15px] text-text outline-none transition placeholder:text-muted/50 focus:border-accent focus:ring-4 focus:ring-accent/15 disabled:opacity-60'
