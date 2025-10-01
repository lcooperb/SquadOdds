# SquadOdds - API Routes Documentation

**Keywords:** api, routes, endpoints, rest-api, backend, server

Complete documentation of all API routes in the SquadOdds platform.

---

## 🔐 Authentication Routes

### POST `/api/auth/register`
**Register a new user account.**

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "cuid123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Validation:**
- Email must be unique
- Password minimum 8 characters
- Name required

**File:** `src/app/api/auth/register/route.ts`

---

### POST `/api/auth/[...nextauth]`
**NextAuth.js authentication endpoints.**

**Endpoints:**
- `/api/auth/signin` - Sign in with credentials
- `/api/auth/signout` - Sign out
- `/api/auth/session` - Get current session
- `/api/auth/csrf` - CSRF token

**Credential Sign In:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Session Response:**
```json
{
  "user": {
    "id": "cuid123",
    "email": "user@example.com",
    "name": "John Doe",
    "isAdmin": false
  },
  "expires": "2024-10-01T00:00:00.000Z"
}
```

**File:** `src/app/api/auth/[...nextauth]/route.ts`

---

### POST `/api/auth/forgot-password`
**Request password reset email.**

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "Password reset email sent"
}
```

**File:** `src/app/api/auth/forgot-password/route.ts`

---

### POST `/api/auth/reset-password`
**Reset password with token.**

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "password": "newsecurepassword"
}
```

**Response (200):**
```json
{
  "message": "Password reset successfully"
}
```

**File:** `src/app/api/auth/reset-password/route.ts`

---

### POST `/api/auth/change-password`
**Change password (authenticated).**

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

**Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

**Auth Required:** Yes

**File:** `src/app/api/auth/change-password/route.ts`

---

## 💰 Betting Routes

### POST `/api/bets`
**Place a new bet (BUY or SELL).**

**Request Body:**
```json
{
  "eventId": "event123",
  "side": "YES",
  "amount": 100,
  "type": "BUY",
  "optionId": "option123" // For multiple choice markets only
}
```

**Response (201):**
```json
{
  "id": "bet123",
  "userId": "user123",
  "eventId": "event123",
  "side": "YES",
  "amount": 100,
  "price": 51.5,
  "shares": 100,
  "status": "ACTIVE",
  "createdAt": "2024-09-30T12:00:00.000Z"
}
```

**Validation:**
- Amount must be > 0 and ≤ 300
- Event must be ACTIVE
- For SELL: User must have sufficient position
- Side must be YES or NO

**Business Logic:**
1. Validate bet parameters
2. Calculate market impact (AMM)
3. Create bet record
4. Update market price
5. Record price history
6. For multiple choice: Recalculate all option prices

**Auth Required:** Yes

**File:** `src/app/api/bets/route.ts`

---

### GET `/api/bets`
**Get user's bets.**

**Query Parameters:**
- `status` (optional): Filter by status (ACTIVE, WON, LOST, REFUNDED)

**Response (200):**
```json
[
  {
    "id": "bet123",
    "userId": "user123",
    "eventId": "event123",
    "side": "YES",
    "amount": 100,
    "price": 51.5,
    "shares": 100,
    "status": "ACTIVE",
    "createdAt": "2024-09-30T12:00:00.000Z",
    "event": {
      "id": "event123",
      "title": "Will Alice get promoted?",
      "status": "ACTIVE"
    }
  }
]
```

**Auth Required:** Yes

**File:** `src/app/api/bets/route.ts`

---

## 🎯 Events Routes

### GET `/api/events`
**List markets with optional filters.**

**Query Parameters:**
- `category` (optional): Filter by category
- `search` (optional): Search title/description
- `status` (optional): ACTIVE, CLOSED, RESOLVED, CANCELLED (comma-separated)

**Response (200):**
```json
[
  {
    "id": "event123",
    "title": "Will Alice get promoted?",
    "description": "By end of Q4 2024",
    "category": "Career",
    "marketType": "BINARY",
    "yesPrice": 65.5,
    "totalVolume": 500,
    "status": "ACTIVE",
    "resolved": false,
    "endDate": "2024-12-31T23:59:59.000Z",
    "createdAt": "2024-09-01T00:00:00.000Z",
    "_count": {
      "bets": 25
    }
  }
]
```

**File:** `src/app/api/events/route.ts`

---

### POST `/api/events`
**Create a new market.**

**Request Body:**
```json
{
  "title": "Will Alice get promoted?",
  "description": "By end of Q4 2024",
  "category": "Career",
  "marketType": "BINARY",
  "endDate": "2024-12-31T23:59:59.000Z",
  "isOngoing": false
}
```

**For Multiple Choice:**
```json
{
  "title": "Who will get promoted first?",
  "description": "Among the team",
  "category": "Career",
  "marketType": "MULTIPLE",
  "options": [
    { "title": "Alice", "description": "Senior dev" },
    { "title": "Bob", "description": "Team lead" },
    { "title": "Charlie", "description": "Product manager" }
  ],
  "endDate": "2024-12-31T23:59:59.000Z"
}
```

**Response (201):**
```json
{
  "id": "event123",
  "title": "Will Alice get promoted?",
  "status": "ACTIVE",
  "yesPrice": 50.0,
  "totalVolume": 0
}
```

**Auth Required:** Yes

**File:** `src/app/api/events/route.ts`

---

### GET `/api/events/[id]`
**Get market details with bets and comments.**

**Response (200):**
```json
{
  "id": "event123",
  "title": "Will Alice get promoted?",
  "description": "By end of Q4 2024",
  "category": "Career",
  "marketType": "BINARY",
  "yesPrice": 65.5,
  "totalVolume": 500,
  "status": "ACTIVE",
  "resolved": false,
  "outcome": null,
  "bets": [...],
  "comments": [...],
  "priceHistory": [...],
  "options": [...] // For multiple choice
}
```

**File:** `src/app/api/events/[id]/route.ts`

---

### POST `/api/events/[id]/resolve`
**Resolve a market with outcome (Admin only).**

**Binary Market Request:**
```json
{
  "outcome": true // true = YES, false = NO
}
```

**Multiple Choice Request:**
```json
{
  "winningOptionId": "option123"
}
```

**Response (200):**
```json
{
  "message": "Event resolved successfully",
  "event": {
    "id": "event123",
    "status": "RESOLVED",
    "resolved": true,
    "outcome": true
  },
  "outcome": "YES",
  "payments": [
    {
      "from": { "id": "user456", "name": "Bob" },
      "to": { "id": "user123", "name": "Alice" },
      "amount": 50.00
    }
  ]
}
```

**Business Logic:**
1. Validate outcome
2. Update event as resolved
3. Update winning bets to WON status
4. Update losing bets to LOST status
5. Calculate payment obligations (proportional distribution)
6. Send notifications to all bettors with payment details
7. Return event with payments

**Auth Required:** Yes (Admin only)

**File:** `src/app/api/events/[id]/resolve/route.ts`

---

### POST `/api/events/[id]/cancel`
**Cancel a market and void all bets (Admin only).**

**Response (200):**
```json
{
  "message": "Market cancelled successfully",
  "event": {
    "id": "event123",
    "status": "CANCELLED",
    "resolved": true
  },
  "voidedBets": 10,
  "totalVoided": 500
}
```

**Business Logic:**
1. Update event status to CANCELLED
2. Mark all active bets as REFUNDED (voided)
3. Bets removed from user portfolios
4. No payment obligations created
5. Send cancellation notifications

**Auth Required:** Yes (Admin only)

**File:** `src/app/api/events/[id]/cancel/route.ts`

---

### GET `/api/events/[id]/price-history`
**Get price history for binary market.**

**Response (200):**
```json
[
  {
    "id": "price123",
    "eventId": "event123",
    "yesPrice": 50.0,
    "noPrice": 50.0,
    "volume": 100,
    "timestamp": "2024-09-30T12:00:00.000Z"
  },
  {
    "id": "price124",
    "yesPrice": 52.5,
    "noPrice": 47.5,
    "volume": 200,
    "timestamp": "2024-09-30T12:15:00.000Z"
  }
]
```

**File:** `src/app/api/events/[id]/price-history/route.ts`

---

### GET `/api/events/[id]/options/price-history`
**Get price history for multiple choice market options.**

**Response (200):**
```json
[
  {
    "optionId": "option1",
    "title": "Alice",
    "history": [
      {
        "price": 33.33,
        "volume": 100,
        "timestamp": "2024-09-30T12:00:00.000Z"
      },
      {
        "price": 45.0,
        "volume": 200,
        "timestamp": "2024-09-30T12:15:00.000Z"
      }
    ]
  }
]
```

**File:** `src/app/api/events/[id]/options/price-history/route.ts`

---

### GET `/api/events/[id]/holders`
**Get top position holders for a market.**

**Response (200):**
```json
[
  {
    "userId": "user123",
    "userName": "Alice",
    "side": "YES",
    "positionValue": 150,
    "shares": 300,
    "averagePrice": 50.0
  },
  {
    "userId": "user456",
    "userName": "Bob",
    "side": "NO",
    "positionValue": 100,
    "shares": 250,
    "averagePrice": 40.0
  }
]
```

**File:** `src/app/api/events/[id]/holders/route.ts`

---

### GET `/api/events/[id]/comments`
**Get comments for a market.**

**Response (200):**
```json
[
  {
    "id": "comment123",
    "eventId": "event123",
    "userId": "user123",
    "content": "I think this is likely!",
    "createdAt": "2024-09-30T12:00:00.000Z",
    "user": {
      "id": "user123",
      "name": "Alice"
    },
    "likes": [
      { "userId": "user456", "createdAt": "..." }
    ],
    "replies": [...]
  }
]
```

**File:** `src/app/api/events/[id]/comments/route.ts`

---

### POST `/api/events/[id]/comments`
**Add a comment to a market.**

**Request Body:**
```json
{
  "content": "I think this is likely!",
  "parentId": "comment456" // Optional, for replies
}
```

**Response (201):**
```json
{
  "id": "comment123",
  "eventId": "event123",
  "userId": "user123",
  "content": "I think this is likely!",
  "createdAt": "2024-09-30T12:00:00.000Z"
}
```

**Auth Required:** Yes

**File:** `src/app/api/events/[id]/comments/route.ts`

---

### POST `/api/events/[id]/options`
**Add an option to multiple choice market (Admin only).**

**Request Body:**
```json
{
  "title": "David",
  "description": "New team member"
}
```

**Response (201):**
```json
{
  "id": "option123",
  "eventId": "event123",
  "title": "David",
  "price": 20.0
}
```

**Business Logic:**
- Recalculates all option prices to sum to 100%
- Creates price history points for all options

**Auth Required:** Yes (Admin only)

**File:** `src/app/api/events/[id]/options/route.ts`

---

## 💬 Comments Routes

### POST `/api/comments/[id]/like`
**Toggle like on a comment.**

**Response (200):**
```json
{
  "liked": true,
  "likeCount": 5
}
```

**Auth Required:** Yes

**File:** `src/app/api/comments/[id]/like/route.ts`

---

## 👥 User Routes

### GET `/api/users`
**Get current user's data.**

**Response (200):**
```json
{
  "id": "user123",
  "email": "user@example.com",
  "name": "Alice",
  "virtualBalance": 1.00,
  "totalWinnings": 150.00,
  "totalLosses": 50.00,
  "isAdmin": false,
  "createdAt": "2024-09-01T00:00:00.000Z",
  "bets": [...],
  "_count": {
    "bets": 25,
    "createdEvents": 5
  }
}
```

**Auth Required:** Yes

**File:** `src/app/api/users/route.ts`

---

### GET `/api/users/[id]`
**Get user by ID (public profile).**

**Response (200):**
```json
{
  "id": "user123",
  "name": "Alice",
  "createdAt": "2024-09-01T00:00:00.000Z",
  "bets": [...],
  "createdEvents": [...],
  "_count": {
    "bets": 25,
    "createdEvents": 5
  }
}
```

**Note:** Does not expose email or sensitive data

**File:** `src/app/api/users/[id]/route.ts`

---

### GET `/api/users/profile`
**Get user profile with query parameter.**

**Query Parameters:**
- `id` (required): User ID

**Response (200):**
```json
{
  "id": "user123",
  "name": "Alice",
  "totalWinnings": 150.00,
  "totalLosses": 50.00,
  "createdAt": "2024-09-01T00:00:00.000Z",
  "bets": [...],
  "stats": {
    "totalBets": 25,
    "winRate": 60.5,
    "roi": 20.0,
    "netProfit": 100.00
  }
}
```

**File:** `src/app/api/users/profile/route.ts`

---

## 🏆 Leaderboard Routes

### GET `/api/leaderboard`
**Get user rankings.**

**Query Parameters:**
- `timeframe` (optional): all, month, week

**Response (200):**
```json
{
  "leaderboard": [
    {
      "id": "user123",
      "name": "Alice",
      "rank": 1,
      "totalWinnings": 500.00,
      "totalLosses": 100.00,
      "stats": {
        "totalBets": 50,
        "totalStaked": 2000.00,
        "netProfit": 400.00,
        "winRate": 65.0,
        "roi": 20.0,
        "eventsCreated": 10,
        "portfolio": 350.00
      }
    }
  ],
  "meta": {
    "totalUsers": 100,
    "activeBettors": 75,
    "totalVolume": 50000.00,
    "timeframe": "all"
  }
}
```

**Ranking Logic:**
- Primary sort: Portfolio value (descending)
- Secondary sort: Net profit (descending)

**File:** `src/app/api/leaderboard/route.ts`

---

## 🔔 Notification Routes

### GET `/api/notifications`
**Get user's notifications.**

**Response (200):**
```json
[
  {
    "id": "notif123",
    "userId": "user123",
    "type": "MARKET_RESOLVED",
    "title": "Market Resolved",
    "message": "Your bet on 'Will Alice get promoted?' has been resolved. You won $100. You'll receive $50 from Bob.",
    "data": {
      "eventId": "event123",
      "betId": "bet123",
      "result": "WON",
      "amount": 100,
      "payments": [...]
    },
    "read": false,
    "createdAt": "2024-09-30T12:00:00.000Z"
  }
]
```

**Auth Required:** Yes

**File:** `src/app/api/notifications/route.ts`

---

### PATCH `/api/notifications/[id]`
**Mark notification as read.**

**Response (200):**
```json
{
  "id": "notif123",
  "read": true
}
```

**Auth Required:** Yes

**File:** `src/app/api/notifications/[id]/route.ts`

---

### POST `/api/notifications/mark-all-read`
**Mark all notifications as read.**

**Response (200):**
```json
{
  "message": "All notifications marked as read",
  "count": 10
}
```

**Auth Required:** Yes

**File:** `src/app/api/notifications/mark-all-read/route.ts`

---

## 🛡️ Admin Routes

### GET `/api/admin/users`
**Get all users (Admin only).**

**Response (200):**
```json
[
  {
    "id": "user123",
    "email": "alice@example.com",
    "name": "Alice",
    "isAdmin": false,
    "createdAt": "2024-09-01T00:00:00.000Z",
    "_count": {
      "bets": 25,
      "createdEvents": 5
    }
  }
]
```

**Auth Required:** Yes (Admin only)

**File:** `src/app/api/admin/users/route.ts`

---

### PATCH `/api/admin/users/[id]`
**Update user (Admin only).**

**Request Body:**
```json
{
  "isAdmin": true
}
```

**Response (200):**
```json
{
  "id": "user123",
  "isAdmin": true
}
```

**Auth Required:** Yes (Admin only)

**File:** `src/app/api/admin/users/[id]/route.ts`

---

### GET `/api/admin/events`
**Get all events (Admin only).**

**Response (200):**
```json
[
  {
    "id": "event123",
    "title": "Will Alice get promoted?",
    "status": "ACTIVE",
    "createdBy": {
      "id": "user456",
      "name": "Bob"
    },
    "_count": {
      "bets": 25
    }
  }
]
```

**Auth Required:** Yes (Admin only)

**File:** `src/app/api/admin/events/route.ts`

---

## 🔧 Utility Routes

### POST `/api/migrate`
**Run database migrations (Development only).**

**Response (200):**
```json
{
  "message": "Migration completed",
  "changes": [...]
}
```

**File:** `src/app/api/migrate/route.ts`

---

## 📋 Standard Response Codes

### Success Codes
- **200 OK:** Request successful
- **201 Created:** Resource created successfully

### Error Codes
- **400 Bad Request:** Invalid input parameters
- **401 Unauthorized:** Not authenticated
- **403 Forbidden:** Not authorized (e.g., non-admin accessing admin route)
- **404 Not Found:** Resource not found
- **500 Internal Server Error:** Server error

### Error Response Format
```json
{
  "message": "Error description",
  "error": "Detailed error (dev mode only)"
}
```

---

## 🔐 Authentication Flow

### All Protected Routes:
```typescript
const session = await getServerSession(authOptions);
if (!session?.user) {
  return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
}

// Access session.user.id, session.user.email, etc.
```

### Admin Routes:
```typescript
const session = await getServerSession(authOptions);
if (!session?.user?.isAdmin) {
  return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
}
```

---

## 📊 Common Patterns

### Transaction Pattern
```typescript
const result = await prisma.$transaction(async (tx) => {
  // Multiple related operations
  const event = await tx.event.update({ ... });
  const bets = await tx.bet.updateMany({ ... });
  return { event, bets };
});
```

### Include Pattern
```typescript
const event = await prisma.event.findUnique({
  where: { id },
  include: {
    bets: {
      include: {
        user: {
          select: { id: true, name: true } // Only needed fields
        }
      }
    }
  }
});
```

### Pagination Pattern (Future)
```typescript
const { page = 1, limit = 20 } = searchParams;
const skip = (page - 1) * limit;

const events = await prisma.event.findMany({
  skip,
  take: limit,
  orderBy: { createdAt: 'desc' }
});
```

---

**Last Updated:** September 2024
**Version:** 2.0 (Credit-based system)
