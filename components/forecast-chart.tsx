"use client"

import { useMemo } from "react"
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { Candle, ProjectionPoint } from "@/lib/types"
import { useCurrency } from "./currency"
import { dayMonth, fullDate } from "@/lib/format"

interface Props {
  candles: Candle[]
  projection: ProjectionPoint[]
  /** How many trailing historical sessions to show. */
  history?: number
}

interface Row {
  t: number
  label: string
  actual?: number
  median?: number
  band80?: [number, number]
  band50?: [number, number]
}

export function ForecastChart({ candles, projection, history = 60 }: Props) {
  const { convert, code } = useCurrency()

  const { data, anchorLabel } = useMemo(() => {
    const hist = candles.slice(-history)
    const rows: Row[] = hist.map((c) => ({
      t: c.t,
      label: dayMonth(c.t),
      actual: convert(c.close),
    }))
    // Anchor the forecast to the last actual close so the lines/bands connect.
    const last = rows[rows.length - 1]
    const anchor = last ? last.label : ""
    if (last) {
      last.median = last.actual
      last.band80 = [last.actual!, last.actual!]
      last.band50 = [last.actual!, last.actual!]
    }
    for (const p of projection) {
      rows.push({
        t: p.t,
        label: dayMonth(p.t),
        median: convert(p.median),
        band80: [convert(p.p10), convert(p.p90)],
        band50: [convert(p.p25), convert(p.p75)],
      })
    }
    return { data: rows, anchorLabel: anchor }
  }, [candles, projection, history, convert])

  const tickInterval = Math.max(0, Math.floor(data.length / 7))

  return (
    <div style={{ width: "100%", height: 320 }} aria-hidden>
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 8, right: 10, bottom: 4, left: 2 }}>
          <defs>
            <linearGradient id="actualFade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--series-price)" stopOpacity={0.14} />
              <stop offset="100%" stopColor="var(--series-price)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--grid)" strokeDasharray="0" vertical={false} />
          <XAxis
            dataKey="label"
            interval={tickInterval}
            tick={{ fill: "var(--muted)", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "var(--axis)" }}
            minTickGap={8}
          />
          <YAxis
            orientation="right"
            width={62}
            domain={["auto", "auto"]}
            tick={{ fill: "var(--muted)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) =>
              new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(v)
            }
          />
          <Tooltip
            content={<ForecastTooltip currency={code} />}
            cursor={{ stroke: "var(--muted)", strokeDasharray: "3 3" }}
          />
          {/* 80% band (outer), then 50% band (inner) */}
          <Area
            dataKey="band80"
            stroke="none"
            fill="var(--band-weak)"
            isAnimationActive={false}
            connectNulls
            activeDot={false}
          />
          <Area
            dataKey="band50"
            stroke="none"
            fill="var(--band-strong)"
            isAnimationActive={false}
            connectNulls
            activeDot={false}
          />
          {/* Historical price */}
          <Area
            dataKey="actual"
            stroke="var(--series-price)"
            strokeWidth={2}
            fill="url(#actualFade)"
            isAnimationActive={false}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: "var(--series-price)" }}
          />
          {/* Forecast median */}
          <Line
            dataKey="median"
            stroke="var(--series-forecast)"
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={false}
            isAnimationActive={false}
            connectNulls
            activeDot={{ r: 4, strokeWidth: 0, fill: "var(--series-forecast)" }}
          />
          {anchorLabel && (
            <ReferenceLine
              x={anchorLabel}
              stroke="var(--muted)"
              strokeDasharray="2 3"
              label={{ value: "today", position: "insideTopRight", fill: "var(--muted)", fontSize: 10 }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ payload: Row }>
  currency: string
}

function ForecastTooltip({ active, payload, currency }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const row = payload[0].payload
  const fmt = (n?: number) =>
    n == null ? "—" : new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(n)
  return (
    <div
      className="glass glass-strong tnum"
      style={{ padding: "10px 12px", borderRadius: 12, fontSize: 12.5, minWidth: 150 }}
    >
      <div style={{ color: "var(--muted)", marginBottom: 6 }}>{fullDate(row.t)}</div>
      {row.actual != null && (
        <Row label="Price" value={`${currency} ${fmt(row.actual)}`} dot="var(--series-price)" />
      )}
      {row.median != null && row.actual == null && (
        <>
          <Row label="Forecast" value={`${currency} ${fmt(row.median)}`} dot="var(--series-forecast)" />
          {row.band50 && (
            <Row label="50% range" value={`${fmt(row.band50[0])} – ${fmt(row.band50[1])}`} />
          )}
          {row.band80 && (
            <Row label="80% range" value={`${fmt(row.band80[0])} – ${fmt(row.band80[1])}`} />
          )}
        </>
      )}
    </div>
  )
}

function Row({ label, value, dot }: { label: string; value: string; dot?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 14, padding: "1px 0" }}>
      <span style={{ color: "var(--ink-2)", display: "flex", alignItems: "center", gap: 6 }}>
        {dot && (
          <span style={{ width: 8, height: 8, borderRadius: 8, background: dot, display: "inline-block" }} />
        )}
        {label}
      </span>
      <span style={{ color: "var(--ink)", fontWeight: 600 }}>{value}</span>
    </div>
  )
}
