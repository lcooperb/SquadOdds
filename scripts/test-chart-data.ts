import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testChartData() {
  try {
    // Get the multiple choice market with options
    const market = await prisma.event.findFirst({
      where: {
        title: 'who gets marred first ',
        marketType: 'MULTIPLE'
      },
      include: {
        options: {
          orderBy: {
            createdAt: 'asc' // Ensure consistent ordering
          }
        }
      }
    })

    if (!market) {
      console.log('Market not found')
      return
    }

    console.log('Market options (in order):')
    market.options?.forEach((option, index) => {
      console.log(`  ${index}: ${option.title} (${option.id})`)
    })

    // Get price history data
    const historyData = await prisma.optionPricePoint.findMany({
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

    console.log('\nPrice history data:')
    historyData.forEach(point => {
      console.log(`  ${point.timestamp.toISOString()}: ${point.option.title} = ${point.price}%`)
    })

    // Simulate the formatMultipleChoiceData function
    const apiData = historyData.map(point => ({
      timestamp: point.timestamp.toISOString(),
      optionId: point.option.id,
      optionTitle: point.option.title,
      price: Number(point.price),
    }))

    console.log('\nAPI format:')
    console.log(JSON.stringify(apiData.slice(0, 8), null, 2)) // Show first 8 entries

    // Group by timestamp like the chart does
    const timeGroups: { [timestamp: string]: any } = {}

    apiData.forEach(point => {
      const timeKey = point.timestamp
      if (!timeGroups[timeKey]) {
        timeGroups[timeKey] = {
          time: new Date(timeKey).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          fullTime: new Date(timeKey).toLocaleString(),
        }
      }

      // Find option index based on optionId
      const optionIndex = market.options?.findIndex(opt => opt.id === point.optionId) ?? -1
      console.log(`  Mapping ${point.optionTitle} (${point.optionId}) to option_${optionIndex}`)

      if (optionIndex >= 0) {
        timeGroups[timeKey][`option_${optionIndex}`] = Math.round(point.price)
        timeGroups[timeKey][`option_${optionIndex}_name`] = point.optionTitle
      }
    })

    const chartData = Object.keys(timeGroups)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .map(key => timeGroups[key])

    console.log('\nFinal chart data:')
    console.log(JSON.stringify(chartData, null, 2))

    // Verify each data point has all options
    console.log('\nData completeness check:')
    chartData.forEach((dataPoint, index) => {
      console.log(`  Time ${index} (${dataPoint.time}):`)
      for (let i = 0; i < (market.options?.length || 0); i++) {
        const value = dataPoint[`option_${i}`]
        const name = dataPoint[`option_${i}_name`]
        console.log(`    option_${i}: ${value}% (${name || 'MISSING'})`)
      }
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testChartData()