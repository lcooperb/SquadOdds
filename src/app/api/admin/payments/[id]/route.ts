import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PUT /api/admin/payments/[id] - Approve or reject a payment
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { message: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const { action } = await request.json() // 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { message: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    // Get the payment
    const payment = await prisma.payment.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
            virtualBalance: true,
          }
        }
      }
    })

    if (!payment) {
      return NextResponse.json(
        { message: 'Payment not found' },
        { status: 404 }
      )
    }

    if (payment.status !== 'PENDING') {
      return NextResponse.json(
        { message: 'Payment has already been processed' },
        { status: 400 }
      )
    }

    if (action === 'approve') {
      // Approve payment and add tokens
      const result = await prisma.$transaction(async (tx) => {
        // Update payment status
        const updatedPayment = await tx.payment.update({
          where: { id: params.id },
          data: {
            status: 'VERIFIED',
            verifiedAt: new Date(),
          }
        })

        // Add tokens to user's balance
        const updatedUser = await tx.user.update({
          where: { id: payment.userId },
          data: {
            virtualBalance: {
              increment: Number(payment.tokens),
            },
          },
          select: {
            virtualBalance: true,
            displayName: true,
            email: true,
          }
        })

        return { payment: updatedPayment, user: updatedUser }
      })

      return NextResponse.json({
        message: `Payment approved! ${payment.tokens} tokens added to ${result.user.displayName}'s account.`,
        payment: result.payment,
        user: result.user,
      })
    } else {
      // Reject payment
      const updatedPayment = await prisma.payment.update({
        where: { id: params.id },
        data: {
          status: 'REJECTED',
        }
      })

      return NextResponse.json({
        message: `Payment rejected.`,
        payment: updatedPayment,
      })
    }
  } catch (error) {
    console.error('Error processing payment approval:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}