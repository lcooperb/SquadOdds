import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/events/[id]/holders - Get top holders for an event
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { message: 'Event ID is required' },
        { status: 400 }
      )
    }

    // Get the event to check market type and current prices
    const event = await prisma.event.findUnique({
      where: { id },
      select: {
        marketType: true,
        yesPrice: true,
        options: {
          select: {
            id: true,
            title: true,
            price: true,
          },
        },
      },
    })

    if (!event) {
      return NextResponse.json(
        { message: 'Event not found' },
        { status: 404 }
      )
    }

    // Get all bets for this event grouped by user and side
    const bets = await prisma.bet.findMany({
      where: {
        eventId: id,
        status: 'ACTIVE',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        option: event.marketType === 'MULTIPLE' ? {
          select: {
            id: true,
            title: true,
          },
        } : undefined,
      },
    })

    if (event.marketType === 'MULTIPLE') {
      // For multiple choice markets, calculate holdings by user and option
      const optionHoldingsMap = new Map<string, {
        user: any,
        optionPositions: { [optionId: string]: { optionTitle: string, yesPosition: number, noPosition: number, amount: number } },
        totalAmount: number,
      }>()

      bets.forEach(bet => {
        const userId = bet.userId
        const positionValue = Number(bet.shares) // In new AMM system, 'shares' field stores position values
        const amount = Number(bet.amount)
        const optionId = bet.optionId || 'unknown'
        const optionTitle = bet.option?.title || 'Unknown Option'

        if (!optionHoldingsMap.has(userId)) {
          optionHoldingsMap.set(userId, {
            user: bet.user,
            optionPositions: {},
            totalAmount: 0,
          })
        }

        const holding = optionHoldingsMap.get(userId)!

        if (!holding.optionPositions[optionId]) {
          holding.optionPositions[optionId] = {
            optionTitle,
            yesPosition: 0,
            noPosition: 0,
            amount: 0,
          }
        }

        // For sell operations (negative position values), we need to handle them differently
        if (bet.side === 'YES') {
          holding.optionPositions[optionId].yesPosition += positionValue
        } else {
          holding.optionPositions[optionId].noPosition += positionValue
        }

        // For amount calculation, only count positive amounts (purchases)
        if (positionValue > 0) {
          holding.optionPositions[optionId].amount += amount
          holding.totalAmount += amount
        }
      })

      // Calculate current position values and P&L for multiple choice
      const holders = Array.from(optionHoldingsMap.values())
        .filter(holding => holding.totalAmount > 0)
        .map((holding) => {
          let totalCurrentValue = 0
          const enhancedOptionPositions: { [optionId: string]: {
            optionTitle: string,
            yesPosition: number,
            noPosition: number,
            amount: number,
            currentValue: number,
            yesAvgPrice: number,
            noAvgPrice: number
          } } = {}

          // Calculate current value for each option position
          Object.entries(holding.optionPositions).forEach(([optionId, position]) => {
            const option = event.options?.find(opt => opt.id === optionId)
            const currentYesPrice = option ? Number(option.price) / 100 : 0
            const currentNoPrice = 1 - currentYesPrice

            const yesCurrentValue = position.yesPosition * currentYesPrice
            const noCurrentValue = position.noPosition * currentNoPrice
            const positionCurrentValue = yesCurrentValue + noCurrentValue

            totalCurrentValue += positionCurrentValue

            enhancedOptionPositions[optionId] = {
              optionTitle: position.optionTitle,
              yesPosition: position.yesPosition,
              noPosition: position.noPosition,
              amount: position.amount,
              currentValue: positionCurrentValue,
              yesAvgPrice: position.yesPosition > 0 ? position.amount / position.yesPosition : 0,
              noAvgPrice: position.noPosition > 0 ? position.amount / position.noPosition : 0,
            }
          })

          // Calculate simple profit/loss
          const profitLoss = totalCurrentValue - holding.totalAmount

          // Find primary position (largest position by value)
          let primaryOption: { optionId: string; title: string; value: number; amount: number } | null = null
          let primaryValue = 0
          Object.entries(enhancedOptionPositions).forEach(([optionId, position]) => {
            if (position.currentValue > primaryValue) {
              primaryValue = position.currentValue
              primaryOption = {
                optionId,
                title: position.optionTitle,
                value: position.currentValue,
                amount: position.amount
              }
            }
          })

          // Simple position description
          const positionDescription = primaryOption && primaryOption.amount && primaryOption.title
            ? `Betting $${Math.round(primaryOption.amount)} on "${primaryOption.title}"`
            : `Multiple positions`

          return {
            user: holding.user,
            totalAmount: holding.totalAmount,
            currentValue: totalCurrentValue,
            profitLoss: profitLoss,
            primaryOption: primaryOption,
            positionDescription: positionDescription,
            optionPositions: enhancedOptionPositions,
            position: 'MULTIPLE' as const,
          }
        })
        .sort((a, b) => b.currentValue - a.currentValue) // Sort by current portfolio value
        .slice(0, 20) // Top 20 holders
        .map((holding, index) => ({
          rank: index + 1,
          ...holding,
        }))

      return NextResponse.json(holders)
    } else {
      // Binary market logic (updated for AMM)
      const holdingsMap = new Map<string, {
        user: any,
        yesPosition: number,
        noPosition: number,
        yesAmount: number,
        noAmount: number,
        totalAmount: number,
      }>()

      bets.forEach(bet => {
        const userId = bet.userId
        const positionValue = Number(bet.shares) // In new AMM system, 'shares' field stores position values
        const amount = Number(bet.amount)

        if (!holdingsMap.has(userId)) {
          holdingsMap.set(userId, {
            user: bet.user,
            yesPosition: 0,
            noPosition: 0,
            yesAmount: 0,
            noAmount: 0,
            totalAmount: 0,
          })
        }

        const holding = holdingsMap.get(userId)!

        // Handle position values (including negative values from sells)
        if (bet.side === 'YES') {
          holding.yesPosition += positionValue
        } else {
          holding.noPosition += positionValue
        }

        // For amount calculation, only count positive amounts (purchases)
        if (positionValue > 0) {
          if (bet.side === 'YES') {
            holding.yesAmount += amount
          } else {
            holding.noAmount += amount
          }
          holding.totalAmount += amount
        }
      })

      // Calculate current position values and P&L
      const currentYesPrice = Number(event.yesPrice) / 100 // Convert to decimal
      const currentNoPrice = (100 - Number(event.yesPrice)) / 100 // Convert to decimal

      // Convert to array and calculate enhanced metrics
      const holders = Array.from(holdingsMap.values())
        .filter(holding => holding.totalAmount > 0)
        .map((holding) => {
          // Calculate current value of positions at market prices
          const yesCurrentValue = holding.yesPosition * currentYesPrice
          const noCurrentValue = holding.noPosition * currentNoPrice
          const totalCurrentValue = yesCurrentValue + noCurrentValue

          // Calculate simple profit/loss
          const profitLoss = totalCurrentValue - holding.totalAmount

          // Identify primary position (what they're mainly betting on)
          const primarySide = holding.yesPosition > holding.noPosition ? 'YES' : 'NO'
          const primaryPosition = primarySide === 'YES' ? holding.yesPosition : holding.noPosition
          const primaryAmount = primarySide === 'YES' ? holding.yesAmount : holding.noAmount

          // Simple position description
          const positionDescription = primarySide === 'YES'
            ? `Betting $${Math.round(primaryPosition)} on YES`
            : `Betting $${Math.round(primaryPosition)} on NO`

          return {
            user: holding.user,
            yesPosition: holding.yesPosition,
            noPosition: holding.noPosition,
            yesAmount: holding.yesAmount,
            noAmount: holding.noAmount,
            totalAmount: holding.totalAmount,
            currentValue: totalCurrentValue,
            profitLoss: profitLoss,
            primarySide: primarySide,
            primaryPosition: primaryPosition,
            primaryAmount: primaryAmount,
            positionDescription: positionDescription,
            position: holding.yesPosition > holding.noPosition ? 'YES' :
                     holding.noPosition > holding.yesPosition ? 'NO' : 'NEUTRAL',
          }
        })
        .sort((a, b) => b.currentValue - a.currentValue) // Sort by current portfolio value
        .slice(0, 20) // Top 20 holders
        .map((holding, index) => ({
          rank: index + 1,
          ...holding,
        }))

      return NextResponse.json(holders)
    }
  } catch (error) {
    console.error('Error fetching holders:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}