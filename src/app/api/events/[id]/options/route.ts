import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/events/[id]/options - Add a new option to a multiple choice market (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      )
    }

    const { title } = await request.json()

    if (!title || !title.trim()) {
      return NextResponse.json(
        { message: 'Option title is required' },
        { status: 400 }
      )
    }

    // Check if event exists and is a multiple choice market
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        options: true,
        bets: true,
      },
    })

    if (!event) {
      return NextResponse.json(
        { message: 'Event not found' },
        { status: 404 }
      )
    }

    if (event.marketType !== 'MULTIPLE') {
      return NextResponse.json(
        { message: 'Can only add options to multiple choice markets' },
        { status: 400 }
      )
    }

    if (event.resolved) {
      return NextResponse.json(
        { message: 'Cannot add options to resolved markets' },
        { status: 400 }
      )
    }

    // Check if option with same title already exists
    const existingOption = event.options.find(
      opt => opt.title.toLowerCase() === title.trim().toLowerCase()
    )

    if (existingOption) {
      return NextResponse.json(
        { message: 'An option with this title already exists' },
        { status: 400 }
      )
    }

    // Check if there are any bets on this market
    const hasBets = event.bets.length > 0

    if (hasBets) {
      return NextResponse.json(
        { message: 'Cannot add options to markets that already have bets' },
        { status: 400 }
      )
    }

    // Calculate initial price (redistribute equally among all options)
    const totalOptions = event.options.length + 1
    const equalPrice = 100 / totalOptions

    // Start a transaction to update all option prices and add the new option
    const result = await prisma.$transaction(async (tx) => {
      // Update existing options to have equal distribution
      await Promise.all(
        event.options.map(option =>
          tx.marketOption.update({
            where: { id: option.id },
            data: { price: equalPrice },
          })
        )
      )

      // Create the new option
      const newOption = await tx.marketOption.create({
        data: {
          eventId: params.id,
          title: title.trim(),
          price: equalPrice,
          totalVolume: 0,
        },
      })

      return newOption
    })

    return NextResponse.json({
      message: 'Option added successfully',
      option: result,
    })
  } catch (error) {
    console.error('Error adding option:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}