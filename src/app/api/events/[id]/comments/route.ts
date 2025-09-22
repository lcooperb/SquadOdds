import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/events/[id]/comments - Get comments for an event
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    const sort = searchParams.get('sort') || 'newest' // newest, oldest, most_liked

    if (!id) {
      return NextResponse.json(
        { message: 'Event ID is required' },
        { status: 400 }
      )
    }

    // Determine sort order
    let orderBy: any = { createdAt: 'desc' } // newest by default
    if (sort === 'oldest') {
      orderBy = { createdAt: 'asc' }
    } else if (sort === 'most_liked') {
      orderBy = { likes: { _count: 'desc' } }
    }

    const comments = await prisma.comment.findMany({
      where: {
        eventId: id,
        parentId: null // Only top-level comments, replies will be nested
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            username: true,
            image: true,
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                username: true,
                image: true,
              },
            },
            likes: {
              select: {
                userId: true,
              },
            },
            _count: {
              select: {
                likes: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            likes: true,
            replies: true,
          },
        },
      },
      orderBy,
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/events/[id]/comments - Create a new comment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('POST /api/events/[id]/comments called with params:', params)

    const session = await getServerSession(authOptions)
    console.log('Session:', session?.user ? { id: session.user.id, email: session.user.email } : 'No session')

    const { id } = params

    if (!session?.user) {
      console.log('Unauthorized: No session')
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!id) {
      console.log('Bad request: No event ID')
      return NextResponse.json(
        { message: 'Event ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    console.log('Request body:', body)
    const { content, parentId } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { message: 'Comment content is required' },
        { status: 400 }
      )
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { message: 'Comment is too long (max 1000 characters)' },
        { status: 400 }
      )
    }

    // Verify event exists
    const event = await prisma.event.findUnique({
      where: { id },
    })

    if (!event) {
      return NextResponse.json(
        { message: 'Event not found' },
        { status: 404 }
      )
    }

    // If replying, verify parent comment exists
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
      })

      if (!parentComment || parentComment.eventId !== id) {
        return NextResponse.json(
          { message: 'Parent comment not found' },
          { status: 404 }
        )
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        eventId: id,
        userId: session.user.id,
        parentId: parentId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            username: true,
            image: true,
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            likes: true,
            replies: true,
          },
        },
      },
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}