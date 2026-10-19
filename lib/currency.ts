// Currency conversion. Base is always INR (all source prices are in rupees).
import type { CurrencyCode, FxTable } from "./types"

export const CURRENCIES: { code: CurrencyCode; label: string; symbol: string }[] = [
  { code: "INR", label: "Indian Rupee", symbol: "₹" },
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "GBP", label: "British Pound", symbol: "£" },
  { code: "JPY", label: "Japanese Yen", symbol: "¥" },
  { code: "AED", label: "UAE Dirham", symbol: "د.إ" },
]

const SYMBOLS: Record<CurrencyCode, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  AED: "د.إ",
}

/** Fallback rates (1 INR = x). Used only when the FX route is unavailable. */
export const FALLBACK_FX: FxTable = {
  base: "INR",
  rates: { INR: 1, USD: 0.012, EUR: 0.011, GBP: 0.0095, JPY: 1.78, AED: 0.044 },
  asOf: "fallback",
  source: "static fallback",
}

export function convertFromInr(amountInr: number, to: CurrencyCode, fx: FxTable): number {
  const rate = fx.rates[to] ?? FALLBACK_FX.rates[to] ?? 1
  return amountInr * rate
}

export function formatMoney(amountInr: number, to: CurrencyCode, fx: FxTable): string {
  const value = convertFromInr(amountInr, to, fx)
  const symbol = SYMBOLS[to]
  const fractionDigits = to === "JPY" ? 0 : 2
  const formatted = value.toLocaleString(to === "INR" ? "en-IN" : "en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
  return `${symbol}${formatted}`
}

export function currencySymbol(code: CurrencyCode): string {
  return SYMBOLS[code]
}
