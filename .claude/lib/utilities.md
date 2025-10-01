# SquadOdds - Library Utilities Documentation

**Keywords:** utilities, lib, helpers, functions, calculations, amm, positions

Complete documentation of all utility functions and libraries in `src/lib/`.

---

## 📊 Market Impact & AMM (`src/lib/marketImpact.ts`)

**Purpose:** Automated Market Maker (AMM) implementation for dynamic pricing with realistic slippage and market depth.

### Key Concepts

**Market Impact:** How much a bet moves the price
- Larger bets = bigger price moves
- Higher volume = less impact per bet
- Extreme prices (near 0% or 100%) resist change more

**Slippage:** Difference between market price and execution price
- User pays more than market price when buying
- Larger bets = more slippage
- Small markets get liquidity boost to reduce volatility

**Liquidity Scaling:** Virtual liquidity added to small markets
- Micro markets (<$200): Significant boost
- Small markets ($200-$500): Moderate boost
- Medium+ markets (>$500): Normal scaling

---

### `calculateMarketImpact()`

**Calculate market impact and execution prices for a bet.**

**Signature:**
```typescript
function calculateMarketImpact(
  betAmount: number,
  startingPrice: number,
  totalLiquidity: number,
  side: 'YES' | 'NO'
): MarketImpactResult

interface MarketImpactResult {
  totalPositions: number;      // Position size (bet amount in AMM)
  averagePrice: number;         // Weighted average execution price
  priceSlices: BetSlice[];      // Breakdown for large bets
  finalPrice: number;           // New market price after trade
}
```

**How It Works:**

1. **Adaptive Liquidity Calculation**
```typescript
// Base liquidity with floor
const minLiquidity = Math.max(150, totalLiquidity * 0.3);

// Progressive scaling by market size
if (totalLiquidity <= 200) {
  // Micro markets: Significant boost
  scaledLiquidity = minLiquidity + Math.log(totalLiquidity + 1) * 60;
} else if (totalLiquidity <= 500) {
  // Small markets: Moderate boost
  scaledLiquidity = minLiquidity + Math.log(totalLiquidity + 1) * 40;
} else {
  // Medium+ markets: Normal scaling
  scaledLiquidity = totalLiquidity * 0.8;
}
```

2. **Impact Factor & Slippage**
```typescript
// How much this bet impacts the market
const impactFactor = betAmount / scaledLiquidity;

// Base slippage
const rawSlippage = impactFactor * startingPrice * 0.4;

// Market size multiplier (caps slippage for tiny markets)
const marketSizeMultiplier = totalLiquidity < 500
  ? Math.max(0.4, totalLiquidity / 1250)
  : 1.0;

const slippage = Math.sqrt(rawSlippage) * (8 * marketSizeMultiplier);
```

3. **Execution Prices**
```typescript
// What user actually pays (always higher due to slippage)
const userExecutionPrice = Math.min(95, startingPrice + slippage);

// New market price (YES bet pushes price up)
const newMarketPrice = side === 'YES'
  ? Math.min(95, startingPrice + slippage * 0.9)
  : Math.max(5, startingPrice - slippage * 0.9);
```

4. **Order Slicing (for large bets)**
```typescript
const liquidityRatio = betAmount / scaledLiquidity;

if (liquidityRatio < 0.0005) {
  // Micro trade: Single execution at user price
  return singleSliceResult;
} else if (liquidityRatio < 0.01) {
  // Small trade: Average of start and user price
  const avgPrice = (startingPrice + userExecutionPrice) / 2;
  return singleSliceResult;
} else {
  // Large trade: Split across 2-5 price levels
  const numSlices = Math.min(5, Math.max(2, Math.ceil(liquidityRatio * 50)));
  // Progressive price movement across slices
}
```

**Example Usage:**
```typescript
// User bets $100 YES at 50% in a $1000 market
const result = calculateMarketImpact(100, 50, 1000, 'YES');

console.log(result);
// {
//   totalPositions: 100,           // Position size
//   averagePrice: 51.2,            // Execution price (user pays)
//   priceSlices: [{...}],          // Single slice for this size
//   finalPrice: 51.8               // New market price
// }
```

---

### `calculateNewMarketPrice()`

**Calculate new market price after a bet (uses market impact result).**

**Signature:**
```typescript
function calculateNewMarketPrice(
  currentPrice: number,
  totalVolumeBeforeBet: number,
  betAmount: number,
  side: 'YES' | 'NO',
  marketImpactResult: MarketImpactResult
): number
```

**Usage:**
```typescript
const marketImpact = calculateMarketImpact(100, 50, 1000, 'YES');
const newPrice = calculateNewMarketPrice(50, 1000, 100, 'YES', marketImpact);
// Returns: 51.8 (rounded to 1 decimal)
```

---

### `previewMarketImpact()`

**Preview market impact for UI display (before placing bet).**

**Signature:**
```typescript
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
}
```

**Usage in UI:**
```typescript
// In BettingCard component
const [amount, setAmount] = useState('');
const [preview, setPreview] = useState(null);

useEffect(() => {
  if (Number(amount) > 0) {
    const result = previewMarketImpact(
      Number(amount),
      event.yesPrice,
      event.totalVolume,
      'YES'
    );
    setPreview(result);
  }
}, [amount, event]);

// Display preview
{preview && (
  <div>
    <p>Position: ${preview.estimatedPosition}</p>
    <p>Avg Price: {preview.estimatedAveragePrice}%</p>
    <p>Price Impact: +{preview.priceImpact}%</p>
    <p>New Price: {preview.estimatedFinalPrice}%</p>
  </div>
)}
```

---

### AMM Examples

**Micro Market ($100 volume):**
```typescript
// $20 bet on YES @ 50%
calculateMarketImpact(20, 50, 100, 'YES')
// Result:
// - Position: $20
// - Avg Price: ~51%
// - New Market Price: ~52%
// - Impact: ~2%
```

**Small Market ($500 volume):**
```typescript
// $50 bet on YES @ 50%
calculateMarketImpact(50, 50, 500, 'YES')
// Result:
// - Position: $50
// - Avg Price: ~51.5%
// - New Market Price: ~52%
// - Impact: ~2%
```

**Large Market ($5000 volume):**
```typescript
// $100 bet on YES @ 50%
calculateMarketImpact(100, 50, 5000, 'YES')
// Result:
// - Position: $100
// - Avg Price: ~50.3%
// - New Market Price: ~50.5%
// - Impact: ~0.5%
```

**Large Bet on Small Market:**
```typescript
// $200 bet on YES @ 50% in $300 market
calculateMarketImpact(200, 50, 300, 'YES')
// Result:
// - Position: $200
// - Avg Price: ~56% (multi-slice execution)
// - New Market Price: ~58%
// - Impact: ~8%
// - Slices: 3 price levels (50→53→56)
```

---

## 📈 Position Calculations (`src/lib/positions.ts`)

**Purpose:** Calculate user positions, portfolio values, and average prices.

### Key Concepts

**Position Value:** Sum of bet shares (can be negative for sells)
- Buy operations: Positive shares
- Sell operations: Negative shares
- Net position: Sum of all shares for a side

**Average Price:** Weighted average entry price
- Only counts positive purchases (excludes sells)
- Used to calculate potential payout

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

4. **Return Dominant Side**
```typescript
if (yesPositionValue > 0) {
  return {
    side: 'YES',
    positionValue: yesPositionValue,
    averagePrice: avgPrice,
    potentialPayout: avgPrice > 0 ? yesPositionValue / (avgPrice / 100) : 0
  };
}
// Returns null if no net position
```

**Example:**
```typescript
const bets = [
  { side: 'YES', amount: 100, shares: 100, userId: 'alice' },
  { side: 'YES', amount: 50, shares: 50, userId: 'alice' },
  { side: 'YES', amount: -30, shares: -30, userId: 'alice' }, // Sell
];

const position = calculateUserPosition(bets, 'alice');
// {
//   side: 'YES',
//   positionValue: 120,           // 100 + 50 - 30
//   averagePrice: ~50,            // (100 + 50) / (100 + 50) * 100
//   potentialPayout: 240          // 120 / 0.5
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
const bets = [
  { side: 'YES', amount: 100, shares: 100, userId: 'alice' },
  { side: 'NO', amount: 50, shares: 50, userId: 'alice' },
];

const positions = getAllUserPositions(bets, 'alice');
// [
//   { side: 'YES', positionValue: 100, averagePrice: 50, potentialPayout: 200 },
//   { side: 'NO', positionValue: 50, averagePrice: 50, potentialPayout: 100 }
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
// 1. Preview (before placing bet)
const preview = previewMarketImpact(amount, price, volume, side);
// Show user estimated impact

// 2. Calculate (when placing bet)
const impact = calculateMarketImpact(amount, price, volume, side);
// Use for actual bet creation

// 3. Update Price (after bet)
const newPrice = calculateNewMarketPrice(price, volume, amount, side, impact);
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

### AMM Price Impact
```
impactFactor = betAmount / scaledLiquidity
slippage = sqrt(impactFactor * startingPrice * 0.4) * (8 * marketSizeMultiplier)
userExecutionPrice = startingPrice + slippage
newMarketPrice = startingPrice + (slippage * 0.9) [for YES]
```

### Average Price
```
avgPrice = totalAmountSpent / totalPositionValue * 100
```

### Potential Payout
```
potentialPayout = positionValue / (avgPrice / 100)
```

### Portfolio Value
```
portfolio = sum(bet.amount WHERE bet.status = 'ACTIVE' AND bet.event.status = 'ACTIVE')
```

---

**Last Updated:** September 2024
**Version:** 2.0 (Credit-based system)
