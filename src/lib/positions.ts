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
  // With negative shares for SELL operations, we can just sum all shares for each side
  const yesBets = userBets.filter(bet => bet.side === 'YES')
  const noBets = userBets.filter(bet => bet.side === 'NO')

  // Sum all shares (including negative ones from sells)
  const yesShares = yesBets.reduce((sum, bet) => sum + Number(bet.shares), 0)
  const noShares = noBets.reduce((sum, bet) => sum + Number(bet.shares), 0)

  // For average price calculation, only count positive purchases
  const yesPurchases = yesBets.filter(bet => Number(bet.shares) > 0)
  const noPurchases = noBets.filter(bet => Number(bet.shares) > 0)

  const yesAmount = yesPurchases.reduce((sum, bet) => sum + Number(bet.amount), 0)
  const noAmount = noPurchases.reduce((sum, bet) => sum + Number(bet.amount), 0)

  const yesSharesForAvg = yesPurchases.reduce((sum, bet) => sum + Number(bet.shares), 0)
  const noSharesForAvg = noPurchases.reduce((sum, bet) => sum + Number(bet.shares), 0)

  // Return position for whichever side has positive net shares
  if (yesShares > 0) {
    return {
      side: 'YES',
      shares: yesShares,
      averagePrice: yesSharesForAvg > 0 ? yesAmount / yesSharesForAvg * 100 : 0
    }
  } else if (noShares > 0) {
    return {
      side: 'NO',
      shares: noShares,
      averagePrice: noSharesForAvg > 0 ? noAmount / noSharesForAvg * 100 : 0
    }
  }

  return null
}

// Get all positions for a user (both YES and NO positions separately)
export function getAllUserPositions(
  bets: Bet[],
  userId: string,
  optionId?: string
): UserPosition[] {
  // Filter bets for this user and option/event
  const userBets = bets.filter(bet => {
    if (bet.user.id !== userId) return false;
    if (optionId) {
      return bet.optionId === optionId
    } else {
      return bet.optionId === null // Binary market
    }
  })

  if (userBets.length === 0) {
    return []
  }

  // Group by side and calculate totals
  const yesBets = userBets.filter(bet => bet.side === 'YES')
  const noBets = userBets.filter(bet => bet.side === 'NO')

  // Sum all shares (including negative ones from sells)
  const yesShares = yesBets.reduce((sum, bet) => sum + Number(bet.shares), 0)
  const noShares = noBets.reduce((sum, bet) => sum + Number(bet.shares), 0)

  // For average price calculation, only count positive purchases
  const yesPurchases = yesBets.filter(bet => Number(bet.shares) > 0)
  const noPurchases = noBets.filter(bet => Number(bet.shares) > 0)

  const yesAmount = yesPurchases.reduce((sum, bet) => sum + Number(bet.amount), 0)
  const noAmount = noPurchases.reduce((sum, bet) => sum + Number(bet.amount), 0)

  const yesSharesForAvg = yesPurchases.reduce((sum, bet) => sum + Number(bet.shares), 0)
  const noSharesForAvg = noPurchases.reduce((sum, bet) => sum + Number(bet.shares), 0)

  const positions: UserPosition[] = []

  // Add YES position if user has positive shares
  if (yesShares > 0) {
    positions.push({
      side: 'YES',
      shares: yesShares,
      averagePrice: yesSharesForAvg > 0 ? yesAmount / yesSharesForAvg * 100 : 0
    })
  }

  // Add NO position if user has positive shares
  if (noShares > 0) {
    positions.push({
      side: 'NO',
      shares: noShares,
      averagePrice: noSharesForAvg > 0 ? noAmount / noSharesForAvg * 100 : 0
    })
  }

  return positions
}