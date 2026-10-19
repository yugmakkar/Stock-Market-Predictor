// NSE trading-day calendar. Skips weekends and known NSE trading holidays.
// Holiday lists are the published NSE equity-segment holidays for each year;
// beyond the known years we fall back to weekday-only stepping.

const NSE_HOLIDAYS: Record<number, string[]> = {
  2025: [
    "2025-02-26", // Mahashivratri
    "2025-03-14", // Holi
    "2025-03-31", // Id-Ul-Fitr
    "2025-04-10", // Mahavir Jayanti
    "2025-04-14", // Dr. Ambedkar Jayanti
    "2025-04-18", // Good Friday
    "2025-05-01", // Maharashtra Day
    "2025-08-15", // Independence Day
    "2025-08-27", // Ganesh Chaturthi
    "2025-10-02", // Gandhi Jayanti / Dussehra
    "2025-10-21", // Diwali Laxmi Pujan
    "2025-10-22", // Diwali Balipratipada
    "2025-11-05", // Guru Nanak Jayanti
    "2025-12-25", // Christmas
  ],
  2026: [
    "2026-01-26", // Republic Day
    "2026-03-04", // Holi
    "2026-03-21", // Id-Ul-Fitr
    "2026-03-31", // Mahavir Jayanti
    "2026-04-03", // Good Friday
    "2026-04-14", // Dr. Ambedkar Jayanti
    "2026-05-01", // Maharashtra Day
    "2026-08-15", // Independence Day
    "2026-10-02", // Gandhi Jayanti
    "2026-11-09", // Diwali (indicative)
    "2026-11-24", // Guru Nanak Jayanti
    "2026-12-25", // Christmas
  ],
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function isTradingDay(d: Date): boolean {
  const day = d.getUTCDay()
  if (day === 0 || day === 6) return false // Sun / Sat
  const holidays = NSE_HOLIDAYS[d.getUTCFullYear()]
  if (holidays && holidays.includes(isoDate(d))) return false
  return true
}

/**
 * Returns the Unix-ms timestamps of the next `count` trading days strictly
 * after `from`. Uses UTC date arithmetic so results are deterministic.
 */
export function nextTradingDays(from: Date, count: number): number[] {
  const out: number[] = []
  const cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()))
  while (out.length < count) {
    cursor.setUTCDate(cursor.getUTCDate() + 1)
    if (isTradingDay(cursor)) out.push(cursor.getTime())
  }
  return out
}

/** Calendar ISO date `days` trading days after `from`. */
export function tradingDayAfter(from: Date, days: number): string {
  const ts = nextTradingDays(from, days)
  const last = ts[ts.length - 1]
  return new Date(last).toISOString().slice(0, 10)
}
