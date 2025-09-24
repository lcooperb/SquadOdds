import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkPriceHistory() {
  try {
    // Get the multiple choice market
    const market = await prisma.event.findFirst({
      where: {
        title: 'who gets marred first ',
        marketType: 'MULTIPLE'
      },
      include: {
        options: true
      }
    })

    if (!market) {
      console.log('Market not found')
      return
    }

    console.log(`Market: ${market.title}`)
    console.log(`Options:`)
    market.options?.forEach(option => {
      console.log(`  - ${option.title}: ${option.price}%`)
    })

    // Check option price history
    const optionPriceHistory = await prisma.optionPricePoint.findMany({
      where: {
        option: {
          eventId: market.id
        }
      },
      include: {
        option: true
      },
      orderBy: {
        timestamp: 'asc'
      }
    })

    console.log(`\nOption price history entries: ${optionPriceHistory.length}`)
    optionPriceHistory.forEach(point => {
      console.log(`  ${point.option.title}: ${point.price}% at ${point.timestamp}`)
    })

    // Test the API format
    console.log('\nAPI format:')
    const apiData = optionPriceHistory.map(point => ({
      timestamp: point.timestamp.toISOString(),
      optionId: point.option.id,
      optionTitle: point.option.title,
      price: Number(point.price),
    }))

    console.log(JSON.stringify(apiData, null, 2))

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkPriceHistory()