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

    const { tokenAmount, venmoHandle } = await request.json()

    if (!tokenAmount || !venmoHandle) {
      return NextResponse.json(
        { message: 'Token amount and Venmo handle are required' },
        { status: 400 }
      )
    }

    if (tokenAmount < 100) {
      return NextResponse.json(
        { message: 'Minimum redemption is 100 tokens' },
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

    if (Number(user.virtualBalance) < tokenAmount) {
      return NextResponse.json(
        { message: 'Insufficient token balance' },
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

    // Create redemption request
    const dollarAmount = tokenAmount / 100
    const redemption = await prisma.redemption.create({
      data: {
        userId: session.user.id,
        tokenAmount,
        dollarAmount,
        venmoHandle: venmoHandle.trim(),
        status: 'PENDING',
      },
    })

    return NextResponse.json(
      {
        message: 'Redemption request created successfully',
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