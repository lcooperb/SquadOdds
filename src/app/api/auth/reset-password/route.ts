import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'nodejs'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword, confirmPassword } = await request.json()

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ message: 'Missing token' }, { status: 400 })
    }
    if (!newPassword || !confirmPassword) {
      return NextResponse.json({ message: 'New password and confirmation are required' }, { status: 400 })
    }
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ message: 'Passwords do not match' }, { status: 400 })
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ message: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const vt = await prisma.verificationToken.findUnique({ where: { token } })
    if (!vt) {
      return NextResponse.json({ message: 'Invalid or expired token' }, { status: 400 })
    }

    if (vt.expires < new Date()) {
      await prisma.verificationToken.delete({ where: { token } })
      return NextResponse.json({ message: 'Token expired' }, { status: 400 })
    }

    const email = vt.identifier
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      await prisma.verificationToken.delete({ where: { token } })
      return NextResponse.json({ message: 'Invalid token' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({ where: { email }, data: { hashedPassword } })

    // Remove all tokens for this email to prevent reuse
    await prisma.verificationToken.deleteMany({ where: { identifier: email } })

    return NextResponse.json({ message: 'Password has been reset successfully' })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 })
  }
}
