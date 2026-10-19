// Walk-forward backtest: at each past point, predict direction from data up to
// that point and compare against the realized move `horizon` trading days later.
// This is the only honest answer to "how accurate is it?" — and it keeps the
// headline hit-rate grounded (typically near 50% for short horizons).

import type { Backtest, Candle } from "./types"
import { driftBpsOnly } from "./prediction"

export function backtest(candles: Candle[], horizon = 5): Backtest | null {
  const minHistory = 60
  if (candles.length < minHistory + horizon + 5) return null

  let correct = 0
  let samples = 0
  // Step through every day that has both enough history behind it and a
  // realized outcome `horizon` days ahead.
  for (let i = minHistory; i + horizon < candles.length; i++) {
    const window = candles.slice(0, i + 1)
    const drift = driftBpsOnly(window)
    if (Math.abs(drift) < 1) continue // model is flat -> no directional call
    const predictedUp = drift > 0
    const realizedUp = candles[i + horizon].close > candles[i].close
    if (predictedUp === realizedUp) correct++
    samples++
  }

  if (samples === 0) return null
  return {
    samples,
    hitRate: correct / samples,
    horizonDays: horizon,
  }
}
