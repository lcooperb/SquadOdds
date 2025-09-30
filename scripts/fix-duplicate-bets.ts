import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Fixing duplicate creator bets...\n')

  // Find the "Will Gabe crash" market
  const gabeMarket = await prisma.event.findFirst({
    where: {
      title: {
        contains: "Will Gabe crash"
      }
    }
  })

  if (!gabeMarket) {
    console.log('Market not found')
    return
  }

  console.log(`Found market: "${gabeMarket.title}"`)
  console.log(`Current volume: $${gabeMarket.totalVolume}`)

  // Get all bets for this market ordered by creation date
  const allBets = await prisma.bet.findMany({
    where: {
      eventId: gabeMarket.id,
      userId: gabeMarket.createdById
    },
    orderBy: {
      createdAt: 'asc'
    }
  })

  console.log(`\nFound ${allBets.length} creator bets:`)
  allBets.forEach((bet, i) => {
    console.log(`  ${i + 1}. $${bet.amount} ${bet.side} - ${bet.createdAt}`)
  })

  // The first 2 are the original bets, the last 2 are duplicates
  const duplicateBets = allBets.slice(2)

  console.log(`\n🗑️  Deleting ${duplicateBets.length} duplicate bets...`)

  for (const bet of duplicateBets) {
    await prisma.bet.delete({
      where: { id: bet.id }
    })
    console.log(`  ✓ Deleted bet: $${bet.amount} ${bet.side}`)
  }

  // Recalculate volume
  const remainingBets = await prisma.bet.findMany({
    where: {
      eventId: gabeMarket.id,
      status: 'ACTIVE'
    }
  })

  const newVolume = remainingBets.reduce(
    (sum, bet) => sum + Number(bet.amount),
    0
  )

  await prisma.event.update({
    where: { id: gabeMarket.id },
    data: { totalVolume: newVolume }
  })

  console.log(`\n✅ Fixed! New volume: $${newVolume.toFixed(2)}`)
  console.log(`   Remaining bets: ${remainingBets.length}`)
}

main()
  .catch((e) => {
    console.error('❌ Fix failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
