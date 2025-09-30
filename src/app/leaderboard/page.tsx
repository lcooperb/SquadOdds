"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trophy } from "lucide-react";
import { gradientFromString, initialsFromName } from "@/lib/avatar";

interface LeaderboardUser {
  id: string;
  name: string;
  image?: string;
  virtualBalance: number;
  totalWinnings: number;
  totalLosses: number;
  createdAt: string;
  stats: {
    totalBets: number;
    totalStaked: number;
    netProfit: number;
    winRate: number;
    roi: number;
    eventsCreated: number;
  };
  rank: number;
}

interface LeaderboardData {
  leaderboard: LeaderboardUser[];
  meta: {
    totalUsers: number;
    activeBettors: number;
    totalVolume: number;
    timeframe: string;
  };
}

export default function Leaderboard() {
  const router = useRouter();
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("all");

  useEffect(() => {
    fetchLeaderboard();
  }, [timeframe]);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`/api/leaderboard?timeframe=${timeframe}`);
      if (response.ok) {
        const leaderboardData = await response.json();
        setData(leaderboardData);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-white">Loading leaderboard...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Leaderboard
          </h1>
          <p className="text-gray-400">
            See who&apos;s winning in your friend group prediction market
          </p>
        </div>

        {/* Stats Overview */}
        {data && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <div className="bg-gray-800/90 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {data.meta.totalUsers}
              </div>
              <div className="text-sm text-gray-400">Total Users</div>
            </div>

            <div className="bg-gray-800/90 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {data.meta.activeBettors}
              </div>
              <div className="text-sm text-gray-400">Active Traders</div>
            </div>

            <div className="bg-gray-800/90 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white mb-1">
                ${Math.round(data.meta.totalVolume).toLocaleString("en-US")}
              </div>
              <div className="text-sm text-gray-400">Total Volume</div>
            </div>

            <div className="bg-gray-800/90 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {data.leaderboard.filter((u) => u.stats.netProfit > 0).length}
              </div>
              <div className="text-sm text-gray-400">Profitable</div>
            </div>
          </div>
        )}

        {/* Timeframe Filter */}
        <div className="flex justify-start mb-8">
          <div className="flex gap-2 bg-gray-800 rounded-lg p-1">
            {[
              { key: "all", label: "All Time" },
              { key: "month", label: "This Month" },
              { key: "week", label: "This Week" },
            ].map((period) => (
              <button
                key={period.key}
                onClick={() => setTimeframe(period.key)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  timeframe === period.key
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-700"
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        {data && data.leaderboard.length > 0 ? (
          <div className="space-y-3">
            {data.leaderboard.map((user, index) => (
              <div
                key={user.id}
                onClick={() => router.push(`/profile?id=${user.id}`)}
                className="bg-gray-800/90 border border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  {/* Left: Rank, Avatar & User Info */}
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10">
                      <span className={`text-lg md:text-xl font-bold ${
                        user.rank === 1 ? "text-yellow-400" :
                        user.rank === 2 ? "text-gray-300" :
                        user.rank === 3 ? "text-orange-400" : "text-gray-400"
                      }`}>
                        #{user.rank}
                      </span>
                    </div>
                    <div
                      className="h-9 w-9 md:h-10 md:w-10 rounded-full flex items-center justify-center text-[10px] md:text-xs font-semibold text-gray-900/90"
                      style={gradientFromString(user.id || user.name)}
                    >
                      {initialsFromName(user.name)}
                    </div>

                    <div>
                      <h3 className="text-base md:text-lg font-semibold text-white">
                        {user.name}
                      </h3>
                      <div className="text-xs md:text-sm text-gray-400 mt-1">
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Center: Stats - Desktop */}
                  <div className="hidden md:flex items-center gap-8">
                    <div className="text-center">
                      <div
                        className={`text-lg font-bold ${
                          user.stats.netProfit >= 0 ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {user.stats.netProfit >= 0 ? "+" : ""}$
                        {Math.round(Math.abs(user.stats.netProfit)).toLocaleString("en-US")}
                      </div>
                      <div className="text-xs text-gray-400">Profit</div>
                    </div>

                    <div className="text-center">
                      <div className="text-lg font-bold text-white">
                        {user.stats.winRate.toFixed(0)}%
                      </div>
                      <div className="text-xs text-gray-400">Win Rate</div>
                    </div>

                    <div className="text-center">
                      <div className="text-lg font-bold text-white">
                        {user.stats.totalBets}
                      </div>
                      <div className="text-xs text-gray-400">Bets</div>
                    </div>
                  </div>

                  {/* Right: Current Balance */}
                  <div className="text-right">
                    <div className="text-lg md:text-xl font-bold text-white">
                      ${Math.round(user.virtualBalance).toLocaleString()}
                    </div>
                    <div className="text-xs md:text-sm text-gray-400">Balance</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No data yet
            </h3>
            <p className="text-gray-400">
              Start trading to see rankings appear on the leaderboard!
            </p>
          </div>
        )}
      </main>
    </>
  );
}
