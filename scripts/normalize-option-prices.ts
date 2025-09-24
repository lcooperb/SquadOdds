import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function normalizeOptionPrices() {
  try {
    // Get all multiple choice markets
    const multipleChoiceMarkets = await prisma.event.findMany({
      where: {
        marketType: 'MULTIPLE'
      },
      include: {
        options: true,
        bets: true
      }
    })

    console.log(`Found ${multipleChoiceMarkets.length} multiple choice markets`)

    for (const market of multipleChoiceMarkets) {
      console.log(`\nProcessing market: ${market.title}`)

      if (!market.options || market.options.length === 0) {
        console.log('  No options found, skipping...')
        continue
      }

      // Calculate new prices for all options based on their YES bets
      const optionData = market.options.map(option => {
        const optionBets = market.bets.filter(bet => bet.optionId === option.id)
        const yesAmount = optionBets.filter(b => b.side === 'YES').reduce((sum, b) => sum + Number(b.amount), 0)

        console.log(`  Option: ${option.title}`)
        console.log(`    Current price: ${option.price}%`)
        console.log(`    YES bets: $${yesAmount}`)

        return {
          option,
          yesAmount,
        }
      })

      // Calculate total YES amount across all options
      const totalYesAmount = optionData.reduce((sum, data) => sum + data.yesAmount, 0)
      console.log(`  Total YES amount: $${totalYesAmount}`)

      // Calculate normalized prices that sum to 100%
      const normalizedPrices = optionData.map(data => {
        if (totalYesAmount === 0) {
          // If no bets, distribute equally
          return 100 / market.options!.length
        }

        // Price is proportional to YES bets for this option
        const rawPrice = (data.yesAmount / totalYesAmount) * 100
        return Math.max(1, Math.min(99, rawPrice)) // Keep within bounds
      })

      // Ensure prices sum to exactly 100% by adjusting the largest
      const priceSum = normalizedPrices.reduce((sum, price) => sum + price, 0)
      if (priceSum !== 100) {
        const adjustment = 100 - priceSum
        const maxIndex = normalizedPrices.indexOf(Math.max(...normalizedPrices))
        normalizedPrices[maxIndex] = Math.max(1, Math.min(99, normalizedPrices[maxIndex] + adjustment))
      }

      console.log(`  Price sum before adjustment: ${priceSum}%`)
      console.log(`  Price sum after adjustment: ${normalizedPrices.reduce((sum, price) => sum + price, 0)}%`)

      // Update all option prices
      for (let i = 0; i < market.options.length; i++) {
        const option = market.options[i]
        const newPrice = normalizedPrices[i]

        console.log(`    Updating ${option.title}: ${option.price}% → ${newPrice.toFixed(2)}%`)

        await prisma.marketOption.update({
          where: { id: option.id },
          data: {
            price: newPrice,
          },
        })
      }

      console.log(`  ✅ Market normalized`)
    }

    console.log('\n✅ All multiple choice markets have been normalized!')

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

normalizeOptionPrices()