import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateMarketImpact, calculateNewMarketPrice, calculatePoolsFromPrice } from '@/lib/marketImpact'

// POST /api/bets - Place a new bet
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { eventId, side, amount, optionId, type = 'BUY' } = await request.json()

    if (!eventId || !side || !amount || !type) {
      return NextResponse.json(
        { message: 'Event ID, side, amount, and type are required' },
        { status: 400 }
      )
    }

    if (type !== 'BUY' && type !== 'SELL') {
      return NextResponse.json(
        { message: 'Type must be BUY or SELL' },
        { status: 400 }
      )
    }

    if (side !== 'YES' && side !== 'NO') {
      return NextResponse.json(
        { message: 'Side must be YES or NO' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { message: 'Amount must be greater than 0' },
        { status: 400 }
      )
    }

    // Check maximum bet limit
    if (amount > 300) {
      return NextResponse.json(
        { message: 'Maximum bet amount is $300' },
        { status: 400 }
      )
    }

    // Get the event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        bets: true,
        options: true,
      },
    })

    if (!event) {
      return NextResponse.json(
        { message: 'Event not found' },
        { status: 404 }
      )
    }

    if (event.status !== 'ACTIVE') {
      return NextResponse.json(
        { message: 'Event is not active' },
        { status: 400 }
      )
    }

    if (event.resolved) {
      return NextResponse.json(
        { message: 'Event is already resolved' },
        { status: 400 }
      )
    }

    // For SELL operations, validate user has sufficient position to sell
    if (type === 'SELL') {
      const userBets = await prisma.bet.findMany({
        where: {
          userId: session.user.id,
          eventId,
          side, // Only get bets for the side being sold
          ...(event.marketType === 'MULTIPLE' && optionId ? { optionId } : {}),
        },
      })

      // Calculate net position value for the side being sold
      const netPosition = userBets.reduce((sum, bet) => sum + Number(bet.shares), 0)

      if (netPosition < amount) {
        return NextResponse.json(
          { message: `Insufficient ${side} position to sell. You have $${netPosition.toFixed(2)} position.` },
          { status: 400 }
        )
      }
    }

    // For multiple choice markets, validate optionId and get option price
    let currentPrice: number
    let selectedOption = null

    if (event.marketType === 'MULTIPLE') {
      if (!optionId) {
        return NextResponse.json(
          { message: 'Option ID is required for multiple choice markets' },
          { status: 400 }
        )
      }

      selectedOption = event.options?.find(opt => opt.id === optionId)
      if (!selectedOption) {
        return NextResponse.json(
          { message: 'Option not found' },
          { status: 404 }
        )
      }

      currentPrice = side === 'YES' ? Number(selectedOption.price) : (100 - Number(selectedOption.price))
    } else {
      // Binary market
      currentPrice = side === 'YES' ? Number(event.yesPrice) : (100 - Number(event.yesPrice))
    }

    // Calculate market impact for the bet (different logic for BUY vs SELL)
    let positionSize: number
    let averagePrice: number
    let marketImpactResult: any

    if (type === 'SELL') {
      // For SELL operations, position size = amount (selling position value)
      // averagePrice = current market price
      positionSize = amount
      averagePrice = currentPrice
      marketImpactResult = {
        totalPositions: positionSize,
        averagePrice: currentPrice,
        priceImpact: 0,
        finalPrice: currentPrice
      }
    } else {
      // For BUY operations, use parimutuel pool calculation
      // Calculate current pool sizes from total volume and YES price
      const eventYesPrice = event.marketType === 'MULTIPLE'
        ? (selectedOption ? Number(selectedOption.price) : Number(event.yesPrice))
        : Number(event.yesPrice)

      const { yesPool, noPool } = calculatePoolsFromPrice(
        Number(event.totalVolume),
        eventYesPrice
      )

      marketImpactResult = calculateMarketImpact(
        amount,
        currentPrice,
        yesPool,
        noPool,
        side
      )
      positionSize = marketImpactResult.totalPositions // This is the bet amount in parimutuel
      averagePrice = marketImpactResult.averagePrice
    }

    // Start transaction to place bet and update user balance and event volume
    const result = await prisma.$transaction(async (tx) => {
      // Calculate the payout for SELL operations
      const sellPayout = type === 'SELL' ? positionSize : 0

      // Create the bet record with position size (simplified from shares)
      const bet = await tx.bet.create({
        data: {
          userId: session.user.id,
          eventId,
          side,
          amount: type === 'SELL' ? sellPayout : amount, // For SELL, amount is the payout received
          price: averagePrice,
          shares: type === 'SELL' ? -positionSize : positionSize, // Position value (was shares)
          optionId: event.marketType === 'MULTIPLE' ? optionId : null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          event: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      })

      // Note: No balance operations needed - users bet on credit up to $300 per bet

      // Update event volume (SELL decreases volume, BUY increases it)
      await tx.event.update({
        where: { id: eventId },
        data: {
          totalVolume: {
            [type === 'SELL' ? 'decrement' : 'increment']: type === 'SELL' ? sellPayout : amount,
          },
        },
      })

      if (event.marketType === 'MULTIPLE') {
        // For multiple choice markets, recalculate prices for ALL options to ensure they sum to 100%
        const allOptions = event.options || []

        // Calculate new prices for all options based on their YES bets
        const optionData = await Promise.all(
          allOptions.map(async (option) => {
            const optionBets = await tx.bet.findMany({
              where: { eventId, optionId: option.id },
            })

            const yesAmount = optionBets.filter(b => b.side === 'YES').reduce((sum, b) => sum + Number(b.amount), 0)
            return {
              option,
              yesAmount,
            }
          })
        )

        // Calculate total YES amount across all options
        const totalYesAmount = optionData.reduce((sum, data) => sum + data.yesAmount, 0)

        // Calculate normalized prices that sum to 100%
        const normalizedPrices = optionData.map(data => {
          if (totalYesAmount === 0) {
            // If no bets, distribute equally
            return 100 / allOptions.length
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

        // Create a single timestamp for all options to ensure they're grouped correctly
        const sharedTimestamp = new Date()

        // Update all option prices and record history for ALL options at the SAME timestamp
        for (let i = 0; i < allOptions.length; i++) {
          const option = allOptions[i]
          const newPrice = normalizedPrices[i]

          await tx.marketOption.update({
            where: { id: option.id },
            data: {
              price: newPrice,
              totalVolume: option.id === optionId ? {
                [type === 'SELL' ? 'decrement' : 'increment']: type === 'SELL' ? sellPayout : amount,
              } : undefined,
            },
          })

          // Record price history point for ALL options at the SAME timestamp
          await tx.optionPricePoint.create({
            data: {
              optionId: option.id,
              price: newPrice,
              volume: option.id === optionId ?
                (type === 'SELL' ?
                  Number(option.totalVolume) - sellPayout :
                  Number(option.totalVolume) + amount
                ) :
                Number(option.totalVolume),
              timestamp: sharedTimestamp,
            },
          })
        }
      } else {
        // Binary market price calculation - PARIMUTUEL MODEL
        // New price = new YES pool / new total pool
        const currentYesPrice = Number(event.yesPrice)
        const currentTotalVolume = Number(event.totalVolume)

        // Calculate current pools
        const { yesPool: currentYesPool, noPool: currentNoPool } = calculatePoolsFromPrice(
          currentTotalVolume,
          currentYesPrice
        )

        // Calculate new pools after this bet
        const volumeChange = type === 'SELL' ? -sellPayout : amount
        const newTotalVolume = currentTotalVolume + volumeChange
        const newYesPool = side === 'YES'
          ? currentYesPool + (type === 'BUY' ? amount : 0)
          : currentYesPool - (type === 'SELL' && side === 'YES' ? sellPayout : 0)
        const newNoPool = newTotalVolume - newYesPool

        // Calculate new price from pool ratio
        let newYesPrice = newTotalVolume > 0
          ? (newYesPool / newTotalVolume) * 100
          : currentYesPrice

        // Ensure price is within bounds
        newYesPrice = Math.max(5, Math.min(95, newYesPrice))
        const newNoPrice = 100 - newYesPrice

        // Update event price
        await tx.event.update({
          where: { id: eventId },
          data: {
            yesPrice: newYesPrice,
          },
        })

        // Record price history point for binary markets
        await tx.pricePoint.create({
          data: {
            eventId,
            yesPrice: newYesPrice,
            noPrice: newNoPrice,
            volume: newTotalVolume,
          },
        })
      }

      return bet
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error placing bet:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/bets - Get user's bets
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: any = {
      userId: session.user.id,
    }

    if (status) {
      where.status = status
    }

    const bets = await prisma.bet.findMany({
      where,
      include: {
        event: {
          select: {
            id: true,
            title: true,
            category: true,
            status: true,
            resolved: true,
            outcome: true,
            endDate: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(bets)
  } catch (error) {
    console.error('Error fetching bets:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}