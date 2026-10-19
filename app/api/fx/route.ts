import { NextResponse } from "next/server"
import { getFx } from "@/lib/datasource"

export const dynamic = "force-dynamic"

export async function GET() {
  const fx = await getFx()
  return NextResponse.json(fx)
}
