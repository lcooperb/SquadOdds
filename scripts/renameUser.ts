import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    // Find user with name "Big Baller 3hunnid"
    const user = await prisma.user.findFirst({
      where: {
        name: 'Big Baller 3hunnid'
      }
    })

    if (!user) {
      console.log('User "Big Baller 3hunnid" not found.')
      return
    }

    console.log(`Found user: ${user.name} (${user.email})`)

    // Update the user's name
    const updatedUser = await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        name: 'Eli'
      }
    })

    console.log(`✅ Successfully renamed user to: ${updatedUser.name}`)
  } catch (error) {
    console.error('Error renaming user:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()