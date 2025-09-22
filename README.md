# SquadOdds 🎯

A **Polymarket-inspired prediction market platform** for squads. Create and bet on personal life events with virtual money!

![Next.js](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-blue) ![Prisma](https://img.shields.io/badge/Prisma-2D3748) ![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC)

## ✨ Features

### 🎯 **Core Trading**
- **Real-time Betting**: Place YES/NO bets with dynamic pricing
- **Interactive Charts**: Live price history with Recharts
- **Market Maker Algorithm**: Automatic price adjustments based on volume
- **Virtual Money**: Start with $100, track performance

### 🗣️ **Social Features**
- **Comments System**: Threaded discussions with likes and replies
- **User Positions**: See YES/NO positions next to usernames
- **Top Holders**: Rankings with crown icons for leaders
- **Activity Feed**: Real-time trading activity

### 📊 **Analytics**
- **Personal Dashboard**: Betting history and performance stats
- **Leaderboard**: User rankings with comprehensive metrics
- **Portfolio Tracking**: Win rates, ROI, and profit/loss

### 🔍 **User Experience**
- **Dropdown Search**: Real-time market search with rich previews
- **Ongoing Events**: Support for events without end dates
- **Category Filtering**: Organize by Career, Relationships, Personal, etc.
- **Mobile Responsive**: Works on all devices

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/squadodds.git
   cd squadodds
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Add your values:
   ```env
   NEXTAUTH_SECRET=your-secret-here
   NEXTAUTH_URL=http://localhost:3000
   DATABASE_URL="file:./dev.db"
   ```

4. **Set up the database**
   ```bash
   npx prisma db push
   npx ts-node scripts/seed.ts  # Optional: Add sample data
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

Visit [http://localhost:3000](http://localhost:3000) to see your app!

## 🧪 Demo Accounts

If you run the seed script, you can sign in with:
- **alice@example.com** / password123
- **bob@example.com** / password123  
- **charlie@example.com** / password123

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **UI Components**: Custom component library

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── create/            # Market creation
│   ├── market/[id]/       # Individual market pages
│   └── ...
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   ├── MarketCard.tsx    # Market display cards
│   ├── BettingModal.tsx  # Trading interface
│   └── ...
├── lib/                  # Utilities and configurations
prisma/                   # Database schema and migrations
```

## 🎮 How to Use

1. **Sign Up**: Create an account to get $100 virtual money
2. **Browse Markets**: Explore betting opportunities on the homepage
3. **Place Bets**: Click any market to see details and place YES/NO bets
4. **Create Markets**: Add new events for your squad
5. **Engage**: Comment on markets and see live trading activity
6. **Track Performance**: Monitor your portfolio and leaderboard ranking

## 🔒 Security Notes

- All sensitive data is in `.env` (not committed to git)
- Passwords are hashed with bcrypt
- Session management via NextAuth.js
- Input validation on all API endpoints

## 🚀 Deployment

Ready to deploy on Vercel, Netlify, or any Node.js hosting platform.

For Vercel:
```bash
npm run build
vercel deploy
```

## 📝 License

MIT License - feel free to use this for your own friend group!

## 🤝 Contributing

Found a bug or have a feature idea? Open an issue or submit a PR!

---

**Built with ❤️ for squad drama** 😄
