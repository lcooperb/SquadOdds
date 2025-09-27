import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/admin/payments/process - Admin endpoint to process external payments
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is admin
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { message: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const {
      userEmail,
      amount,
      paymentMethod = 'venmo',
      externalTransactionId,
      notes
    } = await request.json()

    if (!userEmail || !amount || !externalTransactionId) {
      return NextResponse.json(
        { message: 'User email, amount, and transaction ID are required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Validate amount
    const paymentAmount = Number(amount)
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return NextResponse.json(
        { message: 'Invalid payment amount' },
        { status: 400 }
      )
    }

    // Check if external transaction has been processed before
    const existingPayment = await prisma.payment.findUnique({
      where: { transactionId: externalTransactionId }
    })

    if (existingPayment) {
      return NextResponse.json(
        { message: 'Transaction has already been processed' },
        { status: 400 }
      )
    }

    // USD-based wallet: $1 deposit = $1 balance
    // Keep tokens field for backward compatibility by mirroring USD amount
    const tokensToAdd = paymentAmount

    // Process payment in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create payment record
      const payment = await tx.payment.create({
        data: {
          userId: user.id,
          amount: paymentAmount,
          tokens: tokensToAdd,
          transactionId: externalTransactionId,
          paymentMethod,
          status: 'VERIFIED',
          verifiedAt: new Date(),
        }
      })

      // Add USD to user's balance
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          virtualBalance: {
            increment: tokensToAdd,
          },
        },
        select: {
          virtualBalance: true,
          name: true,
          email: true,
        }
      })

      return { payment, updatedUser }
    })

    return NextResponse.json({
      message: 'Payment processed successfully',
      payment: result.payment,
      user: result.updatedUser,
      dollarsAdded: tokensToAdd,
    })
  } catch (error) {
    console.error('Error processing admin payment:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/admin/payments/process - Get pending payments for admin review
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { message: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    // Get recent payments for review
    const payments = await prisma.payment.findMany({
      include: {
        user: {
          select: {
            email: true,
            name: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error('Error fetching admin payments:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}