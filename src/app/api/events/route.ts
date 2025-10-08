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

    // Handle multiple statuses (e.g., "CLOSED,RESOLVED")
    const where: any = {}
    if (status.includes(',')) {
      const statuses = status.split(',')
      where.status = { in: statuses }
    } else {
      where.status = status
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
            name: true,
          },
        },
        options: true,
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

    // Get current session to check if user is viewing their own events
    const session = await getServerSession(authOptions)
    const currentUserId = session?.user?.id

    // Anonymize creator names for events not created by current user
    const anonymizedEvents = events.map(event => ({
      ...event,
      createdBy: {
        id: event.createdBy.id,
        name: event.createdBy.id === currentUserId ? event.createdBy.name : 'Anonymous',
      },
    }))

    return NextResponse.json(anonymizedEvents)
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
      initialOdds = {},
      investment = 10,
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

    // No balance check needed - market creation uses credit system

    // Validate odds add up to 100%
    if (marketType === 'BINARY') {
      const { yes = 50, no = 50 } = initialOdds
      if (yes + no !== 100) {
        return NextResponse.json(
          { message: 'Binary market odds must add up to 100%' },
          { status: 400 }
        )
      }
    } else if (marketType === 'MULTIPLE') {
      const totalOdds = Object.values(initialOdds).reduce((sum: number, odds: any) => sum + (Number(odds) || 0), 0)
      if (Math.abs(totalOdds - 100) > 0.01) { // Allow small floating point differences
        return NextResponse.json(
          { message: 'Multiple choice market odds must add up to 100%' },
          { status: 400 }
        )
      }
    }

    // Create event with transaction to handle investment and initial odds
    const event = await prisma.$transaction(async (tx) => {
      // Create the event with initial odds
      const createdEvent = await tx.event.create({
        data: {
          title,
          description,
          category,
          endDate: endDateTime,
          isOngoing: Boolean(isOngoing),
          marketType,
          createdById: session.user.id,
          yesPrice: marketType === 'BINARY' ? Number(initialOdds.yes || 50) : 0.0,
          totalVolume: investment, // Start with creator's investment
          options: marketType === 'MULTIPLE' ? {
            create: options.map((title: string, index: number) => ({
              title: title.trim(),
              price: Number(initialOdds[index] || (100 / options.length)),
              totalVolume: investment * (Number(initialOdds[index] || (100 / options.length)) / 100),
            }))
          } : undefined,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              },
          },
          options: true,
        },
      })

      // Note: No balance deduction needed - users create markets on credit

      // Create initial bets based on creator's odds to establish market prices
      if (marketType === 'BINARY') {
        const { yes = 50, no = 50 } = initialOdds
        const yesAmount = investment * (yes / 100)
        const noAmount = investment * (no / 100)

        // Create YES bet (AMM system - shares represent position values)
        if (yesAmount > 0) {
          await tx.bet.create({
            data: {
              userId: session.user.id,
              eventId: createdEvent.id,
              side: 'YES',
              amount: yesAmount,
              price: yes,
              shares: yesAmount, // In AMM system, shares field stores position values
            },
          })
        }

        // Create NO bet (AMM system - shares represent position values)
        if (noAmount > 0) {
          await tx.bet.create({
            data: {
              userId: session.user.id,
              eventId: createdEvent.id,
              side: 'NO',
              amount: noAmount,
              price: 100 - yes, // NO price is inverse of YES price
              shares: noAmount, // In AMM system, shares field stores position values
            },
          })
        }

        // Create initial price history point
        await tx.pricePoint.create({
          data: {
            eventId: createdEvent.id,
            yesPrice: yes,
            noPrice: 100 - yes,
            volume: investment,
          },
        })
      } else if (marketType === 'MULTIPLE') {
        // Create YES bets for each option based on odds
        for (let i = 0; i < options.length; i++) {
          const optionOdds = Number(initialOdds[i] || (100 / options.length))
          const optionAmount = investment * (optionOdds / 100)
          const option = createdEvent.options![i]

          if (optionAmount > 0) {
            await tx.bet.create({
              data: {
                userId: session.user.id,
                eventId: createdEvent.id,
                optionId: option.id,
                side: 'YES',
                amount: optionAmount,
                price: optionOdds,
                shares: optionAmount, // In AMM system, shares field stores position values
              },
            })

            // Create option price history point
            await tx.optionPricePoint.create({
              data: {
                optionId: option.id,
                price: optionOdds,
                volume: optionAmount,
              },
            })
          }
        }
      }

      return createdEvent
    })

    // Fetch the complete event with counts for response
    const completeEvent = await prisma.event.findUnique({
      where: { id: event.id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
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

    // Anonymize creator name for non-creators (though creator just created this)
    const anonymizedEvent = {
      ...completeEvent,
      createdBy: {
        id: completeEvent!.createdBy.id,
        name: completeEvent!.createdBy.id === session.user.id ? completeEvent!.createdBy.name : 'Anonymous',
      },
    }

    return NextResponse.json(anonymizedEvent, { status: 201 })
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}