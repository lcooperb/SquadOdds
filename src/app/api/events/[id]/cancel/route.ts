import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notifyMarketCancelled } from '@/lib/notifications'

// POST /api/events/[id]/cancel - Cancel a market and refund all bets
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

    // Get the event with all bets
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        bets: {
          where: {
            status: 'ACTIVE'
          },
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
        { message: 'Event is already resolved and cannot be cancelled' },
        { status: 400 }
      )
    }

    // Start a transaction to cancel the event and refund all bets
    const result = await prisma.$transaction(async (tx) => {
      // Cancel the event
      const cancelledEvent = await tx.event.update({
        where: { id: params.id },
        data: {
          resolved: true,
          status: 'CANCELLED',
          resolutionDate: new Date(),
        },
      })

      // Refund all active bets
      for (const bet of event.bets) {
        // Update bet status to REFUNDED
        await tx.bet.update({
          where: { id: bet.id },
          data: { status: 'REFUNDED' },
        })

        // Refund the bet amount to the user
        await tx.user.update({
          where: { id: bet.userId },
          data: {
            virtualBalance: {
              increment: Number(bet.amount),
            },
          },
        })
      }

      return cancelledEvent
    })

    // Send notifications to all users with bets on this market
    try {
      await notifyMarketCancelled(params.id)
    } catch (notificationError) {
      console.error('Error sending cancellation notifications:', notificationError)
      // Don't fail the cancellation if notifications fail
    }

    return NextResponse.json({
      message: 'Market cancelled successfully',
      event: result,
      refundedBets: event.bets.length,
      totalRefunded: event.bets.reduce((sum, bet) => sum + Number(bet.amount), 0),
    })
  } catch (error) {
    console.error('Error cancelling market:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
