'use client'

import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import { BarChart3 } from 'lucide-react'

interface PricePoint {
  id: string
  yesPrice: number
  noPrice: number
  volume: number
  timestamp: string
}

interface PriceChartProps {
  eventId: string
  className?: string
}

export default function PriceChart({ eventId, className = '' }: PriceChartProps) {
  const [data, setData] = useState<PricePoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPriceHistory()
  }, [eventId])

  const fetchPriceHistory = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/events/${eventId}/price-history`)
      if (!response.ok) {
        throw new Error('Failed to fetch price history')
      }

      const history = await response.json()
      setData(history)
    } catch (error) {
      console.error('Error fetching price history:', error)
      setError('Failed to load chart data')
    } finally {
      setLoading(false)
    }
  }

  // Format data for chart
  const chartData = data.map(point => ({
    time: new Date(point.timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    fullTime: new Date(point.timestamp).toLocaleString(),
    yesPrice: Math.round(point.yesPrice),
    noPrice: Math.round(point.noPrice),
    volume: point.volume,
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-gray-300 text-sm mb-2">{data.fullTime}</p>
          <div className="space-y-1">
            <p className="text-green-400 text-sm">
              YES: {data.yesPrice}¢
            </p>
            <p className="text-red-400 text-sm">
              NO: {data.noPrice}¢
            </p>
            <p className="text-gray-300 text-sm">
              Volume: ${data.volume.toFixed(0)}
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className={`h-64 bg-gray-800/30 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-400">
          <BarChart3 className="h-8 w-8 mx-auto mb-2 animate-pulse" />
          <p>Loading chart...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`h-64 bg-gray-800/30 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-400">
          <BarChart3 className="h-8 w-8 mx-auto mb-2" />
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className={`h-64 bg-gray-800/30 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-400">
          <BarChart3 className="h-8 w-8 mx-auto mb-2" />
          <p>No trading activity yet</p>
          <p className="text-sm">Price history will appear after the first bet</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-64 ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="yesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="noGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="time"
            stroke="#9ca3af"
            fontSize={12}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            stroke="#9ca3af"
            fontSize={12}
            tickLine={false}
            label={{ value: 'Price (¢)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="yesPrice"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#yesGradient)"
            name="YES Price"
          />
          <Line
            type="monotone"
            dataKey="noPrice"
            stroke="#ef4444"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="NO Price"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}