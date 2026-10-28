# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Free-hosting (Vercel) deploy guide in the README.
- Standard GitHub community-health docs: license, contributing guide, code of
  conduct, security policy, issue and pull request templates, and Dependabot
  configuration.

## [1.0.0] - 2026-10-19

A ground-up rebuild into a transparent forecaster for NSE-listed Indian stocks.

### Added

- **Live-style prices & stats** for the Nifty 50 (current price, day/52-week
  range, volume).
- **Forecast cone** — a projected median path plus shaded 50% / 80% likelihood
  ranges drawn on real future trading days (NSE weekends and holidays skipped).
- **Probabilities** — the chance a stock closes higher over the next 5 and 20
  trading days, with target prices and likely ranges.
- **"Why" panel** — each signal's signed contribution to the expected daily move,
  in basis points and plain English (trend, MACD, momentum, RSI, Bollinger
  stretch, news sentiment).
- **Walk-forward backtest** — an honest track record of the same model on each
  stock's own past.
- **News with sentiment** — recent headlines scored by a transparent finance
  word-list.
- **Currency converter** — INR by default, switchable to USD, EUR, GBP, JPY, or
  AED; every price, stat, and chart value updates.
- **Liquid-glass UI** — light and dark themes, fully responsive.
- **Free, keyless data** fetched server-side: Yahoo Finance (prices), Google News
  RSS (headlines), Frankfurter/ECB (FX rates), with clear error states and a
  deterministic demo mode.
- **Tests** — unit tests for indicators, prediction, backtest, sentiment,
  currency, calendar, and RSS parsing, plus Playwright end-to-end tests.

[Unreleased]: https://github.com/yugmakkar/Stock-Market-Predictor/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/yugmakkar/Stock-Market-Predictor/releases/tag/v1.0.0
