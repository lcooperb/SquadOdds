import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/users/[id] - Get specific user
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

    // Users can only access their own data unless they're admin
    if (params.id !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: session.user.isAdmin || params.id === session.user.id,
        username: true,
        displayName: true,
        image: true,
        virtualBalance: true,
        totalWinnings: true,
        totalLosses: true,
        isAdmin: session.user.isAdmin,
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
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10, // Last 10 bets
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
          take: 10, // Last 10 events
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
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(
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

    // Users can only update their own data unless they're admin
    if (params.id !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      )
    }

    const { displayName, image, isAdmin, virtualBalance } = await request.json()

    const updateData: any = {}

    if (displayName !== undefined) {
      updateData.displayName = displayName
    }

    if (image !== undefined) {
      updateData.image = image
    }

    // Only admins can update admin status and balance
    if (session.user.isAdmin) {
      if (isAdmin !== undefined) {
        updateData.isAdmin = isAdmin
      }
      if (virtualBalance !== undefined) {
        updateData.virtualBalance = virtualBalance
      }
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
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
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}