import { prisma } from '@/lib/prisma'

export interface NotificationData {
  eventId?: string
  amount?: number
  outcome?: string
  winningOption?: string
  status?: string
  [key: string]: any
}

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  data?: NotificationData
) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data: data ? JSON.stringify(data) : undefined,
      },
    })
    return notification
  } catch (error) {
    console.error('Error creating notification:', error)
    throw error
  }
}

export async function notifyMarketClosed(eventId: string) {
  try {
    // Get the event and all users who have bets on it
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        bets: {
          include: {
            user: true,
            option: true,
          },
        },
        options: true,
      },
    })

    if (!event) {
      throw new Error('Event not found')
    }

    // Get unique users who have bets on this market
    const userIds = Array.from(new Set(event.bets.map(bet => bet.userId)))

    // Determine the final outcome
    let finalOutcome = 'Unknown'
    if (event.marketType === 'BINARY') {
      const yesPrice = Math.round(Number(event.yesPrice))
      finalOutcome = yesPrice >= 50 ? `YES (${yesPrice}%)` : `NO (${100 - yesPrice}%)`
    } else if (event.marketType === 'MULTIPLE' && event.options) {
      const topOption = event.options.reduce((prev, current) =>
        Number(prev.price) > Number(current.price) ? prev : current
      )
      finalOutcome = `${topOption.title} (${Math.round(Number(topOption.price))}%)`
    }

    // Create notifications for each user
    const notifications = await Promise.all(
      userIds.map(userId =>
        createNotification(
          userId,
          'MARKET_CLOSED',
          'Market Closed',
          `The market "${event.title}" has closed. Final outcome: ${finalOutcome}`,
          {
            eventId: event.id,
            outcome: finalOutcome,
            marketType: event.marketType,
          }
        )
      )
    )

    return notifications
  } catch (error) {
    console.error('Error notifying market closure:', error)
    throw error
  }
}

export async function notifyMarketResolution(eventId: string, outcome: boolean | null, winningOptionId?: string) {
  try {
    // Get the event and all bets
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        bets: {
          include: {
            user: true,
            option: true,
          },
        },
        options: true,
      },
    })

    if (!event) {
      throw new Error('Event not found')
    }

    // Determine winning description
    let winningDescription = 'Unknown'
    if (event.marketType === 'BINARY') {
      winningDescription = outcome ? 'YES' : 'NO'
    } else if (event.marketType === 'MULTIPLE' && winningOptionId) {
      const winningOption = event.options?.find(opt => opt.id === winningOptionId)
      winningDescription = winningOption?.title || 'Unknown option'
    }

    // Create notifications for each user with bets
    const notifications = await Promise.all(
      event.bets.map(async (bet) => {
        // Determine if this bet won
        let isWinner = false
        if (event.marketType === 'BINARY') {
          isWinner = (outcome && bet.side === 'YES') || (!outcome && bet.side === 'NO')
        } else if (event.marketType === 'MULTIPLE') {
          isWinner = bet.optionId === winningOptionId
        }

        const result = isWinner ? 'won' : 'lost'
        const amount = isWinner ? Number(bet.shares) : Number(bet.amount)
        const amountText = isWinner ? `won $${amount.toFixed(2)}` : `lost $${amount.toFixed(2)}`

        return createNotification(
          bet.userId,
          'MARKET_RESOLVED',
          'Market Resolved',
          `Your bet on "${event.title}" has been resolved. You ${amountText}. Winner: ${winningDescription}`,
          {
            eventId: event.id,
            betId: bet.id,
            result,
            amount,
            outcome: winningDescription,
          }
        )
      })
    )

    return notifications
  } catch (error) {
    console.error('Error notifying market resolution:', error)
    throw error
  }
}

export async function notifyPaymentApproved(userId: string, amount: number) {
  try {
    const notification = await createNotification(
      userId,
      'PAYMENT_APPROVED',
      'Payment Approved',
      `Your $${amount.toFixed(2)} payment has been approved and added to your balance.`,
      {
        amount,
      }
    )
    return notification
  } catch (error) {
    console.error('Error notifying payment approval:', error)
    throw error
  }
}

export async function notifyRedemptionUpdate(redemptionId: string, status: string, adminNotes?: string) {
  try {
    // Get the redemption details
    const redemption = await prisma.redemption.findUnique({
      where: { id: redemptionId },
      include: {
        user: true,
      },
    })

    if (!redemption) {
      throw new Error('Redemption not found')
    }

    let title = 'Redemption Update'
    let message = `Your $${Number(redemption.dollarAmount).toFixed(2)} redemption has been ${status.toLowerCase()}.`

    if (status === 'COMPLETED') {
      title = 'Redemption Completed'
      message = `Your $${Number(redemption.dollarAmount).toFixed(2)} redemption has been completed and sent to ${redemption.appleCashEmail}.`
    } else if (status === 'REJECTED') {
      title = 'Redemption Rejected'
      message = `Your $${Number(redemption.dollarAmount).toFixed(2)} redemption has been rejected and refunded to your account.`
      if (adminNotes) {
        message += ` Reason: ${adminNotes}`
      }
    }

    const notification = await createNotification(
      redemption.userId,
      `REDEMPTION_${status}`,
      title,
      message,
      {
        redemptionId: redemption.id,
        amount: Number(redemption.dollarAmount),
        status,
        adminNotes,
      }
    )

    return notification
  } catch (error) {
    console.error('Error notifying redemption update:', error)
    throw error
  }
}