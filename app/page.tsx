"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import StockChart from "./components/stock-chart"
import StockList from "./components/stock-list"
import AIBackground from "./components/ai-background"
import { TrendingUp, TrendingDown, Activity, Brain, Globe, IndianRupee, DollarSign, AlertTriangle } from "lucide-react"

interface Stock {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  market: "US" | "IN"
  currency: string
  predictedPrice?: number
  predictedChange?: number
}

const INITIAL_STOCKS: Stock[] = [
  // US Stocks
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    price: 175.43,
    change: 2.15,
    changePercent: 1.24,
    market: "US",
    currency: "USD",
  },
  {
    symbol: "GOOGL",
    name: "Alphabet Inc.",
    price: 142.56,
    change: -1.23,
    changePercent: -0.85,
    market: "US",
    currency: "USD",
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corp.",
    price: 378.85,
    change: 4.67,
    changePercent: 1.25,
    market: "US",
    currency: "USD",
  },
  {
    symbol: "TSLA",
    name: "Tesla Inc.",
    price: 248.42,
    change: -3.21,
    changePercent: -1.27,
    market: "US",
    currency: "USD",
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    price: 875.28,
    change: 12.45,
    changePercent: 1.44,
    market: "US",
    currency: "USD",
  },
  {
    symbol: "AMZN",
    name: "Amazon.com Inc.",
    price: 155.89,
    change: -2.34,
    changePercent: -1.48,
    market: "US",
    currency: "USD",
  },
  {
    symbol: "META",
    name: "Meta Platforms Inc.",
    price: 334.87,
    change: 5.67,
    changePercent: 1.72,
    market: "US",
    currency: "USD",
  },
  {
    symbol: "NFLX",
    name: "Netflix Inc.",
    price: 487.23,
    change: -8.45,
    changePercent: -1.71,
    market: "US",
    currency: "USD",
  },
  // Indian Stocks
  {
    symbol: "RELIANCE",
    name: "Reliance Industries Ltd",
    price: 2456.75,
    change: 15.3,
    changePercent: 0.63,
    market: "IN",
    currency: "INR",
  },
  {
    symbol: "TCS",
    name: "Tata Consultancy Services",
    price: 3542.8,
    change: -12.45,
    changePercent: -0.35,
    market: "IN",
    currency: "INR",
  },
  {
    symbol: "INFY",
    name: "Infosys Limited",
    price: 1456.9,
    change: 8.75,
    changePercent: 0.6,
    market: "IN",
    currency: "INR",
  },
  {
    symbol: "HDFCBANK",
    name: "HDFC Bank Limited",
    price: 1678.25,
    change: 22.1,
    changePercent: 1.33,
    market: "IN",
    currency: "INR",
  },
  {
    symbol: "ICICIBANK",
    name: "ICICI Bank Limited",
    price: 1234.56,
    change: -8.9,
    changePercent: -0.71,
    market: "IN",
    currency: "INR",
  },
  {
    symbol: "SBIN",
    name: "State Bank of India",
    price: 567.89,
    change: 4.32,
    changePercent: 0.77,
    market: "IN",
    currency: "INR",
  },
  {
    symbol: "BHARTIARTL",
    name: "Bharti Airtel Limited",
    price: 1089.45,
    change: 12.67,
    changePercent: 1.18,
    market: "IN",
    currency: "INR",
  },
  {
    symbol: "ITC",
    name: "ITC Limited",
    price: 456.78,
    change: -3.21,
    changePercent: -0.7,
    market: "IN",
    currency: "INR",
  },
  {
    symbol: "LT",
    name: "Larsen & Toubro Ltd",
    price: 3456.12,
    change: 23.45,
    changePercent: 0.68,
    market: "IN",
    currency: "INR",
  },
  {
    symbol: "HCLTECH",
    name: "HCL Technologies Ltd",
    price: 1567.89,
    change: 15.67,
    changePercent: 1.01,
    market: "IN",
    currency: "INR",
  },
  {
    symbol: "WIPRO",
    name: "Wipro Limited",
    price: 567.34,
    change: -4.56,
    changePercent: -0.8,
    market: "IN",
    currency: "INR",
  },
  {
    symbol: "MARUTI",
    name: "Maruti Suzuki India Ltd",
    price: 10234.56,
    change: 89.12,
    changePercent: 0.88,
    market: "IN",
    currency: "INR",
  },
  {
    symbol: "ADANIPORTS",
    name: "Adani Ports & SEZ Ltd",
    price: 789.45,
    change: 12.34,
    changePercent: 1.59,
    market: "IN",
    currency: "INR",
  },
  {
    symbol: "ASIANPAINT",
    name: "Asian Paints Limited",
    price: 3234.67,
    change: -45.23,
    changePercent: -1.38,
    market: "IN",
    currency: "INR",
  },
  {
    symbol: "AXISBANK",
    name: "Axis Bank Limited",
    price: 1123.45,
    change: 18.76,
    changePercent: 1.7,
    market: "IN",
    currency: "INR",
  },
  {
    symbol: "BAJFINANCE",
    name: "Bajaj Finance Limited",
    price: 6789.12,
    change: -89.45,
    changePercent: -1.3,
    market: "IN",
    currency: "INR",
  },
  {
    symbol: "KOTAKBANK",
    name: "Kotak Mahindra Bank Ltd",
    price: 1789.45,
    change: -23.45,
    changePercent: -1.29,
    market: "IN",
    currency: "INR",
  },
]

export default function StockPredictor() {
  const [stocks, setStocks] = useState<Stock[]>(INITIAL_STOCKS)
  const [selectedStock, setSelectedStock] = useState<Stock>(INITIAL_STOCKS[0])
  const [searchTerm, setSearchTerm] = useState("")
  const [activeMarket, setActiveMarket] = useState<"ALL" | "US" | "IN">("ALL")

  // Enhanced real-time price simulation with more realistic movements
  useEffect(() => {
    const interval = setInterval(() => {
      setStocks((prevStocks) =>
        prevStocks.map((stock) => {
          // More realistic price movements based on market volatility
          const baseVolatility = stock.market === "US" ? 0.015 : 0.02 // US stocks slightly less volatile
          const volatility = (Math.random() - 0.5) * baseVolatility

          // Add some momentum based on previous change
          const momentum = stock.changePercent > 0 ? 0.3 : -0.3
          const momentumFactor = (Math.random() - 0.5) * momentum * 0.001

          const totalChange = volatility + momentumFactor
          const newPrice = stock.price * (1 + totalChange)
          const change = newPrice - stock.price
          const changePercent = (change / stock.price) * 100

          return {
            ...stock,
            price: Number(newPrice.toFixed(2)),
            change: Number(change.toFixed(2)),
            changePercent: Number(changePercent.toFixed(2)),
          }
        }),
      )
    }, 1000) // Update every second for live feel

    return () => clearInterval(interval)
  }, [])

  // Update selected stock when stocks update
  useEffect(() => {
    const updatedStock = stocks.find((s) => s.symbol === selectedStock.symbol)
    if (updatedStock) {
      setSelectedStock(updatedStock)
    }
  }, [stocks, selectedStock.symbol])

  const filteredStocks = stocks.filter((stock) => {
    const matchesSearch =
      stock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesMarket = activeMarket === "ALL" || stock.market === activeMarket
    return matchesSearch && matchesMarket
  })

  const handlePredictionUpdate = (predictedPrice: number, predictedChange: number) => {
    setSelectedStock((prev) => ({
      ...prev,
      predictedPrice,
      predictedChange,
    }))
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
                  Market Watch
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
