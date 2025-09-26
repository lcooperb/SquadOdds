# SquadOdds 🎯

A **Polymarket-inspired prediction market platform** for squads. Create and bet on personal life events with virtual money!

![Next.js](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-blue) ![Prisma](https://img.shields.io/badge/Prisma-2D3748) ![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC)

## 🌟 Live Demo

🚀 **[Try SquadOdds Live](https://squad-odds-49hcpv51i-lcooperbs-projects.vercel.app)**

Experience the full prediction market platform with sample data and user accounts!

## ✨ Features

### 🎯 **Core Trading**
- **Multiple Market Types**: Binary (YES/NO) and Multiple Choice markets
- **Responsive Betting Interface**: Large, intuitive buttons with real-time price display
- **Smart Auto-Selection**: Automatically highlights highest probability options
- **Interactive Charts**: Live price history with Recharts integration
- **Market Maker Algorithm**: Automatic price adjustments based on volume
- **Virtual Money**: Start with $100, track performance with detailed analytics
- **Buy/Sell Modes**: Full trading capabilities with position management

### 🗣️ **Social Features**
- **Comments System**: Threaded discussions with likes and replies
- **Enhanced User Positions**: See actual YES/NO share counts next to usernames
- **Top Holders**: Rankings with crown icons for leaders and detailed position breakdowns
- **Activity Feed**: Real-time trading activity with bet details
- **User Profiles**: Comprehensive trading history and performance metrics

### 📊 **Analytics**
- **Personal Dashboard**: Betting history and performance stats
- **Leaderboard**: User rankings with comprehensive metrics
- **Portfolio Tracking**: Win rates, ROI, and profit/loss

### 🔍 **User Experience**
- **Dropdown Search**: Real-time market search with rich previews
- **Ongoing Events**: Support for events without end dates
- **Category Filtering**: Organize by Career, Relationships, Personal, etc.
- **Fully Mobile Responsive**: Desktop and mobile optimized interfaces
- **Touch-Friendly**: Large buttons and modal-based mobile trading
- **Admin Panel**: Market management and user administration tools
- **Modal Animations**: Smooth slide-up and fade-in transitions

## 🎉 Recent Updates

### v2.0 - Enhanced Trading Experience
- **Responsive Betting Interface**: Large, intuitive YES/NO buttons with side-by-side layout
- **Smart Auto-Selection**: Highest probability options automatically selected on page load
- **Mobile-First Design**: Touch-friendly buttons that open modals on mobile
- **Enhanced Position Display**: Show actual share counts instead of just spending amounts
- **Improved Color System**: Muted backgrounds for better visual hierarchy
- **Modal Animations**: Smooth transitions and better UX

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
│   ├── admin/             # Admin panel for user management
│   ├── api/               # API routes
│   │   ├── auth/          # NextAuth.js API routes
│   │   ├── events/        # Market CRUD operations
│   │   └── users/         # User management APIs
│   ├── auth/              # Authentication pages
│   ├── create/            # Market creation interface
│   ├── dashboard/         # User dashboard and portfolio
│   ├── leaderboard/       # User rankings and stats
│   ├── market/[id]/       # Individual market pages
│   └── profile/           # User profile management
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components (Button, Modal, etc.)
│   ├── AddOptionModal.tsx # Multiple choice option creation
│   ├── BettingCard.tsx   # Desktop trading interface
│   ├── BettingModal.tsx  # Mobile trading modal
│   ├── MarketCard.tsx    # Market display cards
│   ├── MarketComments.tsx # Comments and activity feed
│   ├── Navigation.tsx    # App navigation header
│   ├── PriceChart.tsx    # Interactive price charts
│   └── SearchDropdown.tsx # Real-time market search
├── lib/                  # Utilities and configurations
│   ├── positions.ts      # Position calculation utilities
│   └── utils.ts          # General utility functions
prisma/                   # Database schema and migrations
scripts/                  # Database seeding and utilities
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
