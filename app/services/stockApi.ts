// Enhanced Stock API service with Yahoo Finance unofficial API
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
  previousClose?: number
  dayHigh?: number
  dayLow?: number
  weekHigh52?: number
  weekLow52?: number
}

export interface HistoricalData {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface TechnicalIndicators {
  sma20: number
  sma50: number
  ema12: number
  ema26: number
  rsi: number
  macd: number
  bollinger: {
    upper: number
    middle: number
    lower: number
  }
  stochastic: {
    k: number
    d: number
  }
}

// Yahoo Finance unofficial API endpoints
const YAHOO_FINANCE_API = {
  quote: 'https://query1.finance.yahoo.com/v8/finance/chart',
  search: 'https://query2.finance.yahoo.com/v1/finance/search',
  options: 'https://query2.finance.yahoo.com/v7/finance/options'
}

class EnhancedStockApiService {
  private cache = new Map<string, { data: any; timestamp: number }>()
  private historicalCache = new Map<string, { data: HistoricalData[]; timestamp: number }>()
  private readonly CACHE_DURATION = 30000 // 30 seconds for real-time data
  private readonly HISTORICAL_CACHE_DURATION = 300000 // 5 minutes for historical data
  
  // WebSocket connections for real-time data
  private wsConnections = new Map<string, WebSocket>()
  private subscribers = new Map<string, Set<(data: StockData) => void>>()
  private updateIntervals = new Map<string, NodeJS.Timeout>()

  constructor() {
    this.initializeRealTimeConnections()
  }

  private initializeRealTimeConnections() {
    console.log('Initializing Yahoo Finance real-time data connections...')
  }

  // Subscribe to real-time updates with custom intervals
  subscribeToRealTimeUpdates(symbol: string, callback: (data: StockData) => void, intervalMinutes: number = 15) {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, new Set())
    }
    this.subscribers.get(symbol)!.add(callback)
    
    // Start real-time connection with specified interval
    this.startRealTimeConnection(symbol, intervalMinutes)
  }

  private startRealTimeConnection(symbol: string, intervalMinutes: number) {
    // Clear existing interval if any
    if (this.updateIntervals.has(symbol)) {
      clearInterval(this.updateIntervals.get(symbol)!)
    }

    // Set up new interval
    const intervalMs = intervalMinutes * 60 * 1000
    const interval = setInterval(async () => {
      try {
        const data = await this.fetchRealTimeStockData(symbol)
        if (data) {
          const subscribers = this.subscribers.get(symbol)
          if (subscribers) {
            subscribers.forEach(callback => callback(data))
          }
        }
      } catch (error) {
        console.error(`Error updating ${symbol}:`, error)
      }
    }, intervalMs)

    this.updateIntervals.set(symbol, interval)
    
    // Initial fetch
    this.fetchRealTimeStockData(symbol).then(data => {
      if (data) {
        const subscribers = this.subscribers.get(symbol)
        if (subscribers) {
          subscribers.forEach(callback => callback(data))
        }
      }
    })
  }

  async fetchRealTimeStockData(symbol: string): Promise<StockData | null> {
    try {
      // Check cache first
      const cached = this.cache.get(symbol)
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.data
      }

      const data = await this.fetchFromYahooFinance(symbol)
      
      if (data) {
        this.cache.set(symbol, { data, timestamp: Date.now() })
        return data
      }
      
      return null
    } catch (error) {
      console.error(`Error fetching real-time data for ${symbol}:`, error)
      return null
    }
  }

  private async fetchFromYahooFinance(symbol: string): Promise<StockData | null> {
    try {
      const response = await axios.get(`${YAHOO_FINANCE_API.quote}/${symbol}`, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })

      const result = response.data?.chart?.result?.[0]
      if (!result) return null

      const meta = result.meta
      const quote = result.indicators?.quote?.[0]
      
      if (!meta) return null

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
        open: meta.regularMarketOpen,
        previousClose: previousClose,
        dayHigh: meta.regularMarketDayHigh,
        dayLow: meta.regularMarketDayLow,
        weekHigh52: meta.fiftyTwoWeekHigh,
        weekLow52: meta.fiftyTwoWeekLow
      }
    } catch (error) {
      throw new Error(`Yahoo Finance API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async fetchHistoricalData(symbol: string, period: string = '1d', interval: string = '15m'): Promise<HistoricalData[]> {
    const cacheKey = `${symbol}_${period}_${interval}`
    const cached = this.historicalCache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < this.HISTORICAL_CACHE_DURATION) {
      return cached.data
    }

    try {
      const data = await this.fetchHistoricalFromYahoo(symbol, period, interval)
      if (data && data.length > 0) {
        this.historicalCache.set(cacheKey, { data, timestamp: Date.now() })
        return data
      }
      
      return []
    } catch (error) {
      console.error(`Error fetching historical data for ${symbol}:`, error)
      return []
    }
  }

  private async fetchHistoricalFromYahoo(symbol: string, period: string, interval: string): Promise<HistoricalData[]> {
    try {
      const response = await axios.get(`${YAHOO_FINANCE_API.quote}/${symbol}`, {
        params: {
          range: period,
          interval: interval,
          includePrePost: true,
          events: 'div%2Csplit'
        },
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })

      const result = response.data?.chart?.result?.[0]
      if (!result) return []

      const timestamps = result.timestamp
      const quotes = result.indicators?.quote?.[0]
      
      if (!timestamps || !quotes) return []

      return timestamps.map((timestamp: number, index: number) => ({
        timestamp: timestamp * 1000,
        open: quotes.open[index] || 0,
        high: quotes.high[index] || 0,
        low: quotes.low[index] || 0,
        close: quotes.close[index] || 0,
        volume: quotes.volume[index] || 0
      })).filter((item: HistoricalData) => item.close > 0)
    } catch (error) {
      throw new Error(`Yahoo historical data error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Enhanced prediction algorithm with technical analysis
  calculateAdvancedPrediction(
    currentPrice: number,
    historicalData: HistoricalData[],
    volume: number = 0,
    marketCap: number = 0,
    timeHorizonMinutes: number = 30
  ): { predictedPrice: number; confidence: number; trend: 'bullish' | 'bearish' | 'neutral'; signals: string[] } {
    
    if (historicalData.length < 50) {
      // Fallback for insufficient data
      const randomWalk = (Math.random() - 0.5) * 0.02
      return {
        predictedPrice: currentPrice * (1 + randomWalk),
        confidence: 0.3,
        trend: randomWalk > 0 ? 'bullish' : 'bearish',
        signals: ['Insufficient historical data']
      }
    }

    const signals: string[] = []
    const prices = historicalData.map(d => d.close)
    const volumes = historicalData.map(d => d.volume)
    const highs = historicalData.map(d => d.high)
    const lows = historicalData.map(d => d.low)

    // Calculate technical indicators
    const indicators = this.calculateTechnicalIndicators(historicalData)
    
    // Trend Analysis
    const sma20 = this.calculateSMA(prices.slice(-20))
    const sma50 = this.calculateSMA(prices.slice(-50))
    const ema12 = this.calculateEMA(prices, 12)
    const ema26 = this.calculateEMA(prices, 26)
    
    // Support and Resistance levels
    const supportResistance = this.findSupportResistanceLevels(highs, lows, prices)
    
    // Volume analysis
    const avgVolume = this.calculateSMA(volumes.slice(-20))
    const volumeRatio = volume / avgVolume
    
    // Price action patterns
    const patterns = this.identifyPatterns(historicalData.slice(-20))
    
    // Momentum indicators
    const rsi = this.calculateRSI(prices)
    const macd = this.calculateMACD(prices)
    const stochastic = this.calculateStochastic(highs, lows, prices)
    
    // Volatility analysis
    const volatility = this.calculateVolatility(prices.slice(-20))
    const atr = this.calculateATR(historicalData.slice(-14))
    
    // Market sentiment analysis
    let sentimentScore = 0
    
    // Moving Average signals
    if (currentPrice > sma20 && sma20 > sma50) {
      sentimentScore += 0.3
      signals.push('Bullish MA crossover')
    } else if (currentPrice < sma20 && sma20 < sma50) {
      sentimentScore -= 0.3
      signals.push('Bearish MA crossover')
    }
    
    // EMA signals
    if (ema12 > ema26) {
      sentimentScore += 0.2
      signals.push('Bullish EMA trend')
    } else {
      sentimentScore -= 0.2
      signals.push('Bearish EMA trend')
    }
    
    // RSI signals
    if (rsi > 70) {
      sentimentScore -= 0.25
      signals.push('Overbought (RSI > 70)')
    } else if (rsi < 30) {
      sentimentScore += 0.25
      signals.push('Oversold (RSI < 30)')
    }
    
    // MACD signals
    if (macd.macd > macd.signal && macd.histogram > 0) {
      sentimentScore += 0.2
      signals.push('Bullish MACD crossover')
    } else if (macd.macd < macd.signal && macd.histogram < 0) {
      sentimentScore -= 0.2
      signals.push('Bearish MACD crossover')
    }
    
    // Stochastic signals
    if (stochastic.k > 80 && stochastic.d > 80) {
      sentimentScore -= 0.15
      signals.push('Overbought (Stochastic)')
    } else if (stochastic.k < 20 && stochastic.d < 20) {
      sentimentScore += 0.15
      signals.push('Oversold (Stochastic)')
    }
    
    // Volume confirmation
    if (volumeRatio > 1.5) {
      sentimentScore *= 1.2 // Amplify signal with high volume
      signals.push('High volume confirmation')
    } else if (volumeRatio < 0.5) {
      sentimentScore *= 0.8 // Reduce signal with low volume
      signals.push('Low volume warning')
    }
    
    // Support/Resistance levels
    const nearSupport = supportResistance.support.some(level => 
      Math.abs(currentPrice - level) / currentPrice < 0.02
    )
    const nearResistance = supportResistance.resistance.some(level => 
      Math.abs(currentPrice - level) / currentPrice < 0.02
    )
    
    if (nearSupport) {
      sentimentScore += 0.1
      signals.push('Near support level')
    }
    if (nearResistance) {
      sentimentScore -= 0.1
      signals.push('Near resistance level')
    }
    
    // Pattern recognition
    patterns.forEach(pattern => {
      if (pattern.type === 'bullish') {
        sentimentScore += pattern.strength
        signals.push(`Bullish pattern: ${pattern.name}`)
      } else if (pattern.type === 'bearish') {
        sentimentScore -= pattern.strength
        signals.push(`Bearish pattern: ${pattern.name}`)
      }
    })
    
    // Time decay factor
    const timeDecay = Math.exp(-timeHorizonMinutes / 120) // 2-hour half-life
    
    // Market cap factor (larger companies are more stable)
    const marketCapFactor = marketCap > 1000000000 ? 0.8 : 1.2
    
    // Calculate predicted price change
    const baseChange = sentimentScore * volatility * timeDecay * marketCapFactor
    const randomComponent = (Math.random() - 0.5) * volatility * 0.2
    
    const totalChange = baseChange + randomComponent
    const predictedPrice = currentPrice * (1 + totalChange)
    
    // Calculate confidence based on various factors
    const dataQuality = Math.min(1, historicalData.length / 100)
    const volumeConfidence = Math.min(1, volumeRatio)
    const volatilityConfidence = 1 - Math.min(1, volatility * 10)
    const timeConfidence = timeDecay
    
    const confidence = Math.min(0.95, Math.max(0.1, 
      (dataQuality * 0.3 + volumeConfidence * 0.2 + volatilityConfidence * 0.3 + timeConfidence * 0.2) * 0.8 + 0.2
    ))
    
    const trend = sentimentScore > 0.1 ? 'bullish' : sentimentScore < -0.1 ? 'bearish' : 'neutral'
    
    return {
      predictedPrice: Number(predictedPrice.toFixed(2)),
      confidence: Number(confidence.toFixed(2)),
      trend,
      signals: signals.slice(0, 5) // Limit to top 5 signals
    }
  }

  private calculateTechnicalIndicators(data: HistoricalData[]): TechnicalIndicators {
    const prices = data.map(d => d.close)
    const highs = data.map(d => d.high)
    const lows = data.map(d => d.low)
    
    return {
      sma20: this.calculateSMA(prices.slice(-20)),
      sma50: this.calculateSMA(prices.slice(-50)),
      ema12: this.calculateEMA(prices, 12),
      ema26: this.calculateEMA(prices, 26),
      rsi: this.calculateRSI(prices),
      macd: this.calculateMACD(prices).macd,
      bollinger: this.calculateBollingerBands(prices),
      stochastic: this.calculateStochastic(highs, lows, prices)
    }
  }

  private calculateSMA(prices: number[]): number {
    if (prices.length === 0) return 0
    return prices.reduce((sum, price) => sum + price, 0) / prices.length
  }

  private calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1] || 0
    
    const multiplier = 2 / (period + 1)
    let ema = prices[0]
    
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier))
    }
    
    return ema
  }

  private calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50

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

  private calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
    const ema12 = this.calculateEMA(prices, 12)
    const ema26 = this.calculateEMA(prices, 26)
    const macd = ema12 - ema26
    
    // Calculate signal line (9-period EMA of MACD)
    const macdValues = []
    for (let i = 26; i < prices.length; i++) {
      const slice = prices.slice(0, i + 1)
      const ema12 = this.calculateEMA(slice, 12)
      const ema26 = this.calculateEMA(slice, 26)
      macdValues.push(ema12 - ema26)
    }
    
    const signal = this.calculateEMA(macdValues, 9)
    const histogram = macd - signal
    
    return { macd, signal, histogram }
  }

  private calculateBollingerBands(prices: number[], period: number = 20): { upper: number; middle: number; lower: number } {
    const sma = this.calculateSMA(prices.slice(-period))
    const variance = prices.slice(-period).reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period
    const stdDev = Math.sqrt(variance)
    
    return {
      upper: sma + (stdDev * 2),
      middle: sma,
      lower: sma - (stdDev * 2)
    }
  }

  private calculateStochastic(highs: number[], lows: number[], closes: number[], period: number = 14): { k: number; d: number } {
    if (highs.length < period) return { k: 50, d: 50 }
    
    const recentHighs = highs.slice(-period)
    const recentLows = lows.slice(-period)
    const currentClose = closes[closes.length - 1]
    
    const highestHigh = Math.max(...recentHighs)
    const lowestLow = Math.min(...recentLows)
    
    const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100
    
    // Calculate %D (3-period SMA of %K)
    const kValues = []
    for (let i = period - 1; i < closes.length; i++) {
      const sliceHighs = highs.slice(i - period + 1, i + 1)
      const sliceLows = lows.slice(i - period + 1, i + 1)
      const sliceClose = closes[i]
      
      const high = Math.max(...sliceHighs)
      const low = Math.min(...sliceLows)
      
      kValues.push(((sliceClose - low) / (high - low)) * 100)
    }
    
    const d = this.calculateSMA(kValues.slice(-3))
    
    return { k, d }
  }

  private calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0.02

    const returns = []
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1])
    }

    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length
    
    return Math.sqrt(variance)
  }

  private calculateATR(data: HistoricalData[], period: number = 14): number {
    if (data.length < period) return 0
    
    const trueRanges = []
    for (let i = 1; i < data.length; i++) {
      const high = data[i].high
      const low = data[i].low
      const prevClose = data[i - 1].close
      
      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      )
      trueRanges.push(tr)
    }
    
    return this.calculateSMA(trueRanges.slice(-period))
  }

  private findSupportResistanceLevels(highs: number[], lows: number[], prices: number[]): { support: number[]; resistance: number[] } {
    const support: number[] = []
    const resistance: number[] = []
    
    // Find local minima and maxima
    for (let i = 2; i < prices.length - 2; i++) {
      // Local minimum (support)
      if (lows[i] < lows[i - 1] && lows[i] < lows[i + 1] && 
          lows[i] < lows[i - 2] && lows[i] < lows[i + 2]) {
        support.push(lows[i])
      }
      
      // Local maximum (resistance)
      if (highs[i] > highs[i - 1] && highs[i] > highs[i + 1] && 
          highs[i] > highs[i - 2] && highs[i] > highs[i + 2]) {
        resistance.push(highs[i])
      }
    }
    
    return { support: support.slice(-3), resistance: resistance.slice(-3) }
  }

  private identifyPatterns(data: HistoricalData[]): Array<{ name: string; type: 'bullish' | 'bearish' | 'neutral'; strength: number }> {
    const patterns = []
    
    if (data.length < 10) return patterns
    
    const prices = data.map(d => d.close)
    const highs = data.map(d => d.high)
    const lows = data.map(d => d.low)
    
    // Hammer pattern
    const lastCandle = data[data.length - 1]
    const bodySize = Math.abs(lastCandle.close - lastCandle.open)
    const lowerShadow = Math.min(lastCandle.open, lastCandle.close) - lastCandle.low
    const upperShadow = lastCandle.high - Math.max(lastCandle.open, lastCandle.close)
    
    if (lowerShadow > bodySize * 2 && upperShadow < bodySize * 0.5) {
      patterns.push({ name: 'Hammer', type: 'bullish', strength: 0.15 })
    }
    
    // Doji pattern
    if (bodySize < (lastCandle.high - lastCandle.low) * 0.1) {
      patterns.push({ name: 'Doji', type: 'neutral', strength: 0.1 })
    }
    
    // Engulfing pattern
    if (data.length >= 2) {
      const prev = data[data.length - 2]
      const curr = data[data.length - 1]
      
      if (prev.close < prev.open && curr.close > curr.open && 
          curr.close > prev.open && curr.open < prev.close) {
        patterns.push({ name: 'Bullish Engulfing', type: 'bullish', strength: 0.2 })
      } else if (prev.close > prev.open && curr.close < curr.open && 
                 curr.close < prev.open && curr.open > prev.close) {
        patterns.push({ name: 'Bearish Engulfing', type: 'bearish', strength: 0.2 })
      }
    }
    
    return patterns
  }

  private determineMarket(symbol: string): "US" | "IN" {
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
    const promises = symbols.map(symbol => this.fetchRealTimeStockData(symbol))
    const results = await Promise.allSettled(promises)
    
    return results
      .filter((result): result is PromiseFulfilledResult<StockData> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value)
  }

  // Update subscription interval
  updateSubscriptionInterval(symbol: string, intervalMinutes: number) {
    if (this.subscribers.has(symbol)) {
      this.startRealTimeConnection(symbol, intervalMinutes)
    }
  }

  // Cleanup method
  cleanup() {
    this.updateIntervals.forEach((interval) => {
      clearInterval(interval)
    })
    this.updateIntervals.clear()
    
    this.wsConnections.forEach((connection, symbol) => {
      if (typeof connection === 'number') {
        clearInterval(connection)
      } else if (connection instanceof WebSocket) {
        connection.close()
      }
    })
    this.wsConnections.clear()
    this.subscribers.clear()
  }
}

export const stockApiService = new EnhancedStockApiService()