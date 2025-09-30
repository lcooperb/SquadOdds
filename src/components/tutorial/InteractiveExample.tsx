'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { previewMarketImpact } from '@/lib/marketImpact'

interface InteractiveExampleProps {
  title?: string
  description?: string
}

export default function InteractiveExample({
  title = "Try Betting on a Market",
  description = "See how your bet affects market prices in real-time"
}: InteractiveExampleProps) {
  const [betAmount, setBetAmount] = useState(25)
  const [selectedSide, setSelectedSide] = useState<'YES' | 'NO'>('YES')
  const [currentPrice] = useState(65) // Example market price
  const [totalVolume] = useState(500) // Example market volume

  const betAmounts = [10, 25, 50, 100]

  // Calculate market impact
  const impact = previewMarketImpact(betAmount, currentPrice, totalVolume, selectedSide)
  const yesPercentage = Math.round(currentPrice)

  const formatCompactNumber = (value: number) => {
    const abs = Math.abs(value)
    if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(value % 1_000_000_000 === 0 ? 0 : 1)}b`
    if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}m`
    if (abs >= 1_000) return `${(value / 1_000).toFixed(value % 1_000 === 0 ? 0 : 1)}k`
    return Math.round(value).toString()
  }

  return (
    <Card className="bg-gray-800/90 border-0 shadow-lg">
      <CardHeader className="p-4">
        <CardTitle className="text-white flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-purple-400" />
          {title}
        </CardTitle>
        <p className="text-gray-400 text-sm">{description}</p>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-4">
          {/* Market + Config */}
          <div className="space-y-3">
            {/* Example Market (styled like real MarketCard, softened container) */}
            <div className="market-card bg-gray-800/30 border border-gray-700/60 hover:border-blue-500 transition-colors rounded-lg p-3 md:p-4">
              {/* Header with title and percentage arc */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 pr-3">
                  <h4 className="text-base font-semibold text-white leading-tight">
                    Will the new product launch be successful?
                  </h4>
                </div>
                <div className="flex-shrink-0 text-center">
                  <div className="relative w-16 h-10 md:w-20 md:h-12">
                    <svg className="w-16 h-10 md:w-20 md:h-12" viewBox="0 0 80 48">
                      <path d="M 10 35 A 30 30 0 0 1 70 35" fill="none" stroke="#374151" strokeWidth="6" strokeLinecap="round" />
                      <path
                        d="M 10 35 A 30 30 0 0 1 70 35"
                        fill="none"
                        stroke={yesPercentage >= 50 ? '#10b981' : '#ef4444'}
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={`${(yesPercentage / 100) * 94.25} 94.25`}
                        className="transition-all duration-300"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center mt-3 md:mt-4">
                      <div className={`text-sm md:text-base font-bold ${yesPercentage >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                        {yesPercentage}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Stats */}
              <div className="flex items-center justify-between text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">Business</Badge>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  ${formatCompactNumber(totalVolume)} Vol.
                </div>
              </div>
            </div>

            {/* Bet Configuration */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Choose your side:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => setSelectedSide('YES')}
                    variant={selectedSide === 'YES' ? 'primary' : 'outline'}
                    className={selectedSide === 'YES' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    YES {currentPrice}¢
                  </Button>
                  <Button
                    onClick={() => setSelectedSide('NO')}
                    variant={selectedSide === 'NO' ? 'primary' : 'outline'}
                    className={selectedSide === 'NO' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
                  >
                    <TrendingDown className="h-4 w-4 mr-2" />
                    NO {100 - currentPrice}¢
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bet amount:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {betAmounts.map(amount => (
                    <Button
                      key={amount}
                      onClick={() => setBetAmount(amount)}
                      variant={betAmount === amount ? 'primary' : 'outline'}
                      size="sm"
                      className={
                        betAmount === amount
                          ? 'bg-purple-600 hover:bg-purple-700 text-white ring-1 ring-purple-400/50 border-transparent'
                          : 'bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700'
                      }
                    >
                      ${amount}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Results (now below the betting card) */}
          <div className="bg-purple-900/20 rounded-lg p-4 border border-purple-500/30">
            <h5 className="text-white font-medium mb-3">Your Bet Impact:</h5>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Your Position:</span>
                <div className="text-white font-medium">
                  ${impact.estimatedPosition.toFixed(2)}
                </div>
              </div>
              <div>
                <span className="text-gray-400">Average Price:</span>
                <div className="text-white font-medium">
                  {impact.estimatedAveragePrice.toFixed(1)}¢
                </div>
              </div>
              <div>
                <span className="text-gray-400">Price Impact:</span>
                <div className="text-white font-medium">
                  +{impact.priceImpact.toFixed(1)}¢
                </div>
              </div>
              <div>
                <span className="text-gray-400">New Market Price:</span>
                <div className="text-white font-medium">
                  {impact.estimatedFinalPrice.toFixed(1)}¢
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-purple-500/30">
              <p className="text-purple-300 text-xs">
                💡 Try different amounts to see how larger bets create more price movement!
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}