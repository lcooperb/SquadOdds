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
          // Calculate winnings: (bet amount / price) * 100
          const winnings = Number(bet.shares)

          // Update user balance and stats
          await tx.user.update({
            where: { id: bet.userId },
            data: {
              virtualBalance: {
                increment: winnings,
              },
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

    // Send notifications to all users with bets on this market
    try {
      await notifyMarketResolution(params.id, outcome, winningOptionId)
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
    })
  } catch (error) {
    console.error('Error resolving event:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}