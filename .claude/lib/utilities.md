# SquadOdds - Library Utilities Documentation

**Keywords:** utilities, lib, helpers, functions, calculations, parimutuel, positions

Complete documentation of all utility functions and libraries in `src/lib/`.

---

## 📊 Parimutuel Betting System (`src/lib/marketImpact.ts`)

**Purpose:** Pool-based betting system where all bets go into pools and winners split the losers' pool proportionally.

### Key Concepts

**Pool-Based Pricing:** Price is determined by pool ratios
- All bets go into YES and NO pools (or option pools)
- Price = (pool amount / total volume) × 100
- Larger bets = bigger price moves (shift pool ratios more)

**Parimutuel Payouts:** Winners split losers' pool
- Your share of winning pool = your bet / total winning pool
- Your profit = (your share) × (total losing pool)
- Total payout = your bet + your profit

**Money In = Money Out:** No platform profit
- Total bets = total payouts
- Pure peer-to-peer betting system
- Platform holds no money

---

### `calculateMarketImpact()`

**Calculate parimutuel market impact when placing a bet.**

**Signature:**
```typescript
function calculateMarketImpact(
  betAmount: number,
  startingPrice: number,
  yesPool: number,
  noPool: number,
  side: 'YES' | 'NO'
): MarketImpactResult

interface MarketImpactResult {
  totalPositions: number;      // Position size (bet amount)
  averagePrice: number;         // Entry price (%)
  finalPrice: number;           // New market price after bet
  estimatedPayout: number;      // Estimated payout if wins
}
```

**How It Works:**

1. **Add Bet to Pool**
```typescript
const newYesPool = side === 'YES' ? yesPool + betAmount : yesPool;
const newNoPool = side === 'NO' ? noPool + betAmount : noPool;
const newTotalPool = newYesPool + newNoPool;
```

2. **Calculate New Price (Pool Ratio)**
```typescript
// Price = (YES pool / total pool) × 100
const finalPrice = newTotalPool > 0
  ? Math.round((newYesPool / newTotalPool) * 100)
  : startingPrice;
```

3. **Estimate Payout**
```typescript
// User's share of winning pool
const totalWinningPool = side === 'YES' ? newYesPool : newNoPool;
const userShare = betAmount / totalWinningPool;

// Profit from losing pool
const totalLosingPool = side === 'YES' ? newNoPool : newYesPool;
const profitFromLosers = userShare * totalLosingPool;

// Total payout = bet + profit
const estimatedPayout = betAmount + profitFromLosers;
```

**Example Usage:**
```typescript
// User bets $100 YES when YES pool = $500, NO pool = $500
const result = calculateMarketImpact(100, 50, 500, 500, 'YES');

console.log(result);
// {
//   totalPositions: 100,           // User's bet amount
//   averagePrice: 50,              // Entry price
//   finalPrice: 55,                // New price (600/1100 * 100)
//   estimatedPayout: 120           // $100 + ($100/600 * $500)
// }
```

---

### `calculatePoolsFromPrice()`

**Helper to derive pool sizes from current price and total volume.**

**Signature:**
```typescript
function calculatePoolsFromPrice(
  totalVolume: number,
  yesPrice: number
): { yesPool: number; noPool: number }
```

**Usage:**
```typescript
const { yesPool, noPool } = calculatePoolsFromPrice(1000, 60);
// Returns: { yesPool: 600, noPool: 400 }
```

---

### `previewMarketImpact()`

**Preview market impact for UI display (before placing bet).**

**Signature:**
```typescript
function previewMarketImpact(
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
  estimatedPayout: number;
}
```

**Usage in UI:**
```typescript
// In BettingCard component
const { yesPool, noPool } = calculatePoolsFromPrice(
  event.totalVolume,
  event.yesPrice
);

const preview = previewMarketImpact(
  Number(amount),
  event.yesPrice,
  yesPool,
  noPool,
  'YES'
);

// Display preview
{preview && (
  <div>
    <p>Your Bet: ${preview.estimatedPosition}</p>
    <p>Entry Odds: {preview.estimatedAveragePrice}%</p>
    <p>Odds Shift: +{preview.priceImpact}pp</p>
    <p>New Odds: {preview.estimatedFinalPrice}%</p>
    <p>Est. Payout: ${preview.estimatedPayout}</p>
  </div>
)}
```

---

### Parimutuel Examples

**Balanced Market ($500 YES, $500 NO):**
```typescript
// $100 bet on YES @ 50%
const { yesPool, noPool } = calculatePoolsFromPrice(1000, 50);
calculateMarketImpact(100, 50, yesPool, noPool, 'YES')
// Result:
// - Position: $100
// - Entry Price: 50%
// - New Price: 55% (600/1100)
// - Odds Shift: +5pp
// - Est. Payout: $183.33 ($100 + $100/600 * $500)
```

**Skewed Market ($700 YES, $300 NO):**
```typescript
// $100 bet on YES @ 70%
const { yesPool, noPool } = calculatePoolsFromPrice(1000, 70);
calculateMarketImpact(100, 70, yesPool, noPool, 'YES')
// Result:
// - Position: $100
// - Entry Price: 70%
// - New Price: 73% (800/1100)
// - Odds Shift: +3pp
// - Est. Payout: $137.50 ($100 + $100/800 * $300)
```

**Large Bet on Small Market:**
```typescript
// $200 bet on YES when pools are YES: $150, NO: $150
calculateMarketImpact(200, 50, 150, 150, 'YES')
// Result:
// - Position: $200
// - Entry Price: 50%
// - New Price: 70% (350/500)
// - Odds Shift: +20pp
// - Est. Payout: $285.71 ($200 + $200/350 * $150)
```

---

## 📈 Position Calculations (`src/lib/positions.ts`)

**Purpose:** Calculate user positions, portfolio values, and average prices.

### Key Concepts

**Position Value:** Total bet amount on a side
- Stored in `bet.shares` field (represents bet amount in parimutuel system)
- Sum of all bets for a side

**Average Price:** Weighted average entry odds
- Only counts positive purchases
- Calculated as (total amount spent / total position) × 100

**Potential Payout:** Parimutuel payout estimate if wins
- Your share of winning pool × losing pool = profit
- Total payout = bet amount + profit

**Portfolio:** Sum of all ACTIVE bet amounts on ACTIVE markets

---

### `calculateUserPosition()`

**Calculate user's net position for a market (returns dominant side only).**

**Signature:**
```typescript
function calculateUserPosition(
  bets: Bet[],
  userId: string,
  optionId?: string  // For multiple choice markets
): UserPosition | null

interface UserPosition {
  side: 'YES' | 'NO';
  positionValue: number;        // Net position ($)
  averagePrice: number;         // Weighted avg entry price (%)
  potentialPayout: number;      // Max payout if wins
}
```

**How It Works:**

1. **Filter User's Bets**
```typescript
const userBets = bets.filter(bet => {
  if (bet.user.id !== userId) return false;
  if (optionId) {
    return bet.optionId === optionId;
  } else {
    return bet.optionId === null; // Binary market
  }
});
```

2. **Calculate Net Positions**
```typescript
const yesBets = userBets.filter(bet => bet.side === 'YES');
const noBets = userBets.filter(bet => bet.side === 'NO');

// Sum all shares (includes negative from sells)
const yesPositionValue = yesBets.reduce((sum, bet) => sum + Number(bet.shares), 0);
const noPositionValue = noBets.reduce((sum, bet) => sum + Number(bet.shares), 0);
```

3. **Calculate Average Price (Purchases Only)**
```typescript
const yesPurchases = yesBets.filter(bet => Number(bet.shares) > 0);
const yesAmount = yesPurchases.reduce((sum, bet) => sum + Number(bet.amount), 0);
const yesPositionForAvg = yesPurchases.reduce((sum, bet) => sum + Number(bet.shares), 0);

const avgPrice = yesPositionForAvg > 0 ? yesAmount / yesPositionForAvg * 100 : 0;
```

4. **Calculate Parimutuel Payout**
```typescript
// Calculate total pools from ALL bets
const totalYesPool = allRelevantBets
  .filter(bet => bet.side === 'YES' && Number(bet.shares) > 0)
  .reduce((sum, bet) => sum + Number(bet.amount), 0);

const totalNoPool = allRelevantBets
  .filter(bet => bet.side === 'NO' && Number(bet.shares) > 0)
  .reduce((sum, bet) => sum + Number(bet.amount), 0);

// User's share of winning pool
const userShare = totalYesPool > 0 ? yesPositionValue / totalYesPool : 0;

// Profit from losers' pool
const profitFromLosers = userShare * totalNoPool;

// Total payout = original bet + profit
const potentialPayout = yesPositionValue + profitFromLosers;
```

5. **Return Dominant Side**
```typescript
if (yesPositionValue > 0) {
  return {
    side: 'YES',
    positionValue: yesPositionValue,
    averagePrice: avgPrice,
    potentialPayout: potentialPayout
  };
}
// Returns null if no net position
```

**Example:**
```typescript
// Alice has $150 bet on YES
// Total market: YES pool = $500, NO pool = $300
const allBets = [
  { side: 'YES', amount: 100, shares: 100, userId: 'alice' },
  { side: 'YES', amount: 50, shares: 50, userId: 'alice' },
  { side: 'YES', amount: 350, shares: 350, userId: 'bob' },    // Other YES bets
  { side: 'NO', amount: 300, shares: 300, userId: 'charlie' }  // NO pool
];

const position = calculateUserPosition(allBets, 'alice');
// {
//   side: 'YES',
//   positionValue: 150,           // Alice's total YES position
//   averagePrice: 50,             // Entry odds (weighted avg)
//   potentialPayout: 240          // $150 + (150/500 * 300) = $240
// }
```

---

### `getAllUserPositions()`

**Get all positions (both YES and NO) for a user in a market.**

**Signature:**
```typescript
function getAllUserPositions(
  bets: Bet[],
  userId: string,
  optionId?: string
): UserPosition[]
```

**Returns:** Array of positions (can have both YES and NO if user has both)

**Example:**
```typescript
// Alice has hedged: $400 YES, $100 NO
// Total market: YES pool = $600, NO pool = $400
const bets = [
  { side: 'YES', amount: 400, shares: 400, userId: 'alice' },
  { side: 'NO', amount: 100, shares: 100, userId: 'alice' },
  { side: 'YES', amount: 200, shares: 200, userId: 'bob' },
  { side: 'NO', amount: 300, shares: 300, userId: 'charlie' }
];

const positions = getAllUserPositions(bets, 'alice');
// [
//   {
//     side: 'YES',
//     positionValue: 400,
//     averagePrice: 60,  // Current YES odds
//     potentialPayout: 667  // $400 + (400/600 * 400)
//   },
//   {
//     side: 'NO',
//     positionValue: 100,
//     averagePrice: 40,  // Current NO odds
//     potentialPayout: 250  // $100 + (100/400 * 600)
//   }
// ]
```

**Use Case:** Displaying all positions when user has hedged (both YES and NO)

---

### Portfolio Calculation Pattern

**Always calculate portfolio dynamically (never stored):**

```typescript
// In components or API routes
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    bets: {
      include: { event: true }
    }
  }
});

// Filter ACTIVE bets on ACTIVE markets
const activeBets = user.bets.filter(bet =>
  bet.status === 'ACTIVE' && bet.event.status === 'ACTIVE'
);

// Sum bet amounts
const portfolio = activeBets.reduce((sum, bet) => sum + Number(bet.amount), 0);
```

---

## 🔔 Notifications (`src/lib/notifications.ts`)

**Purpose:** Create and send notifications for market events with personalized payment details.

### `createNotification()`

**Create a notification for a user.**

**Signature:**
```typescript
async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  data?: any
): Promise<Notification>
```

**Types:**
- `MARKET_CLOSED`: Market closed for betting
- `MARKET_RESOLVED`: Market resolved with outcome
- `MARKET_CANCELLED`: Market cancelled/voided
- `PAYMENT_APPROVED`: Payment approved (legacy)
- `REDEMPTION_COMPLETED`: Redemption completed (legacy)

**Usage:**
```typescript
await createNotification(
  userId,
  'MARKET_RESOLVED',
  'Market Resolved',
  'Your bet on "Will Alice get promoted?" has been resolved. You won $100.',
  {
    eventId: 'event123',
    betId: 'bet456',
    result: 'WON',
    amount: 100
  }
);
```

---

### `notifyMarketClosure()`

**Notify all bettors when market closes.**

**Signature:**
```typescript
async function notifyMarketClosure(eventId: string): Promise<void>
```

**Usage:**
```typescript
// In API route when closing market
await notifyMarketClosure(eventId);
```

**Notification Sent:**
```
Title: "Market Closed"
Message: "The market '[Title]' has closed for betting"
Type: MARKET_CLOSED
```

---

### `notifyMarketResolution()`

**Notify all bettors when market resolves, with personalized payment details.**

**Signature:**
```typescript
async function notifyMarketResolution(
  eventId: string,
  outcome: boolean | null,
  winningOptionId?: string,
  payments?: Array<{
    from: { id: string; name: string };
    to: { id: string; name: string };
    amount: number;
  }>
): Promise<void>
```

**How It Works:**

1. **Determine Winner/Loser for Each Bet**
```typescript
const isWinner = (event.marketType === 'BINARY')
  ? (outcome && bet.side === 'YES') || (!outcome && bet.side === 'NO')
  : bet.optionId === winningOptionId;
```

2. **Calculate Personalized Payment Details**
```typescript
// For winners: Who owes them money
if (isWinner && payments) {
  const paymentsToUser = payments.filter(p => p.to.id === bet.userId);
  const totalReceiving = paymentsToUser.reduce((sum, p) => sum + p.amount, 0);
  const payersList = paymentsToUser.map(p => `${p.from.name} ($${p.amount.toFixed(2)})`).join(', ');
  paymentDetails = ` You'll receive $${totalReceiving.toFixed(2)} from: ${payersList}`;
}

// For losers: Who they owe money to
if (!isWinner && payments) {
  const paymentsFromUser = payments.filter(p => p.from.id === bet.userId);
  const totalOwing = paymentsFromUser.reduce((sum, p) => sum + p.amount, 0);
  const payeesList = paymentsFromUser.map(p => `${p.to.name} ($${p.amount.toFixed(2)})`).join(', ');
  paymentDetails = ` You owe $${totalOwing.toFixed(2)} to: ${payeesList}`;
}
```

3. **Send Notification**
```typescript
await createNotification(
  bet.userId,
  'MARKET_RESOLVED',
  'Market Resolved',
  `Your bet on "${event.title}" has been resolved. You ${amountText}. Winner: ${winningDescription}.${paymentDetails}`,
  {
    eventId: event.id,
    betId: bet.id,
    result,
    amount,
    outcome: winningDescription,
    payments: payments?.filter(p => p.from.id === bet.userId || p.to.id === bet.userId) || []
  }
);
```

**Example Notifications:**

*Winner:*
```
Title: "Market Resolved"
Message: "Your bet on 'Will Alice get promoted?' has been resolved. You won $100.00. Winner: YES. You'll receive $50.00 from: Bob ($30.00), Charlie ($20.00)"
```

*Loser:*
```
Title: "Market Resolved"
Message: "Your bet on 'Will Alice get promoted?' has been resolved. You lost $50.00. Winner: NO. You owe $50.00 to: Alice"
```

**Usage in Resolve API:**
```typescript
// After resolving market and calculating payments
await notifyMarketResolution(eventId, outcome, winningOptionId, payments);
```

---

### `notifyMarketCancellation()`

**Notify all bettors when market is cancelled.**

**Signature:**
```typescript
async function notifyMarketCancellation(eventId: string): Promise<void>
```

**Usage:**
```typescript
// In cancel API route
await notifyMarketCancellation(eventId);
```

**Notification Sent:**
```
Title: "Market Cancelled"
Message: "Market '[Title]' was cancelled. Your bet has been voided."
Type: MARKET_CANCELLED
```

---

## 🎨 Avatar Utilities (`src/lib/avatar.ts`)

**Purpose:** Generate consistent avatar gradients and user initials.

### `gradientFromString()`

**Generate a gradient background from a string (userId or name).**

**Signature:**
```typescript
function gradientFromString(str: string): React.CSSProperties
```

**How It Works:**
- Hashes the string to get consistent colors
- Returns CSS gradient style object
- Same input always produces same gradient

**Usage:**
```tsx
<div
  className="h-10 w-10 rounded-full flex items-center justify-center"
  style={gradientFromString(user.id)}
>
  {initialsFromName(user.name)}
</div>
```

---

### `initialsFromName()`

**Extract initials from a name.**

**Signature:**
```typescript
function initialsFromName(name?: string | null): string
```

**Examples:**
```typescript
initialsFromName('Alice Johnson')    // 'AJ'
initialsFromName('Bob')              // 'B'
initialsFromName('Charlie Van Der')  // 'CV'
initialsFromName(null)               // '?'
```

**Usage:**
```tsx
<div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
  <span className="text-white font-semibold">
    {initialsFromName(user.name)}
  </span>
</div>
```

---

## 🔐 Authentication (`src/lib/auth.ts`)

**Purpose:** NextAuth.js configuration.

### `authOptions`

**NextAuth configuration object.**

**Key Settings:**
```typescript
export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Find user, verify password with bcrypt
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.hashedPassword) {
          throw new Error('Invalid credentials');
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );

        if (!isValid) {
          throw new Error('Invalid credentials');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          isAdmin: user.isAdmin
        };
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = user.isAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.isAdmin = token.isAdmin as boolean;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error'
  }
};
```

**Usage in API Routes:**
```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const session = await getServerSession(authOptions);
if (!session?.user) {
  return unauthorized();
}

// Access: session.user.id, session.user.email, session.user.isAdmin
```

---

## 📧 Email Utilities (`src/lib/email.ts`)

**Purpose:** Send emails for password resets, etc.

### `sendPasswordResetEmail()`

**Send password reset email with token.**

**Signature:**
```typescript
async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<void>
```

**Usage:**
```typescript
// Generate token
const token = generateResetToken();

// Send email
await sendPasswordResetEmail(user.email, token);
```

**Email Template:**
```
Subject: "Password Reset Request"
Body:
"Click the link below to reset your password:
https://yourapp.com/auth/reset-password?token={token}

This link expires in 1 hour."
```

---

## 🗄️ Prisma Client (`src/lib/prisma.ts`)

**Purpose:** Singleton Prisma client instance.

### `prisma`

**Global Prisma client for database operations.**

**Setup:**
```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

**Usage:**
```typescript
import { prisma } from '@/lib/prisma';

const user = await prisma.user.findUnique({
  where: { id: userId }
});
```

**Why Singleton:**
- Prevents multiple client instances in development (hot reload)
- Shares connection pool across requests
- Best practice for Next.js API routes

---

## 🛠️ General Utilities (`src/lib/utils.ts`)

**Purpose:** Miscellaneous helper functions.

### `cn()` (Tailwind Merge)

**Merge Tailwind classes without conflicts.**

**Signature:**
```typescript
function cn(...inputs: ClassValue[]): string
```

**Usage:**
```typescript
import { cn } from '@/lib/utils';

// Combine classes, later ones override earlier
const className = cn(
  'px-4 py-2',
  'bg-blue-500',
  isActive && 'bg-green-500',  // Overrides blue if active
  additionalClasses
);

<button className={className}>Click</button>
```

### `formatCurrency()`

**Format number as currency.**

**Signature:**
```typescript
function formatCurrency(amount: number): string
```

**Usage:**
```typescript
formatCurrency(1234.56)   // "$1,234.56"
formatCurrency(100)       // "$100.00"
formatCurrency(0.5)       // "$0.50"
```

### `formatPercentage()`

**Format number as percentage.**

**Signature:**
```typescript
function formatPercentage(value: number, decimals = 1): string
```

**Usage:**
```typescript
formatPercentage(65.5)     // "65.5%"
formatPercentage(50, 0)    // "50%"
formatPercentage(33.333, 2) // "33.33%"
```

---

## 🔍 Usage Patterns

### Market Impact in Betting Flow
```typescript
// 1. Calculate pools from current price
const { yesPool, noPool } = calculatePoolsFromPrice(totalVolume, currentPrice);

// 2. Preview (before placing bet)
const preview = previewMarketImpact(amount, currentPrice, yesPool, noPool, side);
// Show user estimated impact and payout

// 3. Calculate (when placing bet)
const impact = calculateMarketImpact(amount, currentPrice, yesPool, noPool, side);
// Use for actual bet creation

// 4. Update Price (from pool ratios)
const newYesPool = side === 'YES' ? yesPool + amount : yesPool;
const newNoPool = side === 'NO' ? noPool + amount : noPool;
const newPrice = (newYesPool / (newYesPool + newNoPool)) * 100;
// Store new price in event
```

### Position Display
```typescript
// Get user's dominant position
const position = calculateUserPosition(bets, userId);

if (position) {
  console.log(`${position.side} position: $${position.positionValue}`);
  console.log(`Avg price: ${position.averagePrice}%`);
  console.log(`Potential payout: $${position.potentialPayout}`);
}

// Get all positions (for hedgers)
const allPositions = getAllUserPositions(bets, userId);
allPositions.forEach(pos => {
  console.log(`${pos.side}: $${pos.positionValue}`);
});
```

### Notification with Payments
```typescript
// 1. Resolve market
const { payments } = await resolveMarket(eventId, outcome);

// 2. Send notifications with payment details
await notifyMarketResolution(eventId, outcome, winningOptionId, payments);

// 3. Users receive personalized messages
// Winner: "You'll receive $50 from Bob"
// Loser: "You owe $50 to Alice"
```

---

## 📊 Key Formulas

### Parimutuel Price (Pool Ratio)
```
yesPrice = (yesPool / (yesPool + noPool)) * 100
noPrice = 100 - yesPrice
```

### Pool Calculation from Price
```
yesPool = (yesPrice / 100) * totalVolume
noPool = totalVolume - yesPool
```

### Average Entry Odds
```
avgPrice = (totalAmountSpent / totalPositionValue) * 100
```

### Parimutuel Payout
```
userShare = userBetAmount / totalWinningPool
profitFromLosers = userShare * totalLosingPool
potentialPayout = userBetAmount + profitFromLosers
```

### Portfolio Value
```
portfolio = sum(bet.amount WHERE bet.status = 'ACTIVE' AND bet.event.status = 'ACTIVE')
```

---

**Last Updated:** September 2024
**Version:** 2.0 (Credit-based system)
