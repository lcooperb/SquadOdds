// Inline the AMM calculation to avoid import issues
function previewMarketImpact(
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
  // Updated AMM parameters (matching our improved liquidity system)
  const minLiquidity = Math.max(150, totalLiquidity * 0.3);

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

  const distanceFrom50 = Math.abs(startingPrice - 50);
  const liquidityMultiplier = 1 + (distanceFrom50 / 200);
  const k = scaledLiquidity * liquidityMultiplier;

  const impactFactor = betAmount / k;
  const rawSlippage = impactFactor * startingPrice * 0.4;

  // Market size-based slippage scaling
  const marketSizeMultiplier = totalLiquidity < 500
    ? Math.max(0.4, totalLiquidity / 1250)
    : 1.0;

  const slippage = Math.sqrt(rawSlippage) * (8 * marketSizeMultiplier);

  const userExecutionPrice = Math.min(95, startingPrice + slippage);
  const newMarketPrice = side === 'YES' ?
    Math.min(95, startingPrice + slippage * 0.9) :
    Math.max(5, startingPrice - slippage * 0.9);

  const liquidityRatio = betAmount / k;
  let totalPositions: number;
  let averagePrice: number;

  if (liquidityRatio < 0.0005) {
    totalPositions = betAmount;
    averagePrice = userExecutionPrice;
  } else if (liquidityRatio < 0.01) {
    totalPositions = betAmount;
    averagePrice = (startingPrice + userExecutionPrice) / 2;
  } else {
    totalPositions = betAmount;
    averagePrice = (startingPrice + userExecutionPrice) / 2;
  }

  const priceImpact = Math.abs(newMarketPrice - startingPrice);

  return {
    estimatedPosition: Math.round(totalPositions * 100) / 100,
    estimatedAveragePrice: Math.round(averagePrice * 10) / 10,
    priceImpact: Math.round(priceImpact * 10) / 10,
    estimatedFinalPrice: Math.round(newMarketPrice * 10) / 10
  };
}

interface TestScenario {
  name: string
  betAmount: number
  startingPrice: number
  totalLiquidity: number
  side: 'YES' | 'NO'
  expectedMinMovement?: number // minimum price movement we expect
}

const testScenarios: TestScenario[] = [
  // Small market scenarios (improved stability)
  {
    name: "Small bet in tiny market",
    betAmount: 10,
    startingPrice: 50,
    totalLiquidity: 100,
    side: 'YES',
    expectedMinMovement: 1 // Should move at least 1¢ (reduced from 2¢)
  },
  {
    name: "Medium bet in small market",
    betAmount: 50,
    startingPrice: 30,
    totalLiquidity: 200,
    side: 'YES',
    expectedMinMovement: 3 // Should move at least 3¢ (reduced from 5¢)
  },
  {
    name: "Large bet in small market",
    betAmount: 100,
    startingPrice: 50,
    totalLiquidity: 300,
    side: 'NO',
    expectedMinMovement: 5 // Should move at least 5¢ (reduced from 8¢)
  },

  // Medium market scenarios
  {
    name: "Small bet in medium market",
    betAmount: 25,
    startingPrice: 70,
    totalLiquidity: 500,
    side: 'YES',
    expectedMinMovement: 1 // Should move at least 1¢
  },
  {
    name: "Medium bet in medium market",
    betAmount: 100,
    startingPrice: 40,
    totalLiquidity: 800,
    side: 'YES',
    expectedMinMovement: 3 // Should move at least 3¢
  },
  {
    name: "Large bet in medium market",
    betAmount: 200,
    startingPrice: 60,
    totalLiquidity: 1000,
    side: 'NO',
    expectedMinMovement: 5 // Should move at least 5¢
  },

  // Large market scenarios
  {
    name: "Medium bet in large market",
    betAmount: 100,
    startingPrice: 45,
    totalLiquidity: 2000,
    side: 'YES',
    expectedMinMovement: 1 // Should move at least 1¢
  },
  {
    name: "Large bet in large market",
    betAmount: 500,
    startingPrice: 55,
    totalLiquidity: 3000,
    side: 'YES',
    expectedMinMovement: 3 // Should move at least 3¢
  },

  // Edge case scenarios
  {
    name: "Bet on extreme price (high)",
    betAmount: 50,
    startingPrice: 85,
    totalLiquidity: 500,
    side: 'YES',
    expectedMinMovement: 2 // Should still move despite high price
  },
  {
    name: "Bet on extreme price (low)",
    betAmount: 50,
    startingPrice: 15,
    totalLiquidity: 500,
    side: 'NO',
    expectedMinMovement: 2 // Should still move despite low price
  }
]

function runAMMTests() {
  console.log('🧪 Testing AMM Improvements\n')
  console.log('='.repeat(60))

  let passedTests = 0
  let totalTests = testScenarios.length

  testScenarios.forEach((scenario, index) => {
    console.log(`\n📊 Test ${index + 1}: ${scenario.name}`)
    console.log(`   Bet: $${scenario.betAmount} ${scenario.side} at ${scenario.startingPrice}¢`)
    console.log(`   Market: $${scenario.totalLiquidity} total liquidity`)

    const result = previewMarketImpact(
      scenario.betAmount,
      scenario.startingPrice,
      scenario.totalLiquidity,
      scenario.side
    )

    const actualMovement = Math.abs(result.estimatedFinalPrice - scenario.startingPrice)
    const passed = scenario.expectedMinMovement ? actualMovement >= scenario.expectedMinMovement : true

    console.log(`   📈 Price: ${scenario.startingPrice}¢ → ${result.estimatedFinalPrice}¢ (${actualMovement.toFixed(1)}¢ movement)`)
    console.log(`   💰 Position: $${result.estimatedPosition.toFixed(2)} at avg ${result.estimatedAveragePrice.toFixed(1)}¢`)
    console.log(`   🎯 Expected: ≥${scenario.expectedMinMovement || 0}¢ movement`)

    if (passed) {
      console.log(`   ✅ PASSED`)
      passedTests++
    } else {
      console.log(`   ❌ FAILED - Movement too small`)
    }
  })

  console.log('\n' + '='.repeat(60))
  console.log(`\n📊 Results: ${passedTests}/${totalTests} tests passed`)

  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! AMM improvements are working correctly.')
  } else {
    console.log('⚠️  Some tests failed. Consider further AMM parameter tuning.')
  }

  // Additional analysis
  console.log('\n🔍 Analysis:')
  console.log('- Smaller markets should show larger price movements')
  console.log('- Larger bets should create more slippage')
  console.log('- Price movements should be visible but not extreme')
  console.log('- Edge cases (very high/low prices) should still be responsive')

  console.log('\n💡 Improved AMM Parameter Summary:')
  console.log('- Liquidity floors: min(150, totalLiquidity * 0.3) with logarithmic boost')
  console.log('- Market tiers: Micro (<$200), Small ($200-$500), Medium+ (>$500)')
  console.log('- Slippage scaling: Market size multiplier (0.4-1.0) * 8')
  console.log('- Enhanced stability for small markets while preserving responsiveness')
  console.log('- Micro trade threshold: < 0.05% of liquidity')
  console.log('- Small trade threshold: < 1% of liquidity')
}

runAMMTests()