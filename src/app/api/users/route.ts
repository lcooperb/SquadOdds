import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/users - Get all users (admin only) or current user
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
    const all = searchParams.get('all')

    if (all === 'true') {
      // Admin only - get all users
      if (!session.user.isAdmin) {
        return NextResponse.json(
          { message: 'Admin access required' },
          { status: 403 }
        )
      }

      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          virtualBalance: true,
          totalWinnings: true,
          totalLosses: true,
          isAdmin: true,
          createdAt: true,
          _count: {
            select: {
              bets: true,
              createdEvents: true,
            },
          },
        },
        orderBy: [
          { totalWinnings: 'desc' },
          { createdAt: 'asc' },
        ],
      })

      return NextResponse.json(users)
    } else {
      // Get current user with detailed info
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          image: true,
          virtualBalance: true,
          totalWinnings: true,
          totalLosses: true,
          isAdmin: true,
          createdAt: true,
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
    }
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}