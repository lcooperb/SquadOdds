# SquadOdds - Coding Conventions & Standards

**Keywords:** coding-standards, eslint, typescript, conventions, best-practices, common-errors

This document outlines coding standards, patterns, and solutions to common issues in the SquadOdds codebase.

---

## 📋 ESLint Configuration

### Current Setup
```json
{
  "extends": "next/core-web-vitals",
  "rules": {
    "react-hooks/exhaustive-deps": "off"
  }
}
```

### What This Means
- **next/core-web-vitals:** Includes Next.js recommended rules + React rules + accessibility rules
- **react-hooks/exhaustive-deps: off:** Disabled to allow manual dependency array management (use with caution)

---

## ⚠️ Common ESLint Errors & Solutions

### 1. Apostrophe/Quote Escaping in JSX

**Error:** `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.

**Problem:**
```tsx
// ❌ WRONG - Causes ESLint error
<p className="text-gray-400">
  See who's winning in your friend group
</p>
```

**Solution:**
```tsx
// ✅ CORRECT - Use &apos; for apostrophes
<p className="text-gray-400">
  See who&apos;s winning in your friend group
</p>

// ✅ ALTERNATIVE - Use template literals
<p className="text-gray-400">
  {`See who's winning in your friend group`}
</p>
```

**When to Use Each:**
- **`&apos;`:** Best for simple text with one or two apostrophes
- **Template literals:** Best for complex text with multiple quotes or dynamic content

**Examples in Codebase:**
```tsx
// Leaderboard page
<p className="text-gray-400">
  See who&apos;s winning in your friend group prediction market
</p>

// Market detail page
<div className="text-sm text-gray-400">Can&apos;t place bets</div>

// Navigation
<h1>Welcome back{session.user.name ? `, ${session.user.name}` : ''}!</h1>
```

### 2. Unused Variables

**Error:** `'variable' is assigned a value but never used`

**Solution:**
```tsx
// ❌ WRONG
const [data, setData] = useState(null);
// data is never used

// ✅ CORRECT - Remove if truly unused
const [, setData] = useState(null);

// ✅ OR use underscore prefix if needed for clarity
const [_data, setData] = useState(null);
```

### 3. Missing Dependencies in useEffect

**Note:** We have `react-hooks/exhaustive-deps: off` so this won't error, but still follow best practices.

**Best Practice:**
```tsx
// ✅ GOOD - Include all dependencies
useEffect(() => {
  fetchData(userId, eventId);
}, [userId, eventId]);

// ⚠️ ACCEPTABLE (with rule off) - But document why
useEffect(() => {
  fetchData(); // Only runs on mount intentionally
}, []); // eslint-disable-line react-hooks/exhaustive-deps
```

---

## 🎯 TypeScript Conventions

### Type Definitions

**Prefer interfaces for objects, types for unions/primitives:**

```typescript
// ✅ GOOD - Use interface for object shapes
interface Event {
  id: string;
  title: string;
  yesPrice: number;
  status: EventStatus;
}

// ✅ GOOD - Use type for unions
type EventStatus = 'ACTIVE' | 'CLOSED' | 'RESOLVED' | 'CANCELLED';
type BetSide = 'YES' | 'NO';
```

### Prisma Type Imports

```typescript
// ✅ GOOD - Import Prisma types when needed
import { Prisma } from '@prisma/client';

// For complex queries with includes
type EventWithBets = Prisma.EventGetPayload<{
  include: { bets: true; options: true };
}>;
```

### Type Casting

```typescript
// ✅ GOOD - Use Number() for Decimal to number conversion
const amount = Number(bet.amount);
const price = Number(event.yesPrice);

// ❌ AVOID - Don't use 'as' unless absolutely necessary
const amount = bet.amount as number; // Unsafe
```

---

## 🗄️ Prisma Patterns

### Transactions

**Always use transactions for related operations:**

```typescript
// ✅ GOOD - Transaction ensures atomicity
const result = await prisma.$transaction(async (tx) => {
  // Update event
  const event = await tx.event.update({
    where: { id: eventId },
    data: { status: 'RESOLVED' }
  });

  // Update all bets
  await tx.bet.updateMany({
    where: { eventId },
    data: { status: 'WON' }
  });

  return event;
});

// ❌ BAD - Separate operations can cause inconsistency
await prisma.event.update({ ... });
await prisma.bet.updateMany({ ... }); // Could fail, leaving inconsistent state
```

### Decimal Handling

**Always convert Prisma Decimals to numbers:**

```typescript
// ✅ GOOD
const totalVolume = Number(event.totalVolume);
const betAmount = Number(bet.amount);

// Calculate
const newVolume = totalVolume + betAmount;

// Store back (Prisma auto-converts)
await prisma.event.update({
  data: { totalVolume: newVolume }
});
```

### Include Patterns

```typescript
// ✅ GOOD - Specific includes for what you need
const event = await prisma.event.findUnique({
  where: { id },
  include: {
    bets: {
      include: {
        user: {
          select: { id: true, name: true } // Only select needed fields
        }
      }
    },
    options: true, // Include all option fields
  }
});

// ❌ AVOID - Over-fetching
const event = await prisma.event.findUnique({
  where: { id },
  include: {
    bets: {
      include: {
        user: true // Fetches ALL user fields including password hash
      }
    }
  }
});
```

---

## 🚀 API Route Conventions

### Route Structure

```typescript
// Standard pattern for API routes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Route logic here

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in route:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Auth Checks

```typescript
// ✅ GOOD - Check session first
const session = await getServerSession(authOptions);
if (!session?.user) {
  return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
}

// ✅ GOOD - Admin check when needed
if (!session.user.isAdmin) {
  return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
}
```

### Input Validation

```typescript
// ✅ GOOD - Validate all inputs
const { eventId, side, amount } = await request.json();

if (!eventId || !side || !amount) {
  return NextResponse.json(
    { message: 'Missing required fields' },
    { status: 400 }
  );
}

if (amount <= 0 || amount > 300) {
  return NextResponse.json(
    { message: 'Amount must be between 0 and 300' },
    { status: 400 }
  );
}
```

---

## ⚛️ React Component Patterns

### Component Structure

```typescript
// ✅ GOOD - Consistent structure
export default function ComponentName() {
  // 1. Hooks
  const router = useRouter();
  const [state, setState] = useState(initialValue);

  // 2. Effects
  useEffect(() => {
    fetchData();
  }, []);

  // 3. Event handlers
  const handleClick = () => {
    // ...
  };

  // 4. Render logic
  if (loading) return <LoadingState />;
  if (error) return <ErrorState />;

  // 5. Main render
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

### State Updates

```typescript
// ✅ GOOD - Functional updates when depending on previous state
setCount(prev => prev + 1);
setBets(prev => [...prev, newBet]);

// ❌ BAD - Direct state reference (can cause stale state issues)
setCount(count + 1);
setBets([...bets, newBet]);
```

### Conditional Rendering

```typescript
// ✅ GOOD - Clear conditionals
{session ? (
  <AuthenticatedView />
) : (
  <UnauthenticatedView />
)}

// ✅ GOOD - Boolean rendering
{isLoading && <Spinner />}
{error && <ErrorMessage error={error} />}

// ❌ AVOID - Nested ternaries (hard to read)
{session ? isAdmin ? <AdminView /> : <UserView /> : <LoginView />}
```

---

## 🎨 Tailwind CSS Conventions

### Class Organization

```tsx
// ✅ GOOD - Organized by category
<div className="
  flex items-center justify-between    /* Layout */
  bg-gray-800 border border-gray-700   /* Background & Borders */
  rounded-lg p-4                       /* Spacing */
  hover:border-blue-500 transition-all /* Interactive */
  text-white font-semibold             /* Typography */
">
```

### Responsive Design

```tsx
// ✅ GOOD - Mobile-first approach
<div className="
  text-sm              /* Mobile: small text */
  md:text-base         /* Tablet: base text */
  lg:text-lg           /* Desktop: large text */
  grid grid-cols-1     /* Mobile: single column */
  md:grid-cols-2       /* Tablet: two columns */
  lg:grid-cols-4       /* Desktop: four columns */
">
```

### Color Consistency

**Established color meanings:**

```tsx
// Green = Positive/Profits/Wins
<div className="text-green-400">+$50.00</div>

// Red = Negative/Losses
<div className="text-red-400">-$30.00</div>

// Blue = Primary actions
<Button className="bg-blue-600 hover:bg-blue-700">Place Bet</Button>

// Purple = Categories/Filters
<button className="bg-purple-600">Category</button>

// Gray-800/90 = Card backgrounds
<div className="bg-gray-800/90">Card content</div>
```

---

## 📊 Calculation Conventions

### Portfolio Calculation

**Always use this pattern:**

```typescript
// ✅ CORRECT - Portfolio is calculated, never stored
const activeBets = user.bets.filter(b =>
  b.status === 'ACTIVE' && b.event.status === 'ACTIVE'
);
const portfolio = activeBets.reduce((sum, b) => sum + Number(b.amount), 0);
```

### Position Calculation

```typescript
// ✅ CORRECT - Sum shares (includes negative for sells)
const netPosition = userBets.reduce((sum, bet) => sum + Number(bet.shares), 0);

// ❌ WRONG - Sum amounts (doesn't account for sells)
const position = userBets.reduce((sum, bet) => sum + Number(bet.amount), 0);
```

### Price Formatting

```typescript
// ✅ GOOD - Consistent formatting
const priceString = price.toFixed(1); // "50.5"
const currencyString = amount.toLocaleString('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
}); // "1,234.56"
```

---

## 🚫 Anti-Patterns to Avoid

### 1. Virtual Balance References

```typescript
// ❌ NEVER - Virtual balance is deprecated
if (user.virtualBalance < amount) { ... }
await updateUserBalance(-amount);

// ✅ INSTEAD - Use bet limit check
if (amount > 300) { ... }
// No balance operations needed
```

### 2. String Comparison for Numbers

```typescript
// ❌ BAD
if (bet.amount === '50') { ... }

// ✅ GOOD
if (Number(bet.amount) === 50) { ... }
```

### 3. Mutating Props or State

```typescript
// ❌ BAD
props.bets.push(newBet);
state.users[0].name = 'New Name';

// ✅ GOOD
setBets([...bets, newBet]);
setUsers(users.map(u => u.id === userId ? { ...u, name: 'New Name' } : u));
```

---

## 📝 Documentation Standards

### Code Comments

```typescript
// ✅ GOOD - Explain WHY, not WHAT
// Calculate proportional distribution: Each loser's bet is split among winners
// based on their winning bet sizes (bigger winners get bigger shares)
const winnerShare = winningBet.amount / totalWinningAmount;

// ❌ BAD - Comments that just restate the code
// Calculate winner share
const winnerShare = winningBet.amount / totalWinningAmount;
```

### TODO Comments

```typescript
// ✅ GOOD - Action item with context
// TODO: Optimize this query to avoid N+1 problem when fetching 100+ events
const events = await prisma.event.findMany({ include: { bets: true } });

// ❌ BAD - Vague
// TODO: Fix this
const events = await prisma.event.findMany({ include: { bets: true } });
```

---

## 🧪 Testing Patterns

### Manual Testing Checklist

When making changes, test:

1. **Auth flows:** Sign in, sign out, protected routes
2. **Betting:** Place bet, check portfolio update, verify price change
3. **Market resolution:** Resolve market, check notifications, verify payments
4. **Mobile responsiveness:** Test on mobile viewport
5. **Edge cases:** Empty states, error states, large numbers

### Common Test Scenarios

```typescript
// Test empty states
if (bets.length === 0) return <EmptyState />;

// Test error handling
try {
  await apiCall();
} catch (error) {
  console.error('Error:', error);
  // Show error to user
}

// Test large numbers
const largeAmount = 999999.99;
const formatted = largeAmount.toLocaleString('en-US'); // "999,999.99"
```

---

## 🔧 Development Workflow

### Git Commit Messages

```bash
# ✅ GOOD - Clear, descriptive
git commit -m "Add payment breakdown UI to resolved market pages"
git commit -m "Fix: Portfolio calculation now excludes cancelled bets"
git commit -m "Refactor: Extract parimutuel logic to marketImpact.ts"

# ❌ BAD - Vague
git commit -m "Updates"
git commit -m "Fixed stuff"
git commit -m "WIP"
```

### Branch Naming

```bash
# ✅ GOOD
feature/payment-tracking
fix/portfolio-calculation-bug
refactor/admin-panel-cleanup

# ❌ BAD
my-branch
test
feature
```

---

## 📚 Key Takeaways

1. **Always use `&apos;` for apostrophes in JSX text**
2. **Convert Prisma Decimals with `Number()` before calculations**
3. **Use transactions for related database operations**
4. **Never reference virtualBalance (deprecated in v2.0)**
5. **Portfolio = sum of ACTIVE bets on ACTIVE markets (calculated, not stored)**
6. **Follow mobile-first responsive design**
7. **Use consistent color system (green=profit, red=loss, blue=action)**
8. **Validate all API inputs before processing**
9. **Always check auth session in protected routes**
10. **Document WHY not WHAT in code comments**

---

**Last Updated:** September 2024
