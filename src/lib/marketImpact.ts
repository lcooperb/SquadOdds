/**
 * Market Impact System for SquadOdds
 *
 * Implements weighted share allocation for large bets to simulate
 * realistic market depth and price impact.
 */

interface BetSlice {
  amount: number;
  price: number;
  shares: number;
}

interface MarketImpactResult {
  totalShares: number;
  averagePrice: number;
  priceSlices: BetSlice[];
  finalPrice: number;
}

/**
 * Calculate market impact for a bet, splitting large orders across price levels
 */
export function calculateMarketImpact(
  betAmount: number,
  startingPrice: number,
  totalLiquidity: number,
  side: 'YES' | 'NO'
): MarketImpactResult {
  // Base liquidity multiplier - determines how much volume moves price
  const liquidityMultiplier = Math.max(50, totalLiquidity * 0.5); // Minimum 50 for small markets

  // Impact threshold - orders larger than this percentage of liquidity get sliced
  const impactThreshold = liquidityMultiplier * 0.1; // 10% of effective liquidity

  // If bet is small relative to liquidity, execute at single price
  if (betAmount <= impactThreshold) {
    const shares = (betAmount / startingPrice) * 100;
    return {
      totalShares: shares,
      averagePrice: startingPrice,
      priceSlices: [{
        amount: betAmount,
        price: startingPrice,
        shares: shares
      }],
      finalPrice: startingPrice
    };
  }

  // Large bet - split across multiple price levels
  const priceSlices: BetSlice[] = [];
  let remainingAmount = betAmount;
  let currentPrice = startingPrice;
  let totalShares = 0;
  let totalCost = 0;

  // Calculate how many slices we need (more slices for larger impact)
  const impactRatio = betAmount / liquidityMultiplier;
  const numSlices = Math.min(10, Math.max(3, Math.ceil(impactRatio * 5)));

  // Price movement per slice (asymptotic - gets harder to move price)
  const maxPriceMove = Math.min(20, impactRatio * 15); // Cap at 20% price move

  for (let i = 0; i < numSlices && remainingAmount > 0; i++) {
    // Amount for this slice (decreasing sizes as price moves)
    const sliceAmount = Math.min(
      remainingAmount,
      betAmount / numSlices * (1.5 - (i / numSlices)) // Front-load the slices
    );

    // Calculate price for this slice
    if (side === 'YES') {
      // Buying YES pushes price up
      const priceIncrease = (maxPriceMove / numSlices) * Math.pow(1.2, i);
      currentPrice = Math.min(95, startingPrice + priceIncrease);
    } else {
      // Buying NO pushes NO price up (YES price down)
      const priceDecrease = (maxPriceMove / numSlices) * Math.pow(1.2, i);
      currentPrice = Math.max(5, startingPrice - priceDecrease);
    }

    // Calculate shares for this slice
    const sliceShares = (sliceAmount / currentPrice) * 100;

    priceSlices.push({
      amount: sliceAmount,
      price: currentPrice,
      shares: sliceShares
    });

    totalShares += sliceShares;
    totalCost += sliceAmount;
    remainingAmount -= sliceAmount;
  }

  // Calculate weighted average price
  const averagePrice = totalCost / (totalShares / 100);

  // Final price after all slices (for market update)
  const finalPrice = currentPrice;

  return {
    totalShares,
    averagePrice,
    priceSlices,
    finalPrice
  };
}

/**
 * Calculate the new market price after a bet with market impact
 */
export function calculateNewMarketPrice(
  currentPrice: number,
  totalVolumeBeforeBet: number,
  betAmount: number,
  side: 'YES' | 'NO',
  marketImpactResult: MarketImpactResult
): number {
  // Use the final price from market impact calculation
  let newPrice = marketImpactResult.finalPrice;

  // Apply additional volume-based price movement
  const volumeImpact = betAmount / Math.max(100, totalVolumeBeforeBet);
  const volumePriceMove = volumeImpact * 5; // 5% move per 100% volume increase

  if (side === 'YES') {
    newPrice = Math.min(95, newPrice + volumePriceMove);
  } else {
    newPrice = Math.max(5, newPrice - volumePriceMove);
  }

  return Math.round(newPrice * 10) / 10; // Round to 1 decimal
}

/**
 * Preview market impact for UI display
 */
export function previewMarketImpact(
  betAmount: number,
  startingPrice: number,
  totalLiquidity: number,
  side: 'YES' | 'NO'
): {
  estimatedShares: number;
  estimatedAveragePrice: number;
  priceImpact: number;
  estimatedFinalPrice: number;
} {
  const result = calculateMarketImpact(betAmount, startingPrice, totalLiquidity, side);

  const priceImpact = Math.abs(result.finalPrice - startingPrice);

  return {
    estimatedShares: Math.round(result.totalShares * 100) / 100,
    estimatedAveragePrice: Math.round(result.averagePrice * 10) / 10,
    priceImpact: Math.round(priceImpact * 10) / 10,
    estimatedFinalPrice: Math.round(result.finalPrice * 10) / 10
  };
}