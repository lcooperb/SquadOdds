import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/events/[id]/holders - Get top holders for an event
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { message: 'Event ID is required' },
        { status: 400 }
      )
    }

    // Get the event to check market type
    const event = await prisma.event.findUnique({
      where: { id },
      select: {
        marketType: true,
      },
    })

    if (!event) {
      return NextResponse.json(
        { message: 'Event not found' },
        { status: 404 }
      )
    }

    // Get all bets for this event grouped by user and side
    const bets = await prisma.bet.findMany({
      where: {
        eventId: id,
        status: 'ACTIVE',
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            username: true,
            image: true,
          },
        },
        option: event.marketType === 'MULTIPLE' ? {
          select: {
            id: true,
            title: true,
          },
        } : undefined,
      },
    })

    if (event.marketType === 'MULTIPLE') {
      // For multiple choice markets, calculate holdings by user and option
      const optionHoldingsMap = new Map<string, {
        user: any,
        optionPositions: { [optionId: string]: { optionTitle: string, yesShares: number, noShares: number, amount: number } },
        totalAmount: number,
      }>()

      bets.forEach(bet => {
        const userId = bet.userId
        const shares = Number(bet.shares)
        const amount = Number(bet.amount)
        const optionId = bet.optionId || 'unknown'
        const optionTitle = bet.option?.title || 'Unknown Option'

        if (!optionHoldingsMap.has(userId)) {
          optionHoldingsMap.set(userId, {
            user: bet.user,
            optionPositions: {},
            totalAmount: 0,
          })
        }

        const holding = optionHoldingsMap.get(userId)!

        if (!holding.optionPositions[optionId]) {
          holding.optionPositions[optionId] = {
            optionTitle,
            yesShares: 0,
            noShares: 0,
            amount: 0,
          }
        }

        if (bet.side === 'YES') {
          holding.optionPositions[optionId].yesShares += shares
        } else {
          holding.optionPositions[optionId].noShares += shares
        }
        holding.optionPositions[optionId].amount += amount
        holding.totalAmount += amount
      })

      // Convert to array and sort by total amount invested
      const holders = Array.from(optionHoldingsMap.values())
        .filter(holding => holding.totalAmount > 0)
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, 20) // Top 20 holders
        .map((holding, index) => ({
          rank: index + 1,
          user: holding.user,
          totalAmount: holding.totalAmount,
          optionPositions: holding.optionPositions,
          position: 'MULTIPLE' as const,
        }))

      return NextResponse.json(holders)
    } else {
      // Binary market logic (existing)
      const holdingsMap = new Map<string, {
        user: any,
        yesShares: number,
        noShares: number,
        yesAmount: number,
        noAmount: number,
        totalAmount: number,
      }>()

      bets.forEach(bet => {
        const userId = bet.userId
        const shares = Number(bet.shares)
        const amount = Number(bet.amount)

        if (!holdingsMap.has(userId)) {
          holdingsMap.set(userId, {
            user: bet.user,
            yesShares: 0,
            noShares: 0,
            yesAmount: 0,
            noAmount: 0,
            totalAmount: 0,
          })
        }

        const holding = holdingsMap.get(userId)!

        if (bet.side === 'YES') {
          holding.yesShares += shares
          holding.yesAmount += amount
        } else {
          holding.noShares += shares
          holding.noAmount += amount
        }

        holding.totalAmount += amount
      })

      // Convert to array and sort by total amount invested
      const holders = Array.from(holdingsMap.values())
        .filter(holding => holding.totalAmount > 0)
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, 20) // Top 20 holders
        .map((holding, index) => ({
          rank: index + 1,
          user: holding.user,
          yesShares: holding.yesShares,
          noShares: holding.noShares,
          yesAmount: holding.yesAmount,
          noAmount: holding.noAmount,
          totalAmount: holding.totalAmount,
          position: holding.yesShares > holding.noShares ? 'YES' :
                   holding.noShares > holding.yesShares ? 'NO' : 'NEUTRAL',
        }))

      return NextResponse.json(holders)
    }
  } catch (error) {
    console.error('Error fetching holders:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}