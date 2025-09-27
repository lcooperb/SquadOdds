import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const redemptions = await prisma.redemption.findMany({
      where: { userId: session.user.id },
      orderBy: { requestedAt: 'desc' },
    })

    return NextResponse.json(redemptions)
  } catch (error) {
    console.error('Error fetching redemptions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { dollarAmount, appleCashEmail } = await request.json()

    if (!dollarAmount || !appleCashEmail) {
      return NextResponse.json(
        { message: 'Dollar amount and Apple Cash email are required' },
        { status: 400 }
      )
    }

    if (dollarAmount < 1) {
      return NextResponse.json(
        { message: 'Minimum redemption is $1' },
        { status: 400 }
      )
    }

    // Get user's current balance
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { virtualBalance: true }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    if (Number(user.virtualBalance) < dollarAmount) {
      return NextResponse.json(
        { message: 'Insufficient balance' },
        { status: 400 }
      )
    }

    // Check for pending redemptions
    const pendingRedemptions = await prisma.redemption.findMany({
      where: {
        userId: session.user.id,
        status: 'PENDING'
      }
    })

    if (pendingRedemptions.length > 0) {
      return NextResponse.json(
        { message: 'You have a pending redemption request. Please wait for it to be processed.' },
        { status: 400 }
      )
    }

    // Create redemption request and HOLD funds immediately by decrementing balance
    const [redemption] = await prisma.$transaction([
      prisma.redemption.create({
        data: {
          userId: session.user.id,
          // Backward compatibility: mirror USD amount into tokenAmount
          tokenAmount: dollarAmount,
          dollarAmount,
          appleCashEmail: appleCashEmail.trim(),
          status: 'PENDING',
        },
      }),
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          virtualBalance: { decrement: Number(dollarAmount) },
        },
      }),
    ])

    return NextResponse.json(
      {
        message: 'Redemption request created successfully. Funds placed on hold.',
        redemption
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating redemption:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}