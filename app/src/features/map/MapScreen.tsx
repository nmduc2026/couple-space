import { useMemo } from 'react'
import { Link } from 'react-router'
import { TopHeader } from '../../components/AppShell'
import { usePosts } from '../../hooks/usePosts'
import {
  PROVINCES,
  PROVINCE_COUNT,
  guessProvince,
  provinceByCode,
  type Zone,
} from '../../lib/provinces'
import { btn } from '../../lib/ui-classes'

const ZONES: Array<{ key: Zone; label: string }> = [
  { key: 'bac', label: 'Miền Bắc' },
  { key: 'trung', label: 'Miền Trung' },
  { key: 'nam', label: 'Miền Nam' },
]

export function MapScreen() {
  const { posts, isLoading } = usePosts()

  const { visits, foreign } = useMemo(() => {
    const visits = new Map<string, number>()
    let foreign = 0
    for (const post of posts) {
      if (!post.place_name) continue
      const code = guessProvince(post.place_name)
      if (code) visits.set(code, (visits.get(code) ?? 0) + 1)
      else foreign++
    }
    return { visits, foreign }
  }, [posts])

  const visitedCount = visits.size
  const topProvince = [...visits.entries()].sort((a, b) => b[1] - a[1])[0]

  return (
    <>
      <TopHeader title="Dấu chân" />

      <div className="flex-1 px-4 py-4">
        {isLoading ? (
          <p className="py-16 text-center text-sm text-muted">Đang tải...</p>
        ) : visitedCount === 0 ? (
          <EmptyState hasPosts={posts.length > 0} />
        ) : (
          <>
            <section className="rounded-2xl border border-border bg-surface p-4">
              <p className="text-[30px] leading-tight font-extrabold text-text">
                {visitedCount}
                <span className="text-[17px] font-semibold text-muted">
                  /{PROVINCE_COUNT} tỉnh thành
                </span>
              </p>
              <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-soft">
                <span
                  className="block h-full rounded-full bg-accent"
                  style={{
                    width: `${(visitedCount / PROVINCE_COUNT) * 100}%`,
                  }}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-muted">
                {topProvince ? (
                  <span>
                    Đi nhiều nhất:{' '}
                    <b className="font-semibold text-text">
                      {provinceByCode(topProvince[0])?.name}
                    </b>{' '}
                    ({topProvince[1]} lần)
                  </span>
                ) : null}
                {foreign > 0 ? (
                  <span>
                    <b className="font-semibold text-text">{foreign}</b> kỉ niệm
                    ở nơi chưa nhận ra
                  </span>
                ) : null}
              </div>
            </section>

            {ZONES.map((zone) => (
              <section key={zone.key} className="mt-5">
                <h2 className="text-[11px] font-bold tracking-[0.13em] text-muted uppercase">
                  {zone.label}
                </h2>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {PROVINCES.filter((p) => p.zone === zone.key).map((p) => {
                    const count = visits.get(p.code) ?? 0
                    return count > 0 ? (
                      <Link
                        key={p.code}
                        to={`/timeline?place=${encodeURIComponent(p.name)}`}
                        className="rounded-full bg-accent px-2.5 py-1 text-[12px] font-semibold text-on-accent"
                      >
                        {p.name} · {count}
                      </Link>
                    ) : (
                      <span
                        key={p.code}
                        className="rounded-full border border-border px-2.5 py-1 text-[12px] text-muted/60"
                      >
                        {p.name}
                      </span>
                    )
                  })}
                </div>
              </section>
            ))}

            <p className="mt-6 text-center text-[12px] leading-relaxed text-muted">
              Đây chưa phải bản đồ vẽ thật — mới là lưới theo vùng. Bản SVG 63
              tỉnh sẽ thay vào đúng chỗ này.
            </p>
          </>
        )}
      </div>
    </>
  )
}

function EmptyState({ hasPosts }: { hasPosts: boolean }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <p className="text-5xl" aria-hidden>
        🗺️
      </p>
      <p className="mt-5 text-[17px] font-semibold text-text">
        Chưa có dấu chân nào
      </p>
      <p className="mt-2 max-w-[30ch] text-sm leading-relaxed text-muted">
        {hasPosts
          ? 'Kỉ niệm đã có rồi nhưng chưa gắn địa điểm. Mở một bài và thêm nơi chốn vào là bản đồ sáng lên ngay.'
          : 'Đăng một kỉ niệm có gắn địa điểm, chỗ đó sẽ hiện lên đây.'}
      </p>
      <Link
        to={hasPosts ? '/timeline' : '/compose'}
        className={`${btn.primary} mt-7 max-w-[18rem]`}
      >
        {hasPosts ? 'Mở kỉ niệm gần nhất' : 'Thêm kỉ niệm'}
      </Link>
    </div>
  )
}
