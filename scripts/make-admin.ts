import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function makeAdmin() {
  const emailArg = process.argv[2]
  const emailEnv = process.env.ADMIN_EMAIL
  const targetEmail = emailArg || emailEnv || 'lcooperband@gmail.com'

  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: targetEmail }
    })

    if (!user) {
      console.log(`User with email ${targetEmail} not found`)
      return
    }

    if (user.isAdmin) {
      console.log(`User ${targetEmail} is already an admin.`)
      return
    }

    // Update user to admin
    const updatedUser = await prisma.user.update({
      where: { email: targetEmail },
      data: { isAdmin: true }
    })

    console.log('User updated successfully:', updatedUser.email, 'is now admin:', updatedUser.isAdmin)
  } catch (error) {
    console.error('Error updating user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

makeAdmin()