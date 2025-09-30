import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({
    select: {
      name: true,
      email: true,
      virtualBalance: true,
      totalWinnings: true,
      totalLosses: true,
      _count: {
        select: {
          createdEvents: true,
          bets: true
        }
      }
    }
  })

  console.log('\nCurrent User Balances:')
  console.log('='.repeat(80))
  users.forEach(user => {
    console.log(`${user.name} (${user.email})`)
    console.log(`  Balance: $${user.virtualBalance}`)
    console.log(`  Markets Created: ${user._count.createdEvents}`)
    console.log(`  Active Bets: ${user._count.bets}`)
    console.log(`  Winnings: $${user.totalWinnings}`)
    console.log(`  Losses: $${user.totalLosses}`)
    console.log('-'.repeat(80))
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
