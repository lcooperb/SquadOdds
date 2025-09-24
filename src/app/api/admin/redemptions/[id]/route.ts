import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { action, adminNotes } = await request.json()
    const redemptionId = params.id

    if (!['complete', 'reject'].includes(action)) {
      return NextResponse.json(
        { message: 'Invalid action. Must be complete or reject' },
        { status: 400 }
      )
    }

    // Get the redemption
    const redemption = await prisma.redemption.findUnique({
      where: { id: redemptionId },
      include: { user: true }
    })

    if (!redemption) {
      return NextResponse.json(
        { message: 'Redemption not found' },
        { status: 404 }
      )
    }

    let updateData: any = {
      processedAt: new Date(),
      adminNotes: adminNotes || null,
    }

    if (action === 'complete') {
      if (redemption.status !== 'APPROVED' && redemption.status !== 'PENDING') {
        return NextResponse.json(
          { message: 'Can only complete approved or pending redemptions' },
          { status: 400 }
        )
      }

      // Tokens were already deducted (held) at request time; mark as completed only
      await prisma.redemption.update({
        where: { id: redemptionId },
        data: {
          ...updateData,
          status: 'COMPLETED',
        }
      })

      return NextResponse.json({
        message: `Redemption completed! Tokens were already held at request time for ${redemption.user.displayName}.`
      })
    } else if (action === 'reject') {
      // Refund held tokens back to user and mark as rejected
      await prisma.$transaction([
        prisma.user.update({
          where: { id: redemption.userId },
          data: {
            virtualBalance: {
              increment: Number(redemption.tokenAmount)
            }
          }
        }),
        prisma.redemption.update({
          where: { id: redemptionId },
          data: {
            ...updateData,
            status: 'REJECTED'
          }
        })
      ])

      return NextResponse.json({
        message: `Redemption rejected and ${redemption.tokenAmount} tokens refunded to ${redemption.user.displayName}.`
      })
    }

    const actionText = action
    return NextResponse.json({
      message: `Redemption ${actionText} successfully`
    })

  } catch (error) {
    console.error('Error processing redemption:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}