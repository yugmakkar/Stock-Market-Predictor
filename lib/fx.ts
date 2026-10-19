// Server-only FX rates with INR as the base. Primary source Frankfurter (ECB,
// free, no key); falls back to a static table so the UI never hard-fails.

import type { CurrencyCode, FxTable } from "./types"
import { FALLBACK_FX } from "./currency"

// Currencies the ECB (Frankfurter) actually publishes. AED is NOT among them —
// it is pegged to the US dollar, so we derive it from the USD rate below.
const ECB_TARGETS: CurrencyCode[] = ["USD", "EUR", "GBP", "JPY"]
const AED_PER_USD = 3.6725 // fixed peg since 1997

export async function getFxLive(): Promise<FxTable> {
  const url = `https://api.frankfurter.app/latest?from=INR&to=${ECB_TARGETS.join(",")}`
  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`Frankfurter responded ${res.status}`)
  const json = (await res.json()) as { date?: string; rates?: Record<string, number> }
  if (!json.rates) throw new Error("Frankfurter returned no rates")
  const rates: FxTable["rates"] = { ...FALLBACK_FX.rates, INR: 1 }
  for (const code of ECB_TARGETS) {
    if (typeof json.rates[code] === "number") rates[code] = json.rates[code]
  }
  // Derive AED from USD via its dollar peg.
  if (typeof rates.USD === "number") rates.AED = rates.USD * AED_PER_USD
  return {
    base: "INR",
    rates,
    asOf: json.date ?? new Date().toISOString().slice(0, 10),
    source: "ECB via Frankfurter (AED derived from USD peg)",
  }
}
