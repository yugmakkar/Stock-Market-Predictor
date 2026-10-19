// Server-only FX rates with INR as the base. Primary source Frankfurter (ECB,
// free, no key); falls back to a static table so the UI never hard-fails.

import type { CurrencyCode, FxTable } from "./types"
import { FALLBACK_FX } from "./currency"

const TARGETS: CurrencyCode[] = ["USD", "EUR", "GBP", "JPY", "AED"]

export async function getFxLive(): Promise<FxTable> {
  const url = `https://api.frankfurter.app/latest?from=INR&to=${TARGETS.join(",")}`
  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`Frankfurter responded ${res.status}`)
  const json = (await res.json()) as { date?: string; rates?: Record<string, number> }
  if (!json.rates) throw new Error("Frankfurter returned no rates")
  const rates: FxTable["rates"] = { ...FALLBACK_FX.rates, INR: 1 }
  for (const code of TARGETS) {
    if (typeof json.rates[code] === "number") rates[code] = json.rates[code]
  }
  return {
    base: "INR",
    rates,
    asOf: json.date ?? new Date().toISOString().slice(0, 10),
    source: "Frankfurter (ECB)",
  }
}
