// Server-only Google News RSS fetch + parse. Free, no key. We parse the RSS
// with regex (no XML dependency) and score each headline with our lexicon.

import type { NewsItem } from "./types"
import { scoreHeadline } from "./sentiment"

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"

function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .trim()
}

function tag(block: string, name: string): string {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"))
  return m ? decodeEntities(m[1]) : ""
}

export function parseRss(xml: string, limit = 12): NewsItem[] {
  const items: NewsItem[] = []
  const blocks = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? []
  for (const block of blocks.slice(0, limit)) {
    const rawTitle = tag(block, "title")
    if (!rawTitle) continue
    // Google News titles are "Headline - Source".
    const lastDash = rawTitle.lastIndexOf(" - ")
    const title = lastDash > 0 ? rawTitle.slice(0, lastDash) : rawTitle
    const source = tag(block, "source") || (lastDash > 0 ? rawTitle.slice(lastDash + 3) : "Google News")
    const pub = tag(block, "pubDate")
    items.push({
      title,
      link: tag(block, "link"),
      source,
      publishedAt: pub ? new Date(pub).toISOString() : new Date().toISOString(),
      sentiment: scoreHeadline(title),
    })
  }
  return items
}

export async function getNewsLive(query: string): Promise<NewsItem[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(
    query + " stock NSE",
  )}&hl=en-IN&gl=IN&ceid=IN:en`
  const res = await fetch(url, {
    headers: { "User-Agent": UA },
    next: { revalidate: 600 },
  })
  if (!res.ok) throw new Error(`Google News responded ${res.status}`)
  const xml = await res.text()
  return parseRss(xml)
}
