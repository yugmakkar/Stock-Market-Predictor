"use client"

import {
  ArrowDownRight,
  ArrowUpRight,
  ExternalLink,
  Minus,
  Newspaper,
  TrendingDown,
  TrendingUp,
} from "lucide-react"
import type { Factor, HorizonForecast, NewsItem, Prediction, Quote } from "@/lib/types"
import { useCurrency } from "./currency"
import { ForecastChart } from "./forecast-chart"
import { HowItWorks } from "./notices"
import { compact, fullDate, pct, timeAgo } from "@/lib/format"
import type { Candle } from "@/lib/types"

export function StockDetail({
  quote,
  candles,
  prediction,
  news,
}: {
  quote: Quote
  candles: Candle[]
  prediction: Prediction
  news: NewsItem[]
}) {
  return (
    <div className="flex flex-col gap-4">
      <PriceHeader quote={quote} prediction={prediction} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <section className="glass p-5 lg:col-span-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold" style={{ color: "var(--ink)" }}>
              Price &amp; 20-day forecast
            </h2>
            <ChartLegend />
          </div>
          <ForecastChart candles={candles} projection={prediction.projection} />
          <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
            Dashed line is the most-likely path; shaded areas are the 50% and 80% likelihood ranges.
          </p>
        </section>
        <section className="lg:col-span-2">
          <ForecastSummary prediction={prediction} />
        </section>
      </div>
      <WhyPanel prediction={prediction} />
      <NewsPanel news={news} symbol={quote.symbol} />
    </div>
  )
}

function PriceHeader({ quote, prediction }: { quote: Quote; prediction: Prediction }) {
  const { format } = useCurrency()
  const up = quote.change >= 0
  return (
    <section className="glass p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold sm:text-2xl" style={{ color: "var(--ink)" }}>
              {quote.name}
            </h1>
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-medium hairline"
              style={{ color: "var(--ink-2)" }}
            >
              {quote.symbol.replace(".NS", "")} · {quote.exchange}
            </span>
          </div>
          <div className="mt-3 flex items-end gap-3">
            <span className="text-3xl font-semibold tnum sm:text-4xl" style={{ color: "var(--ink)" }}>
              {format(quote.price)}
            </span>
            <span
              className="mb-1 inline-flex items-center gap-1 text-sm font-medium tnum"
              style={{ color: up ? "var(--up-ink)" : "var(--down-ink)" }}
            >
              {up ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              {format(Math.abs(quote.change))} ({pct(quote.changePercent)})
            </span>
          </div>
          <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
            As of {fullDate(quote.asOf)} · prior close {format(quote.previousClose)}
          </p>
        </div>
        <DirectionPill prediction={prediction} />
      </div>
      <div
        className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 border-t pt-4 sm:grid-cols-4"
        style={{ borderColor: "var(--glass-border)" }}
      >
        <Stat label="Open" value={format(quote.open)} />
        <Stat label="Day range" value={`${format(quote.dayLow)} – ${format(quote.dayHigh)}`} />
        <Stat label="52-week range" value={`${format(quote.yearLow)} – ${format(quote.yearHigh)}`} />
        <Stat label="Volume" value={compact(quote.volume)} />
      </div>
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs" style={{ color: "var(--muted)" }}>
        {label}
      </div>
      <div className="mt-0.5 text-sm font-medium tnum" style={{ color: "var(--ink)" }}>
        {value}
      </div>
    </div>
  )
}

function DirectionPill({ prediction }: { prediction: Prediction }) {
  const { direction } = prediction
  const map = {
    up: { label: "Leaning higher", color: "var(--up-ink)", bg: "rgba(10,138,47,0.12)", icon: TrendingUp },
    down: { label: "Leaning lower", color: "var(--down-ink)", bg: "rgba(199,52,47,0.12)", icon: TrendingDown },
    flat: { label: "No clear edge", color: "var(--muted)", bg: "var(--glass-bg)", icon: Minus },
  } as const
  const d = map[direction]
  const Icon = d.icon
  return (
    <div
      className="flex items-center gap-2 rounded-full px-3.5 py-2 hairline"
      style={{ background: d.bg, color: d.color }}
    >
      <Icon size={17} />
      <span className="text-sm font-semibold">{d.label}</span>
    </div>
  )
}

function ChartLegend() {
  const items = [
    { c: "var(--series-price)", label: "Price", dash: false },
    { c: "var(--series-forecast)", label: "Forecast", dash: true },
  ]
  return (
    <div className="flex items-center gap-3">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--ink-2)" }}>
          <span
            style={{
              width: 16,
              height: 0,
              borderTop: `2px ${i.dash ? "dashed" : "solid"} ${i.c}`,
              display: "inline-block",
            }}
          />
          {i.label}
        </span>
      ))}
    </div>
  )
}

function ForecastSummary({ prediction }: { prediction: Prediction }) {
  const { format } = useCurrency()
  return (
    <div className="glass flex h-full flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold" style={{ color: "var(--ink)" }}>
          Forecast
        </h2>
        <HowItWorks />
      </div>

      {prediction.horizons.map((h) => (
        <HorizonRow key={h.days} h={h} format={format} />
      ))}

      <div className="mt-auto rounded-xl p-3" style={{ background: "var(--glass-bg)" }}>
        <div className="text-xs font-medium" style={{ color: "var(--ink-2)" }}>
          Model track record (this stock)
        </div>
        {prediction.backtest ? (
          <>
            <div className="mt-1 text-2xl font-semibold tnum" style={{ color: "var(--ink)" }}>
              {(prediction.backtest.hitRate * 100).toFixed(0)}%
            </div>
            <div className="text-xs" style={{ color: "var(--muted)" }}>
              of {prediction.backtest.samples} past {prediction.backtest.horizonDays}-day calls pointed the
              right way. Near 50% is normal — short-term moves are close to a coin-flip.
            </div>
          </>
        ) : (
          <div className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
            Not enough history on this stock to score the model yet.
          </div>
        )}
      </div>
    </div>
  )
}

function HorizonRow({ h, format }: { h: HorizonForecast; format: (n: number) => string }) {
  const probPctUp = Math.round(h.probUp * 100)
  const leansUp = h.probUp >= 0.5
  const probShown = leansUp ? probPctUp : 100 - probPctUp
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium" style={{ color: "var(--ink)" }}>
          Next {h.days} trading days
        </span>
        <span className="text-xs tnum" style={{ color: "var(--muted)" }}>
          by {fullDate(h.date)}
        </span>
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <div
          className="relative h-2 flex-1 overflow-hidden rounded-full"
          style={{ background: "var(--glass-bg)" }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: `${probShown}%`,
              background: leansUp ? "var(--up)" : "var(--down)",
            }}
          />
        </div>
        <span className="text-sm font-semibold tnum" style={{ color: leansUp ? "var(--up-ink)" : "var(--down-ink)" }}>
          {probShown}%
        </span>
      </div>
      <div className="mt-1 flex items-center justify-between text-xs" style={{ color: "var(--ink-2)" }}>
        <span>
          chance {leansUp ? "higher" : "lower"} · median {format(h.median)} ({pct(h.expectedMovePct)})
        </span>
      </div>
      <div className="text-xs tnum" style={{ color: "var(--muted)" }}>
        likely range {format(h.low)} – {format(h.high)}
      </div>
    </div>
  )
}

function WhyPanel({ prediction }: { prediction: Prediction }) {
  const maxAbs = Math.max(1, ...prediction.factors.map((f) => Math.abs(f.bps)))
  return (
    <section className="glass p-5">
      <h2 className="mb-1 text-base font-semibold" style={{ color: "var(--ink)" }}>
        Why — the drivers behind this call
      </h2>
      <p className="mb-4 text-xs" style={{ color: "var(--muted)" }}>
        Each bar is one signal&apos;s contribution to the expected daily move, in basis points (1 bp =
        0.01%). Green pushes the price up, red pushes it down. They sum to a net drift of{" "}
        <strong style={{ color: "var(--ink-2)" }}>
          {prediction.driftBps >= 0 ? "+" : ""}
          {prediction.driftBps.toFixed(1)} bps/day
        </strong>
        .
      </p>
      <div className="flex flex-col gap-2.5">
        {prediction.factors.map((f) => (
          <FactorBar key={f.key} f={f} maxAbs={maxAbs} />
        ))}
      </div>
      {prediction.rationale.length > 0 && (
        <div className="mt-4 border-t pt-3" style={{ borderColor: "var(--glass-border)" }}>
          <div className="mb-1 text-xs font-medium" style={{ color: "var(--ink-2)" }}>
            In plain words
          </div>
          <ul className="flex flex-col gap-1" style={{ color: "var(--ink-2)", fontSize: 13 }}>
            {prediction.rationale.map((r, i) => (
              <li key={i} className="flex gap-2">
                <span style={{ color: "var(--muted)" }}>•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

function FactorBar({ f, maxAbs }: { f: Factor; maxAbs: number }) {
  const positive = f.bps >= 0
  const widthPct = (Math.abs(f.bps) / maxAbs) * 50
  return (
    <div className="grid grid-cols-[minmax(0,9.5rem)_1fr_auto] items-center gap-3">
      <div className="min-w-0">
        <div className="truncate text-sm font-medium" style={{ color: "var(--ink)" }}>
          {f.label}
        </div>
        <div className="truncate text-xs" style={{ color: "var(--muted)" }} title={f.detail}>
          {f.detail}
        </div>
      </div>
      <div className="relative h-5" aria-hidden>
        <div
          className="absolute inset-y-0"
          style={{ left: "50%", width: 1, background: "var(--axis)" }}
        />
        <div
          className="absolute top-1/2 h-3 -translate-y-1/2 rounded-sm"
          style={{
            left: positive ? "50%" : `${50 - widthPct}%`,
            width: `${widthPct}%`,
            background: positive ? "var(--up)" : "var(--down)",
            minWidth: Math.abs(f.bps) >= 0.1 ? 3 : 0,
          }}
        />
      </div>
      <div
        className="w-14 text-right text-sm font-semibold tnum"
        style={{ color: positive ? "var(--up-ink)" : "var(--down-ink)" }}
      >
        {positive ? "+" : ""}
        {f.bps.toFixed(1)}
      </div>
    </div>
  )
}

function NewsPanel({ news, symbol }: { news: NewsItem[]; symbol: string }) {
  return (
    <section className="glass p-5">
      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold" style={{ color: "var(--ink)" }}>
        <Newspaper size={17} style={{ color: "var(--muted)" }} />
        Headlines moving {symbol.replace(".NS", "")}
      </h2>
      {news.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          No recent headlines found.
        </p>
      ) : (
        <ul className="flex flex-col divide-y" style={{ borderColor: "var(--glass-border)" }}>
          {news.map((n, i) => (
            <li key={i} className="py-2.5 first:pt-0 last:pb-0">
              <a
                href={n.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <div
                    className="text-sm leading-snug group-hover:underline"
                    style={{ color: "var(--ink)", textUnderlineOffset: 3 }}
                  >
                    {n.title}
                    {n.link !== "#" && (
                      <ExternalLink size={12} className="ml-1 inline" style={{ color: "var(--muted)" }} />
                    )}
                  </div>
                  <div className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
                    {n.source} · {timeAgo(n.publishedAt)}
                  </div>
                </div>
                <SentimentChip s={n.sentiment} />
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function SentimentChip({ s }: { s: number }) {
  let label = "Neutral"
  let color = "var(--muted)"
  let bg = "var(--glass-bg)"
  if (s > 0.15) {
    label = "Positive"
    color = "var(--up-ink)"
    bg = "rgba(10,138,47,0.12)"
  } else if (s < -0.15) {
    label = "Negative"
    color = "var(--down-ink)"
    bg = "rgba(199,52,47,0.12)"
  }
  return (
    <span
      className="flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ color, background: bg }}
    >
      {label}
    </span>
  )
}
