import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'nodejs'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    // Do not reveal whether user exists to prevent enumeration
    if (!user) {
      return NextResponse.json({ message: 'If an account exists, a reset link will be sent.' })
    }

    // Create a reset token using VerificationToken table
    const token = randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

    // Clean up any existing tokens for this identifier
    await prisma.verificationToken.deleteMany({ where: { identifier: email } })

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    })

    const origin = request.nextUrl.origin
    const resetUrl = `${origin}/auth/reset-password?token=${encodeURIComponent(token)}`

    await sendEmail({
      to: email,
      subject: 'Reset your SquadOdds password',
      html: `
        <p>Hello${user.displayName ? ' ' + user.displayName : ''},</p>
        <p>We received a request to reset your password. Click the link below to set a new password:</p>
        <p><a href="${resetUrl}">Reset your password</a></p>
        <p>This link will expire in 1 hour. If you did not request this, you can ignore this email.</p>
      `.trim(),
    })

    return NextResponse.json({ message: 'If an account exists, a reset link will be sent.' })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 })
  }
}
