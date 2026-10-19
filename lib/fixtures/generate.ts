// Deterministic synthetic market data for DEMO mode and offline tests.
// Seeded by symbol so every run is identical — NEVER presented as live prices.

import type { Candle, NewsItem } from "../types"
import { scoreHeadline } from "../sentiment"
import { seedBySymbol } from "../stocks"

// Mulberry32 — a tiny deterministic PRNG. Used only for fixture generation.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashSymbol(symbol: string): number {
  let h = 2166136261
  for (let i = 0; i < symbol.length; i++) {
    h ^= symbol.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// A plausible anchor price per symbol so demo values look sane.
function basePrice(symbol: string): number {
  const rand = mulberry32(hashSymbol(symbol))
  const tiers = [180, 420, 850, 1500, 3200, 6800]
  const tier = tiers[Math.floor(rand() * tiers.length)]
  return Math.round(tier * (0.7 + rand() * 0.6))
}

/** Generate `days` daily candles ending today (UTC), deterministic per symbol. */
export function demoCandles(symbol: string, days = 180): Candle[] {
  const seed = hashSymbol(symbol)
  const rand = mulberry32(seed)
  let price = basePrice(symbol)
  const driftPerDay = (rand() - 0.45) * 0.0012 // mild symbol-specific trend
  const vol = 0.012 + rand() * 0.014 // 1.2%–2.6% daily vol
  const candles: Candle[] = []

  const today = new Date()
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
  start.setUTCDate(start.getUTCDate() - Math.ceil(days * 1.5))

  const cursor = new Date(start)
  while (candles.length < days) {
    const dow = cursor.getUTCDay()
    if (dow !== 0 && dow !== 6) {
      // Box-Muller normal from two uniforms.
      const u1 = Math.max(1e-9, rand())
      const u2 = rand()
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
      const ret = driftPerDay + vol * z
      const open = price
      const close = Math.max(1, open * Math.exp(ret))
      const high = Math.max(open, close) * (1 + rand() * 0.006)
      const low = Math.min(open, close) * (1 - rand() * 0.006)
      const volume = Math.round(500000 + rand() * 4500000)
      candles.push({
        t: cursor.getTime(),
        open: round2(open),
        high: round2(high),
        low: round2(low),
        close: round2(close),
        volume,
      })
      price = close
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return candles
}

const DEMO_HEADLINE_TEMPLATES = [
  "{name} posts quarterly results in line with estimates",
  "Analysts weigh in on {name} outlook for the coming quarter",
  "{name} shares in focus amid sector rotation",
  "{name} announces board meeting to consider updates",
  "Brokerages maintain neutral stance on {name}",
  "{name} volumes steady as broader market consolidates",
]

export function demoNews(symbol: string): NewsItem[] {
  const seed = hashSymbol(symbol + "news")
  const rand = mulberry32(seed)
  const name = seedBySymbol(symbol)?.name ?? symbol.replace(".NS", "")
  const count = 4 + Math.floor(rand() * 3)
  const items: NewsItem[] = []
  const now = Date.now()
  for (let i = 0; i < count; i++) {
    const template = DEMO_HEADLINE_TEMPLATES[Math.floor(rand() * DEMO_HEADLINE_TEMPLATES.length)]
    const title = template.replace("{name}", name)
    items.push({
      title,
      link: "#",
      source: "Demo Newswire",
      publishedAt: new Date(now - i * 3600_000 * (3 + rand() * 8)).toISOString(),
      sentiment: scoreHeadline(title),
    })
  }
  return items
}

function round2(x: number): number {
  return Math.round(x * 100) / 100
}
