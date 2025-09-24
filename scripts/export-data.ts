import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

async function exportData() {
  try {
    console.log('🔄 Exporting data from local SQLite database...')

    // Export all data
    const users = await prisma.user.findMany()
    const events = await prisma.event.findMany()
    const options = await prisma.marketOption.findMany()
    const bets = await prisma.bet.findMany()
    const priceHistory = await prisma.pricePoint.findMany()
    const optionPriceHistory = await prisma.optionPricePoint.findMany()

    const exportData = {
      users,
      events,
      options,
      bets,
      priceHistory,
      optionPriceHistory
    }

    // Write to JSON file
    fs.writeFileSync('local-data-export.json', JSON.stringify(exportData, null, 2))

    console.log('✅ Data exported successfully!')
    console.log(`📊 Exported:`)
    console.log(`  - ${users.length} users`)
    console.log(`  - ${events.length} events`)
    console.log(`  - ${options.length} market options`)
    console.log(`  - ${bets.length} bets`)
    console.log(`  - ${priceHistory.length} price history points`)
    console.log(`  - ${optionPriceHistory.length} option price history points`)

  } catch (error) {
    console.error('❌ Export failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

exportData()