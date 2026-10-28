# Contributing

Thanks for your interest in improving **Bharat Stock Predictor**. This is an
educational project, and contributions of all sizes are welcome — bug reports,
docs, new signals for the model, or UI polish.

## Ground rules

- Be respectful. See the [Code of Conduct](CODE_OF_CONDUCT.md).
- This tool is **educational, not investment advice.** Keep that framing intact —
  never add features that present forecasts as guarantees or financial advice.
- Keep third-party data **free and keyless.** No API keys, logins, or paid
  services. New data must come from a free, public source.

## Getting set up

```bash
git clone https://github.com/yugmakkar/Stock-Market-Predictor.git
cd Stock-Market-Predictor
npm install

# Demo mode — synthetic data, no network needed:
DATA_MODE=demo npm run dev

# Live mode (default) — real NSE data:
npm run dev
```

Open http://localhost:3000.

## Before you open a pull request

Run the full local check suite — the same checks CI expects to pass:

```bash
npm run lint        # ESLint (Next.js config)
npm run typecheck   # tsc --noEmit
npm test            # Vitest unit tests
npm run e2e         # Playwright end-to-end tests (run in demo mode)
```

- Keep the prediction engine **pure and deterministic** — no randomness. Any
  change to a signal or the cone math must come with unit tests.
- Fetch third-party data **server-side** (in route handlers), never from the
  browser.
- Match the existing code style; the linter is the source of truth.

## Pull request conventions

1. Branch off `main`.
2. Keep each PR focused on one change.
3. Fill in the pull request template so the change is easy to review.
4. Reference any related issue (e.g. `Closes #12`).

## Reporting bugs and requesting features

Open an issue using the templates under **Issues → New issue**. The more
reproduction detail you give (symbol, data mode, browser), the faster it gets
fixed.
