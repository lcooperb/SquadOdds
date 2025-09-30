import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notifyMarketResolution } from '@/lib/notifications'

// POST /api/events/[id]/resolve - Resolve an event and distribute winnings
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      )
    }

    const { outcome, winningOptionId } = await request.json()

    // Validate based on market type - we'll get the event first to check type
    const eventToCheck = await prisma.event.findUnique({
      where: { id: params.id },
      select: { marketType: true }
    })

    if (!eventToCheck) {
      return NextResponse.json(
        { message: 'Event not found' },
        { status: 404 }
      )
    }

    if (eventToCheck.marketType === 'BINARY') {
      if (typeof outcome !== 'boolean') {
        return NextResponse.json(
          { message: 'Binary markets require outcome to be true (YES) or false (NO)' },
          { status: 400 }
        )
      }
    } else if (eventToCheck.marketType === 'MULTIPLE') {
      if (!winningOptionId || typeof winningOptionId !== 'string') {
        return NextResponse.json(
          { message: 'Multiple choice markets require winningOptionId' },
          { status: 400 }
        )
      }
    }

    // Get the event with all bets and options
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        bets: {
          include: {
            user: true,
            option: true,
          },
        },
        options: true,
      },
    })

    if (!event) {
      return NextResponse.json(
        { message: 'Event not found' },
        { status: 404 }
      )
    }

    if (event.resolved) {
      return NextResponse.json(
        { message: 'Event is already resolved' },
        { status: 400 }
      )
    }

    // Start a transaction to resolve the event and update all bets and user balances
    const result = await prisma.$transaction(async (tx) => {
      // Resolve the event
      const resolvedEvent = await tx.event.update({
        where: { id: params.id },
        data: {
          resolved: true,
          outcome: event.marketType === 'BINARY' ? outcome : null,
          winningOptionId: event.marketType === 'MULTIPLE' ? winningOptionId : null,
          status: 'RESOLVED',
          resolutionDate: new Date(),
        },
      })

      // Process all bets
      for (const bet of event.bets) {
        let isWinner = false

        if (event.marketType === 'BINARY') {
          isWinner = (outcome && bet.side === 'YES') || (!outcome && bet.side === 'NO')
        } else if (event.marketType === 'MULTIPLE') {
          isWinner = bet.optionId === winningOptionId
        }

        const newStatus = isWinner ? 'WON' : 'LOST'

        // Update bet status
        await tx.bet.update({
          where: { id: bet.id },
          data: { status: newStatus },
        })

        if (isWinner) {
          // Calculate winnings for stats tracking
          const winnings = Number(bet.shares)

          // Update user stats (no balance operations)
          await tx.user.update({
            where: { id: bet.userId },
            data: {
              totalWinnings: {
                increment: winnings - Number(bet.amount),
              },
            },
          })
        } else {
          // Update user stats for losing bet
          await tx.user.update({
            where: { id: bet.userId },
            data: {
              totalLosses: {
                increment: Number(bet.amount),
              },
            },
          })
        }
      }

      return resolvedEvent
    })

    // Calculate payment obligations
    const winningBets = event.bets.filter(bet => {
      if (event.marketType === 'BINARY') {
        return (outcome && bet.side === 'YES') || (!outcome && bet.side === 'NO')
      } else if (event.marketType === 'MULTIPLE') {
        return bet.optionId === winningOptionId
      }
      return false
    })

    const losingBets = event.bets.filter(bet => {
      if (event.marketType === 'BINARY') {
        return (outcome && bet.side === 'NO') || (!outcome && bet.side === 'YES')
      } else if (event.marketType === 'MULTIPLE') {
        return bet.optionId !== winningOptionId
      }
      return false
    })

    // Calculate payment matrix: who owes who
    const payments: Array<{
      from: { id: string; name: string }
      to: { id: string; name: string }
      amount: number
    }> = []

    // Total amount won by each winner
    const totalWinningAmount = winningBets.reduce((sum, bet) => sum + Number(bet.amount), 0)

    // Each loser's amount is distributed proportionally to winners
    losingBets.forEach(losingBet => {
      const loserAmount = Number(losingBet.amount)

      // Distribute this loser's amount proportionally to each winner
      winningBets.forEach(winningBet => {
        const winnerShare = Number(winningBet.amount) / totalWinningAmount
        const paymentAmount = loserAmount * winnerShare

        if (paymentAmount > 0.01) { // Only include payments over 1 cent
          payments.push({
            from: {
              id: losingBet.userId,
              name: losingBet.user.name || 'Unknown'
            },
            to: {
              id: winningBet.userId,
              name: winningBet.user.name || 'Unknown'
            },
            amount: Math.round(paymentAmount * 100) / 100 // Round to 2 decimals
          })
        }
      })
    })

    // Send notifications to all users with bets on this market
    try {
      await notifyMarketResolution(params.id, outcome, winningOptionId, payments)
    } catch (notificationError) {
      console.error('Error sending resolution notifications:', notificationError)
      // Don't fail the resolution if notifications fail
    }

    const winnerDescription = event.marketType === 'BINARY'
      ? (outcome ? 'YES' : 'NO')
      : event.options?.find(opt => opt.id === winningOptionId)?.title || 'Unknown'

    return NextResponse.json({
      message: 'Event resolved successfully',
      event: result,
      outcome: winnerDescription,
      payments,
    })
  } catch (error) {
    console.error('Error resolving event:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}