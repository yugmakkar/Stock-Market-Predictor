import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params
    const { searchParams } = new URL(request.url)
    
    // Build Yahoo Finance API URL
    const yahooUrl = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`)
    
    // Add query parameters if they exist
    searchParams.forEach((value, key) => {
      yahooUrl.searchParams.set(key, value)
    })

    const response = await fetch(yahooUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    if (!response.ok) {
      throw new Error(`Yahoo Finance API responded with status: ${response.status}`)
    }

    const data = await response.json()
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      }
    })
  } catch (error) {
    console.error('Error fetching historical data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch historical data' },
      { status: 500 }
    )
  }
}