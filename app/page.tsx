"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Activity, TriangleAlert } from "lucide-react"
import type { DataMode, StockDetailResponse } from "@/lib/types"
import type { SeedStock } from "@/lib/stocks"
import { isNseOpen } from "@/lib/trading-calendar"
import { CurrencyProvider, CurrencySelector } from "@/components/currency"
import { ThemeToggle } from "@/components/theme-toggle"
import { StockBrowser } from "@/components/stock-browser"
import { StockDetail } from "@/components/stock-detail"
import { DemoBanner, RiskWarning } from "@/components/notices"

const REFRESH_MS = 60_000

export default function Page() {
  return (
    <CurrencyProvider>
      <Dashboard />
    </CurrencyProvider>
  )
}

function Dashboard() {
  const [stocks, setStocks] = useState<SeedStock[]>([])
  const [mode, setMode] = useState<DataMode>("live")
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<string>("RELIANCE.NS")
  const [detail, setDetail] = useState<StockDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<number | null>(null)
  const reqId = useRef(0)

  useEffect(() => {
    fetch("/api/stocks")
      .then((r) => r.json())
      .then((d: { mode: DataMode; stocks: SeedStock[] }) => {
        setStocks(d.stocks)
        setMode(d.mode)
        if (d.stocks.length && !d.stocks.some((s) => s.symbol === "RELIANCE.NS")) {
          setSelected(d.stocks[0].symbol)
        }
      })
      .catch(() => setStocks([]))
  }, [])

  const loadDetail = useCallback((symbol: string, quiet = false) => {
    const id = ++reqId.current
    if (!quiet) setLoading(true)
    setError(null)
    fetch(`/api/stock/${encodeURIComponent(symbol)}`)
      .then(async (r) => {
        const body = await r.json()
        if (!r.ok) throw new Error(body?.error || `Request failed (${r.status})`)
        return body as StockDetailResponse
      })
      .then((d) => {
        if (id !== reqId.current) return // a newer request superseded this one
        setDetail(d)
        setMode(d.mode)
        setUpdatedAt(Date.now())
        setLoading(false)
      })
      .catch((e: Error) => {
        if (id !== reqId.current) return
        if (!quiet) setError(e.message)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    // Fetching on the current selection is the whole job of this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDetail(selected)
  }, [selected, loadDetail])

  // Keep the current price fresh while the market is open and the tab is visible.
  useEffect(() => {
    if (mode !== "live") return
    const tick = () => {
      if (document.visibilityState === "visible" && isNseOpen()) loadDetail(selected, true)
    }
    const timer = setInterval(tick, REFRESH_MS)
    document.addEventListener("visibilitychange", tick)
    return () => {
      clearInterval(timer)
      document.removeEventListener("visibilitychange", tick)
    }
  }, [selected, mode, loadDetail])

  return (
    <div className="mx-auto min-h-dvh w-full max-w-7xl px-4 pb-16 sm:px-6">
      <header className="sticky top-0 z-10 -mx-4 mb-4 px-4 py-3 sm:-mx-6 sm:px-6">
        <div className="glass glass-strong flex items-center justify-between gap-3 rounded-full px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <span
              className="grid h-9 w-9 place-items-center rounded-full"
              style={{ background: "var(--series-price)", color: "#fff" }}
            >
              <Activity size={18} />
            </span>
            <div className="leading-tight">
              <div className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
                Bharat Stock Predictor
              </div>
              <div className="hidden text-xs sm:block" style={{ color: "var(--muted)" }}>
                NSE forecasts · free &amp; transparent
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LiveStatus mode={mode} updatedAt={updatedAt} />
            <CurrencySelector />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-3">
        <RiskWarning />
        {mode === "demo" && <DemoBanner />}
      </div>

      <main className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[20rem_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <StockBrowser
            stocks={stocks}
            selected={selected}
            onSelect={setSelected}
            query={query}
            onQuery={setQuery}
          />
        </aside>
        <section>
          {loading && <DetailSkeleton />}
          {!loading && error && <ErrorCard message={error} onRetry={() => loadDetail(selected)} />}
          {!loading && !error && detail && (
            <StockDetail
              quote={detail.quote}
              candles={detail.candles}
              prediction={detail.prediction}
              news={detail.news}
            />
          )}
        </section>
      </main>

      <footer className="mt-10 text-center text-xs" style={{ color: "var(--muted)" }}>
        <p className="mx-auto max-w-2xl">
          Built with free, public data (Yahoo Finance for prices, Google News for headlines, the
          European Central Bank for FX). No logins, no payments, no paid feeds. Forecasts are
          educational and probabilistic — not a recommendation to buy or sell. Not SEBI-registered.
        </p>
      </footer>
    </div>
  )
}

function LiveStatus({ mode, updatedAt }: { mode: DataMode; updatedAt: number | null }) {
  const [now, setNow] = useState(0)
  useEffect(() => {
    // Seed the clock after mount (Date.now() is browser-only / non-deterministic).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 5000)
    return () => clearInterval(t)
  }, [])

  if (mode === "demo") {
    return (
      <span
        className="hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium sm:flex"
        style={{ color: "var(--series-forecast)", background: "var(--band-weak)" }}
      >
        Demo
      </span>
    )
  }

  const open = now > 0 ? isNseOpen(new Date(now)) : false
  const ago = updatedAt && now > 0 ? Math.round((now - updatedAt) / 1000) : null
  const agoText = ago == null ? "" : ago < 60 ? `${ago}s ago` : `${Math.round(ago / 60)}m ago`
  return (
    <span
      className="hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium sm:flex"
      style={{ color: "var(--ink-2)", background: "var(--glass-bg)" }}
      title={open ? "NSE is open — auto-refreshing" : "NSE is closed"}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: 7,
          background: open ? "var(--up)" : "var(--muted)",
          boxShadow: open ? "0 0 0 3px rgba(10,138,47,0.18)" : "none",
        }}
      />
      {open ? `Live · ${agoText}` : "Market closed"}
    </span>
  )
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading">
      <div className="glass h-40 animate-pulse p-5" style={{ opacity: 0.6 }} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="glass h-80 animate-pulse lg:col-span-3" style={{ opacity: 0.6 }} />
        <div className="glass h-80 animate-pulse lg:col-span-2" style={{ opacity: 0.6 }} />
      </div>
      <div className="glass h-56 animate-pulse" style={{ opacity: 0.6 }} />
    </div>
  )
}

function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="glass flex flex-col items-center gap-3 p-10 text-center">
      <TriangleAlert size={28} style={{ color: "var(--warn)" }} />
      <div>
        <div className="text-base font-semibold" style={{ color: "var(--ink)" }}>
          Couldn&apos;t load live market data
        </div>
        <p className="mx-auto mt-1 max-w-md text-sm" style={{ color: "var(--ink-2)" }}>
          {message}
        </p>
        <p className="mx-auto mt-2 max-w-md text-xs" style={{ color: "var(--muted)" }}>
          Yahoo Finance occasionally rate-limits requests. Try again in a moment, or switch to demo
          mode to preview the interface.
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-full px-4 py-2 text-sm font-medium hairline"
        style={{ background: "var(--glass-bg)", color: "var(--ink)" }}
      >
        Try again
      </button>
    </div>
  )
}
