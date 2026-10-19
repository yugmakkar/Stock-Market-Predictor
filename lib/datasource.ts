// Mode-aware data facade used by the API routes.
//
//  DATA_MODE=live (default): fetch real data from Yahoo / Google News / ECB.
//    On failure the route surfaces a clear error — we never silently swap in
//    fake prices.
//  DATA_MODE=demo: serve deterministic synthetic data, clearly flagged in the
//    UI as "Demo data — not live market prices". Used for offline dev and e2e.

import type { Candle, DataMode, FxTable, NewsItem, Quote } from "./types"
import { getHistoryLive, getQuoteLive } from "./yahoo"
import { getNewsLive } from "./news"
import { getFxLive } from "./fx"
import { FALLBACK_FX } from "./currency"
import { demoCandles, demoNews } from "./fixtures/generate"
import { seedBySymbol } from "./stocks"
import { cached } from "./cache"

const TTL = { quote: 45_000, history: 60_000, news: 600_000, fx: 3_600_000 }

export function dataMode(): DataMode {
  return process.env.DATA_MODE === "demo" ? "demo" : "live"
}

function quoteFromCandles(symbol: string, candles: Candle[]): Quote {
  const last = candles[candles.length - 1]
  const prev = candles[candles.length - 2] ?? last
  const closes = candles.map((c) => c.close)
  const seed = seedBySymbol(symbol)
  const change = last.close - prev.close
  return {
    symbol,
    name: seed?.name ?? symbol.replace(".NS", ""),
    exchange: "NSE (demo)",
    currency: "INR",
    price: last.close,
    previousClose: prev.close,
    change,
    changePercent: prev.close ? (change / prev.close) * 100 : 0,
    dayHigh: last.high,
    dayLow: last.low,
    open: last.open,
    yearHigh: Math.max(...closes),
    yearLow: Math.min(...closes),
    volume: last.volume,
    asOf: new Date(last.t).toISOString(),
  }
}

export async function getQuote(symbol: string): Promise<Quote> {
  if (dataMode() === "demo") return quoteFromCandles(symbol, demoCandles(symbol, 60))
  return cached(`quote:${symbol}`, TTL.quote, () => getQuoteLive(symbol))
}

export async function getHistory(symbol: string): Promise<{ candles: Candle[]; quote: Quote }> {
  if (dataMode() === "demo") {
    const candles = demoCandles(symbol, 180)
    return { candles, quote: quoteFromCandles(symbol, candles) }
  }
  return cached(`history:${symbol}`, TTL.history, () => getHistoryLive(symbol))
}

export async function getNews(symbol: string, name: string): Promise<NewsItem[]> {
  if (dataMode() === "demo") return dedupeNews(demoNews(symbol))
  return cached(`news:${symbol}`, TTL.news, async () => dedupeNews(await getNewsLive(name)))
}

export async function getFx(): Promise<FxTable> {
  if (dataMode() === "demo") {
    return { ...FALLBACK_FX, asOf: new Date().toISOString().slice(0, 10), source: "Demo rates" }
  }
  return cached("fx", TTL.fx, async () => {
    try {
      return await getFxLive()
    } catch {
      // FX failing shouldn't break the page; fall back to a static table.
      return { ...FALLBACK_FX, asOf: new Date().toISOString().slice(0, 10), source: "static fallback" }
    }
  })
}

/** Remove duplicate headlines (syndicated stories repeat across outlets). */
function dedupeNews(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>()
  const out: NewsItem[] = []
  for (const n of items) {
    const key = n.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(n)
  }
  return out
}
