# Security Policy

## Supported versions

This project is actively maintained on the `main` branch. Fixes land there and
are deployed from the latest commit. Older commits are not separately patched.

| Version | Supported |
|---------|-----------|
| `main` (latest) | ✅ |
| older commits   | ❌ |

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Instead, report it privately through GitHub:

1. Go to the repository's **Security** tab.
2. Click **Report a vulnerability** (GitHub private vulnerability reporting).

If private reporting is unavailable, contact the maintainer through their
GitHub profile: https://github.com/yugmakkar

Please include:

- A description of the issue and its impact.
- Steps to reproduce (symbol, data mode, request, etc.).
- Any suggested fix, if you have one.

You can expect an acknowledgement within a few days. Since this is an
educational project maintained in spare time, please allow reasonable time for a
fix before any public disclosure.

## Scope notes

- This app fetches only **public, keyless** market data server-side — there are
  no stored credentials or user accounts to compromise.
- Forecasts are **educational, not investment advice**; "bad predictions" are a
  property of markets, not a security vulnerability.
