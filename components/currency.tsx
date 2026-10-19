"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { Check, ChevronDown } from "lucide-react"
import type { CurrencyCode, FxTable } from "@/lib/types"
import { CURRENCIES, FALLBACK_FX, convertFromInr, formatMoney } from "@/lib/currency"

interface CurrencyCtx {
  code: CurrencyCode
  setCode: (c: CurrencyCode) => void
  fx: FxTable
  format: (amountInr: number) => string
  convert: (amountInr: number) => number
}

const Ctx = createContext<CurrencyCtx | null>(null)

const STORAGE_KEY = "bsp-currency"

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [code, setCodeState] = useState<CurrencyCode>("INR")
  const [fx, setFx] = useState<FxTable>(FALLBACK_FX)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as CurrencyCode | null
      // Hydration-safe read of a browser-only API; must run after mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved && CURRENCIES.some((c) => c.code === saved)) setCodeState(saved)
    } catch {
      /* ignore */
    }
    let alive = true
    fetch("/api/fx")
      .then((r) => r.json())
      .then((data: FxTable) => {
        if (alive && data?.rates) setFx(data)
      })
      .catch(() => {
        /* keep fallback */
      })
    return () => {
      alive = false
    }
  }, [])

  function setCode(c: CurrencyCode) {
    setCodeState(c)
    try {
      localStorage.setItem(STORAGE_KEY, c)
    } catch {
      /* ignore */
    }
  }

  const value = useMemo<CurrencyCtx>(
    () => ({
      code,
      setCode,
      fx,
      format: (amountInr: number) => formatMoney(amountInr, code, fx),
      convert: (amountInr: number) => convertFromInr(amountInr, code, fx),
    }),
    [code, fx],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCurrency(): CurrencyCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider")
  return ctx
}

export function CurrencySelector() {
  const { code, setCode, fx } = useCurrency()
  const [open, setOpen] = useState(false)
  const active = CURRENCIES.find((c) => c.code === code)!

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Change display currency"
        className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium hairline tnum"
        style={{ background: "var(--glass-bg)" }}
      >
        <span style={{ color: "var(--ink)" }}>
          {active.symbol} {active.code}
        </span>
        <ChevronDown size={15} style={{ color: "var(--muted)" }} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} aria-hidden />
          <ul
            role="listbox"
            className="glass glass-strong absolute right-0 z-30 mt-2 w-60 overflow-hidden p-1.5"
          >
            {CURRENCIES.map((c) => {
              const rate = c.code === "INR" ? 1 : fx.rates[c.code]
              return (
                <li key={c.code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={c.code === code}
                    onClick={() => {
                      setCode(c.code)
                      setOpen(false)
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors"
                    style={{ color: "var(--ink)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--glass-bg)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <span className="w-6 text-center text-base">{c.symbol}</span>
                    <span className="flex-1">
                      <span className="font-medium">{c.code}</span>
                      <span className="ml-2" style={{ color: "var(--muted)" }}>
                        {c.label}
                      </span>
                    </span>
                    {c.code === code && <Check size={16} style={{ color: "var(--series-price)" }} />}
                  </button>
                </li>
              )
            })}
            <li
              className="px-3 pb-1 pt-2 text-[11px]"
              style={{ color: "var(--muted)", borderTop: "1px solid var(--glass-border)" }}
            >
              Rates: {fx.source} · as of {fx.asOf}
            </li>
          </ul>
        </>
      )}
    </div>
  )
}
