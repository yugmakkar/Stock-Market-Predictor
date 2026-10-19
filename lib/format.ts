// Small formatting helpers shared by client components.

export function pct(value: number, digits = 2): string {
  const sign = value > 0 ? "+" : ""
  return `${sign}${value.toFixed(digits)}%`
}

export function signed(value: number, digits = 2): string {
  const sign = value > 0 ? "+" : ""
  return `${sign}${value.toFixed(digits)}`
}

export function compact(n: number): string {
  if (!Number.isFinite(n)) return "—"
  return new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 2 }).format(n)
}

export function dayMonth(ts: number | string): string {
  const d = typeof ts === "string" ? new Date(ts) : new Date(ts)
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
}

export function fullDate(ts: number | string): string {
  const d = typeof ts === "string" ? new Date(ts) : new Date(ts)
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
}

export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime()
  const mins = Math.round((Date.now() - then) / 60000)
  if (!Number.isFinite(mins)) return ""
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.round(hrs / 24)}d ago`
}
