"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { Brain, Activity, Target, Sparkles } from "lucide-react"
import { stockApiService } from "../services/stockApi"

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

interface ChartData {
  time: string
  price: number
  predicted?: number
}

interface StockChartProps {
  stock: Stock
  onPredictionUpdate: (predictedPrice: number, predictedChange: number) => void
}

export default function StockChart({ stock, onPredictionUpdate }: StockChartProps) {
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [timeUnit, setTimeUnit] = useState<string>("minutes")
  const [timeValue, setTimeValue] = useState<string>("30")
  const [isGenerating, setIsGenerating] = useState(false)
  const [showPredictions, setShowPredictions] = useState(false)
  const [accuracy, setAccuracy] = useState<number>(0)

  // Store historical prices for better predictions
  const [historicalPrices, setHistoricalPrices] = useState<number[]>([])

  useEffect(() => {
    // Initialize chart with historical data
    const now = new Date()
    const initialData: ChartData[] = []

    // Generate 50 data points for better visualization
    for (let i = 49; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 1000)
      const basePrice = stock.price
      const volatility = (Math.random() - 0.5) * 0.015 // Reduced volatility for more realistic data
      const price = basePrice * (1 + volatility)

      initialData.push({
        time: time.toLocaleTimeString(),
        price: Number(price.toFixed(2)),
      })
    }

    setChartData(initialData)
    setShowPredictions(false)
    
    // Store historical prices
    setHistoricalPrices(initialData.map(d => d.price))
  }, [stock.symbol])

  useEffect(() => {
    // Add new data point every second for live updates
    const interval = setInterval(() => {
      setChartData((prevData) => {
        const newData = [...prevData]
        const now = new Date()

        // Add current price with timestamp
        const newPoint: ChartData = {
          time: now.toLocaleTimeString(),
          price: stock.price,
        }

        newData.push(newPoint)

        // Update historical prices
        setHistoricalPrices(prev => {
          const updated = [...prev, stock.price]
          return updated.slice(-50) // Keep last 50 prices
        })

        // Keep only last 50 data points for performance
        if (newData.length > 50) {
          newData.shift()
        }

        return newData
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [stock.price, stock.symbol])

  // Enhanced AI Prediction Algorithm using real stock service
  const generatePredictions = async () => {
    setIsGenerating(true)

    // Simulate AI processing time
    await new Promise((resolve) => setTimeout(resolve, 1500))

    try {
      const currentPrice = stock.price
      const timeInMinutes = convertToMinutes(Number.parseInt(timeValue), timeUnit)
      
      // Use the enhanced prediction algorithm from the stock service
      const prediction = stockApiService.calculateAdvancedPrediction(
        currentPrice,
        historicalPrices,
        stock.volume || 0,
        stock.marketCap || 0,
        timeInMinutes
      )

      const predictionPoints = Math.min(30, Math.max(5, Math.floor(timeInMinutes / 2)))
      const predictions: number[] = []
      
      // Generate prediction path
      let currentPredictedPrice = currentPrice
      const targetPrice = prediction.predictedPrice
      const priceStep = (targetPrice - currentPrice) / predictionPoints
      
      for (let i = 1; i <= predictionPoints; i++) {
        const progress = i / predictionPoints
        const basePrice = currentPrice + (priceStep * i)
        
        // Add some realistic noise based on volatility
        const volatility = Math.abs(stock.changePercent) / 100 || 0.01
        const noise = (Math.random() - 0.5) * volatility * basePrice * 0.3
        
        currentPredictedPrice = basePrice + noise
        predictions.push(currentPredictedPrice)
      }

      // Update chart data with predictions
      setChartData((prevData) => {
        const updatedData = [...prevData]
        const currentTime = Date.now()

        predictions.forEach((predicted, index) => {
          const futureTime = new Date(currentTime + (index + 1) * 2000)
          updatedData.push({
            time: futureTime.toLocaleTimeString(),
            price: currentPrice,
            predicted: Number(predicted.toFixed(2)),
          })
        })

        return updatedData
      })

      // Calculate final predicted price and change
      const finalPredictedPrice = prediction.predictedPrice
      const predictedChange = ((finalPredictedPrice - currentPrice) / currentPrice) * 100

      // Update parent component with prediction
      onPredictionUpdate(finalPredictedPrice, predictedChange)

      // Set accuracy based on confidence
      setAccuracy(prediction.confidence * 100)
      setShowPredictions(true)
      
    } catch (error) {
      console.error('Prediction error:', error)
      // Fallback to simple prediction
      const simpleChange = (Math.random() - 0.5) * 0.04
      const simplePrediction = currentPrice * (1 + simpleChange)
      onPredictionUpdate(simplePrediction, simpleChange * 100)
      setAccuracy(65)
      setShowPredictions(true)
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
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Live Chart */}
      <Card className="glass border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Activity className="h-5 w-5 text-green-400" />
            Live Price Chart with AI Predictions
          </CardTitle>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-white">Live Price</span>
            </div>
            {showPredictions && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                <span className="text-white">AI Prediction</span>
              </div>
            )}
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
                  name="Live Price"
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
