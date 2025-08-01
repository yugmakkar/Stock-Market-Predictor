"use client"

import { useState, useEffect } from "react"
import { stockApiService, type StockData } from "./services/stockApi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import StockChart from "./components/stock-chart"
import StockList from "./components/stock-list"
import AIBackground from "./components/ai-background"
import { TrendingUp, TrendingDown, Activity, Brain, Globe, IndianRupee, DollarSign, AlertTriangle, RefreshCw } from "lucide-react"

interface Stock extends StockData {
  predictedPrice?: number
  predictedChange?: number
}

const STOCK_SYMBOLS = [
  // US Stocks
  "AAPL", "GOOGL", "MSFT", "TSLA", "NVDA", "AMZN", "META", "NFLX",
  // Indian Stocks
  "RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "ICICIBANK.NS",
  "SBIN.NS", "BHARTIARTL.NS", "ITC.NS", "LT.NS", "HCLTECH.NS",
  "WIPRO.NS", "MARUTI.NS", "ADANIPORTS.NS", "ASIANPAINT.NS",
  "AXISBANK.NS", "BAJFINANCE.NS", "KOTAKBANK.NS"
]

export default function StockPredictor() {
  const [stocks, setStocks] = useState<Stock[]>([])
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeMarket, setActiveMarket] = useState<"ALL" | "US" | "IN">("ALL")
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Load initial stock data
  useEffect(() => {
    loadStockData()
  }, [])

  // Refresh data every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      refreshStockData()
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [])

  // Update selected stock when stocks update
  useEffect(() => {
    if (selectedStock && stocks.length > 0) {
      const updatedStock = stocks.find((s) => s.symbol === selectedStock.symbol)
      if (updatedStock) {
        setSelectedStock(updatedStock)
      }
    }
  }, [stocks, selectedStock])

  const loadStockData = async () => {
    setIsLoading(true)
    try {
      const stockData = await stockApiService.fetchMultipleStocks(STOCK_SYMBOLS)
      setStocks(stockData)
      if (stockData.length > 0 && !selectedStock) {
        setSelectedStock(stockData[0])
      }
    } catch (error) {
      console.error('Error loading stock data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshStockData = async () => {
    setIsRefreshing(true)
    try {
      const stockData = await stockApiService.fetchMultipleStocks(STOCK_SYMBOLS)
      setStocks(stockData)
    } catch (error) {
      console.error('Error refreshing stock data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const filteredStocks = stocks.filter((stock) => {
    const matchesSearch =
      stock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesMarket = activeMarket === "ALL" || stock.market === activeMarket
    return matchesSearch && matchesMarket
  })

  const handlePredictionUpdate = (predictedPrice: number, predictedChange: number) => {
    if (selectedStock) {
      setSelectedStock((prev) => prev ? ({
        ...prev,
        predictedPrice,
        predictedChange,
      }) : null)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
        <AIBackground />
        <div className="relative z-10 container mx-auto p-6 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Brain className="h-16 w-16 text-blue-400 mx-auto mb-4 animate-pulse" />
            <h2 className="text-2xl font-bold text-white mb-2">Loading Stock Data</h2>
            <p className="text-gray-400">Fetching real-time market data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!selectedStock) {
    return (
      <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
        <AIBackground />
        <div className="relative z-10 container mx-auto p-6 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No Stock Data Available</h2>
            <p className="text-gray-400 mb-4">Unable to load stock data. Please try again.</p>
            <Button onClick={loadStockData} className="bg-blue-600 hover:bg-blue-700">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      <AIBackground />

      <div className="relative z-10 container mx-auto p-6">
        {/* Centered Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Brain className="h-10 w-10 text-blue-400" />
            <h1 className="text-5xl font-bold text-white">AI Stock Market Predictor</h1>
          </div>
          <p className="text-white text-lg mb-4">
            Advanced artificial intelligence for accurate stock price predictions
          </p>

          {/* Warning Alert */}
          <Alert className="max-w-4xl mx-auto mb-6 bg-yellow-900/20 border-yellow-600/30">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-yellow-200">
              <strong>Disclaimer:</strong> Predictions are not 100% accurate and no financial decisions should be made
              solely based on these predictions. Please do your own research and use this website as a tool for future
              analysis only.
            </AlertDescription>
          </Alert>
        </div>

        {/* Market Selector */}
        <div className="flex justify-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={refreshStockData}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
          <Button
            variant={activeMarket === "ALL" ? "default" : "outline"}
            onClick={() => setActiveMarket("ALL")}
            className="flex items-center gap-2"
          >
            <Globe className="h-4 w-4" />
            All Markets
          </Button>
          <Button
            variant={activeMarket === "US" ? "default" : "outline"}
            onClick={() => setActiveMarket("US")}
            className="flex items-center gap-2"
          >
            <DollarSign className="h-4 w-4" />
            US Stocks
          </Button>
          <Button
            variant={activeMarket === "IN" ? "default" : "outline"}
            onClick={() => setActiveMarket("IN")}
            className="flex items-center gap-2"
          >
            <IndianRupee className="h-4 w-4" />
            Indian Stocks
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stock List */}
          <div className="lg:col-span-1">
            <Card className="glass border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Activity className="h-5 w-5" />
                  Market Watch ({stocks.length} stocks)
                </CardTitle>
                <CardDescription className="text-gray-300">Real-time stock prices and changes</CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="Search stocks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mb-4 bg-slate-800/50 border-slate-600 text-white"
                />
                <StockList stocks={filteredStocks} selectedStock={selectedStock} onSelectStock={setSelectedStock} />
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Selected Stock Info with Predictions */}
            <Card className="glass border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold text-white">{selectedStock.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <span className="text-lg font-medium text-gray-300">{selectedStock.symbol}</span>
                      <Badge variant={selectedStock.market === "US" ? "default" : "secondary"}>
                        {selectedStock.market}
                      </Badge>
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white">
                      {selectedStock.currency === "USD" ? "$" : "₹"}
                      {selectedStock.price.toFixed(2)}
                    </div>
                    <div
                      className={`flex items-center gap-1 text-lg font-medium ${selectedStock.change >= 0 ? "text-green-400" : "text-red-400"}`}
                    >
                      {selectedStock.change >= 0 ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      {selectedStock.change >= 0 ? "+" : ""}
                      {selectedStock.change.toFixed(2)} ({selectedStock.changePercent.toFixed(2)}%)
                    </div>
                  </div>
                </div>

                {/* Predicted Price Section */}
                {selectedStock.predictedPrice && (
                  <div className="mt-4 pt-4 border-t border-slate-600">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-blue-400">AI Predicted Price</h3>
                        <p className="text-sm text-gray-400">Based on current market analysis</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-400">
                          {selectedStock.currency === "USD" ? "$" : "₹"}
                          {selectedStock.predictedPrice.toFixed(2)}
                        </div>
                        <div
                          className={`flex items-center gap-1 text-lg font-medium ${selectedStock.predictedChange && selectedStock.predictedChange >= 0 ? "text-green-400" : "text-red-400"}`}
                        >
                          {selectedStock.predictedChange && selectedStock.predictedChange >= 0 ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                          {selectedStock.predictedChange && selectedStock.predictedChange >= 0 ? "+" : ""}
                          {selectedStock.predictedChange?.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardHeader>
            </Card>

            {/* Chart with Predictions */}
            <StockChart stock={selectedStock} onPredictionUpdate={handlePredictionUpdate} />
          </div>
        </div>
      </div>
    </div>
  )
}
