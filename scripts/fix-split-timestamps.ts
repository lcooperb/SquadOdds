import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixSplitTimestamps() {
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

    // Get all price history points
    const allPoints = await prisma.optionPricePoint.findMany({
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

    console.log(`Found ${allPoints.length} price history points`)

    // Group by timestamp (rounded to nearest second to catch split timestamps)
    const timeGroups: { [key: string]: any[] } = {}

    allPoints.forEach(point => {
      // Round timestamp to nearest second
      const roundedTime = new Date(point.timestamp)
      roundedTime.setMilliseconds(0)
      const timeKey = roundedTime.toISOString()

      if (!timeGroups[timeKey]) {
        timeGroups[timeKey] = []
      }
      timeGroups[timeKey].push(point)
    })

    console.log(`Grouped into ${Object.keys(timeGroups).length} time periods`)

    // Find groups with incomplete data (less than 4 options)
    const incompleteGroups = Object.keys(timeGroups).filter(timeKey =>
      timeGroups[timeKey].length < (market.options?.length || 0)
    )

    console.log(`Found ${incompleteGroups.length} incomplete time groups`)

    if (incompleteGroups.length === 0) {
      console.log('No incomplete groups found')
      return
    }

    // For each incomplete group, delete all points and recreate with current prices
    for (const timeKey of incompleteGroups) {
      const points = timeGroups[timeKey]
      console.log(`\nFixing time group: ${timeKey}`)
      console.log(`  Current points: ${points.length}`)

      // Delete all points in this time group
      for (const point of points) {
        await prisma.optionPricePoint.delete({
          where: { id: point.id }
        })
        console.log(`    Deleted point for ${point.option.title}`)
      }

      // Create new points for ALL options at this timestamp
      const timestamp = new Date(timeKey)
      for (const option of market.options || []) {
        await prisma.optionPricePoint.create({
          data: {
            optionId: option.id,
            price: Number(option.price), // Use current price
            volume: Number(option.totalVolume),
            timestamp: timestamp,
          },
        })
        console.log(`    Created new point for ${option.title}: ${option.price}%`)
      }
    }

    // Verify the result
    const newPoints = await prisma.optionPricePoint.findMany({
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

    console.log(`\nAfter fix: ${newPoints.length} total points`)

    // Group again to verify
    const newTimeGroups: { [key: string]: any[] } = {}
    newPoints.forEach(point => {
      const timeKey = point.timestamp.toISOString()
      if (!newTimeGroups[timeKey]) {
        newTimeGroups[timeKey] = []
      }
      newTimeGroups[timeKey].push(point)
    })

    console.log('\nFinal verification:')
    Object.keys(newTimeGroups).forEach(timeKey => {
      const points = newTimeGroups[timeKey]
      console.log(`  ${timeKey}: ${points.length} options`)
      points.forEach(point => {
        console.log(`    ${point.option.title}: ${point.price}%`)
      })
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixSplitTimestamps()