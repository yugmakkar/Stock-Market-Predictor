// Stock API service for fetching real-time data
import axios from 'axios'

export interface StockData {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  market: "US" | "IN"
  currency: string
  volume?: number
  marketCap?: number
  high?: number
  low?: number
  open?: number
}

// Alpha Vantage API (free tier available)
const ALPHA_VANTAGE_API_KEY = 'demo' // Replace with actual API key
const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query'

// Finnhub API (free tier available)
const FINNHUB_API_KEY = 'demo' // Replace with actual API key
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1'

// Yahoo Finance API (unofficial but free)
const YAHOO_FINANCE_BASE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart'

class StockApiService {
  private cache = new Map<string, { data: StockData; timestamp: number }>()
  private readonly CACHE_DURATION = 60000 // 1 minute cache

  private isDataCached(symbol: string): boolean {
    const cached = this.cache.get(symbol)
    if (!cached) return false
    return Date.now() - cached.timestamp < this.CACHE_DURATION
  }

  private getCachedData(symbol: string): StockData | null {
    const cached = this.cache.get(symbol)
    return cached ? cached.data : null
  }

  private setCachedData(symbol: string, data: StockData): void {
    this.cache.set(symbol, { data, timestamp: Date.now() })
  }

  async fetchStockData(symbol: string): Promise<StockData | null> {
    // Check cache first
    if (this.isDataCached(symbol)) {
      return this.getCachedData(symbol)
    }

    try {
      // Try Yahoo Finance first (most reliable for free usage)
      const data = await this.fetchFromYahooFinance(symbol)
      if (data) {
        this.setCachedData(symbol, data)
        return data
      }

      // Fallback to Alpha Vantage
      const alphaData = await this.fetchFromAlphaVantage(symbol)
      if (alphaData) {
        this.setCachedData(symbol, alphaData)
        return alphaData
      }

      return null
    } catch (error) {
      console.error(`Error fetching data for ${symbol}:`, error)
      return null
    }
  }

  private async fetchFromYahooFinance(symbol: string): Promise<StockData | null> {
    try {
      const response = await axios.get(`${YAHOO_FINANCE_BASE_URL}/${symbol}`, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })

      const result = response.data?.chart?.result?.[0]
      if (!result) return null

      const meta = result.meta
      const quote = result.indicators?.quote?.[0]
      
      if (!meta || !quote) return null

      const currentPrice = meta.regularMarketPrice || meta.previousClose
      const previousClose = meta.previousClose
      const change = currentPrice - previousClose
      const changePercent = (change / previousClose) * 100

      return {
        symbol: meta.symbol,
        name: meta.longName || meta.shortName || meta.symbol,
        price: Number(currentPrice.toFixed(2)),
        change: Number(change.toFixed(2)),
        changePercent: Number(changePercent.toFixed(2)),
        market: this.determineMarket(meta.symbol),
        currency: meta.currency === 'INR' ? 'INR' : 'USD',
        volume: meta.regularMarketVolume,
        marketCap: meta.marketCap,
        high: meta.regularMarketDayHigh,
        low: meta.regularMarketDayLow,
        open: meta.regularMarketOpen
      }
    } catch (error) {
      console.error('Yahoo Finance API error:', error)
      return null
    }
  }

  private async fetchFromAlphaVantage(symbol: string): Promise<StockData | null> {
    try {
      const response = await axios.get(ALPHA_VANTAGE_BASE_URL, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: symbol,
          apikey: ALPHA_VANTAGE_API_KEY
        },
        timeout: 5000
      })

      const quote = response.data['Global Quote']
      if (!quote) return null

      const currentPrice = parseFloat(quote['05. price'])
      const change = parseFloat(quote['09. change'])
      const changePercent = parseFloat(quote['10. change percent'].replace('%', ''))

      return {
        symbol: quote['01. symbol'],
        name: quote['01. symbol'], // Alpha Vantage doesn't provide company names in this endpoint
        price: Number(currentPrice.toFixed(2)),
        change: Number(change.toFixed(2)),
        changePercent: Number(changePercent.toFixed(2)),
        market: this.determineMarket(symbol),
        currency: this.determineMarket(symbol) === 'IN' ? 'INR' : 'USD',
        volume: parseInt(quote['06. volume']),
        high: parseFloat(quote['03. high']),
        low: parseFloat(quote['04. low']),
        open: parseFloat(quote['02. open'])
      }
    } catch (error) {
      console.error('Alpha Vantage API error:', error)
      return null
    }
  }

  private determineMarket(symbol: string): "US" | "IN" {
    // Indian stock symbols typically end with .NS (NSE) or .BO (BSE)
    // or are specific Indian company symbols
    const indianSymbols = [
      'RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS',
      'SBIN.NS', 'BHARTIARTL.NS', 'ITC.NS', 'LT.NS', 'HCLTECH.NS',
      'WIPRO.NS', 'MARUTI.NS', 'ADANIPORTS.NS', 'ASIANPAINT.NS',
      'AXISBANK.NS', 'BAJFINANCE.NS', 'KOTAKBANK.NS'
    ]
    
    if (symbol.includes('.NS') || symbol.includes('.BO') || indianSymbols.includes(symbol)) {
      return 'IN'
    }
    return 'US'
  }

  async fetchMultipleStocks(symbols: string[]): Promise<StockData[]> {
    const promises = symbols.map(symbol => this.fetchStockData(symbol))
    const results = await Promise.allSettled(promises)
    
    return results
      .filter((result): result is PromiseFulfilledResult<StockData> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value)
  }

  // Enhanced prediction algorithm
  calculateAdvancedPrediction(
    currentPrice: number,
    historicalData: number[],
    volume: number = 0,
    marketCap: number = 0,
    timeHorizonMinutes: number = 30
  ): { predictedPrice: number; confidence: number; trend: 'bullish' | 'bearish' | 'neutral' } {
    if (historicalData.length < 5) {
      // Fallback for insufficient data
      const randomWalk = (Math.random() - 0.5) * 0.02
      return {
        predictedPrice: currentPrice * (1 + randomWalk),
        confidence: 0.3,
        trend: randomWalk > 0 ? 'bullish' : 'bearish'
      }
    }

    // Calculate various technical indicators
    const sma5 = this.calculateSMA(historicalData.slice(-5))
    const sma10 = this.calculateSMA(historicalData.slice(-10))
    const rsi = this.calculateRSI(historicalData)
    const volatility = this.calculateVolatility(historicalData)
    const momentum = this.calculateMomentum(historicalData)
    
    // Trend analysis
    const shortTermTrend = sma5 > sma10 ? 1 : -1
    const momentumSignal = momentum > 0 ? 1 : -1
    const rsiSignal = rsi > 70 ? -1 : rsi < 30 ? 1 : 0
    
    // Combine signals with weights
    const trendScore = (shortTermTrend * 0.4) + (momentumSignal * 0.3) + (rsiSignal * 0.3)
    
    // Time decay factor (longer predictions are less reliable)
    const timeDecay = Math.exp(-timeHorizonMinutes / 60)
    
    // Volume factor (higher volume = more reliable)
    const volumeFactor = Math.min(1, volume / 1000000) * 0.1 + 0.9
    
    // Calculate predicted price change
    const baseChange = trendScore * volatility * timeDecay * volumeFactor
    const randomComponent = (Math.random() - 0.5) * volatility * 0.3
    
    const totalChange = baseChange + randomComponent
    const predictedPrice = currentPrice * (1 + totalChange)
    
    // Calculate confidence based on various factors
    const confidence = Math.min(0.95, Math.max(0.1, 
      (1 - volatility) * timeDecay * volumeFactor * 0.8 + 0.2
    ))
    
    const trend = trendScore > 0.1 ? 'bullish' : trendScore < -0.1 ? 'bearish' : 'neutral'
    
    return {
      predictedPrice: Number(predictedPrice.toFixed(2)),
      confidence: Number(confidence.toFixed(2)),
      trend
    }
  }

  private calculateSMA(prices: number[]): number {
    return prices.reduce((sum, price) => sum + price, 0) / prices.length
  }

  private calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50 // Neutral RSI

    const gains: number[] = []
    const losses: number[] = []

    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1]
      gains.push(change > 0 ? change : 0)
      losses.push(change < 0 ? Math.abs(change) : 0)
    }

    const avgGain = gains.slice(-period).reduce((sum, gain) => sum + gain, 0) / period
    const avgLoss = losses.slice(-period).reduce((sum, loss) => sum + loss, 0) / period

    if (avgLoss === 0) return 100
    const rs = avgGain / avgLoss
    return 100 - (100 / (1 + rs))
  }

  private calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0.02 // Default volatility

    const returns = []
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1])
    }

    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length
    
    return Math.sqrt(variance)
  }

  private calculateMomentum(prices: number[], period: number = 5): number {
    if (prices.length < period) return 0
    
    const current = prices[prices.length - 1]
    const past = prices[prices.length - period]
    
    return (current - past) / past
  }
}

export const stockApiService = new StockApiService()