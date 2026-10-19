"use client"

import { useState } from "react"
import { AlertTriangle, Info, X } from "lucide-react"

/** Always-visible risk warning. Not dismissable — this is the core honesty rail. */
export function RiskWarning() {
  return (
    <div
      role="note"
      className="flex items-start gap-3 rounded-2xl px-4 py-3"
      style={{
        background: "var(--warn-bg)",
        border: "1px solid var(--warn-border)",
        color: "var(--ink)",
      }}
    >
      <AlertTriangle size={18} style={{ color: "var(--warn)", flexShrink: 0, marginTop: 1 }} />
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>
        <strong>Educational use only — not investment advice.</strong> These forecasts come from a
        transparent statistical model, not a crystal ball. Markets are driven by events no model can
        foresee. Never invest based on this site alone. We are not SEBI-registered investment
        advisers. You alone are responsible for your decisions.
      </p>
    </div>
  )
}

/** Shown only when the app is serving synthetic demo data. */
export function DemoBanner() {
  return (
    <div
      role="status"
      className="flex items-center gap-2.5 rounded-2xl px-4 py-2.5"
      style={{
        background: "var(--band-weak)",
        border: "1px solid var(--glass-border)",
        color: "var(--ink)",
      }}
    >
      <Info size={16} style={{ color: "var(--series-forecast)", flexShrink: 0 }} />
      <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.45 }}>
        <strong>Demo data.</strong> Prices and news below are synthetic samples for previewing the
        interface — <em>not</em> live market data. Deploy with <code>DATA_MODE=live</code> for real
        NSE quotes.
      </p>
    </div>
  )
}

export function HowItWorks() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium underline-offset-4 hover:underline"
        style={{ color: "var(--series-price)" }}
      >
        How these forecasts work
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center p-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="glass glass-strong w-full max-w-lg p-6"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="How these forecasts work"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 650, color: "var(--ink)" }}>
                How these forecasts work
              </h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" style={{ color: "var(--muted)" }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--ink-2)" }}>
              <p>
                The model reads a stock&apos;s recent price history and news headlines, turning a handful of
                well-known signals into a small daily <strong>drift</strong> (expected move):
              </p>
              <ul style={{ paddingLeft: 18, margin: "8px 0" }}>
                <li>Trend — price versus its 50-day average, confirmed by moving-average crossovers</li>
                <li>Momentum — MACD and the last 10 sessions&apos; return</li>
                <li>Mean-reversion — RSI and Bollinger-band stretch pull back extremes</li>
                <li>News sentiment — a finance word-list scores recent headlines</li>
              </ul>
              <p>
                It then projects a <strong>cone of outcomes</strong> using the stock&apos;s own volatility: a
                most-likely (median) path plus 50% and 80% likelihood ranges over the next 20 trading
                days. The drift is deliberately capped, so probabilities stay close to 50% — because
                short-term markets really are close to a coin-flip.
              </p>
              <p>
                The <strong>track record</strong> figure is an honest walk-forward backtest: how often the
                same model&apos;s direction call was right on this stock&apos;s own past. It will usually sit
                near 50%. That is the point — anyone promising much more is not being straight with you.
              </p>
              <p style={{ color: "var(--muted)", marginBottom: 0 }}>
                No account, no payment, no paid data feeds. Everything here uses free, public sources.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
