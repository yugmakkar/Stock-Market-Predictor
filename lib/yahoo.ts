// Server-only Yahoo Finance access via the public `chart` endpoint.
// The chart endpoint returns both a quote snapshot (meta) and OHLC history, and
// needs no API key or crumb. Never call this from the browser (CORS + IP bans).

import type { Candle, Quote } from "./types"
import { seedBySymbol } from "./stocks"

const CHART = "https://query1.finance.yahoo.com/v8/finance/chart"
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"

interface ChartResult {
  meta: {
    symbol: string
    longName?: string
    shortName?: string
    exchangeName?: string
    regularMarketPrice?: number
    previousClose?: number
    chartPreviousClose?: number
    regularMarketDayHigh?: number
    regularMarketDayLow?: number
    regularMarketVolume?: number
    regularMarketTime?: number
    fiftyTwoWeekHigh?: number
    fiftyTwoWeekLow?: number
    currency?: string
  }
  timestamp?: number[]
  indicators?: {
    quote?: Array<{
      open?: (number | null)[]
      high?: (number | null)[]
      low?: (number | null)[]
      close?: (number | null)[]
      volume?: (number | null)[]
    }>
  }
}

async function fetchChart(symbol: string, range: string, interval: string): Promise<ChartResult> {
  const url = `${CHART}/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    // Cache at the platform edge for a short window to dodge rate limits.
    next: { revalidate: 60 },
  })
  if (!res.ok) {
    throw new Error(`Yahoo responded ${res.status} for ${symbol}`)
  }
  const json = (await res.json()) as {
    chart?: { result?: ChartResult[]; error?: { description?: string } }
  }
  const result = json.chart?.result?.[0]
  if (!result) {
    throw new Error(json.chart?.error?.description || `No data for ${symbol}`)
  }
  return result
}

export function parseCandles(result: ChartResult): Candle[] {
  const ts = result.timestamp ?? []
  const q = result.indicators?.quote?.[0]
  if (!q) return []
  const out: Candle[] = []
  for (let i = 0; i < ts.length; i++) {
    const close = q.close?.[i]
    if (close == null) continue
    out.push({
      t: ts[i] * 1000,
      open: q.open?.[i] ?? close,
      high: q.high?.[i] ?? close,
      low: q.low?.[i] ?? close,
      close,
      volume: q.volume?.[i] ?? 0,
    })
  }
  return out
}

export function parseQuote(result: ChartResult): Quote {
  const m = result.meta
  const candles = parseCandles(result)
  const last = candles[candles.length - 1]
  const price = m.regularMarketPrice ?? last?.close ?? 0
  const prev = m.previousClose ?? m.chartPreviousClose ?? last?.open ?? price
  const change = price - prev
  const seed = seedBySymbol(m.symbol)
  return {
    symbol: m.symbol,
    name: seed?.name ?? m.longName ?? m.shortName ?? m.symbol.replace(".NS", ""),
    exchange: m.exchangeName ?? "NSE",
    currency: "INR",
    price,
    previousClose: prev,
    change,
    changePercent: prev ? (change / prev) * 100 : 0,
    dayHigh: m.regularMarketDayHigh ?? last?.high ?? price,
    dayLow: m.regularMarketDayLow ?? last?.low ?? price,
    open: last?.open ?? price,
    yearHigh: m.fiftyTwoWeekHigh ?? price,
    yearLow: m.fiftyTwoWeekLow ?? price,
    volume: m.regularMarketVolume ?? last?.volume ?? 0,
    asOf: new Date((m.regularMarketTime ? m.regularMarketTime * 1000 : Date.now())).toISOString(),
  }
}

export async function getQuoteLive(symbol: string): Promise<Quote> {
  const result = await fetchChart(symbol, "1d", "1d")
  return parseQuote(result)
}

/** ~8 months of daily candles — enough for indicators and a backtest. */
export async function getHistoryLive(symbol: string): Promise<{ candles: Candle[]; quote: Quote }> {
  const result = await fetchChart(symbol, "8mo", "1d")
  return { candles: parseCandles(result), quote: parseQuote(result) }
}
