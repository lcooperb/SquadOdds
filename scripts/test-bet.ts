import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testBet() {
  try {
    // Get the user and market
    const user = await prisma.user.findUnique({
      where: { email: 'lecooperband@gmail.com' }
    })

    const market = await prisma.event.findFirst({
      where: {
        title: 'who gets marred first ',
        marketType: 'MULTIPLE'
      },
      include: {
        options: true,
        bets: true
      }
    })

    if (!user || !market) {
      console.log('User or market not found')
      return
    }

    // Find Andrew's option
    const andrewOption = market.options?.find(opt => opt.title === 'andrew')
    if (!andrewOption) {
      console.log('Andrew option not found')
      return
    }

    console.log(`Placing a $20 YES bet on Andrew (${andrewOption.title})`)
    console.log(`Current price: ${andrewOption.price}%`)

    // Simulate the betting logic with manual price calculation
    const currentPrice = Number(andrewOption.price)
    const amount = 20
    const shares = (amount / currentPrice) * 100

    // Start transaction
    await prisma.$transaction(async (tx) => {
      // Create the bet
      const bet = await tx.bet.create({
        data: {
          userId: user.id,
          eventId: market.id,
          optionId: andrewOption.id,
          side: 'YES',
          amount,
          price: currentPrice,
          shares,
        },
      })

      console.log(`Bet created: ${bet.id}`)

      // Update user balance
      await tx.user.update({
        where: { id: user.id },
        data: {
          virtualBalance: {
            decrement: amount,
          },
        },
      })

      // Update event volume
      await tx.event.update({
        where: { id: market.id },
        data: {
          totalVolume: {
            increment: amount,
          },
        },
      })

      // Recalculate prices for ALL options
      const allOptions = market.options || []

      const optionData = await Promise.all(
        allOptions.map(async (option) => {
          const optionBets = await tx.bet.findMany({
            where: { eventId: market.id, optionId: option.id },
          })

          const yesAmount = optionBets.filter(b => b.side === 'YES').reduce((sum, b) => sum + Number(b.amount), 0)
          return {
            option,
            yesAmount,
          }
        })
      )

      const totalYesAmount = optionData.reduce((sum, data) => sum + data.yesAmount, 0)

      const normalizedPrices = optionData.map(data => {
        if (totalYesAmount === 0) {
          return 100 / allOptions.length
        }
        const rawPrice = (data.yesAmount / totalYesAmount) * 100
        return Math.max(1, Math.min(99, rawPrice))
      })

      const priceSum = normalizedPrices.reduce((sum, price) => sum + price, 0)
      if (priceSum !== 100) {
        const adjustment = 100 - priceSum
        const maxIndex = normalizedPrices.indexOf(Math.max(...normalizedPrices))
        normalizedPrices[maxIndex] = Math.max(1, Math.min(99, normalizedPrices[maxIndex] + adjustment))
      }

      console.log('\nUpdated prices:')
      for (let i = 0; i < allOptions.length; i++) {
        const option = allOptions[i]
        const newPrice = normalizedPrices[i]

        console.log(`  ${option.title}: ${option.price}% → ${newPrice.toFixed(2)}%`)

        await tx.marketOption.update({
          where: { id: option.id },
          data: {
            price: newPrice,
            totalVolume: option.id === andrewOption.id ? {
              increment: amount,
            } : undefined,
          },
        })

        // Record price history point for ALL options
        await tx.optionPricePoint.create({
          data: {
            optionId: option.id,
            price: newPrice,
            volume: option.id === andrewOption.id ? Number(option.totalVolume) + amount : Number(option.totalVolume),
          },
        })
      }
    })

    console.log('\n✅ Bet placed successfully!')

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testBet()