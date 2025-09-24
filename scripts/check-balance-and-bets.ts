import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkBalanceAndBets() {
  try {
    // Check user balance
    const user = await prisma.user.findUnique({
      where: {
        email: 'lecooperband@gmail.com'
      },
      select: {
        id: true,
        email: true,
        virtualBalance: true,
        displayName: true
      }
    })

    console.log('User details:', user)

    if (user) {
      // Check recent bets
      const recentBets = await prisma.bet.findMany({
        where: {
          userId: user.id
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5,
        include: {
          event: {
            select: {
              title: true,
              marketType: true
            }
          },
          option: {
            select: {
              title: true
            }
          }
        }
      })

      console.log('\nRecent bets:')
      recentBets.forEach(bet => {
        console.log(`- ${bet.event.title} (${bet.event.marketType}) - ${bet.side} $${bet.amount} at ${bet.price}¢`)
        if (bet.option) {
          console.log(`  Option: ${bet.option.title}`)
        }
      })

      // Check multiple choice markets with options
      const multipleChoiceMarkets = await prisma.event.findMany({
        where: {
          marketType: 'MULTIPLE',
          status: 'ACTIVE'
        },
        include: {
          options: true
        }
      })

      console.log('\nMultiple choice markets:')
      multipleChoiceMarkets.forEach(market => {
        console.log(`- ${market.title}`)
        market.options?.forEach(option => {
          console.log(`  * ${option.title}: ${option.price}¢`)
        })
      })
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkBalanceAndBets()