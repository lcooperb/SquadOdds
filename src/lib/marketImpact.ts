/**
 * Market Impact System for SquadOdds - PARIMUTUEL MODEL
 *
 * Pure parimutuel betting where prices reflect pool ratios
 * and payouts come from splitting the losing pool among winners.
 */

interface BetSlice {
  amount: number;
  price: number;
  positionSize: number;
}

/**
 * Calculate pool sizes from total volume and current price
 * In parimutuel: price = YES pool / total pool
 */
export function calculatePoolsFromPrice(
  totalVolume: number,
  yesPrice: number // 0-100
): { yesPool: number; noPool: number } {
  if (totalVolume === 0) {
    return { yesPool: 0, noPool: 0 };
  }

  // YES price (0-100) = (YES pool / total pool) * 100
  // Therefore: YES pool = (YES price / 100) * total volume
  const yesPool = (yesPrice / 100) * totalVolume;
  const noPool = totalVolume - yesPool;

  return {
    yesPool: Math.max(0, yesPool),
    noPool: Math.max(0, noPool)
  };
}

interface MarketImpactResult {
  totalPositions: number;
  averagePrice: number;
  priceSlices: BetSlice[];
  finalPrice: number;
}

/**
 * Calculate market impact for a bet using parimutuel pool logic
 *
 * In parimutuel:
 * - Price = pool ratio (YES pool / total pool)
 * - Position = your bet amount
 * - Payout = your proportion of the losing pool
 */
export function calculateMarketImpact(
  betAmount: number,
  startingPrice: number,
  yesPool: number,
  noPool: number,
  side: 'YES' | 'NO'
): MarketImpactResult {
  // Calculate new pool sizes after the bet
  const newYesPool = side === 'YES' ? yesPool + betAmount : yesPool;
  const newNoPool = side === 'NO' ? noPool + betAmount : noPool;
  const newTotalPool = newYesPool + newNoPool;

  // New market price based on pool ratio
  const finalPrice = newTotalPool > 0
    ? Math.round((newYesPool / newTotalPool) * 100)
    : startingPrice;

  // In parimutuel, your "position" is simply your bet amount
  // Average price is just the entry price (no slippage in parimutuel)
  const positionSize = betAmount;
  const averagePrice = startingPrice;

  return {
    totalPositions: positionSize,
    averagePrice: averagePrice,
    priceSlices: [{
      amount: betAmount,
      price: startingPrice,
      positionSize: positionSize
    }],
    finalPrice: finalPrice
  };
}

/**
 * Calculate the new market price after a bet with market impact
 */
export function calculateNewMarketPrice(
  currentPrice: number,
  yesPool: number,
  noPool: number,
  betAmount: number,
  side: 'YES' | 'NO',
  marketImpactResult: MarketImpactResult
): number {
  // Use the final price from market impact calculation directly
  return Math.round(marketImpactResult.finalPrice * 10) / 10; // Round to 1 decimal
}

/**
 * Preview market impact for UI display - PARIMUTUEL VERSION
 *
 * Shows estimated payout based on current pool ratios
 */
export function previewMarketImpact(
  betAmount: number,
  startingPrice: number,
  yesPool: number,
  noPool: number,
  side: 'YES' | 'NO'
): {
  estimatedPosition: number;
  estimatedAveragePrice: number;
  priceImpact: number;
  estimatedFinalPrice: number;
  estimatedPayout: number; // What you'd get if you win
} {
  const result = calculateMarketImpact(betAmount, startingPrice, yesPool, noPool, side);

  const priceImpact = Math.abs(result.finalPrice - startingPrice);

  // Calculate parimutuel payout estimate
  // Your bet + your share of the losing pool
  const newYesPool = side === 'YES' ? yesPool + betAmount : yesPool;
  const newNoPool = side === 'NO' ? noPool + betAmount : noPool;

  const winningPool = side === 'YES' ? newYesPool : newNoPool;
  const losingPool = side === 'YES' ? newNoPool : newYesPool;

  // Your share of the winning pool
  const yourShare = winningPool > 0 ? betAmount / winningPool : 0;

  // Your profit from the losing pool
  const profitFromLosers = yourShare * losingPool;

  // Total payout = original bet + profit
  const estimatedPayout = betAmount + profitFromLosers;

  return {
    estimatedPosition: Math.round(result.totalPositions * 100) / 100,
    estimatedAveragePrice: Math.round(result.averagePrice * 10) / 10,
    priceImpact: Math.round(priceImpact * 10) / 10,
    estimatedFinalPrice: Math.round(result.finalPrice * 10) / 10,
    estimatedPayout: Math.round(estimatedPayout * 100) / 100
  };
}