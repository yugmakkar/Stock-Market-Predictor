# Bharat Stock Predictor

An educational forecasting tool for **NSE-listed Indian stocks**. It shows live-style
prices, projects a transparent price **cone** (most-likely path plus 50% / 80%
likelihood ranges) over the next 20 trading days, explains **why** each call was made,
tracks relevant **news headlines**, and converts every price into your chosen
currency — all from **free, public data with no API keys, logins, or payments**.

> ⚠️ **Educational use only — not investment advice.** The forecasts come from a
> transparent statistical model, not a crystal ball. Markets move on events no model
> can foresee. We are not SEBI-registered advisers. Never invest based on this tool
> alone.

---

## What it does

- **Live prices & stats** for the Nifty 50 (current price, day/52-week range, volume).
- **Forecast chart** — historical price plus a projected median line and shaded 50% /
  80% ranges drawn on real **future trading days** (NSE weekends & holidays skipped),
  so you can see *when* a move is projected, not just that one is.
- **Probabilities** — the chance the stock closes higher over the next 5 and 20 trading
  days, with target prices and likely ranges. Drift is deliberately capped, so
  probabilities stay near 50% — because short-term markets really are close to a
  coin-flip.
- **"Why" panel** — every signal's signed contribution to the expected daily move, in
  basis points, in plain English (trend, MACD, 10-day momentum, RSI, Bollinger stretch,
  news sentiment).
- **Honest track record** — a walk-forward backtest of the same model on each stock's
  own past. It usually sits near 50%; anyone promising much more isn't being straight.
- **News with sentiment** — recent headlines scored by a transparent finance word-list.
- **Currency converter** — INR by default (saved in your browser); switch to USD, EUR,
  GBP, JPY or AED and *every* price, stat, chart value and forecast updates.
- **Liquid-glass UI** — light & dark themes, fully responsive, accessible contrast.

## Data sources (all free, no keys)

| Data | Source |
|------|--------|
| Prices & history | Yahoo Finance public `chart` endpoint (`*.NS` symbols) |
| News | Google News RSS (`hl=en-IN`) |
| FX rates | Frankfurter (European Central Bank); AED derived from its USD peg; static fallback |

All third-party data is fetched **server-side** in Next.js route handlers (never from
the browser), which avoids CORS issues and keeps requests off client IPs. A small
in-memory TTL cache (history 60s, quotes 45s, news 10m, FX 1h) coalesces repeated
requests so a busy page makes at most one upstream call per window — this is what
protects against Yahoo rate limits (Next's own fetch cache is bypassed on
`force-dynamic` routes). While the market is open, the current price auto-refreshes
about once a minute when the tab is visible.

## How the model works

For each stock it reads recent daily candles and news, turns a handful of well-known
signals into a small daily **drift** (expected move), then projects a **lognormal cone**
from the stock's own volatility:

- median path = `lastClose · exp(drift · t)`
- bands = `exp(mean ± z · σ√t)` for the 50% (`z=0.674`) and 80% (`z=1.282`) ranges
- `P(up over h days) = Φ(drift·√h / σ)`

The engine is **pure and deterministic** — no randomness — so the same inputs always
produce the same forecast, and every function is unit-tested.

## Running locally

```bash
npm install

# Demo mode — synthetic data, no network needed (great for previewing the UI):
DATA_MODE=demo npm run dev

# Live mode (default) — real NSE data from the public sources above:
npm run dev
```

Open http://localhost:3000.

### Data modes

- `DATA_MODE=live` (default): fetches real market data. If a source is unavailable
  (Yahoo occasionally rate-limits), the UI shows a clear error state — it **never**
  silently substitutes fake prices.
- `DATA_MODE=demo`: serves deterministic synthetic data, clearly flagged in the UI as
  *"Demo data — not live market prices."* Used for offline development and the e2e tests.

## Deploy it free (Vercel)

This app has server-side routes (prices, news, FX), so it needs a host that runs
Next.js — not static-only GitHub Pages. **Vercel's free Hobby tier** is the natural fit
and redeploys automatically on every push.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Sign in at [vercel.com](https://vercel.com) with your **GitHub** account (free).
2. **Add New… → Project → Import** this repository.
3. Leave every setting at its default — Vercel detects Next.js automatically — and click
   **Deploy**. The site goes live at `https://<project>.vercel.app`.
4. **Auto-updates are on by default:** Vercel watches the linked repo, so every push to
   `main` triggers a fresh production deploy. No extra configuration.

**Data mode on the host:** the app defaults to `DATA_MODE=live` and fetches real NSE data
server-side. If the host's IP is ever rate-limited by Yahoo and quotes stop loading, add
an environment variable `DATA_MODE=demo` under **Project → Settings → Environment
Variables** and redeploy — the public site then always renders with the clearly-flagged
synthetic sample data.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build & serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (Next.js config) |
| `npm test` | Vitest unit tests (indicators, prediction, backtest, sentiment, currency, calendar, RSS) |
| `npm run e2e` | Playwright end-to-end tests (run in demo mode) |

## Tech

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Recharts · Vitest ·
Playwright.

## Deployment note

This repository was built and verified in an environment with **no outbound access to
Yahoo/Google**, so the live data path was validated against the documented API schema
and exercised through unit tests and demo mode — **but not against the live endpoints**.
**First-deploy checklist:**

1. Load 2–3 symbols (e.g. `RELIANCE.NS`, `TCS.NS`) and confirm quotes appear.
2. Compare the day's change against the NSE website — it should match.
3. Check the FX rate label in the currency menu reads *"ECB via Frankfurter…"* (not the
   static fallback).
4. If any seed symbol 404s, it was likely renamed by a corporate action (e.g. a
   demerger) — update it in `lib/stocks.ts`. The constituent list is a curated browse
   set, not a live index feed.

If Yahoo rate-limits your host, the in-memory TTL cache and the clear error state keep
the app usable.

---

Not affiliated with the NSE, SEBI, or any listed company. Forecasts are probabilistic
and educational.
