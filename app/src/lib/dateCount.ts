/** Calendar-day math in the device timezone. Never parse YYYY-MM-DD via Date.UTC. */

export function todayYmd(timeZone?: string): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: timeZone ?? undefined,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return fmt.format(new Date())
}

function parseYmd(ymd: string): { y: number; m: number; d: number } {
  const [y, m, d] = ymd.split('-').map(Number)
  return { y, m, d }
}

function ymdToOrdinal({ y, m, d }: { y: number; m: number; d: number }): number {
  // Rata Die-ish via civil calendar (proleptic Gregorian)
  const a = Math.floor((14 - m) / 12)
  const y2 = y + 4800 - a
  const m2 = m + 12 * a - 3
  return (
    d +
    Math.floor((153 * m2 + 2) / 5) +
    365 * y2 +
    Math.floor(y2 / 4) -
    Math.floor(y2 / 100) +
    Math.floor(y2 / 400) -
    32045
  )
}

/** Days together; start date counts as day 1. */
export function daysTogether(startDate: string, today = todayYmd()): number {
  const start = ymdToOrdinal(parseYmd(startDate))
  const end = ymdToOrdinal(parseYmd(today))
  return end - start + 1
}

function daysInMonth(y: number, m: number): number {
  return new Date(y, m, 0).getDate()
}

function addMonthsClamped(ymd: string, months: number): string {
  const { y, m, d } = parseYmd(ymd)
  const total = y * 12 + (m - 1) + months
  const ny = Math.floor(total / 12)
  const nm = (total % 12) + 1
  const nd = Math.min(d, daysInMonth(ny, nm))
  return `${ny}-${String(nm).padStart(2, '0')}-${String(nd).padStart(2, '0')}`
}

function addYearsClamped(ymd: string, years: number): string {
  const { y, m, d } = parseYmd(ymd)
  const ny = y + years
  const nd = m === 2 && d === 29 ? Math.min(d, daysInMonth(ny, 2)) : d
  return `${ny}-${String(m).padStart(2, '0')}-${String(nd).padStart(2, '0')}`
}

const DAY_MARKS = [
  100, 200, 300, 365, 500, 600, 700, 730, 800, 900, 1000, 1095, 1460, 1825, 2000,
  2555, 3000, 3650,
]

export type Milestone = {
  label: string
  date: string
  daysAway: number
}

export function nextMilestone(
  startDate: string,
  today = todayYmd(),
): Milestone | null {
  const candidates: Milestone[] = []

  for (const n of DAY_MARKS) {
    const date = ordinalToYmd(ymdToOrdinal(parseYmd(startDate)) + n - 1)
    const daysAway = ymdToOrdinal(parseYmd(date)) - ymdToOrdinal(parseYmd(today))
    if (daysAway >= 0) {
      candidates.push({ label: `Ngày thứ ${n}`, date, daysAway })
    }
  }

  for (let mo = 1; mo <= 120; mo++) {
    const date = addMonthsClamped(startDate, mo)
    const daysAway = ymdToOrdinal(parseYmd(date)) - ymdToOrdinal(parseYmd(today))
    if (daysAway >= 0) {
      candidates.push({ label: `Tròn ${mo} tháng`, date, daysAway })
    }
  }

  for (let y = 1; y <= 50; y++) {
    const date = addYearsClamped(startDate, y)
    const daysAway = ymdToOrdinal(parseYmd(date)) - ymdToOrdinal(parseYmd(today))
    if (daysAway >= 0) {
      candidates.push({
        label: y === 1 ? 'Kỉ niệm 1 năm' : `Kỉ niệm ${y} năm`,
        date,
        daysAway,
      })
    }
  }

  candidates.sort((a, b) => a.daysAway - b.daysAway || a.date.localeCompare(b.date))
  return candidates[0] ?? null
}

function ordinalToYmd(ord: number): string {
  // Inverse of ymdToOrdinal (Fliegel & Van Flandern style)
  let l = ord + 68569
  const n = Math.floor((4 * l) / 146097)
  l = l - Math.floor((146097 * n + 3) / 4)
  const i = Math.floor((4000 * (l + 1)) / 1461001)
  l = l - Math.floor((1461 * i) / 4) + 31
  const j = Math.floor((80 * l) / 2447)
  const d = l - Math.floor((2447 * j) / 80)
  l = Math.floor(j / 11)
  const m = j + 2 - 12 * l
  const y = 100 * (n - 49) + i + l
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}
