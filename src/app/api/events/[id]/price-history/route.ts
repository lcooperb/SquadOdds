import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/events/[id]/price-history - Get price history for an event
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

    // Get price history points for the event
    const priceHistory = await prisma.pricePoint.findMany({
      where: { eventId: id },
      orderBy: { timestamp: 'asc' },
      select: {
        id: true,
        yesPrice: true,
        noPrice: true,
        volume: true,
        timestamp: true,
      },
    })

    // If no price history exists, create a starting point based on current event
    if (priceHistory.length === 0) {
      const event = await prisma.event.findUnique({
        where: { id },
        select: {
          yesPrice: true,
          totalVolume: true,
          createdAt: true,
        },
      })

      if (event) {
        return NextResponse.json([
          {
            id: 'initial',
            yesPrice: Number(event.yesPrice),
            noPrice: 100 - Number(event.yesPrice),
            volume: Number(event.totalVolume),
            timestamp: event.createdAt.toISOString(),
          },
        ])
      }
    }

    // Convert Decimal to number for JSON serialization
    const formattedHistory = priceHistory.map(point => ({
      id: point.id,
      yesPrice: Number(point.yesPrice),
      noPrice: Number(point.noPrice),
      volume: Number(point.volume),
      timestamp: point.timestamp.toISOString(),
    }))

    return NextResponse.json(formattedHistory)
  } catch (error) {
    console.error('Error fetching price history:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}