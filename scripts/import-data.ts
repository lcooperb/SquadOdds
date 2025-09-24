import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

async function importData() {
  try {
    console.log('🔄 Importing data to production Supabase database...')

    // Read exported data
    const exportedData = JSON.parse(fs.readFileSync('local-data-export.json', 'utf8'))

    // First, clear existing data to avoid conflicts
    console.log('🗑️ Clearing existing data...')
    await prisma.bet.deleteMany()
    await prisma.optionPricePoint.deleteMany()
    await prisma.pricePoint.deleteMany()
    await prisma.marketOption.deleteMany()
    await prisma.event.deleteMany()
    await prisma.user.deleteMany()

    // Import users first (they are referenced by events and bets)
    console.log(`📥 Importing ${exportedData.users.length} users...`)
    for (const user of exportedData.users) {
      await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          hashedPassword: user.hashedPassword,
          virtualBalance: user.virtualBalance,
          totalWinnings: user.totalWinnings,
          totalLosses: user.totalLosses,
          isAdmin: user.isAdmin,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt)
        }
      })
    }

    // Import events
    console.log(`📥 Importing ${exportedData.events.length} events...`)
    for (const event of exportedData.events) {
      await prisma.event.create({
        data: {
          id: event.id,
          title: event.title,
          description: event.description,
          category: event.category,
          createdById: event.createdById,
          status: event.status,
          endDate: event.endDate ? new Date(event.endDate) : null,
          isOngoing: event.isOngoing,
          marketType: event.marketType,
          yesPrice: event.yesPrice,
          totalVolume: event.totalVolume,
          resolved: event.resolved,
          outcome: event.outcome,
          createdAt: new Date(event.createdAt),
          updatedAt: new Date(event.updatedAt)
        }
      })
    }

    // Import market options
    console.log(`📥 Importing ${exportedData.options.length} market options...`)
    for (const option of exportedData.options) {
      await prisma.marketOption.create({
        data: {
          id: option.id,
          eventId: option.eventId,
          title: option.title,
          price: option.price,
          totalVolume: option.totalVolume,
          createdAt: new Date(option.createdAt),
          updatedAt: new Date(option.updatedAt)
        }
      })
    }

    // Import bets
    console.log(`📥 Importing ${exportedData.bets.length} bets...`)
    for (const bet of exportedData.bets) {
      await prisma.bet.create({
        data: {
          id: bet.id,
          userId: bet.userId,
          eventId: bet.eventId,
          optionId: bet.optionId,
          side: bet.side,
          amount: bet.amount,
          price: bet.price,
          shares: bet.shares,
          status: bet.status,
          createdAt: new Date(bet.createdAt),
          updatedAt: new Date(bet.updatedAt)
        }
      })
    }

    // Import price history
    console.log(`📥 Importing ${exportedData.priceHistory.length} price history points...`)
    for (const pricePoint of exportedData.priceHistory) {
      await prisma.pricePoint.create({
        data: {
          id: pricePoint.id,
          eventId: pricePoint.eventId,
          yesPrice: pricePoint.yesPrice,
          noPrice: pricePoint.noPrice,
          volume: pricePoint.volume,
          timestamp: new Date(pricePoint.timestamp)
        }
      })
    }

    // Import option price history
    console.log(`📥 Importing ${exportedData.optionPriceHistory.length} option price history points...`)
    for (const optionPricePoint of exportedData.optionPriceHistory) {
      await prisma.optionPricePoint.create({
        data: {
          id: optionPricePoint.id,
          optionId: optionPricePoint.optionId,
          price: optionPricePoint.price,
          volume: optionPricePoint.volume,
          timestamp: new Date(optionPricePoint.timestamp)
        }
      })
    }

    console.log('✅ Data import completed successfully!')

  } catch (error) {
    console.error('❌ Import failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

importData()