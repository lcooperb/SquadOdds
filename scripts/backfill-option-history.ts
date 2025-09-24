import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function backfillOptionHistory() {
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
    console.log(`Options: ${market.options?.map(o => o.title).join(', ')}`)

    // Get existing price history points
    const existingHistory = await prisma.optionPricePoint.findMany({
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

    console.log(`\nExisting history entries: ${existingHistory.length}`)

    // Get unique timestamps
    const uniqueTimestamps = [...new Set(existingHistory.map(h => h.timestamp.getTime()))]
    console.log(`Unique timestamps: ${uniqueTimestamps.length}`)

    // For each timestamp, ensure ALL options have a price point
    for (const timestamp of uniqueTimestamps) {
      const timestampDate = new Date(timestamp)
      console.log(`\nProcessing timestamp: ${timestampDate.toISOString()}`)

      // Get existing entries for this timestamp
      const entriesAtTimestamp = existingHistory.filter(h => h.timestamp.getTime() === timestamp)
      console.log(`  Existing entries: ${entriesAtTimestamp.length}`)

      // Find missing options for this timestamp
      const existingOptionIds = entriesAtTimestamp.map(e => e.option.id)
      const missingOptions = market.options?.filter(opt => !existingOptionIds.includes(opt.id)) || []

      console.log(`  Missing options: ${missingOptions.map(o => o.title).join(', ')}`)

      // Create entries for missing options using their current prices
      for (const option of missingOptions) {
        console.log(`    Creating entry for ${option.title} with price ${option.price}%`)

        await prisma.optionPricePoint.create({
          data: {
            optionId: option.id,
            price: Number(option.price),
            volume: Number(option.totalVolume),
            timestamp: timestampDate,
          },
        })
      }
    }

    // Verify the result
    const newHistory = await prisma.optionPricePoint.findMany({
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

    console.log(`\nAfter backfill: ${newHistory.length} total entries`)

    // Group by timestamp to verify
    const timeGroups: { [key: string]: any[] } = {}
    newHistory.forEach(entry => {
      const timeKey = entry.timestamp.toISOString()
      if (!timeGroups[timeKey]) timeGroups[timeKey] = []
      timeGroups[timeKey].push(entry)
    })

    console.log('\nFinal grouped data:')
    Object.keys(timeGroups).forEach(timeKey => {
      const entries = timeGroups[timeKey]
      console.log(`  ${timeKey}: ${entries.length} options`)
      entries.forEach(entry => {
        console.log(`    ${entry.option.title}: ${entry.price}%`)
      })
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

backfillOptionHistory()