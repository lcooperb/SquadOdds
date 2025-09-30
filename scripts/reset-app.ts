import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Starting app reset...')

  await prisma.$transaction(async (tx) => {
    // 1. Delete all bets
    console.log(' - Deleting all bets...')
    const deletedBets = await tx.bet.deleteMany({})
    console.log(`   ✓ Deleted ${deletedBets.count} bets`)

    // 2. Delete all payments
    console.log(' - Deleting all payments...')
    const deletedPayments = await tx.payment.deleteMany({})
    console.log(`   ✓ Deleted ${deletedPayments.count} payments`)

    // 3. Delete all redemptions
    console.log(' - Deleting all redemptions...')
    const deletedRedemptions = await tx.redemption.deleteMany({})
    console.log(`   ✓ Deleted ${deletedRedemptions.count} redemptions`)

    // 4. Clear all price history
    console.log(' - Clearing price history...')
    const deletedPriceHistory = await tx.pricePoint.deleteMany({})
    console.log(`   ✓ Deleted ${deletedPriceHistory.count} price history entries`)

    console.log(' - Clearing option price history...')
    const deletedOptionPriceHistory = await tx.optionPricePoint.deleteMany({})
    console.log(`   ✓ Deleted ${deletedOptionPriceHistory.count} option price history entries`)

    // 5. Get all users and count their created markets
    console.log(' - Calculating user balances...')
    const users = await tx.user.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            createdEvents: true
          }
        }
      }
    })

    // 6. Update each user's balance
    console.log(' - Setting user balances...')
    for (const user of users) {
      const marketsCreated = user._count.createdEvents
      const marketCost = marketsCreated * 10
      const newBalance = 1 - marketCost

      await tx.user.update({
        where: { id: user.id },
        data: {
          virtualBalance: newBalance,
          totalWinnings: 0,
          totalLosses: 0
        }
      })

      console.log(`   ✓ ${user.name}: $${newBalance} (${marketsCreated} markets created)`)
    }
  })

  console.log('✅ App reset completed successfully')
  console.log('\nSummary:')
  console.log('- All bets deleted')
  console.log('- All payments deleted')
  console.log('- All redemptions deleted')
  console.log('- All price history cleared')
  console.log('- All user balances reset to $1 minus $10 per market created')
  console.log('- All markets remain intact')
}

main()
  .catch((e) => {
    console.error('❌ Reset failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
