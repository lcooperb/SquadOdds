import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const redemptions = await prisma.redemption.findMany({
      include: {
        user: {
          select: {
            email: true,
            displayName: true,
            username: true,
          }
        }
      },
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