interface Bet {
  id: string
  side: string | null
  optionId: string | null
  amount: number
  price: number
  shares: number // Database field: stores bet amounts in parimutuel model
  createdAt: string
  user: {
    id: string
    name: string
  }
  option?: {
    id: string
    title: string
  } | null
}

interface UserPosition {
  side: 'YES' | 'NO'
  positionValue: number
  averagePrice: number
  potentialPayout: number
}

export function calculateUserPosition(
  bets: Bet[],
  userId: string,
  optionId?: string
): UserPosition | null {
  // Filter bets for this user and option/event
  const userBets = bets.filter(bet => {
    // First filter by user ID
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

  // Calculate total pools from ALL bets (for parimutuel payout estimate)
  const allRelevantBets = bets.filter(bet => {
    if (optionId) {
      return bet.optionId === optionId
    } else {
      return bet.optionId === null
    }
  })

  const totalYesPool = allRelevantBets
    .filter(bet => bet.side === 'YES' && Number(bet.shares) > 0)
    .reduce((sum, bet) => sum + Number(bet.amount), 0)

  const totalNoPool = allRelevantBets
    .filter(bet => bet.side === 'NO' && Number(bet.shares) > 0)
    .reduce((sum, bet) => sum + Number(bet.amount), 0)

  // Group user's bets by side and calculate totals
  const yesBets = userBets.filter(bet => bet.side === 'YES')
  const noBets = userBets.filter(bet => bet.side === 'NO')

  // Sum all position values (including negative ones from sells)
  // Note: bet.shares field stores position values (bet amounts in parimutuel)
  const yesPositionValue = yesBets.reduce((sum, bet) => sum + Number(bet.shares), 0)
  const noPositionValue = noBets.reduce((sum, bet) => sum + Number(bet.shares), 0)

  // For average price calculation, only count positive purchases
  const yesPurchases = yesBets.filter(bet => Number(bet.shares) > 0)
  const noPurchases = noBets.filter(bet => Number(bet.shares) > 0)

  const yesAmount = yesPurchases.reduce((sum, bet) => sum + Number(bet.amount), 0)
  const noAmount = noPurchases.reduce((sum, bet) => sum + Number(bet.amount), 0)

  const yesPositionForAvg = yesPurchases.reduce((sum, bet) => sum + Number(bet.shares), 0)
  const noPositionForAvg = noPurchases.reduce((sum, bet) => sum + Number(bet.shares), 0)

  // Return position for whichever side has positive net position value
  if (yesPositionValue > 0) {
    const avgPrice = yesPositionForAvg > 0 ? (yesAmount / yesPositionForAvg) * 100 : 0

    // PARIMUTUEL PAYOUT CALCULATION
    // User's share of winning pool × losing pool = profit
    // Total payout = original bet + profit
    const userShare = totalYesPool > 0 ? yesPositionValue / totalYesPool : 0
    const profitFromLosers = userShare * totalNoPool
    const potentialPayout = yesPositionValue + profitFromLosers

    return {
      side: 'YES',
      positionValue: yesPositionValue,
      averagePrice: avgPrice,
      potentialPayout: potentialPayout
    }
  } else if (noPositionValue > 0) {
    const avgPrice = noPositionForAvg > 0 ? (noAmount / noPositionForAvg) * 100 : 0

    // PARIMUTUEL PAYOUT CALCULATION
    const userShare = totalNoPool > 0 ? noPositionValue / totalNoPool : 0
    const profitFromLosers = userShare * totalYesPool
    const potentialPayout = noPositionValue + profitFromLosers

    return {
      side: 'NO',
      positionValue: noPositionValue,
      averagePrice: avgPrice,
      potentialPayout: potentialPayout
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

  // Calculate total pools from ALL bets (for parimutuel payout estimate)
  const allRelevantBets = bets.filter(bet => {
    if (optionId) {
      return bet.optionId === optionId
    } else {
      return bet.optionId === null
    }
  })

  const totalYesPool = allRelevantBets
    .filter(bet => bet.side === 'YES' && Number(bet.shares) > 0)
    .reduce((sum, bet) => sum + Number(bet.amount), 0)

  const totalNoPool = allRelevantBets
    .filter(bet => bet.side === 'NO' && Number(bet.shares) > 0)
    .reduce((sum, bet) => sum + Number(bet.amount), 0)

  // Group user's bets by side and calculate totals
  const yesBets = userBets.filter(bet => bet.side === 'YES')
  const noBets = userBets.filter(bet => bet.side === 'NO')

  // Sum all position values (including negative ones from sells)
  // Note: bet.shares field stores position values (bet amounts in parimutuel)
  const yesPositionValue = yesBets.reduce((sum, bet) => sum + Number(bet.shares), 0)
  const noPositionValue = noBets.reduce((sum, bet) => sum + Number(bet.shares), 0)

  // For average price calculation, only count positive purchases
  const yesPurchases = yesBets.filter(bet => Number(bet.shares) > 0)
  const noPurchases = noBets.filter(bet => Number(bet.shares) > 0)

  const yesAmount = yesPurchases.reduce((sum, bet) => sum + Number(bet.amount), 0)
  const noAmount = noPurchases.reduce((sum, bet) => sum + Number(bet.amount), 0)

  const yesPositionForAvg = yesPurchases.reduce((sum, bet) => sum + Number(bet.shares), 0)
  const noPositionForAvg = noPurchases.reduce((sum, bet) => sum + Number(bet.shares), 0)

  const positions: UserPosition[] = []

  // Add YES position if user has positive position value
  if (yesPositionValue > 0) {
    const avgPrice = yesPositionForAvg > 0 ? (yesAmount / yesPositionForAvg) * 100 : 0

    // PARIMUTUEL PAYOUT CALCULATION
    const userShare = totalYesPool > 0 ? yesPositionValue / totalYesPool : 0
    const profitFromLosers = userShare * totalNoPool
    const potentialPayout = yesPositionValue + profitFromLosers

    positions.push({
      side: 'YES',
      positionValue: yesPositionValue,
      averagePrice: avgPrice,
      potentialPayout: potentialPayout
    })
  }

  // Add NO position if user has positive position value
  if (noPositionValue > 0) {
    const avgPrice = noPositionForAvg > 0 ? (noAmount / noPositionForAvg) * 100 : 0

    // PARIMUTUEL PAYOUT CALCULATION
    const userShare = totalNoPool > 0 ? noPositionValue / totalNoPool : 0
    const profitFromLosers = userShare * totalYesPool
    const potentialPayout = noPositionValue + profitFromLosers

    positions.push({
      side: 'NO',
      positionValue: noPositionValue,
      averagePrice: avgPrice,
      potentialPayout: potentialPayout
    })
  }

  return positions
}