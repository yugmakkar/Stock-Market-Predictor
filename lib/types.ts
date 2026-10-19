// Shared domain types for the Bharat Stock Predictor.

export type CurrencyCode = "INR" | "USD" | "EUR" | "GBP" | "JPY" | "AED"

export interface Candle {
  /** Unix epoch in milliseconds (market close for the day). */
  t: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface Quote {
  symbol: string
  name: string
  exchange: string
  currency: "INR"
  price: number
  previousClose: number
  change: number
  changePercent: number
  dayHigh: number
  dayLow: number
  open: number
  yearHigh: number
  yearLow: number
  volume: number
  /** ISO timestamp the quote was produced. */
  asOf: string
}

export interface NewsItem {
  title: string
  link: string
  source: string
  publishedAt: string
  /** Lexicon sentiment in [-1, 1]. */
  sentiment: number
}

/** One named driver of the predicted drift, in basis points per trading day. */
export interface Factor {
  key: string
  label: string
  detail: string
  /** Signed contribution to daily drift, in basis points (1 bp = 0.01%). */
  bps: number
}

export interface ProjectionPoint {
  /** Unix epoch ms of a future trading day. */
  t: number
  /** Trading days ahead (1-based). */
  step: number
  median: number
  p10: number
  p25: number
  p75: number
  p90: number
}

export interface HorizonForecast {
  /** Horizon length in trading days. */
  days: number
  /** The calendar date the horizon lands on (ISO). */
  date: string
  median: number
  /** Probability in [0,1] that the close is higher than today's. */
  probUp: number
  /** Expected percentage move at the median. */
  expectedMovePct: number
  low: number
  high: number
}

export interface Backtest {
  /** Number of walk-forward windows evaluated. */
  samples: number
  /** Share of windows where the direction call was correct, in [0,1]. */
  hitRate: number
  horizonDays: number
}

export interface Prediction {
  symbol: string
  asOf: string
  lastClose: number
  direction: "up" | "down" | "flat"
  /** Net daily drift in basis points. */
  driftBps: number
  /** Daily volatility (stdev of log returns). */
  dailyVol: number
  factors: Factor[]
  projection: ProjectionPoint[]
  horizons: HorizonForecast[]
  backtest: Backtest | null
  /** Plain-language summary of the leading reasons. */
  rationale: string[]
}

export interface FxTable {
  base: "INR"
  rates: Record<CurrencyCode, number>
  asOf: string
  source: string
}

export type DataMode = "live" | "demo"

export interface StockDetailResponse {
  mode: DataMode
  quote: Quote
  candles: Candle[]
  news: NewsItem[]
  prediction: Prediction
}
