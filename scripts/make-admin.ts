import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function makeAdmin() {
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: {
        email: 'lecooperband@gmail.com'
      }
    })

    if (!user) {
      console.log('User with email lecooperband@gmail.com not found')
      return
    }

    // Update user to admin
    const updatedUser = await prisma.user.update({
      where: {
        email: 'lecooperband@gmail.com'
      },
      data: {
        isAdmin: true
      }
    })

    console.log('User updated successfully:', updatedUser.email, 'is now admin:', updatedUser.isAdmin)
  } catch (error) {
    console.error('Error updating user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

makeAdmin()