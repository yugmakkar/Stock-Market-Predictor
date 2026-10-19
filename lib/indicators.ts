// Pure technical-indicator functions. No randomness, no I/O — fully testable.
import type { Candle } from "./types"

export function sma(values: number[], period: number): number {
  if (values.length < period || period <= 0) return NaN
  const slice = values.slice(-period)
  return slice.reduce((a, b) => a + b, 0) / period
}

/** Exponential moving average over the whole series (returns the final value). */
export function ema(values: number[], period: number): number {
  if (values.length === 0 || period <= 0) return NaN
  if (values.length < period) return values[values.length - 1]
  const k = 2 / (period + 1)
  // Seed with the SMA of the first `period` values for stability.
  let prev = values.slice(0, period).reduce((a, b) => a + b, 0) / period
  for (let i = period; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k)
  }
  return prev
}

/** Full EMA series (same length as input; first `period-1` are NaN). */
export function emaSeries(values: number[], period: number): number[] {
  const out = new Array<number>(values.length).fill(NaN)
  if (values.length < period || period <= 0) return out
  const k = 2 / (period + 1)
  let prev = values.slice(0, period).reduce((a, b) => a + b, 0) / period
  out[period - 1] = prev
  for (let i = period; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k)
    out[i] = prev
  }
  return out
}

export function rsi(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50
  let gain = 0
  let loss = 0
  // Seed with the first `period` changes.
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1]
    if (diff >= 0) gain += diff
    else loss -= diff
  }
  let avgGain = gain / period
  let avgLoss = loss / period
  // Wilder smoothing across the remainder.
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1]
    const up = diff > 0 ? diff : 0
    const down = diff < 0 ? -diff : 0
    avgGain = (avgGain * (period - 1) + up) / period
    avgLoss = (avgLoss * (period - 1) + down) / period
  }
  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - 100 / (1 + rs)
}

export interface Macd {
  macd: number
  signal: number
  histogram: number
}

export function macd(closes: number[], fast = 12, slow = 26, signalPeriod = 9): Macd {
  if (closes.length < slow + signalPeriod) {
    return { macd: 0, signal: 0, histogram: 0 }
  }
  const fastSeries = emaSeries(closes, fast)
  const slowSeries = emaSeries(closes, slow)
  const macdLine: number[] = []
  for (let i = 0; i < closes.length; i++) {
    if (!Number.isNaN(fastSeries[i]) && !Number.isNaN(slowSeries[i])) {
      macdLine.push(fastSeries[i] - slowSeries[i])
    }
  }
  const macdValue = macdLine[macdLine.length - 1]
  const signal = ema(macdLine, signalPeriod)
  return { macd: macdValue, signal, histogram: macdValue - signal }
}

export interface Bollinger {
  upper: number
  middle: number
  lower: number
  /** Position of the last close within the bands: -1 (lower) .. +1 (upper). */
  z: number
}

export function bollinger(closes: number[], period = 20, mult = 2): Bollinger {
  if (closes.length < period) {
    const last = closes[closes.length - 1] ?? 0
    return { upper: last, middle: last, lower: last, z: 0 }
  }
  const slice = closes.slice(-period)
  const mid = slice.reduce((a, b) => a + b, 0) / period
  const variance = slice.reduce((a, b) => a + (b - mid) ** 2, 0) / period
  const sd = Math.sqrt(variance)
  const last = closes[closes.length - 1]
  const upper = mid + mult * sd
  const lower = mid - mult * sd
  const z = sd === 0 ? 0 : (last - mid) / (mult * sd)
  return { upper, middle: mid, lower, z: clamp(z, -1.5, 1.5) }
}

/** Average True Range — volatility in price units. */
export function atr(candles: Candle[], period = 14): number {
  if (candles.length < period + 1) return 0
  const trs: number[] = []
  for (let i = 1; i < candles.length; i++) {
    const h = candles[i].high
    const l = candles[i].low
    const pc = candles[i - 1].close
    trs.push(Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc)))
  }
  return sma(trs, period)
}

/** Log returns from a close series. */
export function logReturns(closes: number[]): number[] {
  const out: number[] = []
  for (let i = 1; i < closes.length; i++) {
    if (closes[i - 1] > 0 && closes[i] > 0) {
      out.push(Math.log(closes[i] / closes[i - 1]))
    }
  }
  return out
}

/** Sample standard deviation of daily log returns. */
export function dailyVolatility(closes: number[], lookback = 30): number {
  const rets = logReturns(closes).slice(-lookback)
  if (rets.length < 2) return 0.015 // sane default ~1.5%/day
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length
  const variance = rets.reduce((a, b) => a + (b - mean) ** 2, 0) / (rets.length - 1)
  return Math.sqrt(variance)
}

export function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x))
}

/** Standard normal CDF via the Abramowitz-Stegun approximation. */
export function normalCdf(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x))
  const d = 0.3989422804014327 * Math.exp((-x * x) / 2)
  const p =
    d *
    t *
    (0.31938153 +
      t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))))
  return x >= 0 ? 1 - p : p
}
