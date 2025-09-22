import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    const { outcome } = await request.json()

    if (typeof outcome !== 'boolean') {
      return NextResponse.json(
        { message: 'Outcome must be true (YES) or false (NO)' },
        { status: 400 }
      )
    }

    // Get the event with all bets
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        bets: {
          include: {
            user: true,
          },
        },
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
          outcome,
          status: 'RESOLVED',
          resolutionDate: new Date(),
        },
      })

      // Process all bets
      for (const bet of event.bets) {
        const isWinner = (outcome && bet.side === 'YES') || (!outcome && bet.side === 'NO')
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

    return NextResponse.json({
      message: 'Event resolved successfully',
      event: result,
      outcome: outcome ? 'YES' : 'NO',
    })
  } catch (error) {
    console.error('Error resolving event:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}