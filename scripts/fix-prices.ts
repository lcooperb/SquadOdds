import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixPrices() {
  try {
    // Get the "who gets marred first" market
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

    if (!market) {
      console.log('Market not found')
      return
    }

    console.log('Market:', market.title)
    console.log('Options:', market.options?.map(o => `${o.title}: ${o.price}¢`))
    console.log('Total bets:', market.bets.length)

    // Calculate correct prices for each option
    for (const option of market.options || []) {
      const optionBets = market.bets.filter(bet => bet.optionId === option.id)

      const yesAmount = optionBets.filter(b => b.side === 'YES').reduce((sum, b) => sum + Number(b.amount), 0)
      const noAmount = optionBets.filter(b => b.side === 'NO').reduce((sum, b) => sum + Number(b.amount), 0)
      const totalAmount = yesAmount + noAmount

      console.log(`\n${option.title}:`)
      console.log(`  YES bets: $${yesAmount}`)
      console.log(`  NO bets: $${noAmount}`)
      console.log(`  Total: $${totalAmount}`)

      let newPrice = 50 // default
      if (totalAmount > 0) {
        newPrice = (yesAmount / totalAmount) * 100
        newPrice = Math.max(5, Math.min(95, newPrice))
      }

      console.log(`  Current price: ${option.price}¢`)
      console.log(`  Calculated price: ${newPrice.toFixed(1)}¢`)

      // Update the price
      await prisma.marketOption.update({
        where: { id: option.id },
        data: { price: newPrice }
      })

      console.log(`  Updated to: ${newPrice.toFixed(1)}¢`)
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixPrices()