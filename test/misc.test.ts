import { describe, it, expect } from "vitest"
import { scoreHeadline, aggregateSentiment } from "@/lib/sentiment"
import { convertFromInr, formatMoney, FALLBACK_FX } from "@/lib/currency"
import { isTradingDay, nextTradingDays, isNseOpen } from "@/lib/trading-calendar"
import { parseRss } from "@/lib/news"

describe("sentiment", () => {
  it("scores positive headlines above zero", () => {
    expect(scoreHeadline("Reliance shares surge to record high on strong profit")).toBeGreaterThan(0)
  })
  it("scores negative headlines below zero", () => {
    expect(scoreHeadline("Infosys plunges after profit warning and downgrade")).toBeLessThan(0)
  })
  it("handles negation", () => {
    expect(scoreHeadline("Company does not beat estimates")).toBeLessThanOrEqual(0)
  })
  it("is neutral with no lexicon words", () => {
    expect(scoreHeadline("Company to hold board meeting on Tuesday")).toBe(0)
  })
  it("aggregates", () => {
    const s = aggregateSentiment(["stock surges on profit", "shares plunge on fraud probe"])
    expect(s).toBeGreaterThanOrEqual(-1)
    expect(s).toBeLessThanOrEqual(1)
  })
})

describe("currency", () => {
  it("INR converts to itself", () => {
    expect(convertFromInr(100, "INR", FALLBACK_FX)).toBe(100)
  })
  it("converts to USD using the rate", () => {
    expect(convertFromInr(1000, "USD", FALLBACK_FX)).toBeCloseTo(12, 5)
  })
  it("formats with the right symbol", () => {
    expect(formatMoney(100, "INR", FALLBACK_FX)).toContain("₹")
    expect(formatMoney(1000, "USD", FALLBACK_FX)).toContain("$")
  })
  it("JPY has no decimals", () => {
    expect(formatMoney(1000, "JPY", FALLBACK_FX)).not.toContain(".")
  })
})

describe("trading calendar", () => {
  it("rejects weekends", () => {
    expect(isTradingDay(new Date(Date.UTC(2025, 0, 4)))).toBe(false) // Saturday
    expect(isTradingDay(new Date(Date.UTC(2025, 0, 5)))).toBe(false) // Sunday
  })
  it("rejects a known NSE holiday", () => {
    expect(isTradingDay(new Date(Date.UTC(2025, 7, 15)))).toBe(false) // Independence Day
  })
  it("accepts a normal weekday", () => {
    expect(isTradingDay(new Date(Date.UTC(2025, 0, 6)))).toBe(true) // Monday
  })
  it("knows NSE market hours (IST 09:15–15:30 on trading days)", () => {
    // 2026-01-05 is a Monday (trading day). 10:00 IST = 04:30 UTC → open.
    expect(isNseOpen(new Date("2026-01-05T04:30:00Z"))).toBe(true)
    // 03:00 UTC = 08:30 IST → before open.
    expect(isNseOpen(new Date("2026-01-05T03:00:00Z"))).toBe(false)
    // 12:00 UTC = 17:30 IST → after close.
    expect(isNseOpen(new Date("2026-01-05T12:00:00Z"))).toBe(false)
    // 2026-01-26 is Republic Day (holiday) → closed even at midday.
    expect(isNseOpen(new Date("2026-01-26T05:00:00Z"))).toBe(false)
  })

  it("next trading days skips weekends/holidays and increases", () => {
    const days = nextTradingDays(new Date(Date.UTC(2025, 7, 14)), 3) // Thu before Aug 15 holiday
    expect(days).toHaveLength(3)
    for (let i = 1; i < days.length; i++) expect(days[i]).toBeGreaterThan(days[i - 1])
    // None should be the Aug 15 holiday.
    expect(days.map((t) => new Date(t).toISOString().slice(0, 10))).not.toContain("2025-08-15")
  })
})

describe("rss parsing", () => {
  it("extracts items and splits the source suffix", () => {
    const xml = `<rss><channel>
      <item><title>Reliance hits record high on strong results - Economic Times</title>
      <link>https://example.com/a</link><pubDate>Mon, 13 Oct 2025 06:00:00 GMT</pubDate>
      <source url="x">Economic Times</source></item>
      <item><title>Infosys falls after downgrade - Mint</title>
      <link>https://example.com/b</link><pubDate>Mon, 13 Oct 2025 05:00:00 GMT</pubDate></item>
    </channel></rss>`
    const items = parseRss(xml)
    expect(items).toHaveLength(2)
    expect(items[0].title).toBe("Reliance hits record high on strong results")
    expect(items[0].source).toBe("Economic Times")
    expect(items[0].sentiment).toBeGreaterThan(0)
    expect(items[1].sentiment).toBeLessThan(0)
  })
})
