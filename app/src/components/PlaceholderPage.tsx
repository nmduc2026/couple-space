type PlaceholderPageProps = {
  title: string
  hint?: string
}

export function PlaceholderPage({ title, hint }: PlaceholderPageProps) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-2 bg-bg px-4 pb-24 pt-safe text-center">
      <h1 className="text-2xl font-semibold text-text">{title}</h1>
      {hint ? <p className="text-sm text-muted">{hint}</p> : null}
    </main>
  )
}
