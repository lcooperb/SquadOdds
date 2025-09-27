"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Trophy,
  TrendingUp,
  DollarSign,
  Target,
  Users,
  Medal,
  Crown,
  Award,
} from "lucide-react";

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

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-400" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-300" />;
      case 3:
        return <Award className="h-6 w-6 text-orange-400" />;
      default:
        return <span className="text-gray-400 font-bold">#{rank}</span>;
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return "success";
    if (rank <= 3) return "warning";
    if (rank <= 5) return "default";
    return "secondary";
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
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <Trophy className="h-10 w-10 text-yellow-400" />
            Leaderboard
          </h1>
          <p className="text-gray-400 text-lg">
            See who&apos;s winning in your friend group prediction market
          </p>
        </div>

        {/* Stats Overview */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {data.meta.totalUsers}
                </div>
                <div className="text-sm text-gray-400">Total Users</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-4 text-center">
                <Target className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {data.meta.activeBettors}
                </div>
                <div className="text-sm text-gray-400">Active Traders</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-4 text-center">
                <DollarSign className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  ${Math.round(data.meta.totalVolume).toLocaleString("en-US")}
                </div>
                <div className="text-sm text-gray-400">Total Volume</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-8 w-8 text-orange-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {data.leaderboard.filter((u) => u.stats.netProfit > 0).length}
                </div>
                <div className="text-sm text-gray-400">Profitable Traders</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Timeframe Filter */}
        <div className="flex justify-center mb-8">
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
          <div className="space-y-4">
            {data.leaderboard.map((user, index) => (
              <Card
                key={user.id}
                className={`transition-all duration-200 hover:border-blue-500 ${
                  user.rank <= 3
                    ? "bg-gradient-to-r from-gray-800/50 to-gray-800/30 border-yellow-500/30"
                    : "bg-gray-800/30"
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    {/* Left: Rank & User Info */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-gray-700 rounded-full">
                        {getRankIcon(user.rank)}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3
                            className="text-lg font-semibold text-white cursor-pointer hover:text-blue-400 transition-colors"
                            onClick={() =>
                              router.push(`/profile?id=${user.id}`)
                            }
                          >
                            {user.name}
                          </h3>
                          <Badge variant={getRankBadge(user.rank)}>
                            #{user.rank}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="text-gray-400">
                            Joined{" "}
                            {new Date(user.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Center: Stats */}
                    <div className="hidden md:grid grid-cols-4 gap-6 text-center">
                      <div>
                        <div
                          className={`text-lg font-bold ${
                            user.stats.netProfit >= 0
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {user.stats.netProfit >= 0 ? "+" : "-"}$
                          {Math.round(Math.abs(user.stats.netProfit)).toLocaleString("en-US")}
                        </div>
                        <div className="text-xs text-gray-400">Net Profit</div>
                      </div>

                      <div>
                        <div className="text-lg font-bold text-white">
                          {user.stats.winRate.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-400">Win Rate</div>
                      </div>

                      <div>
                        <div className="text-lg font-bold text-white">
                          {user.stats.totalBets}
                        </div>
                        <div className="text-xs text-gray-400">Total Bets</div>
                      </div>

                      <div>
                        <div
                          className={`text-lg font-bold ${
                            user.stats.roi >= 0
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {user.stats.roi >= 0 ? "+" : ""}
                          {user.stats.roi.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-400">ROI</div>
                      </div>
                    </div>

                    {/* Right: Current Balance */}
                    <div className="text-right">
                      <div className="text-xl font-bold text-white">
                        ${Math.round(user.virtualBalance).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-400">
                        Current Balance
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {user.stats.eventsCreated} markets created
                      </div>
                    </div>
                  </div>
                  {/* Mobile Stats */}
                  <div className="md:hidden mt-4 grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div
                        className={`text-lg font-bold ${
                          user.stats.netProfit >= 0
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {user.stats.netProfit >= 0 ? "+" : ""}$
                        {user.stats.netProfit.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-400">Net Profit</div>
                    </div>

                    <div>
                      <div className="text-lg font-bold text-white">
                        {user.stats.winRate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-400">Win Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
