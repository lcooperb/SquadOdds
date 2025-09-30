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
    const search = searchParams.get('search')?.trim()

    if (all === 'true') {
      // If a search term is provided, allow any authenticated user to search filtered users
      if (search && search.length > 0) {
        const users = await prisma.user.findMany({
          where: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          },
          select: {
            id: true,
            name: true,
            email: true,
            virtualBalance: true,
            totalWinnings: true,
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
          take: 10,
        })

        return NextResponse.json(users)
      }

      // Admin only - get full list if no search filter
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
          name: true,
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
          name: true,
          image: true,
          virtualBalance: true,
          totalWinnings: true,
          totalLosses: true,
          isAdmin: true,
          createdAt: true,
          bets: {
            select: {
              amount: true,
              status: true,
              createdAt: true,
              event: {
                select: {
                  id: true,
                  title: true,
                  category: true,
                  status: true,
                  resolved: true,
                  outcome: true,
                }
              },
              option: {
                select: {
                  id: true,
                  title: true,
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
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
              createdAt: 'desc'
            }
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
    }
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}