import { NextResponse } from "next/server"
import { getHistory, getNews, dataMode } from "@/lib/datasource"
import { predict } from "@/lib/prediction"
import { backtest } from "@/lib/backtest"
import { aggregateSentiment } from "@/lib/sentiment"
import { seedBySymbol } from "@/lib/stocks"

export const dynamic = "force-dynamic"

export async function GET(_request: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params
  try {
    const { candles, quote } = await getHistory(symbol)
    if (!candles.length) {
      return NextResponse.json({ error: `No market data for ${symbol}.` }, { status: 404 })
    }

    const name = seedBySymbol(symbol)?.name ?? quote.name
    // News is best-effort; a news failure must not sink the whole response.
    let news: Awaited<ReturnType<typeof getNews>> = []
    try {
      news = await getNews(symbol, name)
    } catch {
      news = []
    }

    const newsSentiment = aggregateSentiment(news.map((n) => n.title))
    const prediction = predict({ symbol, candles, newsSentiment })
    prediction.backtest = backtest(candles, 5)

    return NextResponse.json({
      mode: dataMode(),
      quote,
      candles,
      news,
      prediction,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json(
      { error: `Could not load live data for ${symbol}. ${message}` },
      { status: 502 },
    )
  }
}
