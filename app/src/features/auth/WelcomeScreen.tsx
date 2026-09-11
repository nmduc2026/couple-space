import { Link } from 'react-router'

export function WelcomeScreen() {
  return (
    <main className="relative flex min-h-svh flex-col overflow-hidden bg-bg pt-safe pb-safe">
      {/* Khối màu chủ đạo — atmosphere, không phải card */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[55%] bg-[radial-gradient(ellipse_at_50%_0%,color-mix(in_srgb,var(--color-accent)_28%,transparent),transparent_70%)]"
      />

      <div className="relative flex flex-1 flex-col items-center justify-center px-6 text-center">
        <img
          src="/logo.svg"
          alt=""
          width={88}
          height={88}
          className="rounded-[1.25rem] shadow-lg shadow-accent/20"
        />
        <h1 className="mt-8 text-3xl font-semibold tracking-tight text-text">
          Couple Space
        </h1>
        <p className="mt-3 max-w-[26ch] text-base leading-relaxed text-muted">
          Nơi hai người cùng viết lại chuyện tình của mình
        </p>
      </div>

      <div className="relative px-6 pb-28">
        <Link
          to="/login"
          className="flex h-12 w-full items-center justify-center rounded-xl bg-accent text-base font-medium text-white transition active:scale-[0.98]"
        >
          Bắt đầu
        </Link>
      </div>
    </main>
  )
}
