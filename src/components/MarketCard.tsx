import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Progress } from '@/components/ui/Progress'
import { Calendar, DollarSign, Users, TrendingUp, TrendingDown, Clock } from 'lucide-react'

interface MarketCardProps {
  event: {
    id: string
    title: string
    description: string
    category: string
    yesPrice: number
    totalVolume: number
    endDate: string | null
    isOngoing?: boolean
    status: string
    _count?: {
      bets: number
    }
  }
  compact?: boolean
}

export default function MarketCard({ event, compact = false }: MarketCardProps) {
  const yesPercentage = Math.round(Number(event.yesPrice))
  const noPercentage = 100 - yesPercentage
  const endDate = event.endDate ? new Date(event.endDate) : null
  const isExpiringSoon = endDate ? endDate.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000 : false // 7 days
  const isOngoing = event.isOngoing || !endDate

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'career':
        return 'default'
      case 'relationships':
        return 'error'
      case 'personal':
        return 'success'
      case 'life events':
        return 'warning'
      default:
        return 'secondary'
    }
  }

  if (compact) {
    return (
      <Link href={`/market/${event.id}`} className="block">
        <Card className="market-card hover:border-purple-500 transition-all duration-200 cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={getCategoryColor(event.category)} className="text-xs">
                    {event.category}
                  </Badge>
                  {isOngoing && (
                    <Badge variant="warning" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      Ongoing
                    </Badge>
                  )}
                  {!isOngoing && isExpiringSoon && (
                    <Badge variant="warning" className="text-xs">
                      Ending Soon
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold text-white text-sm leading-tight mb-2 line-clamp-2">
                  {event.title}
                </h3>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    ${Number(event.totalVolume).toFixed(0)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {event._count?.bets || 0}
                  </span>
                </div>
              </div>
              <div className="ml-4 text-right">
                <div className="text-lg font-bold text-green-400 mb-1">
                  {yesPercentage}¢
                </div>
                <div className="text-xs text-gray-400">YES</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  }

  return (
    <Link href={`/market/${event.id}`} className="block">
      <Card className="market-card hover:border-purple-500 transition-all duration-200 cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={getCategoryColor(event.category)}>
                {event.category}
              </Badge>
              {isOngoing && (
                <Badge variant="warning">
                  <Clock className="h-3 w-3 mr-1" />
                  Ongoing
                </Badge>
              )}
              {!isOngoing && isExpiringSoon && (
                <Badge variant="warning">
                  Ending Soon
                </Badge>
              )}
            </div>
          </div>
          <CardTitle className="text-lg leading-tight line-clamp-2">
            {event.title}
          </CardTitle>
          <p className="text-sm text-gray-400 line-clamp-2 mt-2">
            {event.description}
          </p>
        </CardHeader>

        <CardContent className="py-0">
          {/* Price Display */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 bg-green-600/10 rounded-lg border border-green-500/20">
              <div className="text-2xl font-bold text-green-400">{yesPercentage}¢</div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">YES</div>
              <div className="flex items-center justify-center mt-1 text-xs text-green-400">
                <TrendingUp className="h-3 w-3 mr-1" />
                +2%
              </div>
            </div>
            <div className="text-center p-3 bg-red-600/10 rounded-lg border border-red-500/20">
              <div className="text-2xl font-bold text-red-400">{noPercentage}¢</div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">NO</div>
              <div className="flex items-center justify-center mt-1 text-xs text-red-400">
                <TrendingDown className="h-3 w-3 mr-1" />
                -2%
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>YES {yesPercentage}%</span>
              <span>NO {noPercentage}%</span>
            </div>
            <Progress value={yesPercentage} variant="yes" />
          </div>

          {/* Market Stats */}
          <div className="flex justify-between text-sm text-gray-400 mb-4">
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              <span>${Number(event.totalVolume).toFixed(0)} volume</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{event._count?.bets || 0} traders</span>
            </div>
            <div className="flex items-center gap-1">
              {isOngoing ? (
                <>
                  <Clock className="h-4 w-4" />
                  <span>Ongoing</span>
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4" />
                  <span>{endDate?.toLocaleDateString()}</span>
                </>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-0">
          <div className="w-full">
            <Button className="w-full pointer-events-none">
              Trade
            </Button>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}