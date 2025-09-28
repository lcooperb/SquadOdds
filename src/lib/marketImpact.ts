/**
 * Market Impact System for SquadOdds
 *
 * Implements weighted share allocation for large bets to simulate
 * realistic market depth and price impact.
 */

interface BetSlice {
  amount: number;
  price: number;
  positionSize: number;
}

interface MarketImpactResult {
  totalPositions: number;
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
  // Improved AMM formula for realistic price discovery
  // Price impact based on bet size relative to market depth

  // Adaptive liquidity system with floors for small markets
  // Small markets get enhanced virtual liquidity to reduce extreme volatility
  const minLiquidity = Math.max(150, totalLiquidity * 0.3); // Higher floor, lower base multiplier

  // Progressive scaling based on market size
  let scaledLiquidity: number;
  if (totalLiquidity <= 200) {
    // Micro markets: Significant liquidity boost with logarithmic scaling
    scaledLiquidity = minLiquidity + Math.log(totalLiquidity + 1) * 60;
  } else if (totalLiquidity <= 500) {
    // Small markets: Moderate boost to prevent extreme swings
    scaledLiquidity = minLiquidity + Math.log(totalLiquidity + 1) * 40;
  } else {
    // Medium+ markets: Normal scaling
    scaledLiquidity = totalLiquidity * 0.8;
  }

  // Adjust liquidity based on how far from 50% the price is (less liquid near extremes for bigger moves)
  const distanceFrom50 = Math.abs(startingPrice - 50);
  const liquidityMultiplier = 1 + (distanceFrom50 / 200); // Reduced from 100 to 200 for less dampening
  const k = scaledLiquidity * liquidityMultiplier;

  // Simplified prediction market AMM formula
  // Price impact based on bet size relative to market depth
  const impactFactor = betAmount / k;

  // Calculate slippage with market size-based scaling
  const rawSlippage = impactFactor * startingPrice * 0.4; // Base slippage factor

  // Market size multiplier: reduce slippage impact for smaller markets
  const marketSizeMultiplier = totalLiquidity < 500
    ? Math.max(0.4, totalLiquidity / 1250)  // Caps slippage for tiny markets (0.4-1.0 range)
    : 1.0; // Normal slippage for larger markets

  const slippage = Math.sqrt(rawSlippage) * (8 * marketSizeMultiplier); // Reduced from 12, scaled by market size

  // Calculate the user's execution price (what they actually pay)
  // Buying always makes it more expensive for the user due to slippage
  const userExecutionPrice = Math.min(95, startingPrice + slippage);

  // Calculate new market price after the trade
  const newMarketPrice = side === 'YES' ?
    Math.min(95, startingPrice + slippage * 0.9) : // Increased from 0.7 to 0.9 for more market movement
    Math.max(5, startingPrice - slippage * 0.9);   // NO market price decrease (YES increases)

  const maxPriceMove = Math.abs(newMarketPrice - startingPrice);
  const finalPrice = newMarketPrice;

  // Calculate liquidity impact ratio (bet size relative to total market liquidity)
  const liquidityRatio = betAmount / k;

  // For micro trades (< 0.05% of total liquidity), execute at user execution price
  if (liquidityRatio < 0.0005) { // Reduced from 0.001 to 0.0005 so more trades get slippage
    const positionSize = betAmount;
    return {
      totalPositions: positionSize,
      averagePrice: userExecutionPrice, // What the user actually pays
      priceSlices: [{
        amount: betAmount,
        price: userExecutionPrice,
        positionSize: positionSize
      }],
      finalPrice: finalPrice
    };
  }

  // For small trades (< 1% of total liquidity), single execution with start→user averaging
  if (liquidityRatio < 0.01) { // Reduced from 0.02 to 0.01 for more multi-slice execution
    const avgPrice = (startingPrice + userExecutionPrice) / 2;
    const positionSize = betAmount; // Position size = bet amount in AMM

    return {
      totalPositions: positionSize,
      averagePrice: avgPrice,
      priceSlices: [{
        amount: betAmount,
        price: avgPrice,
        positionSize: positionSize
      }],
      finalPrice: finalPrice
    };
  }

  // For large trades (≥ 2% of total liquidity), split execution across price levels
  // Scale slices based on liquidity impact: more slices for bigger relative impact
  const numSlices = Math.min(5, Math.max(2, Math.ceil(liquidityRatio * 50)));
  const priceSlices: BetSlice[] = [];
  let remainingAmount = betAmount;
  let currentPrice = startingPrice;
  let totalPositionSize = 0;
  let totalCost = 0;

  for (let i = 0; i < numSlices && remainingAmount > 0; i++) {
    const sliceAmount = Math.min(remainingAmount, betAmount / numSlices);
    const progress = i / (numSlices - 1);

    // Progressive price movement for user's execution price (always gets more expensive)
    const sliceSlippage = slippage * Math.pow(progress, 1.3);
    currentPrice = Math.min(95, startingPrice + sliceSlippage);

    const slicePositionSize = sliceAmount; // 1:1 in AMM model

    priceSlices.push({
      amount: sliceAmount,
      price: currentPrice,
      positionSize: slicePositionSize
    });

    totalPositionSize += slicePositionSize;
    totalCost += sliceAmount;
    remainingAmount -= sliceAmount;
  }

  // Calculate weighted average price based on actual execution prices
  const totalWeightedPrice = priceSlices.reduce((sum, slice) => sum + (slice.price * slice.positionSize), 0);
  const averagePrice = totalPositionSize > 0 ? totalWeightedPrice / totalPositionSize : 0;

  return {
    totalPositions: totalPositionSize,
    averagePrice: averagePrice,
    priceSlices,
    finalPrice: finalPrice
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
  // Use the final price from market impact calculation directly
  // No additional price movement - the market impact calculation handles everything
  return Math.round(marketImpactResult.finalPrice * 10) / 10; // Round to 1 decimal
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
  estimatedPosition: number;
  estimatedAveragePrice: number;
  priceImpact: number;
  estimatedFinalPrice: number;
} {
  const result = calculateMarketImpact(betAmount, startingPrice, totalLiquidity, side);

  const priceImpact = Math.abs(result.finalPrice - startingPrice);

  return {
    estimatedPosition: Math.round(result.totalPositions * 100) / 100, // Position value in AMM
    estimatedAveragePrice: Math.round(result.averagePrice * 10) / 10,
    priceImpact: Math.round(priceImpact * 10) / 10,
    estimatedFinalPrice: Math.round(result.finalPrice * 10) / 10
  };
}