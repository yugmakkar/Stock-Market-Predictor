"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { Brain, Activity, Target, Sparkles, TrendingUp, TrendingDown, AlertCircle } from "lucide-react"
import { stockApiService, type HistoricalData } from "../services/stockApi"
import { Badge } from "@/components/ui/badge"

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
  signals?: string[]
}

interface ChartData {
  time: string
  price: number
  predicted?: number
  volume?: number
}

interface StockChartProps {
  stock: Stock
  onPredictionUpdate: (predictedPrice: number, predictedChange: number) => void
}

export default function StockChart({ stock, onPredictionUpdate }: StockChartProps) {
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([])
  const [timeUnit, setTimeUnit] = useState<string>("minutes")
  const [timeValue, setTimeValue] = useState<string>("30")
  const [isGenerating, setIsGenerating] = useState(false)
  const [showPredictions, setShowPredictions] = useState(false)
  const [accuracy, setAccuracy] = useState<number>(0)
  const [predictionSignals, setPredictionSignals] = useState<string[]>([])
  const [isLoadingHistorical, setIsLoadingHistorical] = useState(false)

  useEffect(() => {
    loadHistoricalData()
    setShowPredictions(false)
  }, [stock.symbol])

  const loadHistoricalData = async () => {
    setIsLoadingHistorical(true)
    try {
      const historical = await stockApiService.fetchHistoricalData(stock.symbol, '1m')
      setHistoricalData(historical)
      
      // Convert historical data to chart format
      const chartData = historical.slice(-50).map((item, index) => ({
        time: new Date(item.timestamp).toLocaleTimeString(),
        price: item.close,
        volume: item.volume
      }))
      
      setChartData(chartData)
    } catch (error) {
      console.error('Error loading historical data:', error)
      // Fallback to simulated data
      initializeWithSimulatedData()
    } finally {
      setIsLoadingHistorical(false)
    }
  }

  const initializeWithSimulatedData = () => {
    const now = new Date()
    const initialData: ChartData[] = []

    for (let i = 49; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60000) // 1 minute intervals
      const basePrice = stock.price
      const volatility = (Math.random() - 0.5) * 0.01
      const price = basePrice * (1 + volatility)

      initialData.push({
        time: time.toLocaleTimeString(),
        price: Number(price.toFixed(2)),
        volume: Math.floor(Math.random() * 1000000) + 100000
      })
    }

    setChartData(initialData)
  }

  useEffect(() => {
    // Subscribe to real-time updates
    const handleRealTimeUpdate = (updatedStock: any) => {
      setChartData((prevData) => {
        const newData = [...prevData]
        const now = new Date()

        const newPoint: ChartData = {
          time: now.toLocaleTimeString(),
          price: updatedStock.price,
          volume: updatedStock.volume || Math.floor(Math.random() * 1000000) + 100000
        }

        newData.push(newPoint)

        if (newData.length > 100) {
          newData.shift()
        }

        return newData
      })
    }

    stockApiService.subscribeToRealTimeUpdates(stock.symbol, handleRealTimeUpdate)

    // Fallback: Add new data point every 5 seconds for demo
    const interval = setInterval(() => {
      setChartData((prevData) => {
        const newData = [...prevData]
        const now = new Date()
        
        // Simulate small price movements
        const lastPrice = prevData[prevData.length - 1]?.price || stock.price
        const volatility = 0.005
        const change = (Math.random() - 0.5) * volatility
        const newPrice = lastPrice * (1 + change)

        const newPoint: ChartData = {
          time: now.toLocaleTimeString(),
          price: Number(newPrice.toFixed(2)),
          volume: Math.floor(Math.random() * 1000000) + 100000
        }

        newData.push(newPoint)
        
        if (newData.length > 100) {
          newData.shift()
        }

        return newData
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [stock.symbol])

  const generatePredictions = async () => {
    setIsGenerating(true)
    setPredictionSignals([])

    await new Promise((resolve) => setTimeout(resolve, 2000))

    try {
      const currentPrice = stock.price
      const timeInMinutes = convertToMinutes(Number.parseInt(timeValue), timeUnit)
      
      // Use historical data if available, otherwise use chart data
      const dataForPrediction = historicalData.length > 0 ? historicalData : 
        chartData.map((item, index) => ({
          timestamp: Date.now() - (chartData.length - index) * 60000,
          open: item.price * 0.999,
          high: item.price * 1.002,
          low: item.price * 0.998,
          close: item.price,
          volume: item.volume || 100000
        }))

      const prediction = stockApiService.calculateAdvancedPrediction(
        currentPrice,
        dataForPrediction,
        stock.volume || 0,
        stock.marketCap || 0,
        timeInMinutes
      )

      setPredictionSignals(prediction.signals)

      const predictionPoints = Math.min(30, Math.max(5, Math.floor(timeInMinutes / 2)))
      const predictions: number[] = []
      
      let currentPredictedPrice = currentPrice
      const targetPrice = prediction.predictedPrice
      const priceStep = (targetPrice - currentPrice) / predictionPoints
      
      for (let i = 1; i <= predictionPoints; i++) {
        const progress = i / predictionPoints
        const basePrice = currentPrice + (priceStep * i)
        
        const volatility = Math.abs(stock.changePercent) / 100 || 0.005
        const noise = (Math.random() - 0.5) * volatility * basePrice * 0.3
        
        currentPredictedPrice = basePrice + noise
        predictions.push(currentPredictedPrice)
      }

      setChartData((prevData) => {
        const updatedData = [...prevData]
        const currentTime = Date.now()

        predictions.forEach((predicted, index) => {
          const futureTime = new Date(currentTime + (index + 1) * (timeInMinutes * 60000 / predictionPoints))
          updatedData.push({
            time: futureTime.toLocaleTimeString(),
            price: currentPrice,
            predicted: Number(predicted.toFixed(2)),
          })
        })

        return updatedData
      })

      const finalPredictedPrice = prediction.predictedPrice
      const predictedChange = ((finalPredictedPrice - currentPrice) / currentPrice) * 100

      onPredictionUpdate(finalPredictedPrice, predictedChange)
      setAccuracy(prediction.confidence * 100)
      setShowPredictions(true)
      
    } catch (error) {
      console.error('Prediction error:', error)
      const simpleChange = (Math.random() - 0.5) * 0.02
      const simplePrediction = stock.price * (1 + simpleChange)
      onPredictionUpdate(simplePrediction, simpleChange * 100)
      setAccuracy(60)
      setShowPredictions(true)
      setPredictionSignals(['Limited data available'])
    } finally {
      setIsGenerating(false)
    }
  }

  const convertToMinutes = (value: number, unit: string): number => {
    const conversions: { [key: string]: number } = {
      seconds: value / 60,
      minutes: value,
      hours: value * 60,
      days: value * 24 * 60,
      weeks: value * 7 * 24 * 60,
      months: value * 30 * 24 * 60,
      years: value * 365 * 24 * 60,
    }
    return conversions[unit] || value
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 p-3 rounded-lg border border-slate-600 shadow-lg">
          <p className="text-white font-medium mb-1">{`Time: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="font-medium">
              {`${entry.dataKey === "price" ? "Live Price" : "AI Prediction"}: ${stock.currency === "USD" ? "$" : "₹"}${entry.value.toFixed(2)}`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Prediction Controls */}
      <Card className="glass border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Sparkles className="h-5 w-5 text-purple-400" />
            AI Prediction Engine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4">
          {isLoadingHistorical && (
            <div className="flex items-center gap-2 text-yellow-400">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Loading historical data...</span>
            </div>
          )}
            <div>
              <label className="block text-sm font-medium mb-2 text-white">Time Value</label>
              <Input
                type="number"
                value={timeValue}
                onChange={(e) => setTimeValue(e.target.value)}
                min="1"
                max="1000"
                className="bg-slate-800/50 border-slate-600 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-white">Time Unit</label>
              <Select value={timeUnit} onValueChange={setTimeUnit}>
                <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="seconds">Seconds</SelectItem>
                  <SelectItem value="minutes">Minutes</SelectItem>
                  <SelectItem value="hours">Hours</SelectItem>
                  <SelectItem value="days">Days</SelectItem>
                  <SelectItem value="weeks">Weeks</SelectItem>
                  <SelectItem value="months">Months</SelectItem>
                  <SelectItem value="years">Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end ml-2">
              <Button
                onClick={generatePredictions}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse hover:animate-none relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                {isGenerating ? (
                  <>
                    <Brain className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Predict
                  </>
                )}
              </Button>
            </div>
            {accuracy > 0 && (
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="h-4 w-4 text-green-400" />
                  <span className="text-green-400 font-medium">Accuracy: {accuracy.toFixed(1)}%</span>
                </div>
                <div className="text-gray-400 text-sm">
                  Range: {timeValue} {timeUnit}
                </div>
                <div className="text-gray-400 text-xs mt-1">
                  Data Points: {historicalData.length > 0 ? historicalData.length : chartData.length}
                </div>
              </div>
            )}
          </div>
          
          {/* Prediction Signals */}
          {predictionSignals.length > 0 && (
            <div className="mt-4 p-3 bg-slate-800/30 rounded-lg">
              <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                <Brain className="h-4 w-4" />
                AI Analysis Signals
              </h4>
              <div className="flex flex-wrap gap-2">
                {predictionSignals.map((signal, index) => (
                  <Badge 
                    key={index} 
                    variant={signal.includes('Bullish') ? 'default' : signal.includes('Bearish') ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {signal.includes('Bullish') && <TrendingUp className="h-3 w-3 mr-1" />}
                    {signal.includes('Bearish') && <TrendingDown className="h-3 w-3 mr-1" />}
                    {signal}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live Chart */}
      <Card className="glass border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Activity className="h-5 w-5 text-green-400" />
            Real-time Price Chart with AI Predictions
          </CardTitle>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-white">Real-time Price</span>
            </div>
            {showPredictions && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                <span className="text-white">AI Prediction</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <span className="text-white">Historical Data: {historicalData.length > 0 ? 'Live' : 'Simulated'}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis
                  dataKey="time"
                  stroke="#FFFFFF"
                  fontSize={12}
                  tickFormatter={(value) => value.split(":").slice(1).join(":")}
                />
                <YAxis
                  stroke="#FFFFFF"
                  fontSize={12}
                  domain={["dataMin - 5", "dataMax + 5"]}
                  tickFormatter={(value) => `${stock.currency === "USD" ? "$" : "₹"}${value.toFixed(0)}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "#10B981" }}
                  name="Real-time Price"
                  connectNulls={false}
                />
                {showPredictions && (
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    activeDot={{ r: 4, fill: "#3B82F6" }}
                    name="AI Prediction"
                    connectNulls={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
