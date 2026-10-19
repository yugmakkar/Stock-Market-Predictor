import { NextResponse } from "next/server"
import { searchSeed } from "@/lib/stocks"
import { dataMode } from "@/lib/datasource"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q") ?? ""
  return NextResponse.json({ mode: dataMode(), stocks: searchSeed(q) })
}
