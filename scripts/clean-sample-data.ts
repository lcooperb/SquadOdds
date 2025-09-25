import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanSampleData() {
  console.log('Cleaning sample/demo data...')

  try {
    // Delete sample events created by seed script
    // These are identifiable by their specific titles and sample user creators

    // First, get the IDs of sample users (if they exist)
    const sampleUsers = await prisma.user.findMany({
      where: {
        email: {
          in: ['alice@example.com', 'bob@example.com', 'charlie@example.com']
        }
      },
      select: { id: true, email: true }
    })

    const sampleUserIds = sampleUsers.map(user => user.id)
    console.log(`Found ${sampleUsers.length} sample users`)

    if (sampleUserIds.length > 0) {
      // Delete events created by sample users
      const deletedEvents = await prisma.event.deleteMany({
        where: {
          createdById: {
            in: sampleUserIds
          }
        }
      })
      console.log(`Deleted ${deletedEvents.count} events created by sample users`)
    }

    // Also delete any events with specific sample titles (in case they were created by other users)
    const sampleEventTitles = [
      'Will Alice get the promotion by end of Q1?',
      'Will Bob finally ask Sarah out?',
      'Will Charlie move to New York this year?',
      'Will our team win the office fantasy football league?',
      'Which team will win the 2024 World Series?'
    ]

    const deletedByTitle = await prisma.event.deleteMany({
      where: {
        title: {
          in: sampleEventTitles
        }
      }
    })
    console.log(`Deleted ${deletedByTitle.count} events by sample titles`)

    // Delete the sample users themselves
    if (sampleUserIds.length > 0) {
      const deletedUsers = await prisma.user.deleteMany({
        where: {
          id: {
            in: sampleUserIds
          }
        }
      })
      console.log(`Deleted ${deletedUsers.count} sample users`)
    }

    // Verify removal
    const remainingSampleUsers = await prisma.user.findMany({
      where: { email: { in: ['alice@example.com', 'bob@example.com', 'charlie@example.com'] } },
      select: { email: true }
    })
    console.log(`Remaining sample users: ${remainingSampleUsers.length}`)

    console.log('Sample data cleanup completed!')

    // Show remaining events
    const remainingEvents = await prisma.event.findMany({
      include: {
        createdBy: {
          select: {
            displayName: true,
            email: true
          }
        }
      }
    })

    console.log(`\nRemaining events: ${remainingEvents.length}`)
    remainingEvents.forEach(event => {
      console.log(`- "${event.title}" by ${event.createdBy.displayName}`)
    })

  } catch (error) {
    console.error('Error cleaning sample data:', error)
  }
}

cleanSampleData()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })