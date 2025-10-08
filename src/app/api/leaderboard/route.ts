import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/leaderboard - Get user rankings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || 'all' // all, week, month

    let dateFilter = {}
    if (timeframe !== 'all') {
      const now = new Date()
      const daysBack = timeframe === 'week' ? 7 : 30
      const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000))

      dateFilter = {
        createdAt: {
          gte: startDate,
        },
      }
    }

    // Get users with their betting stats
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        image: true,
        virtualBalance: true,
        totalWinnings: true,
        totalLosses: true,
        createdAt: true,
        bets: {
          where: dateFilter,
          select: {
            amount: true,
            status: true,
            shares: true,
            createdAt: true,
            event: {
              select: {
                status: true,
              },
            },
          },
        },
        _count: {
          select: {
            bets: {
              where: dateFilter,
            },
          },
        },
      },
    })

    // Calculate stats for each user
    const leaderboard = users.map(user => {
      // Bets are already filtered by timeframe from the query
      const bets = user.bets
      const totalBets = bets.length
      const totalStaked = bets.reduce((sum, bet) => sum + Number(bet.amount), 0)

      const wonBets = bets.filter(bet => bet.status === 'WON')
      const lostBets = bets.filter(bet => bet.status === 'LOST')

      const totalWon = wonBets.reduce((sum, bet) => sum + Number(bet.shares), 0)
      const totalLost = lostBets.reduce((sum, bet) => sum + Number(bet.amount), 0)

      const netProfit = totalWon - totalLost
      const winRate = totalBets > 0 ? (wonBets.length / totalBets) * 100 : 0
      const roi = totalStaked > 0 ? (netProfit / totalStaked) * 100 : 0

      // Portfolio: always show current active bets (not filtered by timeframe)
      // For timeframe views, we only show active bets that were placed in that timeframe
      const activeBets = bets.filter(bet => bet.status === 'ACTIVE' && bet.event?.status === 'ACTIVE')
      const portfolio = activeBets.reduce((sum, bet) => sum + Number(bet.amount), 0)

      return {
        id: user.id,
        name: user.name,
        image: user.image,
        virtualBalance: Number(user.virtualBalance),
        totalWinnings: Number(user.totalWinnings),
        totalLosses: Number(user.totalLosses),
        createdAt: user.createdAt,
        stats: {
          totalBets, // Filtered by timeframe
          totalStaked, // Filtered by timeframe
          netProfit, // Filtered by timeframe
          winRate: Math.round(winRate * 100) / 100, // Filtered by timeframe
          roi: Math.round(roi * 100) / 100, // Filtered by timeframe
          portfolio, // Active bets within timeframe
        },
        rank: 0, // Will be set below
      }
    })

    // Sort by net profit (or total winnings for all-time)
    const sortField = timeframe === 'all' ? 'totalWinnings' : 'netProfit'
    leaderboard.sort((a, b) => {
      if (timeframe === 'all') {
        return Number(b.totalWinnings) - Number(a.totalWinnings)
      } else {
        return b.stats.netProfit - a.stats.netProfit
      }
    })

    // Add ranks
    leaderboard.forEach((user, index) => {
      user.rank = index + 1
    })

    // Calculate some overall stats
    const totalUsers = leaderboard.length
    const totalVolume = leaderboard.reduce((sum, user) => sum + user.stats.totalStaked, 0)
    const activeBettors = leaderboard.filter(user => user.stats.totalBets > 0).length

    return NextResponse.json({
      leaderboard,
      meta: {
        totalUsers,
        activeBettors,
        totalVolume,
        timeframe,
      },
    })
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}