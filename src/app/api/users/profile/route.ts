import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/users/profile - update current user's profile fields (image for now)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { image } = body as { image?: string | null }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        image: image && image.trim().length > 0 ? image.trim() : null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      }
    })

    return NextResponse.json(updated)
  } catch (e) {
    console.error('Error updating profile:', e)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
