import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateMarketImpact, calculateNewMarketPrice } from '@/lib/marketImpact'

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

    // Get the user and event
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        bets: true,
        options: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

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

    // For BUY operations, check if user has sufficient balance
    if (type === 'BUY' && Number(user.virtualBalance) < amount) {
      return NextResponse.json(
        { message: 'Insufficient balance' },
        { status: 400 }
      )
    }

    // For SELL operations, validate user has sufficient shares to sell
    if (type === 'SELL') {
      const userBets = await prisma.bet.findMany({
        where: {
          userId: session.user.id,
          eventId,
          ...(event.marketType === 'MULTIPLE' && optionId ? { optionId } : {}),
          // Don't filter by side here - we need all bets to calculate net position
        },
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              username: true,
            },
          },
        },
      })

      // Calculate net shares for the side being sold using the same logic as position calculation
      const sideShares = userBets
        .filter(bet => bet.side === side)
        .reduce((sum, bet) => sum + Number(bet.shares), 0)

      if (sideShares < amount) {
        return NextResponse.json(
          { message: `Insufficient ${side} shares to sell. You have ${sideShares.toFixed(2)} shares.` },
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
    let shares: number
    let averagePrice: number
    let marketImpactResult: any

    if (type === 'SELL') {
      // For SELL operations, shares = amount (selling exact number of shares)
      // averagePrice = current market price
      shares = amount
      averagePrice = currentPrice
      marketImpactResult = {
        totalShares: shares,
        averagePrice: currentPrice,
        priceImpact: 0 // Calculate actual impact later if needed
      }
    } else {
      // For BUY operations, use market impact calculation
      marketImpactResult = calculateMarketImpact(
        amount,
        currentPrice,
        Number(event.totalVolume),
        side
      )
      shares = marketImpactResult.totalShares
      averagePrice = marketImpactResult.averagePrice
    }

    // Start transaction to place bet and update user balance and event volume
    const result = await prisma.$transaction(async (tx) => {
      // Calculate the payout for SELL operations
      const sellPayout = type === 'SELL' ? (shares * averagePrice / 100) : 0

      // Create the bet (negative shares for SELL operations)
      const bet = await tx.bet.create({
        data: {
          userId: session.user.id,
          eventId,
          side,
          amount: type === 'SELL' ? sellPayout : amount, // For SELL, amount is the payout received
          price: averagePrice,
          shares: type === 'SELL' ? -shares : shares, // Negative shares for SELL operations
          optionId: event.marketType === 'MULTIPLE' ? optionId : null,
        },
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              username: true,
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

      // Update user balance (different for BUY vs SELL)
      if (type === 'SELL') {
        // For SELL: add the payout to user balance
        await tx.user.update({
          where: { id: session.user.id },
          data: {
            virtualBalance: {
              increment: sellPayout,
            },
          },
        })
      } else {
        // For BUY: deduct the amount from user balance
        await tx.user.update({
          where: { id: session.user.id },
          data: {
            virtualBalance: {
              decrement: amount,
            },
          },
        })
      }

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
        // Binary market price calculation
        const allBets = await tx.bet.findMany({
          where: { eventId },
        })

        const yesBets = allBets.filter(b => b.side === 'YES')
        const noBets = allBets.filter(b => b.side === 'NO')

        const yesAmount = yesBets.reduce((sum, b) => sum + Number(b.amount), 0)
        const noAmount = noBets.reduce((sum, b) => sum + Number(b.amount), 0)
        const totalAmount = yesAmount + noAmount

        // Calculate new price using market impact
        let newYesPrice = calculateNewMarketPrice(
          Number(event.yesPrice),
          totalAmount - amount, // Volume before this bet
          amount,
          side,
          marketImpactResult
        )

        // Fallback to traditional calculation if needed
        if (totalAmount === 0) {
          newYesPrice = 50 // default 50/50
        }

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
            volume: type === 'SELL' ?
              Number(event.totalVolume) - sellPayout :
              Number(event.totalVolume) + amount,
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