# SquadOdds - Project Overview

**Keywords:** prediction-market, credit-betting, parimutuel, portfolio, next.js, prisma, typescript

## 🎯 Project Description

SquadOdds is a Polymarket-inspired prediction market platform designed for friend groups. Users create and bet on personal life events using a **credit-based betting system** (no wallet management). The platform features a **parimutuel betting system** for dynamic pricing, real-time price charts, social features, and comprehensive analytics.

## 🏗️ Architecture

### Tech Stack
- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth.js with credential provider
- **Styling:** Tailwind CSS
- **Charts:** Recharts for price history visualization
- **Icons:** Lucide React
- **Deployment:** Vercel

### Project Structure
```
src/
├── app/                     # Next.js 14 App Router
│   ├── api/                # API routes (REST endpoints)
│   ├── market/[id]/        # Dynamic market detail pages
│   ├── admin/              # Admin panel (users, events)
│   ├── auth/               # Auth pages (signin, signup, password reset)
│   ├── leaderboard/        # User rankings
│   ├── profile/            # User portfolio and settings
│   └── ...
├── components/             # React components
│   ├── ui/                # Base UI components
│   ├── Navigation.tsx     # Main navigation with portfolio display
│   ├── BettingCard.tsx    # Desktop betting interface
│   ├── BettingModal.tsx   # Mobile betting modal
│   └── ...
├── lib/                    # Utility functions
│   ├── positions.ts       # Portfolio and position calculations
│   ├── marketImpact.ts    # Parimutuel pricing engine
│   ├── notifications.ts   # Notification system
│   └── auth.ts            # NextAuth configuration
prisma/
├── schema.prisma          # Database schema
└── seed.ts                # Database seeding script
```

## 💰 Credit-Based Betting System

**Core Concept:** Users bet on credit without managing a wallet balance.

### Key Features
- **No Wallet Balance:** Users do not top up or withdraw funds
- **$300 Per-Bet Limit:** Each individual bet is limited to $300
- **Portfolio Calculation:** Portfolio = sum of ACTIVE bets on ACTIVE markets
- **Payment Obligations:** When markets resolve, losers owe winners based on proportional distribution
- **No Real Money Flow:** All betting is on credit; payment obligations settled externally

### Bet Lifecycle
1. **ACTIVE:** Bet is placed on an active market (added to portfolio)
2. **WON:** Market resolved in user's favor (removed from portfolio, winner)
3. **LOST:** Market resolved against user (removed from portfolio, loser)
4. **REFUNDED:** Market cancelled/voided (removed from portfolio, no payout)

### Portfolio Logic
```typescript
// Portfolio = sum of ACTIVE bets' amounts on ACTIVE markets
const activeBets = user.bets.filter(b =>
  b.status === 'ACTIVE' && b.event.status === 'ACTIVE'
);
const portfolio = activeBets.reduce((sum, b) => sum + b.amount, 0);
```

## 📊 Parimutuel Betting System

SquadOdds uses a **parimutuel betting system** (pool-based betting) where winners split the losers' pool proportionally.

### How It Works
- **Pool-Based:** All bets go into YES and NO pools (or option pools for multiple choice)
- **Dynamic Odds:** Odds = pool ratio (e.g., if YES pool = $60, NO pool = $40, then YES odds = 60%)
- **Winners Split Losers' Pool:** When resolved, winning pool splits the losing pool proportionally
- **Money In = Money Out:** No platform profit, pure peer-to-peer betting

### Key Calculations
```typescript
// Price is determined by pool ratios
const yesPrice = (yesPool / totalPool) * 100;

// Payout calculation for winners
const userShare = userBetAmount / totalWinningPool;
const profitFromLosers = userShare * totalLosingPool;
const totalPayout = userBetAmount + profitFromLosers;
```

See `src/lib/marketImpact.ts` for full parimutuel implementation.

## 🎯 Market Types

### Binary Markets
- **YES/NO outcomes**
- Single probability (YES price)
- NO price = 100 - YES price
- Users bet on YES or NO side

### Multiple Choice Markets
- **3+ options** (e.g., "Who will get promoted first? Alice, Bob, Charlie")
- Each option has its own probability
- All option probabilities sum to 100%
- Users bet YES on specific options

## 💸 Payment Obligations

When markets resolve, the system calculates who owes who based on **proportional distribution**.

### Payment Calculation
```typescript
// Each loser's bet amount is distributed proportionally to winners
losingBets.forEach(losingBet => {
  winningBets.forEach(winningBet => {
    const winnerShare = winningBet.amount / totalWinningAmount;
    const paymentAmount = losingBet.amount * winnerShare;

    payments.push({
      from: losingBet.user,
      to: winningBet.user,
      amount: paymentAmount
    });
  });
});
```

### Payment Display
- **Notifications:** Users get personalized messages ("You owe Bob $50", "Alice owes you $30")
- **Market Detail Pages:** Payment breakdown shows full payment matrix
- **Note:** Payments are settled privately between users (no platform involvement)

## 🔔 Notification System

Real-time notifications for market events with personalized payment details.

### Notification Types
- `MARKET_CLOSED`: Market has closed for betting
- `MARKET_RESOLVED`: Market resolved with outcome and payment obligations
- `MARKET_CANCELLED`: Market voided, bets removed from portfolios

### Resolution Notifications
Winners and losers receive different messages:
- **Winners:** "You won $50. You'll receive $75 from: Bob ($50), Alice ($25)"
- **Losers:** "You lost $50. You owe $50 to: Charlie"

See `src/lib/notifications.ts` for implementation.

## 🗄️ Database Schema (Prisma)

### Core Models
- **User:** email, name, isAdmin, appleCashEmail (for external payments)
- **Event:** title, description, marketType (BINARY/MULTIPLE), status (ACTIVE/CLOSED/RESOLVED/CANCELLED)
- **Bet:** userId, eventId, side (YES/NO), amount, price, shares (position value), status
- **MarketOption:** For multiple choice markets (title, price, totalVolume)
- **Notification:** userId, type, message, data (structured JSON)
- **Comment:** eventId, userId, content, parentId (for threading)

### Important Fields
- **Event.yesPrice:** Current YES probability (0-100) for binary markets
- **Event.outcome:** true = YES won, false = NO won, null = not resolved
- **Event.winningOptionId:** ID of winning option for multiple choice markets
- **Bet.shares:** Stores bet amount in parimutuel model (position value)
- **Bet.status:** ACTIVE, WON, LOST, REFUNDED

See `prisma/schema.prisma` for complete schema.

## 🔐 Authentication

NextAuth.js with credential provider and bcrypt password hashing.

### User Roles
- **Regular Users:** Can create markets, place bets, comment
- **Admins:** Additional access to admin panel for user/market management (set via `isAdmin` boolean)

### Session Management
```typescript
// Session includes user ID, email, name, isAdmin flag
const session = await getServerSession(authOptions);
if (!session?.user) {
  return unauthorized();
}
```

## 🎨 UI/UX Patterns

### Responsive Design
- **Desktop:** Side-by-side betting interface (BettingCard)
- **Mobile:** Modal-based betting (BettingModal)
- **Large buttons:** Touch-friendly on all devices

### Color System
- **Green:** Positive values (profits, winnings, portfolio)
- **Red:** Negative values (losses)
- **Blue:** Primary actions (Create Market, Place Bet)
- **Purple:** Category filters
- **Muted backgrounds:** Gray-800/90 for better hierarchy

### Key Components
- **Navigation:** Shows portfolio value in real-time
- **MarketCard:** Market preview with price, volume, category
- **PriceChart:** Interactive Recharts line graph
- **NotificationDropdown:** Bell icon with unread count

## 🚀 API Routes

### Betting
- `POST /api/bets` - Place bet (BUY/SELL) with market impact
- `GET /api/bets` - Get user's bets

### Events
- `GET /api/events` - List markets (with filters)
- `POST /api/events` - Create new market
- `POST /api/events/[id]/resolve` - Resolve market, calculate payments
- `POST /api/events/[id]/cancel` - Cancel market, void all bets

### Admin
- `GET /api/admin/users` - List all users
- `GET /api/admin/events` - List all events

### Other
- `GET /api/leaderboard` - User rankings with stats
- `GET /api/notifications` - User notifications
- `POST /api/notifications/mark-all-read` - Mark notifications as read

See `.claude/api/routes-overview.md` for detailed API documentation.

## 📈 Portfolio and Stats

### Portfolio Value
Sum of all ACTIVE bets on ACTIVE markets (calculated in real-time, no stored field).

### User Stats
- **Total Bets:** Count of all bets placed
- **Net Profit:** totalWinnings - totalLosses (from WON/LOST bets)
- **Win Rate:** (WON bets / resolved bets) * 100
- **ROI:** (Net Profit / Total Staked) * 100
- **Markets Created:** Count of events created

### Leaderboard
Ranked by portfolio value, with secondary sorting by net profit.

## 🛠️ Development Commands

```bash
# Install dependencies
npm install

# Database operations
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema changes to database
npm run db:seed       # Seed database with sample data

# Development
npm run dev           # Start dev server (localhost:3000)
npm run build         # Production build
npm run lint          # ESLint check
```

## 🔍 Key Files to Know

- `src/app/api/bets/route.ts` - Core betting logic with parimutuel pricing
- `src/app/api/events/[id]/resolve/route.ts` - Resolution and payment calculation
- `src/lib/marketImpact.ts` - Parimutuel pricing engine
- `src/lib/positions.ts` - Position and portfolio calculations
- `src/lib/notifications.ts` - Notification system with payment details
- `src/components/Navigation.tsx` - Main nav with portfolio display
- `src/app/market/[id]/page.tsx` - Market detail page with payment breakdown

## 📝 Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."  # PostgreSQL connection string

# NextAuth
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"

# Email (optional for password reset)
EMAIL_SERVER="smtp://..."
EMAIL_FROM="noreply@squadodds.com"
```

## 🎯 Core Business Logic

1. **Betting:** Users place bets on credit (up to $300/bet) → price updates via parimutuel pool ratios → portfolio updates
2. **Market Resolution:** Admin resolves → bets marked WON/LOST → payments calculated → notifications sent → portfolio updates
3. **Market Cancellation:** Admin cancels → all bets marked REFUNDED → portfolio clears → no payments
4. **Portfolio:** Always calculated as sum of ACTIVE bet amounts on ACTIVE markets

---

**Last Updated:** September 2024
**Version:** 2.0 (Credit-based system)
