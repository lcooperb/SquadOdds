import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/events - Get all events with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const status = searchParams.get('status') || 'ACTIVE'

    const where: any = {
      status,
    }

    if (category && category !== 'All') {
      where.category = category
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ]
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            displayName: true,
            username: true,
          },
        },
        _count: {
          select: {
            bets: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { endDate: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/events - Create a new event
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const {
      title,
      description,
      category,
      endDate,
      isOngoing,
      marketType = 'BINARY',
      options = [],
    } = await request.json()

    if (!title || !description || !category) {
      return NextResponse.json(
        { message: 'Title, description, and category are required' },
        { status: 400 }
      )
    }

    // Validate that either endDate or isOngoing is provided
    if (!isOngoing && !endDate) {
      return NextResponse.json(
        { message: 'Either end date or ongoing event must be specified' },
        { status: 400 }
      )
    }

    // Validate multiple choice markets have at least 2 options
    if (marketType === 'MULTIPLE') {
      if (!options || options.length < 2) {
        return NextResponse.json(
          { message: 'Multiple choice markets must have at least 2 options' },
          { status: 400 }
        )
      }
    }

    // Validate end date is in the future (if provided)
    let endDateTime = null
    if (endDate) {
      endDateTime = new Date(endDate)
      if (endDateTime <= new Date()) {
        return NextResponse.json(
          { message: 'End date must be in the future' },
          { status: 400 }
        )
      }
    }

    // Create event with options if it's a multiple choice market
    const event = await prisma.event.create({
      data: {
        title,
        description,
        category,
        endDate: endDateTime,
        isOngoing: Boolean(isOngoing),
        marketType,
        createdById: session.user.id,
        yesPrice: marketType === 'BINARY' ? 50.0 : 0.0, // Only for binary markets
        options: marketType === 'MULTIPLE' ? {
          create: options.map((title: string, index: number) => ({
            title: title.trim(),
            price: 100 / options.length, // Distribute equally initially
          }))
        } : undefined,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            displayName: true,
            username: true,
          },
        },
        options: true,
        _count: {
          select: {
            bets: true,
          },
        },
      },
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}