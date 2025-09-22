import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/comments/[id]/like - Toggle like on a comment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id: commentId } = params

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!commentId) {
      return NextResponse.json(
        { message: 'Comment ID is required' },
        { status: 400 }
      )
    }

    // Verify comment exists
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    })

    if (!comment) {
      return NextResponse.json(
        { message: 'Comment not found' },
        { status: 404 }
      )
    }

    // Check if user already liked this comment
    const existingLike = await prisma.commentLike.findUnique({
      where: {
        commentId_userId: {
          commentId,
          userId: session.user.id,
        },
      },
    })

    if (existingLike) {
      // Unlike the comment
      await prisma.commentLike.delete({
        where: {
          id: existingLike.id,
        },
      })

      return NextResponse.json({ liked: false })
    } else {
      // Like the comment
      await prisma.commentLike.create({
        data: {
          commentId,
          userId: session.user.id,
        },
      })

      return NextResponse.json({ liked: true })
    }
  } catch (error) {
    console.error('Error toggling comment like:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}