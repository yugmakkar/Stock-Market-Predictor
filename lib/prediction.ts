// Deterministic forecasting engine. Combines transparent technical signals and
// news sentiment into a small daily drift, then projects a lognormal price cone.
//
// Honesty by design:
//  - No randomness, so the same inputs always give the same forecast.
//  - Drift is capped so probabilities stay near 50% (markets are near-random
//    over short horizons). We never claim certainty.
//  - Every basis point of drift is attributed to a named, signed factor.

import type { Candle, Factor, HorizonForecast, Prediction, ProjectionPoint } from "./types"
import {
  atr,
  bollinger,
  clamp,
  dailyVolatility,
  ema,
  logReturns,
  macd,
  normalCdf,
  rsi,
  sma,
} from "./indicators"
import { nextTradingDays, tradingDayAfter } from "./trading-calendar"

// Per-factor caps (bps/day). Trend-following factors carry more weight than
// mean-reversion ones, which only modulate the directional call.
const CAP = {
  trend: 10,
  macd: 6,
  rsi: 5,
  bollinger: 4,
  momentum: 7,
  news: 7,
} as const
const TOTAL_DRIFT_CAP_BPS = 20 // net drift is capped at ±20 bps/day
const FLAT_THRESHOLD_BPS = 3 // |drift| below this is reported as "flat"
const HORIZONS = [5, 20] // trading days

function signalToBps(signal: number, cap: number): number {
  // signal expected in roughly [-1, 1]
  return clamp(signal, -1, 1) * cap
}

export interface PredictInput {
  symbol: string
  candles: Candle[]
  /** Aggregate news sentiment in [-1, 1]; 0 when no news. */
  newsSentiment?: number
  /** "Now" — defaults to the last candle's date. Injectable for tests. */
  asOf?: Date
}

export function predict(input: PredictInput): Prediction {
  const { symbol, candles } = input
  const newsSentiment = input.newsSentiment ?? 0
  const closes = candles.map((c) => c.close)
  const lastClose = closes[closes.length - 1]
  const asOf = input.asOf ?? new Date(candles[candles.length - 1]?.t ?? Date.now())

  const dailyVol = Math.max(0.004, dailyVolatility(closes, 30))
  const factors: Factor[] = []

  // 1. Trend: price position relative to the 50-day, confirmed by EMA alignment.
  const ema12 = ema(closes, 12)
  const ema26 = ema(closes, 26)
  const sma50 = sma(closes, Math.min(50, closes.length))
  if (Number.isFinite(ema12) && Number.isFinite(ema26) && sma50 > 0) {
    const priceVsSma = clamp((lastClose / sma50 - 1) * 12, -1, 1) // distance above/below trend
    const alignment = ema12 >= ema26 ? 1 : -1
    const signal = priceVsSma * 0.65 + alignment * 0.35
    factors.push({
      key: "trend",
      label: "Trend",
      detail:
        `Price ${lastClose >= sma50 ? "above" : "below"} its 50-day average; ` +
        `12-day average ${ema12 >= ema26 ? "above" : "below"} the 26-day`,
      bps: signalToBps(signal, CAP.trend),
    })
  }

  // 2. MACD momentum.
  const m = macd(closes)
  if (lastClose > 0) {
    const signal = clamp((m.histogram / lastClose) * 400, -1, 1)
    factors.push({
      key: "macd",
      label: "Momentum (MACD)",
      detail: m.histogram >= 0 ? "MACD above its signal line" : "MACD below its signal line",
      bps: signalToBps(signal, CAP.macd),
    })
  }

  // 3. Short-term momentum: 10-day return.
  if (closes.length > 11) {
    const ret10 = (lastClose - closes[closes.length - 11]) / closes[closes.length - 11]
    const signal = clamp(ret10 * 12, -1, 1)
    factors.push({
      key: "momentum",
      label: "10-day momentum",
      detail: `${ret10 >= 0 ? "+" : ""}${(ret10 * 100).toFixed(1)}% over the last 10 sessions`,
      bps: signalToBps(signal, CAP.momentum),
    })
  }

  // 4. RSI mean-reversion (overbought pulls down, oversold pushes up) — modulating.
  const r = rsi(closes)
  {
    // Map RSI 30->+1, 50->0, 70->-1 (contrarian).
    const signal = clamp((50 - r) / 20, -1, 1)
    factors.push({
      key: "rsi",
      label: "RSI position",
      detail:
        r >= 70
          ? `Overbought (RSI ${r.toFixed(0)})`
          : r <= 30
            ? `Oversold (RSI ${r.toFixed(0)})`
            : `Neutral (RSI ${r.toFixed(0)})`,
      bps: signalToBps(signal, CAP.rsi),
    })
  }

  // 5. Bollinger stretch (price far above band = stretched, mean-reverting) — modulating.
  const bb = bollinger(closes)
  {
    const signal = clamp(-bb.z, -1, 1)
    factors.push({
      key: "bollinger",
      label: "Volatility bands",
      detail:
        bb.z > 0.6
          ? "Stretched toward the upper band"
          : bb.z < -0.6
            ? "Stretched toward the lower band"
            : "Trading mid-range",
      bps: signalToBps(signal, CAP.bollinger),
    })
  }

  // 6. News sentiment.
  if (newsSentiment !== 0) {
    factors.push({
      key: "news",
      label: "News sentiment",
      detail:
        newsSentiment > 0.15
          ? "Recent headlines lean positive"
          : newsSentiment < -0.15
            ? "Recent headlines lean negative"
            : "Recent headlines are mixed",
      bps: signalToBps(newsSentiment, CAP.news),
    })
  }

  // Net drift (capped).
  const rawDrift = factors.reduce((a, f) => a + f.bps, 0)
  const driftBps = clamp(rawDrift, -TOTAL_DRIFT_CAP_BPS, TOTAL_DRIFT_CAP_BPS)
  const driftDaily = driftBps / 10000

  // Projection cone over the next 20 trading days.
  const futureTs = nextTradingDays(asOf, 20)
  const logLast = Math.log(lastClose)
  const projection: ProjectionPoint[] = futureTs.map((t, i) => {
    const step = i + 1
    const mu = logLast + driftDaily * step
    const s = dailyVol * Math.sqrt(step)
    return {
      t,
      step,
      median: Math.exp(mu),
      p10: Math.exp(mu - 1.2816 * s),
      p25: Math.exp(mu - 0.6745 * s),
      p75: Math.exp(mu + 0.6745 * s),
      p90: Math.exp(mu + 1.2816 * s),
    }
  })

  // Horizon summaries.
  const horizons: HorizonForecast[] = HORIZONS.map((h) => {
    const mu = driftDaily * h
    const s = dailyVol * Math.sqrt(h)
    const median = lastClose * Math.exp(mu)
    const probUp = normalCdf(mu / s)
    return {
      days: h,
      date: tradingDayAfter(asOf, h),
      median,
      probUp,
      expectedMovePct: (Math.exp(mu) - 1) * 100,
      low: lastClose * Math.exp(mu - 0.6745 * s),
      high: lastClose * Math.exp(mu + 0.6745 * s),
    }
  })

  const direction: Prediction["direction"] =
    driftBps > FLAT_THRESHOLD_BPS ? "up" : driftBps < -FLAT_THRESHOLD_BPS ? "down" : "flat"

  const rationale = [...factors]
    .filter((f) => Math.abs(f.bps) >= 1)
    .sort((a, b) => Math.abs(b.bps) - Math.abs(a.bps))
    .slice(0, 3)
    .map((f) => `${f.label}: ${f.detail} (${f.bps >= 0 ? "+" : ""}${f.bps.toFixed(1)} bps/day).`)

  // ATR reference kept for display completeness.
  void atr(candles)

  return {
    symbol,
    asOf: asOf.toISOString(),
    lastClose,
    direction,
    driftBps,
    dailyVol,
    factors: factors.sort((a, b) => Math.abs(b.bps) - Math.abs(a.bps)),
    projection,
    horizons,
    backtest: null, // filled by backtest.ts
    rationale,
  }
}

/** Lightweight direction-only estimate used by the walk-forward backtest. */
export function driftBpsOnly(candles: Candle[]): number {
  const closes = candles.map((c) => c.close)
  if (closes.length < 30) return 0
  const lastClose = closes[closes.length - 1]
  let total = 0
  const ema12 = ema(closes, 12)
  const ema26 = ema(closes, 26)
  const sma50 = sma(closes, Math.min(50, closes.length))
  if (Number.isFinite(ema12) && Number.isFinite(ema26) && sma50 > 0) {
    const priceVsSma = clamp((lastClose / sma50 - 1) * 12, -1, 1)
    const alignment = ema12 >= ema26 ? 1 : -1
    total += signalToBps(priceVsSma * 0.65 + alignment * 0.35, CAP.trend)
  }
  const m = macd(closes)
  total += signalToBps(clamp((m.histogram / lastClose) * 400, -1, 1), CAP.macd)
  if (closes.length > 11) {
    const ret10 = (lastClose - closes[closes.length - 11]) / closes[closes.length - 11]
    total += signalToBps(clamp(ret10 * 12, -1, 1), CAP.momentum)
  }
  const r = rsi(closes)
  total += signalToBps(clamp((50 - r) / 20, -1, 1), CAP.rsi)
  const bb = bollinger(closes)
  total += signalToBps(clamp(-bb.z, -1, 1), CAP.bollinger)
  return clamp(total, -TOTAL_DRIFT_CAP_BPS, TOTAL_DRIFT_CAP_BPS)
}

export { logReturns }
