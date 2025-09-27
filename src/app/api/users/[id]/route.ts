import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/users/[id] - Get user profile by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = params.id

    // Get user profile with detailed stats
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        virtualBalance: true,
        totalWinnings: true,
        totalLosses: true,
        isAdmin: true,
        createdAt: true,
        bets: {
          include: {
            event: {
              select: {
                id: true,
                title: true,
                category: true,
                status: true,
                resolved: true,
                outcome: true,
              },
            },
            option: {
              select: {
                id: true,
                title: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        createdEvents: {
          select: {
            id: true,
            title: true,
            category: true,
            status: true,
            resolved: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            bets: true,
            createdEvents: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}