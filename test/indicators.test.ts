import { describe, it, expect } from "vitest"
import {
  sma,
  ema,
  rsi,
  macd,
  bollinger,
  logReturns,
  dailyVolatility,
  normalCdf,
  clamp,
} from "@/lib/indicators"

describe("sma", () => {
  it("averages the last n values", () => {
    expect(sma([1, 2, 3, 4, 5], 5)).toBe(3)
    expect(sma([2, 4, 6], 2)).toBe(5)
  })
  it("returns NaN when not enough data", () => {
    expect(Number.isNaN(sma([1, 2], 5))).toBe(true)
  })
})

describe("ema", () => {
  it("equals the value for a flat series", () => {
    expect(ema([10, 10, 10, 10, 10, 10], 3)).toBeCloseTo(10, 6)
  })
  it("tracks an upward series above its start", () => {
    const e = ema([1, 2, 3, 4, 5, 6, 7, 8], 3)
    expect(e).toBeGreaterThan(4)
    expect(e).toBeLessThan(8)
  })
})

describe("rsi", () => {
  it("is 100 for a monotonically rising series", () => {
    const rising = Array.from({ length: 30 }, (_, i) => 100 + i)
    expect(rsi(rising)).toBe(100)
  })
  it("is low for a falling series", () => {
    const falling = Array.from({ length: 30 }, (_, i) => 100 - i)
    expect(rsi(falling)).toBeLessThan(5)
  })
  it("defaults to 50 with too little data", () => {
    expect(rsi([1, 2, 3])).toBe(50)
  })
})

describe("macd", () => {
  it("is positive when the fast EMA leads an uptrend", () => {
    const series = Array.from({ length: 60 }, (_, i) => 100 + i)
    expect(macd(series).macd).toBeGreaterThan(0)
  })
})

describe("bollinger", () => {
  it("z is near 0 for the middle of a stable range", () => {
    const series = Array.from({ length: 25 }, (_, i) => (i % 2 ? 101 : 99))
    const b = bollinger(series)
    expect(Math.abs(b.z)).toBeLessThan(1.5)
    expect(b.upper).toBeGreaterThan(b.middle)
    expect(b.lower).toBeLessThan(b.middle)
  })
})

describe("logReturns & dailyVolatility", () => {
  it("log returns length is n-1", () => {
    expect(logReturns([100, 101, 102]).length).toBe(2)
  })
  it("volatility is non-negative and bounded", () => {
    const v = dailyVolatility([100, 101, 99, 102, 98, 103, 97, 104])
    expect(v).toBeGreaterThan(0)
    expect(v).toBeLessThan(1)
  })
})

describe("normalCdf", () => {
  it("is 0.5 at 0", () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 3)
  })
  it("is symmetric", () => {
    expect(normalCdf(1) + normalCdf(-1)).toBeCloseTo(1, 3)
  })
  it("matches known values", () => {
    expect(normalCdf(1.645)).toBeCloseTo(0.95, 2)
  })
})

describe("clamp", () => {
  it("bounds values", () => {
    expect(clamp(5, 0, 1)).toBe(1)
    expect(clamp(-5, 0, 1)).toBe(0)
    expect(clamp(0.5, 0, 1)).toBe(0.5)
  })
})
