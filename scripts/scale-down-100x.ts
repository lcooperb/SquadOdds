import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Starting 100x scale-down migration...')
  await prisma.$transaction(async (tx) => {
    // Users: virtualBalance, totalWinnings, totalLosses -> /100
    console.log(' - Scaling User balances...')
    await tx.$executeRawUnsafe(`
      UPDATE "User"
      SET
        "virtualBalance" = "virtualBalance" / 100.0,
        "totalWinnings"  = "totalWinnings"  / 100.0,
        "totalLosses"    = "totalLosses"    / 100.0
    `)

    // Events: totalVolume -> /100
    console.log(' - Scaling events.totalVolume...')
    await tx.$executeRawUnsafe(`
      UPDATE "events"
      SET "totalVolume" = "totalVolume" / 100.0
    `)

    // Market options: totalVolume -> /100
    console.log(' - Scaling market_options.totalVolume...')
    await tx.$executeRawUnsafe(`
      UPDATE "market_options"
      SET "totalVolume" = "totalVolume" / 100.0
    `)

    // Price history volumes -> /100
    console.log(' - Scaling price_history.volume...')
    await tx.$executeRawUnsafe(`
      UPDATE "price_history"
      SET "volume" = "volume" / 100.0
    `)

    console.log(' - Scaling option_price_history.volume...')
    await tx.$executeRawUnsafe(`
      UPDATE "option_price_history"
      SET "volume" = "volume" / 100.0
    `)

    // Bets: amount and shares -> /100
    console.log(' - Scaling bets.amount and bets.shares...')
    await tx.$executeRawUnsafe(`
      UPDATE "bets"
      SET
        "amount" = "amount" / 100.0,
        "shares" = "shares" / 100.0
    `)

    // Payments: align legacy tokens to USD amount (no change to amount)
    console.log(' - Aligning payments.tokens to payments.amount...')
    await tx.$executeRawUnsafe(`
      UPDATE "payments"
      SET "tokens" = "amount"
    `)

    // Redemptions: align tokenAmount to dollarAmount (legacy cleanup)
    console.log(' - Aligning redemptions.tokenAmount to redemptions.dollarAmount...')
    await tx.$executeRawUnsafe(`
      UPDATE "redemptions"
      SET "tokenAmount" = "dollarAmount"
    `)
  })
  console.log('✅ 100x scale-down migration completed')
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
