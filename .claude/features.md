# SquadOdds - Features Documentation

**Keywords:** features, functionality, user-guide, capabilities, what-it-does

Complete documentation of all features in the SquadOdds prediction market platform.

---

## 🎯 Core Betting System

### Credit-Based Betting
**No wallet balance, bet on credit with payment obligations on resolution.**

**How It Works:**
- Users can place individual bets up to **$300** without managing a wallet
- No top-ups or withdrawals required
- Portfolio tracks total value of active positions
- When markets resolve, losers owe winners (settled privately)

**Key Concepts:**
```typescript
// Bet Placement
- Maximum: $300 per individual bet
- No balance check required
- Creates ACTIVE bet immediately

// Portfolio Calculation
Portfolio = Sum of all ACTIVE bets on ACTIVE markets

// Resolution
- Winning bets → Removed from portfolio, user is winner
- Losing bets → Removed from portfolio, user owes winners
- Cancelled bets → Removed from portfolio, no obligations
```

**Status Flow:**
1. **ACTIVE** → Bet placed on active market (in portfolio)
2. **WON** → Market resolved in favor (out of portfolio, winner)
3. **LOST** → Market resolved against (out of portfolio, owes payment)
4. **REFUNDED** → Market cancelled (out of portfolio, no payment)

---

## 📊 Market Types

### Binary Markets (YES/NO)
**Simple prediction with two outcomes.**

**Features:**
- Single question with YES or NO answer
- YES price displayed as probability (0-100%)
- NO price = 100 - YES price
- Users bet on either side
- Market resolves to YES (true) or NO (false)

**Example:**
```
Question: "Will Alice get promoted by end of year?"
YES: 65% | NO: 35%
Users can bet on YES or NO
Resolution: Admin marks as YES or NO
```

**UI Elements:**
- Large YES/NO buttons (side-by-side on desktop, modal on mobile)
- Real-time price display
- Auto-selects highest probability side by default
- Price chart showing YES probability over time

### Multiple Choice Markets
**Prediction with 3+ possible outcomes.**

**Features:**
- Multiple options (e.g., "Alice", "Bob", "Charlie")
- Each option has its own probability
- All probabilities sum to 100%
- Users bet YES on specific options
- Market resolves to one winning option

**Example:**
```
Question: "Who will get promoted first?"
Options:
- Alice: 45%
- Bob: 35%
- Charlie: 20%

User bets YES on "Alice"
Resolution: Admin selects winning option (e.g., "Bob")
```

**UI Elements:**
- List of options with individual prices
- Bet YES on each option independently
- Multi-line price chart (one line per option)
- Synchronized price updates (all options move together to maintain 100% sum)

---

## 💹 Automated Market Maker (AMM)

### Dynamic Pricing
**Prices adjust automatically based on betting activity.**

**Key Features:**
- **Market Impact:** Larger bets move prices more
- **Slippage:** Price increases as you buy (execution price > market price)
- **Adaptive Liquidity:** Small markets get virtual liquidity boost
- **Multi-Slice Execution:** Large trades split across price levels

**How It Works:**
```typescript
1. User places $100 bet on YES at 50%
2. System calculates market impact based on:
   - Bet size ($100)
   - Current price (50%)
   - Total market volume
3. Price moves to ~52% (depending on volume)
4. User gets average execution price (~51%)
5. Market price updates for next bettor
```

**Price Impact Factors:**
- **Bet Size:** Bigger bets = bigger price moves
- **Market Volume:** Higher volume = less impact
- **Current Price:** Extreme prices (near 0% or 100%) move less
- **Market Size:** Micro markets (<$200) get liquidity boost to prevent wild swings

**Example Scenarios:**

*Small Market ($100 volume):*
- $20 bet on YES @ 50% → Price moves to ~52% (2% impact)

*Large Market ($5,000 volume):*
- $20 bet on YES @ 50% → Price moves to ~50.2% (0.2% impact)

*Large Bet on Small Market:*
- $100 bet on YES @ 50% in $200 market → Price moves to ~58% (8% impact)
- Bet executes across multiple price levels (slicing)

---

## 💰 Buy/Sell Positions

### Buy (Open Position)
**Enter a new position in the market.**

**Features:**
- Buy YES or NO shares
- Up to $300 per transaction
- Price impact applies (execution price > market price)
- Position added to portfolio
- Market volume increases

**Example:**
```
Buy $100 YES @ 60%
→ Position: $100 YES
→ Portfolio: +$100
→ Market: Price moves up, volume +$100
```

### Sell (Close Position)
**Exit an existing position.**

**Features:**
- Sell YES or NO shares you own
- Can't sell more than owned position
- Receive position value back
- Position removed from portfolio
- Market volume decreases
- Reverse price impact (price moves down when selling YES)

**Example:**
```
Own: $100 YES position
Sell $50 YES @ 65%
→ Position: $50 YES remaining
→ Portfolio: -$50
→ Receive: $50 payout
→ Market: Price moves down slightly, volume -$50
```

**Validation:**
- System checks net position before allowing sell
- Example: If you have $100 YES and $30 YES (bought twice), net position is $130 YES
- Can sell up to $130 YES

---

## 🏆 Market Resolution & Payments

### Resolution Process
**Admin determines market outcome, system calculates payments.**

**Binary Markets:**
1. Admin clicks "Resolve Market"
2. Selects outcome: YES or NO
3. System:
   - Marks winning bets as WON
   - Marks losing bets as LOST
   - Removes all bets from portfolios
   - Calculates payment obligations
   - Sends notifications

**Multiple Choice Markets:**
1. Admin selects winning option
2. System:
   - Marks bets on winning option as WON
   - Marks all other bets as LOST
   - Removes all bets from portfolios
   - Calculates payments
   - Sends notifications

### Payment Obligations
**Proportional distribution: Each loser pays winners based on their bet sizes.**

**Calculation Logic:**
```typescript
Example Market:
- Alice bet $100 YES (winner)
- Bob bet $50 YES (winner)
- Charlie bet $60 NO (loser)

Total winning bets: $150
Alice's share: $100 / $150 = 66.67%
Bob's share: $50 / $150 = 33.33%

Charlie's $60 distributed:
- Charlie owes Alice: $60 × 66.67% = $40
- Charlie owes Bob: $60 × 33.33% = $20
```

**Payment Display:**
- **Market Detail Page:** Full payment matrix showing all obligations
- **Notifications:**
  - Winners: "You won $100. You'll receive $40 from Charlie."
  - Losers: "You lost $60. You owe $40 to Alice, $20 to Bob."

**Settlement:**
- Payments settled privately between users
- Platform does not process actual money transfers
- Users can use Venmo, Cash App, etc.

### Market Cancellation
**Admin can void a market with no payments.**

**Process:**
1. Admin clicks "Cancel Market"
2. Confirms cancellation
3. System:
   - Sets market status to CANCELLED
   - Marks all bets as REFUNDED (voided)
   - Removes all bets from portfolios
   - No payment obligations created
   - Sends cancellation notifications

**Use Cases:**
- Market became invalid (e.g., event already happened)
- Duplicate market created by mistake
- Poorly defined outcome criteria

---

## 🔔 Notification System

### Notification Types

**MARKET_CLOSED**
- Triggers: When market closes for betting (reaches end date or manually closed)
- Message: "The market '[Title]' has closed for betting"
- Recipients: All users with active bets

**MARKET_RESOLVED**
- Triggers: When admin resolves market with outcome
- Message (Winner): "You won $X. You'll receive $Y from: [Names]"
- Message (Loser): "You lost $X. You owe $Y to: [Names]"
- Recipients: All users with bets
- Data: Includes payment obligations relevant to user

**MARKET_CANCELLED**
- Triggers: When admin cancels market
- Message: "Market '[Title]' was cancelled. Your bet has been voided."
- Recipients: All users with active bets
- Note: No payment obligations

### Notification Features
- **Unread Count:** Badge on bell icon in navigation
- **Dropdown View:** Click bell to see recent notifications
- **Mark as Read:** Individual or bulk mark as read
- **Personalized:** Different messages for winners vs. losers
- **Payment Details:** Shows exact amounts owed/owed to user

---

## 👥 Social Features

### Comments System
**Threaded discussions on each market.**

**Features:**
- Top-level comments on markets
- Reply to comments (one level of threading)
- Like comments (heart icon)
- User avatars with gradient backgrounds
- Sorted by newest first

**UI Elements:**
- Comment input box
- Comment list with user names and timestamps
- Reply button and reply UI
- Like count and toggle

### Activity Feed
**Real-time trading activity.**

**Shows:**
- Recent bets placed
- User names and positions
- Bet amounts and prices
- Time of bet
- Side (YES/NO) or option chosen

**Example:**
```
Alice bought $50 YES @ 65% - 2 minutes ago
Bob sold $30 NO @ 35% - 5 minutes ago
Charlie bought $100 on "Alice" @ 45% - 10 minutes ago
```

### Top Holders
**Leaderboard of biggest positions in a market.**

**Features:**
- Shows users with largest positions
- Displays position values and shares
- Crown icon for #1 holder
- Side indicators (YES/NO or option name)
- Live updates as positions change

**Display:**
```
👑 Alice - $150 YES (300 shares @ 50%)
   Bob - $100 NO (250 shares @ 40%)
   Charlie - $75 YES (150 shares @ 50%)
```

---

## 📈 Analytics & Tracking

### Portfolio Dashboard
**User's personal betting overview.**

**Metrics Displayed:**
- **Portfolio Value:** Sum of active bets on active markets
- **Total Bets:** Count of all bets placed
- **Net Profit:** Total winnings - total losses
- **Win Rate:** (Won bets / resolved bets) × 100%
- **ROI:** (Net profit / total staked) × 100%

**Bet History:**
- List of all bets (active and historical)
- Grouped by market
- Shows position, status, amounts
- Filters: All, Active, Won, Lost, Voided

### Leaderboard
**Global user rankings.**

**Ranking System:**
- **Primary Sort:** Portfolio value (descending)
- **Secondary Sort:** Net profit (descending)
- **Displayed Stats:**
  - Rank (#1, #2, #3 with colored badges)
  - Portfolio value
  - Net profit (green/red based on positive/negative)
  - Win rate percentage
  - Total bets count
  - Markets created count

**Filters:**
- All Time
- This Month
- This Week

**UI Features:**
- Click user to view their profile
- Top 3 get special badge colors (gold, silver, bronze)
- Responsive layout (hides some stats on mobile)

### Price Charts
**Interactive price history visualization.**

**Binary Markets:**
- Line chart showing YES probability over time
- X-axis: Time
- Y-axis: Price (0-100%)
- Tooltip shows exact price at point in time

**Multiple Choice Markets:**
- Multi-line chart (one line per option)
- Color-coded by option
- Legend shows option names
- Synchronized timestamps (all options move together)
- Tooltip shows all option prices at that time

**Chart Features:**
- Recharts library (responsive)
- Shows volume at each price point
- Automatically scales to data range
- Updates in real-time as bets placed

---

## 🔍 Search & Discovery

### Market Search
**Real-time dropdown search.**

**Features:**
- Search bar in navigation
- Live results as you type
- Shows top 5 matching markets
- Displays:
  - Market title
  - Current YES price
  - Category badge
  - Total volume
- Click result to navigate to market
- Keyboard navigation support

**Search Algorithm:**
- Matches against title and description
- Case-insensitive
- Substring matching
- Orders by relevance (title matches first)

### Category Filters
**Filter markets by category.**

**Categories:**
- All (default)
- Career
- Relationships
- Personal
- Life Events
- Random

**UI:**
- Pill buttons with active state
- Purple background for selected category
- Resets to "All" when cleared
- Works with search (AND logic)

### Market Sections
**Active vs. Closed markets.**

**Active Markets:**
- Status: ACTIVE
- Users can place bets
- Prices update with trades
- Default view on homepage

**Closed Markets:**
- Status: CLOSED, RESOLVED, CANCELLED
- No new bets allowed
- Shows final outcome (if resolved)
- Shows payment breakdown (if resolved)
- Archival view

---

## 👤 User Profile & Settings

### Profile Page
**User's public profile.**

**Displays:**
- User name and avatar (gradient background)
- Join date
- Total portfolio value
- Betting statistics (win rate, ROI, profit/loss)
- List of bets grouped by market
- Position summaries per market

**Bet Grouping:**
```
Market: "Will Alice get promoted?"
Your Position: $100 YES
Status: Active
Average Price: 55%
```

### Settings
**Account preferences.**

**Available Settings:**
- Change password
- Update Apple Cash email (for external payments)
- Email preferences (future)
- Display name

**Security:**
- Password requires current password verification
- Passwords hashed with bcrypt
- Session management via NextAuth

---

## 🛠️ Admin Features

### Admin Panel
**Market and user management (admin users only).**

**Events Tab:**
- List all markets (active and closed)
- Filters: All, Active, Closed
- Actions per market:
  - **Resolve:** Set outcome, calculate payments
  - **Cancel:** Void all bets, no payments
  - **Edit:** Update title/description
  - **View Details:** See bets, comments, activity

**Users Tab:**
- List all registered users
- Shows per user:
  - Email, name
  - Join date
  - Total bets count
  - Markets created count
- Click to view user profile
- Make/revoke admin status

**Access Control:**
- Only users with `isAdmin: true` can access
- 403 Forbidden for non-admins
- Admin badge shown in navigation

---

## 🎨 UI/UX Features

### Responsive Design
**Mobile-first approach.**

**Desktop (≥768px):**
- Side-by-side betting interface
- Larger buttons and text
- More stats visible
- Multi-column layouts

**Mobile (<768px):**
- Modal-based betting
- Touch-friendly buttons (min 44px)
- Simplified stats
- Single column layouts
- Hamburger menu

### Visual Hierarchy
**Consistent color system.**

- **Green (#10b981):** Profits, winnings, positive values
- **Red (#ef4444):** Losses, negative values
- **Blue (#2563eb):** Primary actions, links
- **Purple (#9333ea):** Category badges, filters
- **Gray-800/90:** Card backgrounds (muted for contrast)
- **White:** Primary text
- **Gray-400:** Secondary text

### Animations
**Smooth transitions.**

- Modal slide-up on open
- Fade-in on content load
- Hover states on buttons/cards
- Price chart animations
- Notification badge pulse

### Loading States
**Feedback during async operations.**

- Skeleton loaders for cards
- Spinner for page loads
- Loading text during fetch
- Disabled buttons during submission

---

## 🔐 Security Features

### Authentication
- NextAuth.js with credential provider
- Bcrypt password hashing
- Session-based auth (HTTP-only cookies)
- CSRF protection built-in

### Authorization
- Protected routes (redirect to signin if not authenticated)
- Admin-only routes (403 for non-admins)
- User can only edit own profile/settings

### Input Validation
- All API routes validate inputs
- SQL injection prevention (Prisma parameterized queries)
- XSS prevention (React escapes by default)
- Rate limiting on sensitive routes (future)

### Data Privacy
- Passwords never exposed in API responses
- Sensitive fields excluded from public queries
- User emails only visible to admins

---

## 📱 Progressive Enhancement

### Core Functionality Works Without JS
- Server-side rendering with Next.js
- Forms work with traditional POST
- Links navigate without client-side routing

### Enhanced With JS
- Real-time price updates
- Live search
- Modal interactions
- Chart interactivity
- Notifications dropdown

---

## 🚀 Performance Optimizations

### Database Queries
- Selective field inclusion (avoid over-fetching)
- Indexed fields (userId, eventId on bets)
- Transactions for consistency
- Connection pooling (Prisma)

### Caching
- Server-side component caching (Next.js)
- Static asset caching (Vercel CDN)
- Browser caching for images

### Code Splitting
- Route-based code splitting (Next.js App Router)
- Dynamic imports for heavy components
- Lazy loading for charts

---

## 📊 Data Export (Future)

### Planned Features
- Export bet history to CSV
- Download portfolio report
- Market analytics export
- API for third-party integrations

---

## 🎯 Key Feature Workflows

### Place a Bet
1. Browse markets on homepage or search
2. Click market to view details
3. Select YES or NO (or option for multiple choice)
4. Enter amount (≤$300)
5. See price impact preview
6. Confirm bet
7. Bet added to portfolio
8. Price updates for next user

### Resolve a Market (Admin)
1. Go to admin panel
2. Find market in Events tab
3. Click "Resolve Market"
4. Select outcome (YES/NO or winning option)
5. Confirm resolution
6. System calculates payments
7. All users notified
8. Payment breakdown visible on market page

### Track Performance
1. Go to Profile page
2. View portfolio value and stats
3. See bet history grouped by market
4. Check win rate and ROI
5. Compare to leaderboard ranking

---

**Last Updated:** September 2024
**Version:** 2.0 (Credit-based system)
