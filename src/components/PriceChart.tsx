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
  BarChart,
  Bar,
} from 'recharts'
import { BarChart3, ArrowUpDown } from 'lucide-react'

interface PricePoint {
  id?: string
  yesPrice?: number
  noPrice?: number
  volume?: number
  timestamp: string
  optionId?: string
  optionTitle?: string
  price?: number
}

interface PriceChartProps {
  eventId: string
  marketType?: string
  options?: Array<{
    id: string
    title: string
    price: number
  }>
  currentYesPrice?: number
  className?: string
}

export default function PriceChart({ eventId, marketType, options, currentYesPrice, className = '' }: PriceChartProps) {
  const [data, setData] = useState<PricePoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeScope, setTimeScope] = useState('ALL')
  const [showYes, setShowYes] = useState(true)

  useEffect(() => {
    fetchPriceHistory()
  }, [eventId, marketType])

  // Refresh chart every minute to show forward progression
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPriceHistory()
    }, 60000) // 60 seconds

    return () => clearInterval(interval)
  }, [eventId, marketType])

  const fetchPriceHistory = async () => {
    try {
      setLoading(true)
      setError(null)

      // For multiple choice markets, fetch option price history
      if (marketType === 'MULTIPLE') {
        const response = await fetch(`/api/events/${eventId}/options/price-history`)
        if (!response.ok) {
          throw new Error('Failed to fetch option price history')
        }
        const history = await response.json()
        setData(history)
      } else {
        // For binary markets, fetch regular price history
        const response = await fetch(`/api/events/${eventId}/price-history`)
        if (!response.ok) {
          throw new Error('Failed to fetch price history')
        }
        const history = await response.json()
        setData(history)
      }
    } catch (error) {
      console.error('Error fetching price history:', error)
      setError('Failed to load chart data')
    } finally {
      setLoading(false)
    }
  }

  // Filter data based on time scope
  const filterDataByTimeScope = (data: any[], scope: string) => {
    if (scope === 'ALL' || data.length === 0) return data

    const now = new Date()
    const scopeMap: { [key: string]: number } = {
      '1H': 1 * 60 * 60 * 1000,
      '6H': 6 * 60 * 60 * 1000,
      '1D': 24 * 60 * 60 * 1000,
      '1W': 7 * 24 * 60 * 60 * 1000,
      '1M': 30 * 24 * 60 * 60 * 1000
    }

    const timeLimit = scopeMap[scope]
    if (!timeLimit) return data

    const cutoffTime = new Date(now.getTime() - timeLimit)
    return data.filter(point => new Date(point.timestamp) >= cutoffTime)
  }

  // Format data for chart
  const filteredData = filterDataByTimeScope(data, timeScope)

  // Add current time point to make chart move forward even without betting
  const addCurrentTimePoint = (data: any[], currentPrices: any) => {
    const now = new Date()
    const lastDataPoint = data.length > 0 ? data[data.length - 1] : null
    const lastTimestamp = lastDataPoint ? new Date(lastDataPoint.timestamp) : new Date(0)

    // Only add current point if last data is more than 1 minute old
    if (now.getTime() - lastTimestamp.getTime() > 60000) {
      return [...data, {
        timestamp: now.toISOString(),
        ...currentPrices
      }]
    }
    return data
  }

  const chartData = marketType === 'MULTIPLE'
    ? formatMultipleChoiceData(filteredData as any[], options)
    : (() => {
        // For binary markets, add current time point with current prices
        const yesPrice = currentYesPrice || 50
        const noPrice = 100 - yesPrice
        const dataWithCurrent = addCurrentTimePoint(filteredData, {
          yesPrice: yesPrice,
          noPrice: noPrice,
          volume: 0
        })

        return dataWithCurrent.map((point, index) => ({
          time: new Date(point.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          fullTime: new Date(point.timestamp).toLocaleString(),
          yesPrice: Math.round(point.yesPrice || 0),
          noPrice: Math.round(point.noPrice || 0),
          volume: point.volume || 0,
          timestamp: point.timestamp, // Keep original timestamp
        }))
      })()

  // Define TimeScopeButtons component early so it's available everywhere
  const TimeScopeButtons = () => (
    <div className="flex gap-1">
      {['1H', '6H', '1D', '1W', '1M', 'ALL'].map((scope) => (
        <button
          key={scope}
          onClick={() => setTimeScope(scope)}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            timeScope === scope
              ? 'bg-blue-500 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          {scope}
        </button>
      ))}
    </div>
  )

  function formatMultipleChoiceData(historyData: any[], options: any[]) {
    if (!options || options.length === 0) {
      return []
    }

    if (!historyData || historyData.length === 0) {
      // Return current prices as single data point
      const now = new Date()
      return [{
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        fullTime: now.toLocaleString(),
        ...options.reduce((acc, option, idx) => {
          acc[option.title] = Number(option.price)
          return acc
        }, {} as any)
      }]
    }

    // Create a map of all unique timestamps
    const timestampMap = new Map<string, any>()

    historyData.forEach(point => {
      const timeKey = point.timestamp
      if (!timestampMap.has(timeKey)) {
        timestampMap.set(timeKey, {
          time: new Date(timeKey).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          fullTime: new Date(timeKey).toLocaleString(),
          timestamp: timeKey
        })
      }
    })

    // Fill in price data for each option at each timestamp
    historyData.forEach(point => {
      const timeKey = point.timestamp
      const timePoint = timestampMap.get(timeKey)
      if (timePoint && point.optionTitle) {
        timePoint[point.optionTitle] = Number(point.price)
      }
    })

    // Add current time point to make chart move forward
    const now = new Date()
    const lastTimestamp = historyData.length > 0
      ? new Date(historyData[historyData.length - 1].timestamp)
      : new Date(0)

    // Only add current point if last data is more than 1 minute old
    if (now.getTime() - lastTimestamp.getTime() > 60000) {
      const currentTimeKey = now.toISOString()
      timestampMap.set(currentTimeKey, {
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        fullTime: now.toLocaleString(),
        timestamp: currentTimeKey,
        ...options.reduce((acc, option) => {
          acc[option.title] = Number(option.price)
          return acc
        }, {} as any)
      })
    }

    // Convert to array and sort by timestamp
    const sortedData = Array.from(timestampMap.values())
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    // Forward fill missing values - if an option doesn't have a price at a timestamp, use the last known price
    const lastKnownPrices: { [optionTitle: string]: number } = {}

    // Initialize with current prices
    options.forEach(option => {
      lastKnownPrices[option.title] = Number(option.price)
    })

    sortedData.forEach(dataPoint => {
      options.forEach(option => {
        if (dataPoint[option.title] !== undefined) {
          lastKnownPrices[option.title] = dataPoint[option.title]
        } else {
          dataPoint[option.title] = lastKnownPrices[option.title]
        }
      })
      // Remove timestamp helper
      delete dataPoint.timestamp
    })

    return sortedData
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 shadow-lg">
          <p className={`text-sm font-medium ${showYes ? 'text-blue-400' : 'text-red-400'}`}>
            {showYes ? 'Yes' : 'No'} {showYes ? (data.yesPrice?.toFixed(0) || 0) : (data.noPrice?.toFixed(0) || 0)}%
          </p>
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

  // For multiple choice markets, show option price history as line chart
  if (marketType === 'MULTIPLE' && options && options.length > 0) {
    const colors = ['#f97316', '#3b82f6', '#eab308', '#64748b', '#3b82f6', '#06b6d4']

    const CustomMultipleTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 shadow-lg">
            <div className="space-y-1">
              {payload.map((entry: any, index: number) => (
                <p key={entry.dataKey} style={{ color: entry.color }} className="text-sm font-medium">
                  {entry.dataKey} {entry.value?.toFixed(0) || 0}%
                </p>
              ))}
            </div>
          </div>
        )
      }
      return null
    }

    return (
      <div className={`${className}`}>
        <div className="h-64 relative rounded-lg overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                label={{ value: 'Probability (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
              />
              <Tooltip content={<CustomMultipleTooltip />} />
              {options.map((option, index) => (
                <Line
                  key={option.id}
                  type="stepAfter"
                  dataKey={option.title}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, stroke: colors[index % colors.length], strokeWidth: 2 }}
                  name={option.title}
                  connectNulls={true}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-between items-center mt-4">
          <TimeScopeButtons />
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
    <div className={`${className}`}>
      <div className="h-64 relative rounded-lg overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
              label={{ value: 'Probability (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="stepAfter"
              dataKey={showYes ? "yesPrice" : "noPrice"}
              stroke={showYes ? "#3b82f6" : "#ef4444"}
              strokeWidth={2}
              dot={false}
              name={showYes ? "YES Price" : "NO Price"}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-between items-center mt-4">
        <TimeScopeButtons />
        {marketType === 'BINARY' && (
          <div className="relative">
            <button
              onClick={() => setShowYes(!showYes)}
              className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1 text-xs rounded transition-colors flex items-center gap-1"
              title={`Switch to ${showYes ? 'No' : 'Yes'}`}
            >
              <ArrowUpDown className="h-3 w-3" />
              {showYes ? 'YES' : 'NO'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}