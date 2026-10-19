"use client"

import { Search } from "lucide-react"
import type { SeedStock } from "@/lib/stocks"

export function StockBrowser({
  stocks,
  selected,
  onSelect,
  query,
  onQuery,
}: {
  stocks: SeedStock[]
  selected: string
  onSelect: (symbol: string) => void
  query: string
  onQuery: (q: string) => void
}) {
  const filtered = stocks.filter((s) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return (
      s.name.toLowerCase().includes(q) ||
      s.symbol.toLowerCase().includes(q) ||
      s.sector.toLowerCase().includes(q)
    )
  })

  return (
    <div className="glass flex max-h-[32rem] flex-col p-3 lg:max-h-[calc(100dvh-10rem)]">
      <div className="relative mb-2">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: "var(--muted)" }}
        />
        <input
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search NSE stocks…"
          aria-label="Search stocks"
          className="w-full rounded-xl py-2.5 pl-9 pr-3 text-sm outline-none hairline"
          style={{ background: "var(--glass-bg)", color: "var(--ink)" }}
        />
      </div>
      <ul className="-mr-1 flex flex-1 flex-col gap-0.5 overflow-y-auto pr-1" role="listbox" aria-label="Stocks">
        {filtered.length === 0 && (
          <li className="px-3 py-6 text-center text-sm" style={{ color: "var(--muted)" }}>
            No matches.
          </li>
        )}
        {filtered.map((s) => {
          const active = s.symbol === selected
          return (
            <li key={s.symbol}>
              <button
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => onSelect(s.symbol)}
                className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left transition-colors"
                style={{
                  background: active ? "var(--glass-bg-strong)" : "transparent",
                  boxShadow: active ? "inset 0 0 0 1px var(--glass-border)" : "none",
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = "var(--glass-bg)"
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = "transparent"
                }}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium" style={{ color: "var(--ink)" }}>
                    {s.name}
                  </span>
                  <span className="block text-xs" style={{ color: "var(--muted)" }}>
                    {s.symbol.replace(".NS", "")}
                  </span>
                </span>
                <span
                  className="flex-shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                  style={{ color: "var(--ink-2)", background: "var(--glass-bg)" }}
                >
                  {s.sector}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
