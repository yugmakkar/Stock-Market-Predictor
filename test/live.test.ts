import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { parseCandles, parseQuote, getHistoryLive, getQuoteLive } from "@/lib/yahoo"
import { getFxLive } from "@/lib/fx"
import { getNewsLive } from "@/lib/news"
import { cached, clearCache } from "@/lib/cache"

// A Yahoo `chart` response shaped like range=8mo&interval=1d, with a null close
// in the middle and meta that has chartPreviousClose but NO previousClose.
function yahooChart() {
  return {
    chart: {
      result: [
        {
          meta: {
            symbol: "TEST.NS",
            longName: "Test Ltd",
            exchangeName: "NSE",
            currency: "INR",
            regularMarketPrice: 105,
            chartPreviousClose: 50, // ~8 months ago — must NOT be used as prior close
            regularMarketDayHigh: 106,
            regularMarketDayLow: 101,
            fiftyTwoWeekHigh: 120,
            fiftyTwoWeekLow: 40,
            regularMarketVolume: 1234,
            regularMarketTime: 1_700_000_000,
          },
          timestamp: [1_699_000_000, 1_699_100_000, 1_699_200_000],
          indicators: {
            quote: [
              {
                open: [99, 100, 104],
                high: [101, 102, 106],
                low: [98, 99, 101],
                close: [100, null, 105],
                volume: [1000, 0, 1234],
              },
            ],
          },
        },
      ],
    },
  }
}

function fakeResponse(body: unknown, { ok = true, status = 200, text = false } = {}) {
  return {
    ok,
    status,
    json: async () => body,
    text: async () => (text ? (body as string) : JSON.stringify(body)),
  } as Response
}

afterEach(() => {
  vi.unstubAllGlobals()
  clearCache()
})

describe("yahoo parsing", () => {
  it("drops candles with a null close", () => {
    const candles = parseCandles(yahooChart().chart.result[0])
    expect(candles).toHaveLength(2)
    expect(candles.map((c) => c.close)).toEqual([100, 105])
  })

  it("computes day change from the prior candle, not chartPreviousClose", () => {
    const q = parseQuote(yahooChart().chart.result[0])
    expect(q.price).toBe(105)
    expect(q.previousClose).toBe(100) // prior candle, not 50
    expect(q.change).toBe(5)
    expect(q.changePercent).toBeCloseTo(5, 5)
  })
})

describe("getHistoryLive / getQuoteLive (stubbed fetch)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async () => fakeResponse(yahooChart())))
  })

  it("returns parsed candles and a quote", async () => {
    const { candles, quote } = await getHistoryLive("TEST.NS")
    expect(candles).toHaveLength(2)
    expect(quote.change).toBe(5)
  })

  it("quote path works too", async () => {
    const q = await getQuoteLive("TEST.NS")
    expect(q.symbol).toBe("TEST.NS")
  })

  it("throws on a non-OK response", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => fakeResponse({}, { ok: false, status: 429 })))
    await expect(getHistoryLive("TEST.NS")).rejects.toThrow(/429/)
  })
})

describe("getFxLive derives AED from the USD peg", () => {
  it("adds AED even though the ECB does not publish it", async () => {
    // Frankfurter returns only ECB currencies — no AED.
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        fakeResponse({ date: "2026-10-16", rates: { USD: 0.012, EUR: 0.011, GBP: 0.0095, JPY: 1.8 } }),
      ),
    )
    const fx = await getFxLive()
    expect(fx.rates.USD).toBe(0.012)
    expect(fx.rates.AED).toBeCloseTo(0.012 * 3.6725, 6)
    expect(fx.source).toMatch(/AED derived/)
  })
})

describe("getNewsLive parses and scores RSS", () => {
  it("extracts headlines with sentiment", async () => {
    const xml = `<rss><channel>
      <item><title>Test Ltd surges to record high on strong profit - ET</title>
      <link>https://x/a</link><pubDate>Mon, 13 Oct 2025 06:00:00 GMT</pubDate></item>
    </channel></rss>`
    vi.stubGlobal("fetch", vi.fn(async () => fakeResponse(xml, { text: true })))
    const news = await getNewsLive("Test Ltd")
    expect(news).toHaveLength(1)
    expect(news[0].sentiment).toBeGreaterThan(0)
  })
})

describe("TTL cache", () => {
  it("calls the loader once for repeated keys within the TTL", async () => {
    const fn = vi.fn(async () => 42)
    const a = await cached("k", 10_000, fn)
    const b = await cached("k", 10_000, fn)
    expect(a).toBe(42)
    expect(b).toBe(42)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it("does not cache failures", async () => {
    const fn = vi.fn(async () => {
      throw new Error("boom")
    })
    await expect(cached("err", 10_000, fn)).rejects.toThrow("boom")
    await expect(cached("err", 10_000, fn)).rejects.toThrow("boom")
    expect(fn).toHaveBeenCalledTimes(2)
  })
})
