# SquadOdds - Claude Documentation Index

**Complete documentation for AI-assisted development of the SquadOdds prediction market platform.**

---

## 📚 Core Documentation

### [project-overview.md](./project-overview.md)
**Start here for project understanding.**

- Architecture & tech stack
- Credit-based betting system (no wallet)
- Parimutuel pricing model
- Portfolio calculations
- Payment obligations system
- Database schema overview
- Key business logic

**Keywords:** `prediction-market`, `credit-betting`, `parimutuel`, `portfolio`, `next.js`, `prisma`, `typescript`

---

### [changelog.md](./changelog.md)
**History of major changes and migrations.**

- **v2.0:** Wallet → Credit System Migration
- **v1.8:** Payment Tracking on Resolution
- **v1.7:** Cancellation Terminology Updates
- **v1.6:** Admin Panel Cleanup
- Earlier versions and features

**Keywords:** `changes`, `updates`, `migrations`, `features`, `breaking-changes`

---

### [conventions.md](./conventions.md)
**Coding standards, patterns, and common issues.**

- **ESLint errors & solutions** (apostrophes, unused vars)
- TypeScript conventions
- Prisma patterns (transactions, decimals)
- API route structure
- React component patterns
- Tailwind CSS conventions
- Anti-patterns to avoid

**Keywords:** `coding-standards`, `eslint`, `typescript`, `conventions`, `best-practices`, `common-errors`

---

### [features.md](./features.md)
**Complete feature documentation.**

- Credit-based betting ($300 per-bet limit)
- Binary & multiple choice markets
- Parimutuel pricing with pool-based odds
- Place bets on YES/NO or options
- Resolution & payment obligations
- Notification system
- Leaderboard & analytics
- Social features (comments, activity)

**Keywords:** `features`, `functionality`, `user-guide`, `capabilities`, `what-it-does`

---

## 🔍 Subsection Documentation

### [api/routes-overview.md](./api/routes-overview.md)
**Complete API route documentation.**

- Authentication routes (signin, signup, password reset)
- Betting routes (place bets, get user bets)
- Events routes (CRUD, resolve, cancel)
- Admin routes (users, events management)
- Notifications, leaderboard, comments
- Request/response examples
- Standard patterns

**Keywords:** `api`, `routes`, `endpoints`, `rest-api`, `backend`, `server`

---

### [components/ui-components.md](./components/ui-components.md)
**React component documentation.**

- Base UI (Button, Modal, Input, Card, Badge)
- Navigation & search
- Betting components (BettingCard, BettingModal)
- Market components (MarketCard, PriceChart)
- Notifications, comments, tutorials
- Component patterns & conventions

**Keywords:** `components`, `ui`, `react`, `frontend`, `tsx`, `interface`

---

### [lib/utilities.md](./lib/utilities.md)
**Utility libraries and helper functions.**

- **marketImpact.ts:** Parimutuel betting system, pool-based pricing
- **positions.ts:** Position & portfolio calculations
- **notifications.ts:** Notification system with payments
- **avatar.ts:** Avatar gradients & initials
- **auth.ts:** NextAuth configuration
- **prisma.ts:** Database client singleton

**Keywords:** `utilities`, `lib`, `helpers`, `functions`, `calculations`, `parimutuel`, `positions`

---

## 🚀 Quick Start for AI Development

### Understanding the System
1. Read **project-overview.md** for architecture
2. Check **changelog.md** for recent changes (especially v2.0 credit system)
3. Review **conventions.md** for coding standards

### Working on Features
- **API Routes:** See `api/routes-overview.md`
- **UI Components:** See `components/ui-components.md`
- **Calculations:** See `lib/utilities.md`
- **Features List:** See `features.md`

### Common Tasks

**Adding a New Market Feature:**
1. Check current market types in `features.md`
2. Review parimutuel pricing logic in `lib/utilities.md` (marketImpact)
3. See betting flow in `api/routes-overview.md` (POST /api/bets)
4. Update UI in `components/ui-components.md` (BettingCard)

**Fixing ESLint Errors:**
1. Check `conventions.md` → Common ESLint Errors
2. Most common: Use `&apos;` for apostrophes in JSX

**Understanding Portfolio:**
1. See `project-overview.md` → Portfolio Logic
2. See `lib/utilities.md` → Position Calculations
3. Formula: Sum of ACTIVE bets on ACTIVE markets

**Resolution & Payments:**
1. See `api/routes-overview.md` → POST /api/events/[id]/resolve
2. See `lib/utilities.md` → notifyMarketResolution
3. Payment breakdown: Proportional distribution

---

## 🔑 Key Concepts

### Credit-Based System (v2.0+)
- **No wallet balance:** Users don't top up or withdraw
- **$300 per-bet limit:** Individual bets capped at $300
- **Portfolio:** Calculated as sum of ACTIVE bets
- **Payments:** Losers owe winners on resolution (settled externally)

### Parimutuel Pricing
- **Pool-Based:** Price = pool ratio (YES pool / total pool)
- **Dynamic Odds:** Larger bets shift pool ratios more
- **Payout:** Winners split losers' pool proportionally
- See `lib/utilities.md` for formulas

### Bet Status Lifecycle
- **ACTIVE** → Bet on active market (in portfolio)
- **WON** → Market resolved in favor (out of portfolio)
- **LOST** → Market resolved against (out of portfolio, owes payment)
- **REFUNDED** → Market cancelled (out of portfolio, no payment)

---

## 🐛 Debugging Guide

### Common Issues

**"Maximum bet is $300" error:**
- System enforces $300 per individual bet
- Not a balance issue (no wallet in v2.0)

**"Insufficient position to sell" error:**
- Calculate net position: sum of all bet.shares for that side
- Can only sell up to net positive position

**Portfolio not updating:**
- Ensure bet status is ACTIVE
- Ensure event status is ACTIVE
- Portfolio = sum(bet.amount) for ACTIVE bets on ACTIVE events

**ESLint apostrophe errors:**
- Use `&apos;` instead of `'` in JSX text
- See `conventions.md` → Common ESLint Errors

**Price not moving after bet:**
- Check parimutuel pool calculation in `src/lib/marketImpact.ts`
- Ensure price history is being recorded
- Verify transaction completed successfully

---

## 📊 File Structure Map

```
.claude/
├── README.md                    # This file (documentation index)
├── project-overview.md          # Architecture, tech stack, core concepts
├── changelog.md                 # Version history and migrations
├── conventions.md               # Coding standards and patterns
├── features.md                  # Complete feature documentation
├── api/
│   └── routes-overview.md       # API endpoints documentation
├── components/
│   └── ui-components.md         # React components documentation
└── lib/
    └── utilities.md             # Utility libraries documentation
```

---

## 🔍 Search Tips

### Finding Information by Keyword

**Credit System:**
- `project-overview.md` → Credit-Based Betting System
- `changelog.md` → v2.0 Migration
- `features.md` → Credit-Based Betting

**Parimutuel / Pricing:**
- `lib/utilities.md` → Parimutuel Betting System
- `features.md` → Parimutuel Pricing
- `project-overview.md` → Parimutuel section

**Portfolio:**
- `project-overview.md` → Portfolio Logic
- `lib/utilities.md` → Position Calculations
- `conventions.md` → Portfolio Calculation Pattern

**Payments / Resolution:**
- `api/routes-overview.md` → POST /api/events/[id]/resolve
- `lib/utilities.md` → notifyMarketResolution
- `features.md` → Market Resolution & Payments

**ESLint Errors:**
- `conventions.md` → Common ESLint Errors & Solutions

**API Routes:**
- `api/routes-overview.md` → Complete route listing

**Components:**
- `components/ui-components.md` → All UI components

---

## 📝 Contributing to Docs

When making significant changes to the codebase:

1. Update `changelog.md` with the change
2. Update relevant section in main docs (project-overview, features, etc.)
3. Add new patterns to `conventions.md` if applicable
4. Update API docs if routes change
5. Update component docs if UI changes

---

## 🎯 Quick Reference

### Most Used Commands
```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # Check ESLint
npm run db:push      # Push schema to database
npm run db:seed      # Seed database
```

### Most Common Imports
```typescript
// Prisma client
import { prisma } from '@/lib/prisma';

// Auth
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Parimutuel Pricing
import { calculateMarketImpact, previewMarketImpact, calculatePoolsFromPrice } from '@/lib/marketImpact';

// Positions
import { calculateUserPosition, getAllUserPositions } from '@/lib/positions';

// Notifications
import { notifyMarketResolution, notifyMarketCancellation } from '@/lib/notifications';
```

### Most Common Patterns
```typescript
// Portfolio calculation
const activeBets = bets.filter(b => b.status === 'ACTIVE' && b.event.status === 'ACTIVE');
const portfolio = activeBets.reduce((sum, b) => sum + Number(b.amount), 0);

// Auth check
const session = await getServerSession(authOptions);
if (!session?.user) return unauthorized();

// Prisma transaction
const result = await prisma.$transaction(async (tx) => {
  // Related operations
});

// Decimal conversion
const amount = Number(bet.amount);
const price = Number(event.yesPrice);
```

---

**Last Updated:** September 2024
**Documentation Version:** 2.0 (Credit System)
**Project Version:** 2.0

---

For questions or improvements to this documentation, open an issue or discuss with the team.
