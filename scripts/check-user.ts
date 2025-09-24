import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkUser() {
  try {
    // Check user balance and details
    const user = await prisma.user.findUnique({
      where: {
        email: 'lecooperband@gmail.com'
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        virtualBalance: true,
        isAdmin: true
      }
    })

    console.log('User details:', user)

    // Check active events
    const activeEvents = await prisma.event.findMany({
      where: {
        status: 'ACTIVE'
      },
      select: {
        id: true,
        title: true,
        status: true,
        resolved: true,
        marketType: true,
        endDate: true,
        isOngoing: true
      }
    })

    console.log('\nActive events:')
    activeEvents.forEach(event => {
      const isExpired = event.endDate ? new Date(event.endDate) < new Date() : false
      console.log(`- ${event.title} (${event.marketType}, resolved: ${event.resolved}, expired: ${isExpired})`)
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUser()