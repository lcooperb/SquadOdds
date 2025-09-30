import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    // Find all closed and resolved markets
    const closedMarkets = await prisma.event.findMany({
      where: {
        OR: [
          { status: 'CLOSED' },
          { status: 'RESOLVED' }
        ]
      },
      select: {
        id: true,
        title: true,
        status: true,
      }
    })

    console.log(`Found ${closedMarkets.length} closed/resolved markets:`)
    closedMarkets.forEach(market => {
      console.log(`  - ${market.title} (${market.status})`)
    })

    if (closedMarkets.length === 0) {
      console.log('No closed markets to delete.')
      return
    }

    const marketIds = closedMarkets.map(m => m.id)

    // Delete in transaction to ensure data integrity
    await prisma.$transaction(async (tx) => {
      // Get all market options for these events
      const marketOptions = await tx.marketOption.findMany({
        where: {
          eventId: { in: marketIds }
        },
        select: { id: true }
      })
      const optionIds = marketOptions.map(o => o.id)

      // Delete option price history first
      if (optionIds.length > 0) {
        const deletedOptionPriceHistory = await tx.optionPricePoint.deleteMany({
          where: {
            optionId: { in: optionIds }
          }
        })
        console.log(`\nDeleted ${deletedOptionPriceHistory.count} option price history entries`)
      }

      // Delete bets for these markets
      const deletedBets = await tx.bet.deleteMany({
        where: {
          eventId: { in: marketIds }
        }
      })
      console.log(`Deleted ${deletedBets.count} bets`)

      // Delete comments for these markets
      const deletedComments = await tx.comment.deleteMany({
        where: {
          eventId: { in: marketIds }
        }
      })
      console.log(`Deleted ${deletedComments.count} comments`)

      // Delete price history for these markets
      const deletedPricePoints = await tx.pricePoint.deleteMany({
        where: {
          eventId: { in: marketIds }
        }
      })
      console.log(`Deleted ${deletedPricePoints.count} price history entries`)

      // Delete market options
      if (optionIds.length > 0) {
        const deletedOptions = await tx.marketOption.deleteMany({
          where: {
            id: { in: optionIds }
          }
        })
        console.log(`Deleted ${deletedOptions.count} market options`)
      }

      // Delete the markets themselves
      const deletedMarkets = await tx.event.deleteMany({
        where: {
          id: { in: marketIds }
        }
      })
      console.log(`Deleted ${deletedMarkets.count} markets`)
    })

    console.log('\n✅ Successfully cleaned up all closed markets and their data!')
  } catch (error) {
    console.error('Error cleaning up closed markets:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()