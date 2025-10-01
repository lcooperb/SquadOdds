# SquadOdds - UI Components Documentation

**Keywords:** components, ui, react, frontend, tsx, interface

Complete documentation of all React components in the SquadOdds platform.

---

## 🧱 Base UI Components (`src/components/ui/`)

### Button
**Reusable button component with variants.**

**File:** `src/components/ui/Button.tsx`

**Props:**
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}
```

**Variants:**
- `primary`: Blue background (default)
- `secondary`: Gray background
- `ghost`: Transparent, hover effect
- `danger`: Red background

**Usage:**
```tsx
<Button variant="primary" size="lg" onClick={handleClick}>
  Place Bet
</Button>

<Button variant="ghost">Cancel</Button>

<Button variant="danger" disabled={loading}>
  Delete Market
</Button>
```

---

### Modal
**Reusable modal/dialog component.**

**File:** `src/components/ui/Modal.tsx`

**Props:**
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}
```

**Features:**
- Backdrop click to close
- ESC key to close
- Slide-up animation on mobile
- Fade-in on desktop
- Scroll lock when open

**Usage:**
```tsx
<Modal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  title="Place a Bet"
  size="md"
>
  <div>Modal content here</div>
</Modal>
```

---

### Input
**Styled text input component.**

**File:** `src/components/ui/Input.tsx`

**Props:**
```typescript
interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number';
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}
```

**Features:**
- Label support
- Error state with red border
- Disabled state
- Placeholder styling

**Usage:**
```tsx
<Input
  type="number"
  label="Bet Amount"
  value={amount}
  onChange={(e) => setAmount(e.target.value)}
  placeholder="Enter amount"
  error={error}
/>
```

---

### Card
**Container component for content sections.**

**File:** `src/components/ui/Card.tsx`

**Props:**
```typescript
interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean; // Enable hover effect
}
```

**Usage:**
```tsx
<Card hover onClick={() => router.push(`/market/${id}`)}>
  <h3>Market Title</h3>
  <p>Description</p>
</Card>
```

---

### Badge
**Small label component.**

**File:** `src/components/ui/Badge.tsx`

**Props:**
```typescript
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}
```

**Variants:**
- `default`: Gray
- `success`: Green
- `warning`: Yellow
- `danger`: Red

**Usage:**
```tsx
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="danger">Closed</Badge>
```

---

### Progress
**Progress bar component.**

**File:** `src/components/ui/Progress.tsx`

**Props:**
```typescript
interface ProgressProps {
  value: number; // 0-100
  max?: number;
  className?: string;
}
```

**Usage:**
```tsx
<Progress value={65} max={100} />
```

---

## 🧭 Navigation Components

### Navigation
**Main app navigation bar with authentication and portfolio.**

**File:** `src/components/Navigation.tsx`

**Features:**
- **Logo/Brand:** Links to home
- **Search Bar:** Real-time market search (desktop)
- **Nav Links:** Markets, Leaderboard, Portfolio, Admin (if admin)
- **Portfolio Display:** Shows real-time portfolio value
- **Notifications:** Bell icon with unread count
- **User Menu:** Avatar dropdown with profile, settings, sign out
- **Mobile Menu:** Hamburger menu with all navigation

**State Management:**
```typescript
const [isMenuOpen, setIsMenuOpen] = useState(false);
const [userBalance, setUserBalance] = useState<number | null>(null);
const [portfolioValue, setPortfolioValue] = useState<number | null>(null);
const [pendingAdminCount, setPendingAdminCount] = useState<number>(0);
```

**Portfolio Calculation:**
```typescript
const fetchUserBalance = async () => {
  const user = await fetch('/api/users').then(r => r.json());
  const activeBets = user.bets.filter(b =>
    b.status === 'ACTIVE' && b.event.status === 'ACTIVE'
  );
  const portfolio = activeBets.reduce((sum, b) => sum + Number(b.amount), 0);
  setPortfolioValue(portfolio);
};
```

**Responsive Behavior:**
- Desktop: Full nav with search, links, portfolio, notifications, user menu
- Mobile: Collapsed nav with hamburger, portfolio, notifications

**Usage:**
```tsx
// In layout.tsx
<Navigation />
<main>{children}</main>
```

---

### SearchDropdown
**Real-time market search with dropdown results.**

**File:** `src/components/SearchDropdown.tsx`

**Features:**
- Live search as you type
- Debounced API calls (300ms)
- Top 5 results displayed
- Click result to navigate
- Keyboard navigation support
- Click outside to close

**State:**
```typescript
const [query, setQuery] = useState('');
const [results, setResults] = useState<Event[]>([]);
const [isOpen, setIsOpen] = useState(false);
```

**Search Logic:**
```typescript
useEffect(() => {
  if (query.length < 2) {
    setResults([]);
    return;
  }

  const timer = setTimeout(async () => {
    const response = await fetch(`/api/events?search=${query}&status=ACTIVE`);
    const data = await response.json();
    setResults(data.slice(0, 5));
  }, 300);

  return () => clearTimeout(timer);
}, [query]);
```

**Result Display:**
```tsx
<div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 rounded-lg shadow-lg">
  {results.map(event => (
    <div key={event.id} onClick={() => router.push(`/market/${event.id}`)}>
      <div className="font-semibold">{event.title}</div>
      <div className="text-sm">YES: {event.yesPrice}%</div>
      <Badge>{event.category}</Badge>
    </div>
  ))}
</div>
```

---

### Brand
**Logo/brand component with consistent sizing.**

**File:** `src/components/Brand.tsx`

**Props:**
```typescript
interface BrandProps {
  size?: number; // Height in pixels
  className?: string;
}
```

**Features:**
- SVG logo or lockup
- Responsive sizing
- Consistent brand display
- Links to home page

**Usage:**
```tsx
<Brand size={32} className="flex-shrink-0" />
```

---

## 🎰 Betting Components

### BettingCard
**Desktop betting interface (side-by-side YES/NO buttons).**

**File:** `src/components/BettingCard.tsx`

**Features:**
- **Large YES/NO buttons** (or option buttons for multiple choice)
- **Amount input** with $300 max validation
- **Price impact preview** (estimated position, final price)
- **Auto-selection** of highest probability option on load
- **BUY/SELL mode toggle**
- **Position validation** for sell operations

**State:**
```typescript
const [amount, setAmount] = useState('');
const [selectedSide, setSelectedSide] = useState<'YES' | 'NO'>('YES');
const [type, setType] = useState<'BUY' | 'SELL'>('BUY');
const [priceImpact, setPriceImpact] = useState(null);
```

**Price Impact Calculation:**
```typescript
useEffect(() => {
  if (!amount || Number(amount) <= 0) {
    setPriceImpact(null);
    return;
  }

  const result = previewMarketImpact(
    Number(amount),
    currentPrice,
    Number(event.totalVolume),
    selectedSide
  );

  setPriceImpact(result);
}, [amount, selectedSide, event]);
```

**Bet Placement:**
```typescript
const handlePlaceBet = async () => {
  const response = await fetch('/api/bets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventId: event.id,
      side: selectedSide,
      amount: Number(amount),
      type,
      optionId: selectedOption?.id
    })
  });

  if (response.ok) {
    // Refresh event data
    router.refresh();
  }
};
```

**Desktop Only:**
```tsx
<div className="hidden md:block">
  <BettingCard event={event} />
</div>
```

---

### BettingModal
**Mobile betting modal (bottom sheet).**

**File:** `src/components/BettingModal.tsx`

**Features:**
- Triggered by tapping YES/NO buttons on mobile
- Slide-up animation
- Same betting logic as BettingCard
- Touch-friendly interface
- Backdrop to close

**Usage:**
```tsx
<div className="md:hidden">
  <button onClick={() => openBettingModal('YES')}>
    Bet YES
  </button>
</div>

<BettingModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  event={event}
  initialSide={selectedSide}
/>
```

---

## 📊 Market Components

### MarketCard
**Market preview card for listings.**

**File:** `src/components/MarketCard.tsx`

**Props:**
```typescript
interface MarketCardProps {
  event: Event;
  hideOngoingTag?: boolean;
}
```

**Displays:**
- Market title (truncated if long)
- Current YES price (or top option price for multiple choice)
- Category badge
- Total volume
- Bet count
- "Ongoing" tag if no end date

**Click Behavior:**
- Navigates to market detail page

**Usage:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
  {events.map(event => (
    <MarketCard key={event.id} event={event} />
  ))}
</div>
```

---

### PriceChart
**Interactive price history chart.**

**File:** `src/components/PriceChart.tsx`

**Props:**
```typescript
interface PriceChartProps {
  eventId: string;
  marketType: 'BINARY' | 'MULTIPLE';
  options?: MarketOption[]; // For multiple choice
}
```

**Features:**
- **Binary:** Single line showing YES probability
- **Multiple Choice:** Multi-line chart, one per option
- **Recharts library** (LineChart, XAxis, YAxis, Tooltip, Legend)
- Responsive sizing
- Time-based X-axis
- 0-100% Y-axis

**Binary Chart:**
```tsx
<LineChart data={priceHistory}>
  <XAxis dataKey="timestamp" />
  <YAxis domain={[0, 100]} />
  <Tooltip />
  <Line
    type="monotone"
    dataKey="yesPrice"
    stroke="#10b981"
    strokeWidth={2}
  />
</LineChart>
```

**Multiple Choice Chart:**
```tsx
<LineChart data={priceHistory}>
  <XAxis dataKey="timestamp" />
  <YAxis domain={[0, 100]} />
  <Tooltip />
  <Legend />
  {options.map((option, index) => (
    <Line
      key={option.id}
      type="monotone"
      dataKey={option.id}
      name={option.title}
      stroke={colors[index]}
      strokeWidth={2}
    />
  ))}
</LineChart>
```

---

### MarketComments
**Comments and activity feed for markets.**

**File:** `src/components/MarketComments.tsx`

**Props:**
```typescript
interface MarketCommentsProps {
  eventId: string;
  bets: Bet[];
}
```

**Features:**
- **Tabs:** Comments, Activity
- **Comments Tab:**
  - Comment input box
  - Threaded comments (replies)
  - Like/unlike functionality
  - User avatars
  - Timestamps
- **Activity Tab:**
  - Recent bets list
  - User names and positions
  - Amounts and prices
  - Time of bet

**Comment Submission:**
```typescript
const handleSubmitComment = async () => {
  await fetch(`/api/events/${eventId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, parentId })
  });
  // Refresh comments
};
```

**Like Toggle:**
```typescript
const handleLike = async (commentId: string) => {
  await fetch(`/api/comments/${commentId}/like`, {
    method: 'POST'
  });
  // Update like state
};
```

---

### AddOptionModal
**Modal to add options to multiple choice markets (Admin).**

**File:** `src/components/AddOptionModal.tsx`

**Props:**
```typescript
interface AddOptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  onOptionAdded: () => void;
}
```

**Features:**
- Input for option title
- Input for option description (optional)
- Submit to create option
- Automatically recalculates all option prices

**Usage:**
```tsx
<AddOptionModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  eventId={event.id}
  onOptionAdded={() => router.refresh()}
/>
```

---

### EditMarketModal
**Modal to edit market title/description (Admin).**

**File:** `src/components/EditMarketModal.tsx`

**Props:**
```typescript
interface EditMarketModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
  onEventUpdated: () => void;
}
```

**Features:**
- Edit title
- Edit description
- Submit to update event

**Usage:**
```tsx
<EditMarketModal
  isOpen={isEditModalOpen}
  onClose={() => setIsEditModalOpen(false)}
  event={event}
  onEventUpdated={() => router.refresh()}
/>
```

---

## 🔔 Notification Components

### NotificationDropdown
**Bell icon with notification dropdown.**

**File:** `src/components/NotificationDropdown.tsx`

**Features:**
- Bell icon in navigation
- Unread count badge
- Dropdown with recent notifications
- Click notification to view details
- Mark as read functionality
- Mark all as read button

**State:**
```typescript
const [notifications, setNotifications] = useState<Notification[]>([]);
const [isOpen, setIsOpen] = useState(false);
const [unreadCount, setUnreadCount] = useState(0);
```

**Fetch Notifications:**
```typescript
const fetchNotifications = async () => {
  const response = await fetch('/api/notifications');
  const data = await response.json();
  setNotifications(data);
  setUnreadCount(data.filter(n => !n.read).length);
};
```

**Mark as Read:**
```typescript
const markAsRead = async (notificationId: string) => {
  await fetch(`/api/notifications/${notificationId}`, {
    method: 'PATCH'
  });
  fetchNotifications();
};
```

**Display:**
```tsx
<div className="relative">
  <button onClick={() => setIsOpen(!isOpen)}>
    <Bell className="h-5 w-5" />
    {unreadCount > 0 && (
      <span className="absolute -top-1 -right-1 bg-red-600 rounded-full">
        {unreadCount}
      </span>
    )}
  </button>

  {isOpen && (
    <div className="absolute right-0 mt-2 w-80 bg-gray-800 rounded-lg">
      {notifications.map(notification => (
        <div key={notification.id} className={notification.read ? 'opacity-60' : ''}>
          <div className="font-semibold">{notification.title}</div>
          <div className="text-sm">{notification.message}</div>
        </div>
      ))}
    </div>
  )}
</div>
```

---

## 🎓 Tutorial Components (`src/components/tutorial/`)

### OnboardingWizard
**Multi-step onboarding flow.**

**File:** `src/components/tutorial/OnboardingWizard.tsx`

**Features:**
- Step-by-step guide
- Progress indicator
- Next/previous navigation
- Skip option
- Completion tracking

---

### TutorialCard
**Individual tutorial step card.**

**File:** `src/components/tutorial/TutorialCard.tsx`

**Features:**
- Title and description
- Image or illustration
- Action button
- Step indicator

---

### InteractiveExample
**Live demo component for tutorial.**

**File:** `src/components/tutorial/InteractiveExample.tsx`

**Features:**
- Simulated betting interface
- Safe environment (no real bets)
- Feedback on actions
- Reset functionality

---

### ProgressIndicator
**Visual progress for multi-step flows.**

**File:** `src/components/tutorial/ProgressIndicator.tsx`

**Props:**
```typescript
interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}
```

**Usage:**
```tsx
<ProgressIndicator currentStep={2} totalSteps={5} />
```

---

## 🎨 Utility Components

### Providers
**Context providers wrapper.**

**File:** `src/components/Providers.tsx`

**Features:**
- NextAuth SessionProvider
- Wraps app for auth context
- Future: Theme provider, etc.

**Usage:**
```tsx
// In layout.tsx
<Providers>
  <Navigation />
  <main>{children}</main>
</Providers>
```

---

## 📋 Common Patterns

### Component Structure
```tsx
'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ComponentProps {
  // Props type definition
}

export default function Component({ prop1, prop2 }: ComponentProps) {
  // 1. Hooks
  const router = useRouter();
  const [state, setState] = useState(initialValue);

  // 2. Effects
  useEffect(() => {
    // Side effects
  }, [dependencies]);

  // 3. Event handlers
  const handleAction = () => {
    // Handler logic
  };

  // 4. Render guards
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage />;

  // 5. Main render
  return (
    <div className="...">
      {/* Component JSX */}
    </div>
  );
}
```

### Conditional Rendering
```tsx
{/* Boolean rendering */}
{isLoading && <Spinner />}
{error && <ErrorMessage error={error} />}

{/* Ternary */}
{session ? <AuthView /> : <LoginView />}

{/* Null coalescing */}
{data?.length ? <DataList data={data} /> : <EmptyState />}
```

### Event Handlers
```tsx
{/* Inline for simple cases */}
<button onClick={() => setIsOpen(true)}>Open</button>

{/* Named for complex logic */}
const handleSubmit = async () => {
  setLoading(true);
  try {
    await submitData();
    router.refresh();
  } catch (error) {
    setError(error);
  } finally {
    setLoading(false);
  }
};

<button onClick={handleSubmit}>Submit</button>
```

### State Updates
```tsx
{/* Functional updates for dependent state */}
setCount(prev => prev + 1);
setBets(prev => [...prev, newBet]);

{/* Direct for independent state */}
setIsOpen(false);
setError(null);
```

---

## 🎨 Styling Conventions

### Tailwind Class Organization
```tsx
<div className="
  flex items-center justify-between    /* Layout */
  bg-gray-800 border border-gray-700   /* Background & Borders */
  rounded-lg p-4 shadow-lg             /* Decoration */
  hover:bg-gray-700 transition-all     /* Interactive */
  text-white font-semibold text-lg     /* Typography */
">
```

### Responsive Classes
```tsx
<div className="
  text-sm md:text-base lg:text-lg           /* Typography */
  grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4  /* Layout */
  p-2 md:p-4 lg:p-6                         /* Spacing */
">
```

### Color Meanings
- `text-green-400`: Profits, wins, positive
- `text-red-400`: Losses, negative
- `bg-blue-600`: Primary actions
- `bg-purple-600`: Categories, filters
- `bg-gray-800/90`: Card backgrounds

---

## 🔍 Component Discovery

### Find Component by Feature
- **Navigation:** `src/components/Navigation.tsx`
- **Search:** `src/components/SearchDropdown.tsx`
- **Betting:** `src/components/BettingCard.tsx`, `src/components/BettingModal.tsx`
- **Markets:** `src/components/MarketCard.tsx`
- **Charts:** `src/components/PriceChart.tsx`
- **Comments:** `src/components/MarketComments.tsx`
- **Notifications:** `src/components/NotificationDropdown.tsx`
- **Modals:** `src/components/ui/Modal.tsx`
- **Buttons:** `src/components/ui/Button.tsx`

### Component Dependencies
```
Navigation
├── SearchDropdown
├── NotificationDropdown
└── Brand

MarketCard
└── Badge

BettingCard
├── Button
├── Input
└── (uses marketImpact.ts)

PriceChart
└── Recharts library

MarketComments
├── Avatar utilities
└── Comment like system
```

---

**Last Updated:** September 2024
**Version:** 2.0 (Credit-based system)
