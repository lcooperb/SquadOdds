# SquadOdds - Changelog

**Keywords:** changes, updates, migrations, features, breaking-changes

All notable changes to the SquadOdds project are documented here.

---

## [2.1.0] - Parimutuel System Migration - November 2024

### 🔄 BREAKING CHANGE: AMM → Parimutuel Betting System

**Complete conversion from Automated Market Maker (AMM) to pure parimutuel pool-based betting.**

#### What Changed
- ❌ **REMOVED:** AMM pricing with slippage and liquidity scaling
  - No more complex market impact formulas
  - No share-based position tracking
  - Removed AMM-style execution prices

- ✅ **ADDED:** Parimutuel pool-based system
  - Odds determined by pool ratios (YES pool / total pool)
  - Winners split losers' pool proportionally
  - Simple, transparent payout calculations
  - Money in = money out (no platform profit)

#### Key Changes
- **`src/lib/marketImpact.ts`:** Rewritten for pool-based calculations
  - Added `calculatePoolsFromPrice()` helper
  - Updated `calculateMarketImpact()` to use pool ratios
  - Updated `previewMarketImpact()` with parimutuel payout estimates

- **`src/lib/positions.ts`:** Updated payout calculations
  - Changed from share-based to pool-based payouts
  - Updated `calculateUserPosition()` for parimutuel math

- **UI Updates:** Changed terminology throughout
  - "¢" (cents) → "%" (percentages)
  - "shares" → "bets"
  - "price impact" → "odds shift"
  - "To win" → "Est. payout"

#### Migration Impact
- **Database:** `bet.shares` field now stores bet amounts (position values in parimutuel)
- **Pricing:** All markets now use pool ratio pricing instead of AMM formulas
- **Payouts:** Winners receive proportional share of losing pool instead of share-based payouts

---

## [2.0.0] - Major System Overhaul - September 2024

### 🔄 BREAKING CHANGE: Wallet → Credit System Migration

**Complete removal of wallet balance management in favor of credit-based betting.**

#### What Changed
- ❌ **REMOVED:** Virtual wallet balance system
  - No more balance top-ups or withdrawals
  - No payment/redemption processing in-app
  - Removed Payment and Redemption models from admin panel
  - Removed virtualBalance display from UI

- ✅ **ADDED:** Credit-based betting system
  - $300 maximum per individual bet
  - No wallet balance checks required
  - Users bet on credit with payment obligations on resolution
  - Portfolio = sum of ACTIVE bets on ACTIVE markets (no stored balance)

#### Migration Impact
- **Database:** `User.virtualBalance` field still exists but is NOT used in calculations
- **API Routes:** All balance checks and updates removed from betting flow
- **Admin Panel:** Payments and Redemptions tabs completely removed
- **UI:** All balance displays replaced with portfolio displays

#### Code Changes
```typescript
// OLD (removed):
if (user.virtualBalance < betAmount) {
  return error('Insufficient balance');
}
await updateUserBalance(-betAmount);

// NEW (current):
if (betAmount > 300) {
  return error('Maximum bet is $300');
}
// No balance operations - just create bet on credit
```

---

## [1.8.0] - Payment Tracking System - September 2024

### Added: Payment Obligations on Market Resolution

**Markets now calculate and display who owes who when resolved.**

#### Features Added
- **Payment Calculation Logic** (`src/app/api/events/[id]/resolve/route.ts`)
  - Proportional distribution: Each loser's bet distributed to winners based on their winning bet sizes
  - Returns payment matrix in resolution response

- **Enhanced Notifications** (`src/lib/notifications.ts`)
  - Winners notified with list of who owes them and amounts
  - Losers notified with list of who they need to pay
  - Example: "You won $50. You'll receive $75 from: Bob ($50), Alice ($25)"

- **Payment Breakdown UI** (`src/app/market/[id]/page.tsx`)
  - New section on resolved market pages showing full payment matrix
  - Displays "Alice owes Bob: $50.00" for each payment obligation
  - Note clarifying payments are settled privately

#### Example Payment Calculation
```typescript
// If Alice bet $100 YES and Bob bet $50 YES (winners)
// Charlie bet $60 NO (loser)
// Charlie's $60 distributed: Alice gets $40, Bob gets $20
const winnerShare = winningBet.amount / totalWinningAmount;
const payment = losingBet.amount * winnerShare;
```

---

## [1.7.0] - Market Cancellation Updates - September 2024

### Changed: Cancellation Terminology (Refund → Void)

**Updated all "refund" language to "void" to reflect credit system.**

#### Changes
- **API Response Fields** (`src/app/api/events/[id]/cancel/route.ts`)
  - `refundedBets` → `voidedBets`
  - `totalRefunded` → `totalVoided`

- **Admin Panel UI** (`src/app/admin/page.tsx`)
  - Button text: "Cancel & Refund Market" → "Cancel Market"
  - Alert message updated to use "voided" language
  - Modal warning: "Bets will be voided and removed from portfolios"

- **Behavior:** No change - bets still removed from portfolios, no payments made

---

## [1.6.0] - Admin Panel Cleanup - September 2024

### Removed: Payment/Redemption Management

**Complete removal of old cash balance functionality from admin panel.**

#### Removed
- Payment and Redemption TypeScript interfaces
- All payment/redemption state variables and functions:
  - `fetchPayments()`, `processPayment()`
  - `handlePaymentAction()`, `handleRedemptionAction()`
  - `getPaymentMethodColor()`
- "Payments" and "Redemptions" tabs from navigation
- Entire Payments tab content (~240 lines)
- Entire Redemptions tab content (~100 lines)
- virtualBalance display from Users list

#### Admin Panel Now Shows
- **Events Tab:** Active/closed markets with resolve/cancel actions
- **Users Tab:** User list with bet count, markets created, join date

---

## [1.5.0] - Enhanced Trading Experience - August 2024

### Added: Responsive Betting Interface

- **Large YES/NO buttons** with side-by-side layout (desktop)
- **Smart auto-selection** of highest probability option on page load
- **Mobile-first modal betting** with touch-friendly buttons
- **Enhanced position display** showing actual share counts vs. spending amounts
- **Improved color system** with muted backgrounds for better hierarchy
- **Smooth modal animations** (slide-up and fade-in)

---

## [1.4.0] - AMM Improvements - August 2024 (Legacy - Before Parimutuel Migration)

### Enhanced: Market Impact System

**More realistic pricing with improved slippage and liquidity.**

#### Changes to `src/lib/marketImpact.ts`
- **Adaptive liquidity system** with floors for small markets
- **Progressive scaling** based on market size (micro/small/medium)
- **Reduced slippage** for small markets to prevent extreme volatility
- **Market size multiplier** caps slippage for tiny markets (0.4-1.0 range)
- **Multi-slice execution** for large trades (splits across price levels)

#### Example
```typescript
// Micro markets (<$200 volume): Significant liquidity boost
scaledLiquidity = minLiquidity + Math.log(totalVolume + 1) * 60;

// Market size multiplier prevents extreme price swings
const marketSizeMultiplier = totalVolume < 500
  ? Math.max(0.4, totalVolume / 1250)
  : 1.0;
```

---

## [1.3.0] - Position Calculation Fixes - July 2024

### Fixed: User Position Calculations

**Corrected position calculations to properly filter by user ID.**

- **Bug:** Position calculations were not filtering by user ID, showing incorrect totals
- **Fix:** Added `bet.user.id !== userId` check in `src/lib/positions.ts`
- **Impact:** Portfolio values, position displays, and sell limits now accurate

---

## [1.2.0] - Multiple Choice Markets - July 2024

### Added: Multiple Choice Market Support

- **New market type:** MULTIPLE (in addition to BINARY)
- **MarketOption model:** Stores individual options with prices
- **Option price normalization:** All option prices sum to 100%
- **Option-specific betting:** Users bet YES on specific options
- **Synchronized price history:** All options get price points at same timestamp

---

## [1.1.0] - Buy/Sell Functionality - June 2024

### Added: Sell Position Feature

- **SELL bet type:** Users can sell positions back to market
- **Position validation:** Can't sell more than owned position
- **Negative shares:** SELL operations store negative position values
- **Price impact:** Selling moves price in opposite direction

#### Changes
- **Bet.shares field:** Now stores position values (can be negative for SELL)
- **Portfolio calculation:** Sums all shares (positive and negative) per side
- **Volume updates:** SELL decreases market volume, BUY increases

---

## [1.0.0] - Initial Release - May 2024

### Core Features
- Binary prediction markets (YES/NO)
- User authentication with NextAuth.js
- Virtual balance system ($100 starting balance)
- Basic AMM for price discovery (replaced by parimutuel system in v2.1.0)
- Market creation and resolution
- Leaderboard and user profiles
- Comments and activity feed
- Admin panel for market management

---

## Migration Notes

### Wallet → Credit System (v2.0.0)

**For developers:**

1. **Portfolio Display:**
   ```typescript
   // Calculate portfolio (not from virtualBalance)
   const activeBets = bets.filter(b =>
     b.status === 'ACTIVE' && b.event.status === 'ACTIVE'
   );
   const portfolio = activeBets.reduce((sum, b) => sum + b.amount, 0);
   ```

2. **Bet Placement:**
   ```typescript
   // Check individual bet limit (not balance)
   if (amount > 300) {
     return error('Maximum bet is $300');
   }
   // No balance deduction needed
   ```

3. **Admin Panel:**
   - Remove any references to `payments` or `redemptions` state
   - Use only Events and Users tabs
   - No balance management needed

### Payment Obligations (v1.8.0)

**For displaying payments:**

```typescript
// Get payments from resolution response
const { payments } = await resolveMarket(eventId, outcome);

// Display in UI
payments.forEach(p => {
  console.log(`${p.from.name} owes ${p.to.name}: $${p.amount}`);
});
```

---

## Deprecated Features

### Removed in v2.0.0
- ❌ Virtual balance system
- ❌ Payment processing (in-app)
- ❌ Redemption requests
- ❌ Balance top-ups
- ❌ Admin payment approval workflow

### Still Available
- ✅ Credit-based betting ($300/bet limit)
- ✅ Payment obligation calculations
- ✅ Portfolio tracking
- ✅ All market and betting features

---

**Note:** This changelog focuses on major system changes. For detailed commit history, see the git log.
