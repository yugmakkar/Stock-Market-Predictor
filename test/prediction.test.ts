import { describe, it, expect } from "vitest"
import { predict } from "@/lib/prediction"
import { backtest } from "@/lib/backtest"
import { demoCandles } from "@/lib/fixtures/generate"
import type { Candle } from "@/lib/types"

function synthetic(trend: number, n = 120, start = 100): Candle[] {
  const out: Candle[] = []
  let price = start
  const base = Date.UTC(2025, 0, 1)
  for (let i = 0; i < n; i++) {
    price = price * (1 + trend)
    out.push({
      t: base + i * 86400_000,
      open: price,
      high: price * 1.005,
      low: price * 0.995,
      close: price,
      volume: 1_000_000,
    })
  }
  return out
}

describe("predict", () => {
  it("is deterministic (no randomness)", () => {
    const candles = demoCandles("TEST.NS", 150)
    const a = predict({ symbol: "TEST.NS", candles })
    const b = predict({ symbol: "TEST.NS", candles })
    expect(a.driftBps).toBe(b.driftBps)
    expect(a.projection.map((p) => p.median)).toEqual(b.projection.map((p) => p.median))
  })

  it("calls up on a steady uptrend", () => {
    const p = predict({ symbol: "UP.NS", candles: synthetic(0.004) })
    expect(p.direction).toBe("up")
    expect(p.horizons[0].probUp).toBeGreaterThan(0.5)
  })

  it("calls down on a steady downtrend", () => {
    const p = predict({ symbol: "DOWN.NS", candles: synthetic(-0.004) })
    expect(p.direction).toBe("down")
    expect(p.horizons[0].probUp).toBeLessThan(0.5)
  })

  it("keeps drift capped (never wild)", () => {
    const p = predict({ symbol: "WILD.NS", candles: synthetic(0.03) })
    expect(Math.abs(p.driftBps)).toBeLessThanOrEqual(25)
  })

  it("keeps short-horizon probabilities in a sane band", () => {
    const p = predict({ symbol: "SANE.NS", candles: demoCandles("SANE.NS", 150) })
    for (const h of p.horizons) {
      expect(h.probUp).toBeGreaterThan(0.15)
      expect(h.probUp).toBeLessThan(0.85)
    }
  })

  it("projects 20 future trading days with widening bands", () => {
    const p = predict({ symbol: "BANDS.NS", candles: demoCandles("BANDS.NS", 150) })
    expect(p.projection).toHaveLength(20)
    const first = p.projection[0]
    const last = p.projection[19]
    const firstWidth = first.p90 - first.p10
    const lastWidth = last.p90 - last.p10
    expect(lastWidth).toBeGreaterThan(firstWidth)
    // Future timestamps must be strictly increasing and after the last candle.
    const candleEnd = demoCandles("BANDS.NS", 150).at(-1)!.t
    expect(first.t).toBeGreaterThan(candleEnd)
    for (let i = 1; i < p.projection.length; i++) {
      expect(p.projection[i].t).toBeGreaterThan(p.projection[i - 1].t)
    }
  })

  it("news sentiment moves drift in the expected direction", () => {
    const candles = demoCandles("NEWS.NS", 150)
    const pos = predict({ symbol: "NEWS.NS", candles, newsSentiment: 1 })
    const neg = predict({ symbol: "NEWS.NS", candles, newsSentiment: -1 })
    expect(pos.driftBps).toBeGreaterThan(neg.driftBps)
  })

  it("attributes every basis point to a named factor", () => {
    const p = predict({ symbol: "ATTR.NS", candles: demoCandles("ATTR.NS", 150), newsSentiment: 0.5 })
    expect(p.factors.length).toBeGreaterThan(0)
    expect(p.factors.some((f) => f.key === "news")).toBe(true)
  })
})

describe("demo data recency", () => {
  it("ends on a recent trading day (within the last week)", () => {
    const candles = demoCandles("REC.NS", 180)
    const last = candles[candles.length - 1].t
    const ageDays = (Date.now() - last) / 86400_000
    expect(ageDays).toBeGreaterThanOrEqual(0)
    expect(ageDays).toBeLessThan(7)
  })

  it("projects forecast dates into the future", () => {
    const candles = demoCandles("FUT.NS", 180)
    const p = predict({ symbol: "FUT.NS", candles })
    expect(p.projection[0].t).toBeGreaterThan(candles[candles.length - 1].t)
    // The first horizon's date is after today.
    expect(new Date(p.horizons[0].date).getTime()).toBeGreaterThan(Date.now() - 86400_000)
  })
})

describe("backtest", () => {
  it("returns a hit rate in [0,1] with samples", () => {
    const bt = backtest(demoCandles("BT.NS", 180), 5)
    expect(bt).not.toBeNull()
    expect(bt!.hitRate).toBeGreaterThanOrEqual(0)
    expect(bt!.hitRate).toBeLessThanOrEqual(1)
    expect(bt!.samples).toBeGreaterThan(0)
  })

  it("returns null without enough history", () => {
    expect(backtest(demoCandles("SHORT.NS", 30), 5)).toBeNull()
  })
})
