'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Navigation from '@/components/Navigation'
import BettingModal from '@/components/BettingModal'
import PriceChart from '@/components/PriceChart'
import MarketComments from '@/components/MarketComments'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Calendar,
  Clock,
  BarChart3,
  MessageCircle
} from 'lucide-react'

interface EventDetail {
  id: string
  title: string
  description: string
  category: string
  yesPrice: number
  totalVolume: number
  endDate: string | null
  isOngoing?: boolean
  status: string
  createdAt: string
  resolved: boolean
  outcome: boolean | null
  createdBy: {
    id: string
    displayName: string
    username: string
  }
  bets: Array<{
    id: string
    side: string
    amount: number
    price: number
    shares: number
    createdAt: string
    user: {
      id: string
      displayName: string
      username: string
    }
  }>
  _count: {
    bets: number
  }
}

export default function MarketPage() {
  const params = useParams()
  const { data: session } = useSession()
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showBettingModal, setShowBettingModal] = useState(false)
  const [userBalance, setUserBalance] = useState<number>(100)
  const [refreshChart, setRefreshChart] = useState(0)

  useEffect(() => {
    if (params.id) {
      fetchEvent()
      if (session?.user) {
        fetchUserBalance()
      }
    }
  }, [params.id, session])

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setEvent(data)
      }
    } catch (error) {
      console.error('Error fetching event:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserBalance = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const user = await response.json()
        setUserBalance(Number(user.virtualBalance))
      }
    } catch (error) {
      console.error('Error fetching user balance:', error)
    }
  }

  const handlePlaceBet = async (eventId: string, side: 'YES' | 'NO', amount: number) => {
    try {
      const response = await fetch('/api/bets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          side,
          amount,
        }),
      })

      if (response.ok) {
        // Refresh event data, user balance, and trigger chart refresh
        fetchEvent()
        fetchUserBalance()
        setRefreshChart(prev => prev + 1)
      } else {
        throw new Error('Failed to place bet')
      }
    } catch (error) {
      console.error('Error placing bet:', error)
      throw error
    }
  }

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-white">Loading market...</div>
        </div>
      </>
    )
  }

  if (!event) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-2">Market not found</h1>
            <p className="text-gray-400">This market may have been removed or doesn't exist.</p>
          </div>
        </div>
      </>
    )
  }

  const yesPrice = Math.round(Number(event.yesPrice))
  const noPrice = 100 - yesPrice
  const endDate = event.endDate ? new Date(event.endDate) : null
  const isExpired = endDate ? endDate < new Date() : false
  const isOngoing = event.isOngoing || !endDate

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'career': return 'default'
      case 'relationships': return 'error'
      case 'personal': return 'success'
      case 'life events': return 'warning'
      default: return 'secondary'
    }
  }

  return (
    <>
      <Navigation />
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Market Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant={getCategoryColor(event.category)}>
                  {event.category}
                </Badge>
                {event.resolved && (
                  <Badge variant={event.outcome ? 'success' : 'error'}>
                    Resolved: {event.outcome ? 'YES' : 'NO'}
                  </Badge>
                )}
                {isOngoing && !event.resolved && (
                  <Badge variant="warning">
                    <Clock className="h-3 w-3 mr-1" />
                    Ongoing
                  </Badge>
                )}
                {!isOngoing && isExpired && !event.resolved && (
                  <Badge variant="warning">Expired</Badge>
                )}
              </div>

              <h1 className="text-3xl font-bold text-white leading-tight">
                {event.title}
              </h1>

              <p className="text-gray-300 text-lg leading-relaxed">
                {event.description}
              </p>

              {/* Market Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                  <div className="flex items-center text-gray-400 text-sm mb-1">
                    <DollarSign className="h-4 w-4 mr-1" />
                    Volume
                  </div>
                  <div className="text-white font-semibold">
                    ${Number(event.totalVolume).toFixed(0)}
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                  <div className="flex items-center text-gray-400 text-sm mb-1">
                    <Users className="h-4 w-4 mr-1" />
                    Traders
                  </div>
                  <div className="text-white font-semibold">
                    {event._count.bets}
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                  <div className="flex items-center text-gray-400 text-sm mb-1">
                    {isOngoing ? (
                      <>
                        <Clock className="h-4 w-4 mr-1" />
                        Status
                      </>
                    ) : (
                      <>
                        <Calendar className="h-4 w-4 mr-1" />
                        Ends
                      </>
                    )}
                  </div>
                  <div className="text-white font-semibold text-sm">
                    {isOngoing ? 'Ongoing' : endDate?.toLocaleDateString()}
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                  <div className="flex items-center text-gray-400 text-sm mb-1">
                    <Clock className="h-4 w-4 mr-1" />
                    Created
                  </div>
                  <div className="text-white font-semibold text-sm">
                    {new Date(event.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Price Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Price History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PriceChart eventId={event.id} key={refreshChart} />
              </CardContent>
            </Card>

            {/* Market Discussion */}
            <MarketComments eventId={event.id} activity={event.bets} />
          </div>

          {/* Right Column - Trading Interface */}
          <div className="space-y-6">
            {/* Current Prices */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-green-600/10 border-green-500/20">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-green-400 mb-1">
                    {yesPrice}¢
                  </div>
                  <div className="text-sm text-gray-300 mb-2">YES</div>
                  <div className="flex items-center justify-center text-xs text-green-400">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +2%
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-red-600/10 border-red-500/20">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-red-400 mb-1">
                    {noPrice}¢
                  </div>
                  <div className="text-sm text-gray-300 mb-2">NO</div>
                  <div className="flex items-center justify-center text-xs text-red-400">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    -2%
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-400">
                <span>YES {yesPrice}%</span>
                <span>NO {noPrice}%</span>
              </div>
              <Progress value={yesPrice} variant="yes" />
            </div>

            {/* Buy/Sell Buttons */}
            {session && !event.resolved && (isOngoing || !isExpired) ? (
              <div className="space-y-3">
                <Button
                  variant="yes"
                  className="w-full py-3"
                  onClick={() => setShowBettingModal(true)}
                >
                  Buy YES for {yesPrice}¢
                </Button>
                <Button
                  variant="no"
                  className="w-full py-3"
                  onClick={() => setShowBettingModal(true)}
                >
                  Buy NO for {noPrice}¢
                </Button>
              </div>
            ) : !session ? (
              <div className="text-center space-y-3">
                <Button
                  variant="outline"
                  className="w-full py-3"
                  onClick={() => window.location.href = '/auth/signin'}
                >
                  Sign in to Trade
                </Button>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-400">
                {event.resolved ? 'Market Resolved' : !isOngoing ? 'Market Expired' : 'Market Inactive'}
              </div>
            )}

            {/* Market Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Market Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Created by</span>
                  <span className="text-white">{event.createdBy.displayName}</span>
                </div>
                {!isOngoing && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">End date</span>
                    <span className="text-white">{endDate?.toLocaleDateString()}</span>
                  </div>
                )}
                {isOngoing && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Type</span>
                    <Badge variant="warning">
                      <Clock className="h-3 w-3 mr-1" />
                      Ongoing
                    </Badge>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">Status</span>
                  <span className="text-white capitalize">{event.status.toLowerCase()}</span>
                </div>
                {event.resolved && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Outcome</span>
                    <Badge variant={event.outcome ? 'success' : 'error'}>
                      {event.outcome ? 'YES' : 'NO'}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Betting Modal */}
      {showBettingModal && session && (
        <BettingModal
          isOpen={showBettingModal}
          onClose={() => setShowBettingModal(false)}
          event={{
            id: event.id,
            title: event.title,
            yesPrice: event.yesPrice,
          }}
          userBalance={userBalance}
          onPlaceBet={handlePlaceBet}
        />
      )}
    </>
  )
}