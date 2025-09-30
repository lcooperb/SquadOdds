import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Starting restoration of initial creator bets...\n')

  // Get all markets with their creator and options
  const markets = await prisma.event.findMany({
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
        }
      },
      options: true,
    }
  })

  console.log(`Found ${markets.length} markets to process\n`)

  for (const market of markets) {
    console.log(`\n📊 Processing: "${market.title}" (${market.marketType})`)
    console.log(`   Creator: ${market.createdBy.name}`)
    console.log(`   Current volume: $${market.totalVolume}`)

    const investment = 10 // Initial creator investment

    await prisma.$transaction(async (tx) => {
      if (market.marketType === 'BINARY') {
        const yesPrice = Number(market.yesPrice)
        const noPrice = 100 - yesPrice
        const yesAmount = investment * (yesPrice / 100)
        const noAmount = investment * (noPrice / 100)

        console.log(`   Creating BINARY bets:`)
        console.log(`     - YES: $${yesAmount.toFixed(2)} at ${yesPrice}%`)
        console.log(`     - NO: $${noAmount.toFixed(2)} at ${noPrice}%`)

        // Create YES bet
        if (yesAmount > 0) {
          await tx.bet.create({
            data: {
              userId: market.createdById,
              eventId: market.id,
              side: 'YES',
              amount: yesAmount,
              price: yesPrice,
              shares: yesAmount,
              createdAt: market.createdAt, // Use market creation date
            },
          })
        }

        // Create NO bet
        if (noAmount > 0) {
          await tx.bet.create({
            data: {
              userId: market.createdById,
              eventId: market.id,
              side: 'NO',
              amount: noAmount,
              price: noPrice,
              shares: noAmount,
              createdAt: market.createdAt,
            },
          })
        }

        // Create initial price history if none exists
        const existingHistory = await tx.pricePoint.findFirst({
          where: { eventId: market.id },
          orderBy: { timestamp: 'asc' }
        })

        if (!existingHistory) {
          await tx.pricePoint.create({
            data: {
              eventId: market.id,
              yesPrice: yesPrice,
              noPrice: noPrice,
              volume: investment,
              timestamp: market.createdAt,
            },
          })
          console.log(`     - Created initial price history`)
        }

      } else if (market.marketType === 'MULTIPLE') {
        console.log(`   Creating MULTIPLE CHOICE bets:`)

        for (const option of market.options) {
          const optionPrice = Number(option.price)
          const optionAmount = investment * (optionPrice / 100)

          console.log(`     - ${option.title}: $${optionAmount.toFixed(2)} at ${optionPrice.toFixed(1)}%`)

          if (optionAmount > 0) {
            await tx.bet.create({
              data: {
                userId: market.createdById,
                eventId: market.id,
                optionId: option.id,
                side: 'YES',
                amount: optionAmount,
                price: optionPrice,
                shares: optionAmount,
                createdAt: market.createdAt,
              },
            })

            // Create option price history if none exists
            const existingHistory = await tx.optionPricePoint.findFirst({
              where: { optionId: option.id },
              orderBy: { timestamp: 'asc' }
            })

            if (!existingHistory) {
              await tx.optionPricePoint.create({
                data: {
                  optionId: option.id,
                  price: optionPrice,
                  volume: optionAmount,
                  timestamp: market.createdAt,
                },
              })
            }
          }
        }

      }
    })

    // Update volumes outside the transaction to avoid timeout
    if (market.marketType === 'MULTIPLE') {
      for (const option of market.options) {
        const optionBets = await prisma.bet.findMany({
          where: {
            eventId: market.id,
            optionId: option.id,
            status: 'ACTIVE'
          }
        })

        const totalOptionVolume = optionBets.reduce(
          (sum, bet) => sum + Number(bet.amount),
          0
        )

        await prisma.marketOption.update({
          where: { id: option.id },
          data: { totalVolume: totalOptionVolume }
        })
      }
    }

    // Update market total volume
    const allBets = await prisma.bet.findMany({
      where: {
        eventId: market.id,
        status: 'ACTIVE'
      }
    })

    const newTotalVolume = allBets.reduce(
      (sum, bet) => sum + Number(bet.amount),
      0
    )

    await prisma.event.update({
      where: { id: market.id },
      data: { totalVolume: newTotalVolume }
    })

    console.log(`   ✓ Updated total volume to $${newTotalVolume.toFixed(2)}`)
  }

  console.log('\n✅ Creator bets restoration completed successfully!')

  // Show summary
  console.log('\n📈 Summary:')
  const updatedMarkets = await prisma.event.findMany({
    select: {
      title: true,
      totalVolume: true,
      _count: {
        select: { bets: true }
      }
    }
  })

  for (const market of updatedMarkets) {
    console.log(`  - ${market.title}: $${Number(market.totalVolume).toFixed(2)} (${market._count.bets} bets)`)
  }
}

main()
  .catch((e) => {
    console.error('❌ Restoration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
