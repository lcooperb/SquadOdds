import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/events/[id] - Get a specific event
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        options: true,
        bets: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                  },
            },
            option: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            bets: true,
          },
        },
      },
    })

    if (!event) {
      return NextResponse.json(
        { message: 'Event not found' },
        { status: 404 }
      )
    }

    // Get current session to check if user is the creator
    const session = await getServerSession(authOptions)
    const currentUserId = session?.user?.id

    // Anonymize creator name if current user is not the creator
    const anonymizedEvent = {
      ...event,
      createdBy: {
        id: event.createdBy.id,
        name: event.createdBy.id === currentUserId ? event.createdBy.name : 'Anonymous',
      },
    }

    return NextResponse.json(anonymizedEvent)
  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/events/[id] - Update an event (creator or admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get the event to check ownership
    const existingEvent = await prisma.event.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        createdById: true,
        resolved: true,
        status: true,
        _count: {
          select: {
            bets: true,
          },
        },
      },
    })

    if (!existingEvent) {
      return NextResponse.json(
        { message: 'Event not found' },
        { status: 404 }
      )
    }

    // Check permissions: must be creator or admin
    const isCreator = existingEvent.createdById === session.user.id
    const isAdmin = session.user.isAdmin

    if (!isCreator && !isAdmin) {
      return NextResponse.json(
        { message: 'Only the market creator or admin can edit this market' },
        { status: 403 }
      )
    }

    const { title, description, category, endDate, status } = await request.json()

    // Validation rules
    if (!title || !description || !category) {
      return NextResponse.json(
        { message: 'Title, description, and category are required' },
        { status: 400 }
      )
    }

    // Restrict what creators can edit vs admins
    const updateData: any = {
      title: title.trim(),
      description: description.trim(),
      category,
    }

    // Only allow endDate changes if not resolved and no bets yet
    if (endDate && !existingEvent.resolved && existingEvent._count.bets === 0) {
      const endDateTime = new Date(endDate)
      if (endDateTime <= new Date()) {
        return NextResponse.json(
          { message: 'End date must be in the future' },
          { status: 400 }
        )
      }
      updateData.endDate = endDateTime
    }

    // Only admins can change status
    if (status && isAdmin) {
      updateData.status = status
    }

    const event = await prisma.event.update({
      where: { id: params.id },
      data: updateData,
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

    // Anonymize creator name if current user is not the creator
    const anonymizedEvent = {
      ...event,
      createdBy: {
        id: event.createdBy.id,
        name: event.createdBy.id === session.user.id ? event.createdBy.name : 'Anonymous',
      },
    }

    return NextResponse.json(anonymizedEvent)
  } catch (error) {
    console.error('Error updating event:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/events/[id] - Delete an event (admin only)
export async function DELETE(
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

    // Check if event exists and get its status
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            bets: true,
          },
        },
      },
    })

    if (!event) {
      return NextResponse.json(
        { message: 'Event not found' },
        { status: 404 }
      )
    }

    // Only allow deletion if:
    // 1. Event is resolved, OR
    // 2. Event has no bets
    if (!event.resolved && event._count.bets > 0) {
      return NextResponse.json(
        { message: 'Cannot delete unresolved event with existing bets. Cancel the market first to refund all bets.' },
        { status: 400 }
      )
    }

    await prisma.event.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Event deleted successfully' })
  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}