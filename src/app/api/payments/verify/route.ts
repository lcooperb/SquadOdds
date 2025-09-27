import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/payments/verify - Verify payment and add tokens
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { amount, transactionId, paymentMethod = 'manual' } = await request.json()

    if (!amount) {
      return NextResponse.json(
        { message: 'Amount is required' },
        { status: 400 }
      )
    }

    // Validate amount
    const paymentAmount = Number(amount)
    if (isNaN(paymentAmount) || paymentAmount <= 0 || paymentAmount > 1000) {
      return NextResponse.json(
        { message: 'Invalid payment amount' },
        { status: 400 }
      )
    }

    // Determine transactionId: use provided or auto-generate one for manual payments
    const txId = (transactionId?.trim?.() as string | undefined) && transactionId.trim() !== ''
      ? transactionId.trim()
      : `manual-${Date.now()}-${session.user.id.substring(0, 6)}`

    // Check if transaction ID has been used before (prevent double-spending)
    const existingPayment = await prisma.payment.findUnique({
      where: { transactionId: txId }
    })

    if (existingPayment) {
      return NextResponse.json(
        { message: 'Transaction ID has already been used' },
        { status: 400 }
      )
    }

    // USD-based wallet: keep legacy tokens field equal to USD amount for compatibility
    const tokensToAdd = paymentAmount

    // Create pending payment record for admin approval
    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        amount: paymentAmount,
        tokens: tokensToAdd,
        transactionId: txId,
        paymentMethod,
        status: 'PENDING', // Requires admin approval
      }
    })

    return NextResponse.json({
      message: 'Payment request submitted successfully. An admin will review and approve your payment shortly.',
      payment: payment,
      dollarsRequested: tokensToAdd,
    })
  } catch (error) {
    console.error('Error verifying payment:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/payments/verify - Get user's payment history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const payments = await prisma.payment.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to recent payments
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error('Error fetching payment history:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}