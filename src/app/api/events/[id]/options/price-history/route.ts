import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/events/[id]/options/price-history - Get price history for multiple choice market options
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { message: 'Event ID is required' },
        { status: 400 }
      )
    }

    // Get the event to check if it's a multiple choice market
    const event = await prisma.event.findUnique({
      where: { id },
      select: {
        marketType: true,
        options: {
          select: {
            id: true,
            title: true,
            price: true,
          },
        },
      },
    })

    if (!event || event.marketType !== 'MULTIPLE') {
      return NextResponse.json(
        { message: 'Event not found or not a multiple choice market' },
        { status: 404 }
      )
    }

    // Get option price history points
    const optionPriceHistory = await prisma.optionPricePoint.findMany({
      where: {
        option: {
          eventId: id
        }
      },
      orderBy: { timestamp: 'asc' },
      include: {
        option: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    // If no price history exists, create starting points based on current prices
    if (optionPriceHistory.length === 0) {
      const now = new Date().toISOString()
      return NextResponse.json(
        event.options.map(option => ({
          timestamp: now,
          optionId: option.id,
          optionTitle: option.title,
          price: Number(option.price),
        }))
      )
    }

    // Format the history
    const formattedHistory = optionPriceHistory.map(point => ({
      timestamp: point.timestamp.toISOString(),
      optionId: point.option.id,
      optionTitle: point.option.title,
      price: Number(point.price),
    }))

    return NextResponse.json(formattedHistory)
  } catch (error) {
    console.error('Error fetching option price history:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}