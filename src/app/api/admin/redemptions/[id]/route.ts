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

    if (!['approve', 'complete', 'reject'].includes(action)) {
      return NextResponse.json(
        { message: 'Invalid action. Must be approve, complete, or reject' },
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

    if (action === 'approve') {
      updateData.status = 'APPROVED'
    } else if (action === 'complete') {
      if (redemption.status !== 'APPROVED' && redemption.status !== 'PENDING') {
        return NextResponse.json(
          { message: 'Can only complete approved or pending redemptions' },
          { status: 400 }
        )
      }

      // Deduct tokens from user's balance and mark as completed
      await prisma.$transaction([
        prisma.user.update({
          where: { id: redemption.userId },
          data: {
            virtualBalance: {
              decrement: Number(redemption.tokenAmount)
            }
          }
        }),
        prisma.redemption.update({
          where: { id: redemptionId },
          data: {
            ...updateData,
            status: 'COMPLETED',
          }
        })
      ])

      return NextResponse.json({
        message: `Redemption completed! ${redemption.tokenAmount} tokens deducted from ${redemption.user.displayName}'s balance.`
      })
    } else if (action === 'reject') {
      updateData.status = 'REJECTED'
    }

    // Update redemption (for approve and reject)
    if (action !== 'complete') {
      await prisma.redemption.update({
        where: { id: redemptionId },
        data: updateData
      })
    }

    const actionText = action === 'approve' ? 'approved' : 'rejected'
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