import { Link } from 'react-router'
import { btn } from '../../lib/ui-classes'

export function WelcomeScreen() {
  return (
    <main className="relative flex min-h-app flex-col overflow-hidden bg-bg pb-safe">
      {/* Quầng màu chủ đạo — không khí, không phải card */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[60%] bg-[radial-gradient(ellipse_at_50%_0%,color-mix(in_srgb,var(--color-accent)_26%,transparent),transparent_70%)]"
      />

      <div className="relative flex flex-1 flex-col items-center justify-center px-6 text-center">
        <img
          src="/logo.svg"
          alt=""
          width={92}
          height={92}
          className="rounded-[1.5rem] shadow-[0_20px_44px_-20px_var(--color-accent)]"
        />
        <h1 className="mt-9 text-[30px] font-extrabold tracking-[-0.03em] text-text">
          Couple Space
        </h1>
        <p className="mt-3 max-w-[26ch] text-[15px] leading-relaxed text-muted">
          Không gian chung của hai người.
        </p>
      </div>

      <div className="relative mx-auto w-full max-w-[calc(28rem/var(--ui-scale))] px-5 pb-10">
        <Link to="/login" className={btn.primary}>
          Bắt đầu
        </Link>
      </div>
    </main>
  )
}
