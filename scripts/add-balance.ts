import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addBalance() {
  try {
    const user = await prisma.user.update({
      where: {
        email: 'lecooperband@gmail.com'
      },
      data: {
        virtualBalance: 1500 // Give $1500 balance (1000 + 500)
      }
    })

    console.log('Updated user balance:', user.email, 'now has $' + user.virtualBalance)
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addBalance()