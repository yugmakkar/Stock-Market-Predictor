"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown } from "lucide-react"

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

interface StockListProps {
  stocks: Stock[]
  selectedStock: Stock
  onSelectStock: (stock: Stock) => void
}

export default function StockList({ stocks, selectedStock, onSelectStock }: StockListProps) {
  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {stocks.map((stock) => (
        <Card
          key={stock.symbol}
          className={`p-3 cursor-pointer transition-all hover:bg-slate-700/50 ${
            selectedStock.symbol === stock.symbol
              ? "bg-blue-600/20 border-blue-500"
              : "bg-slate-800/30 border-slate-600"
          }`}
          onClick={() => onSelectStock(stock)}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-white">{stock.symbol}</span>
                <Badge variant={stock.market === "US" ? "default" : "secondary"} className="text-xs">
                  {stock.market}
                </Badge>
              </div>
              <div className="text-sm text-gray-300 truncate">{stock.name}</div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-white">
                {stock.currency === "USD" ? "$" : "₹"}
                {stock.price.toFixed(2)}
              </div>
              <div
                className={`flex items-center gap-1 text-sm ${stock.change >= 0 ? "text-green-400" : "text-red-400"}`}
              >
                {stock.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {stock.changePercent.toFixed(2)}%
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
