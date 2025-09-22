import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/bets - Place a new bet
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { eventId, side, amount } = await request.json()

    if (!eventId || !side || !amount) {
      return NextResponse.json(
        { message: 'Event ID, side, and amount are required' },
        { status: 400 }
      )
    }

    if (side !== 'YES' && side !== 'NO') {
      return NextResponse.json(
        { message: 'Side must be YES or NO' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { message: 'Amount must be greater than 0' },
        { status: 400 }
      )
    }

    // Get the user and event
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        bets: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    if (!event) {
      return NextResponse.json(
        { message: 'Event not found' },
        { status: 404 }
      )
    }

    if (event.status !== 'ACTIVE') {
      return NextResponse.json(
        { message: 'Event is not active' },
        { status: 400 }
      )
    }

    if (event.resolved) {
      return NextResponse.json(
        { message: 'Event is already resolved' },
        { status: 400 }
      )
    }

    if (Number(user.virtualBalance) < amount) {
      return NextResponse.json(
        { message: 'Insufficient balance' },
        { status: 400 }
      )
    }

    // Calculate current price and shares
    const currentPrice = side === 'YES' ? Number(event.yesPrice) : (100 - Number(event.yesPrice))
    const shares = (amount / currentPrice) * 100

    // Start transaction to place bet and update user balance and event volume
    const result = await prisma.$transaction(async (tx) => {
      // Create the bet
      const bet = await tx.bet.create({
        data: {
          userId: session.user.id,
          eventId,
          side,
          amount,
          price: currentPrice,
          shares,
        },
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              username: true,
            },
          },
          event: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      })

      // Update user balance
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          virtualBalance: {
            decrement: amount,
          },
        },
      })

      // Update event volume
      await tx.event.update({
        where: { id: eventId },
        data: {
          totalVolume: {
            increment: amount,
          },
        },
      })

      // Recalculate market price based on all bets
      const allBets = await tx.bet.findMany({
        where: { eventId },
      })

      const yesBets = allBets.filter(b => b.side === 'YES')
      const noBets = allBets.filter(b => b.side === 'NO')

      const yesAmount = yesBets.reduce((sum, b) => sum + Number(b.amount), 0)
      const noAmount = noBets.reduce((sum, b) => sum + Number(b.amount), 0)
      const totalAmount = yesAmount + noAmount

      let newYesPrice = 50 // default 50/50
      if (totalAmount > 0) {
        newYesPrice = (yesAmount / totalAmount) * 100
        // Ensure price stays within reasonable bounds
        newYesPrice = Math.max(5, Math.min(95, newYesPrice))
      }

      const newNoPrice = 100 - newYesPrice

      // Update event price
      const updatedEvent = await tx.event.update({
        where: { id: eventId },
        data: {
          yesPrice: newYesPrice,
        },
      })

      // Record price history point
      await tx.pricePoint.create({
        data: {
          eventId,
          yesPrice: newYesPrice,
          noPrice: newNoPrice,
          volume: updatedEvent.totalVolume,
        },
      })

      return bet
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error placing bet:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/bets - Get user's bets
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: any = {
      userId: session.user.id,
    }

    if (status) {
      where.status = status
    }

    const bets = await prisma.bet.findMany({
      where,
      include: {
        event: {
          select: {
            id: true,
            title: true,
            category: true,
            status: true,
            resolved: true,
            outcome: true,
            endDate: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(bets)
  } catch (error) {
    console.error('Error fetching bets:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}