interface Bet {
  id: string
  side: string | null
  optionId: string | null
  amount: number
  price: number
  shares: number
  createdAt: string
  user: {
    id: string
    displayName: string
    username: string
  }
  option?: {
    id: string
    title: string
  } | null
}

interface UserPosition {
  side: 'YES' | 'NO'
  shares: number
  averagePrice: number
}

export function calculateUserPosition(
  bets: Bet[],
  userId: string,
  optionId?: string
): UserPosition | null {
  // Filter bets for this user and option/event
  const userBets = bets.filter(bet => {
    // First filter by user ID - this was missing!
    if (bet.user.id !== userId) return false;

    if (optionId) {
      return bet.optionId === optionId
    } else {
      return bet.optionId === null // Binary market
    }
  })

  if (userBets.length === 0) {
    return null
  }

  // Group by side and calculate totals
  const yesBets = userBets.filter(bet => bet.side === 'YES')
  const noBets = userBets.filter(bet => bet.side === 'NO')

  const yesShares = yesBets.reduce((sum, bet) => sum + bet.shares, 0)
  const noShares = noBets.reduce((sum, bet) => sum + bet.shares, 0)

  const yesAmount = yesBets.reduce((sum, bet) => sum + bet.amount, 0)
  const noAmount = noBets.reduce((sum, bet) => sum + bet.amount, 0)

  // Net position
  const netYesShares = yesShares - noShares
  const netNoShares = noShares - yesShares

  if (netYesShares > 0) {
    return {
      side: 'YES',
      shares: netYesShares,
      averagePrice: yesAmount / yesShares
    }
  } else if (netNoShares > 0) {
    return {
      side: 'NO',
      shares: netNoShares,
      averagePrice: noAmount / noShares
    }
  }

  return null
}