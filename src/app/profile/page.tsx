"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import {
  User,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  BarChart3,
  Trophy,
  Activity,
  Clock,
} from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  image?: string;
  virtualBalance: number;
  totalWinnings: number;
  totalLosses: number;
  isAdmin: boolean;
  createdAt: string;
  bets: Array<{
    id: string;
    side: string;
    amount: number;
    price: number;
    shares: number;
    status: string;
    createdAt: string;
    event: {
      id: string;
      title: string;
      category: string;
      status: string;
      resolved: boolean;
      outcome: boolean | null;
    };
    option?: {
      id: string;
      title: string;
    };
  }>;
  createdEvents: Array<{
    id: string;
    title: string;
    category: string;
    status: string;
    resolved: boolean;
    createdAt: string;
  }>;
  _count: {
    bets: number;
    createdEvents: number;
  };
}

export default function Profile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"bets" | "created">("bets");
  const [betFilter, setBetFilter] = useState<"all" | "active" | "won" | "lost">("all");
  const [marketFilter, setMarketFilter] = useState<"all" | "active" | "resolved">("all");

  // Get user ID from URL params or use current user
  const userId = searchParams.get("id") || session?.user?.id;

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
      return;
    }

    fetchProfile();
  }, [session, status, router]);

  const fetchProfile = async () => {
    try {
      const url =
        userId === session?.user?.id ? "/api/users" : `/api/users/${userId}`;
      const response = await fetch(url);
      if (response.ok) {
        const userData = await response.json();
        setProfile(userData);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !session) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-white">Loading profile...</div>
        </div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-2">
              Profile not found
            </h1>
            <p className="text-gray-400">
              Unable to load your profile information.
            </p>
          </div>
        </div>
      </>
    );
  }

  const activeBets = (profile.bets || []).filter(
    (bet) => bet.status === "ACTIVE"
  );
  const completedBets = (profile.bets || []).filter(
    (bet) => bet.status !== "ACTIVE"
  );
  const wonBets = completedBets.filter((bet) => bet.status === "WON");
  const winRate =
    completedBets.length > 0
      ? (wonBets.length / completedBets.length) * 100
      : 0;
  const netProfit =
    Number(profile.totalWinnings || 0) - Number(profile.totalLosses || 0);

  // Filter bets based on current filter
  const filteredBets = (profile.bets || []).filter((bet) => {
    switch (betFilter) {
      case "active":
        return bet.status === "ACTIVE";
      case "won":
        return bet.status === "WON";
      case "lost":
        return bet.status === "LOST";
      default:
        return true;
    }
  });

  // Filter markets based on current filter
  const filteredMarkets = (profile.createdEvents || []).filter((event) => {
    switch (marketFilter) {
      case "active":
        return event.status === "ACTIVE" && !event.resolved;
      case "resolved":
        return event.resolved;
      default:
        return true;
    }
  });

  const getBetStatusColor = (status: string) => {
    switch (status) {
      case "WON":
        return "success";
      case "LOST":
        return "error";
      case "ACTIVE":
        return "default";
      default:
        return "secondary";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "career":
        return "default";
      case "relationships":
        return "error";
      case "personal":
        return "success";
      case "life events":
        return "warning";
      default:
        return "secondary";
    }
  };

  return (
    <>
      <main className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="mb-8">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                {profile.name}
              </h1>
              <p className="text-gray-500 text-sm">
                Member since {new Date(profile.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-4 text-center">
                <DollarSign className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white text-numbers">
                  ${Math.round(Number(profile.virtualBalance)).toLocaleString("en-US")}
                </div>
                <div className="text-sm text-gray-400">Current Balance</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                <div
                  className={`text-2xl font-bold text-numbers ${netProfit >= 0 ? "text-green-400" : "text-red-400"}`}
                >
                  {netProfit >= 0 ? "+" : ""}${Math.round(Math.abs(netProfit)).toLocaleString("en-US")}
                </div>
                <div className="text-sm text-gray-400">Net Profit</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-4 text-center">
                <Target className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white text-numbers">
                  {winRate.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-400">Win Rate</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-4 text-center">
                <Activity className="h-8 w-8 text-orange-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white text-numbers">
                  {profile._count?.bets || 0}
                </div>
                <div className="text-sm text-gray-400">Total Bets</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Winnings</span>
                <span className="text-green-400 font-semibold">
                  +${Math.round(Number(profile.totalWinnings)).toLocaleString("en-US")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Losses</span>
                <span className="text-red-400 font-semibold">
                  -${Math.round(Number(profile.totalLosses)).toLocaleString("en-US")}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-700 pt-2">
                <span className="text-white font-medium">Net Profit/Loss</span>
                <span
                  className={`font-bold ${netProfit >= 0 ? "text-green-400" : "text-red-400"}`}
                >
                  {netProfit >= 0 ? "+" : "-"}${Math.round(Math.abs(netProfit)).toLocaleString("en-US")}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Betting Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Active Bets</span>
                <span className="text-white font-semibold">
                  {activeBets.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Won Bets</span>
                <span className="text-green-400 font-semibold">
                  {wonBets.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Lost Bets</span>
                <span className="text-red-400 font-semibold">
                  {completedBets.length - wonBets.length}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Win Rate</span>
                  <span className="text-white">{winRate.toFixed(1)}%</span>
                </div>
                <Progress value={winRate} variant="yes" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Market Creation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Markets Created</span>
                <span className="text-white font-semibold">
                  {profile._count?.createdEvents || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Active Markets</span>
                <span className="text-white font-semibold">
                  {
                    (profile.createdEvents || []).filter(
                      (e) => e.status === "ACTIVE"
                    ).length
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Resolved Markets</span>
                <span className="text-white font-semibold">
                  {
                    (profile.createdEvents || []).filter((e) => e.resolved)
                      .length
                  }
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Activity</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={activeTab === "bets" ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("bets")}
                >
                  Bets ({(profile.bets || []).length})
                </Button>
                <Button
                  variant={activeTab === "created" ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("created")}
                >
                  Markets ({(profile.createdEvents || []).length})
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {activeTab === "bets" ? (
              <div className="space-y-4">
                {/* Bet Filters */}
                <div className="flex gap-2 border-b border-gray-700 pb-3">
                  <Button
                    variant={betFilter === "all" ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setBetFilter("all")}
                  >
                    All ({(profile.bets || []).length})
                  </Button>
                  <Button
                    variant={betFilter === "active" ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setBetFilter("active")}
                  >
                    Active ({activeBets.length})
                  </Button>
                  <Button
                    variant={betFilter === "won" ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setBetFilter("won")}
                  >
                    Won ({wonBets.length})
                  </Button>
                  <Button
                    variant={betFilter === "lost" ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setBetFilter("lost")}
                  >
                    Lost ({completedBets.length - wonBets.length})
                  </Button>
                </div>

                {/* Bets Table */}
                {filteredBets.length > 0 ? (
                  <div className="space-y-2">
                    {filteredBets.slice(0, 10).map((bet) => (
                      <div
                        key={bet.id}
                        className="flex items-center justify-between py-3 px-4 bg-gray-800/20 rounded-lg hover:bg-gray-800/30 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={getBetStatusColor(bet.status)}>
                              {bet.status}
                            </Badge>
                            <span className="text-sm text-gray-400">{bet.event.category}</span>
                          </div>
                          <h4 className="font-medium text-white truncate pr-4">
                            {bet.event.title}
                          </h4>
                          <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                            <span className="font-medium text-white">
                              {bet.side} {bet.option && `(${bet.option.title})`}
                            </span>
                            <span>${Math.round(Number(bet.amount)).toLocaleString("en-US")}</span>
                            <span>@ {Number(bet.price).toFixed(0)}¢</span>
                            <span>{new Date(bet.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-medium">
                            {Number(bet.shares).toFixed(1)}
                          </div>
                          <div className="text-xs text-gray-400">shares</div>
                          {bet.status !== "ACTIVE" && (
                            <div
                              className={`text-sm font-medium mt-1 ${bet.status === "WON" ? "text-green-400" : "text-red-400"}`}
                            >
                              {bet.status === "WON" ? "+" : "-"}${Math.round(Number(bet.amount)).toLocaleString("en-US")}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {filteredBets.length > 10 && (
                      <div className="text-center pt-3">
                        <p className="text-sm text-gray-400">
                          Showing 10 of {filteredBets.length} bets
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Target className="h-8 w-8 mx-auto mb-2" />
                    <p>No {betFilter !== "all" ? betFilter : ""} bets found</p>
                    <p className="text-sm">
                      {betFilter === "all" ? "Start trading to see your bets here!" : "Try changing the filter above"}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Market Filters */}
                <div className="flex gap-2 border-b border-gray-700 pb-3">
                  <Button
                    variant={marketFilter === "all" ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setMarketFilter("all")}
                  >
                    All ({(profile.createdEvents || []).length})
                  </Button>
                  <Button
                    variant={marketFilter === "active" ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setMarketFilter("active")}
                  >
                    Active ({(profile.createdEvents || []).filter(e => e.status === "ACTIVE" && !e.resolved).length})
                  </Button>
                  <Button
                    variant={marketFilter === "resolved" ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setMarketFilter("resolved")}
                  >
                    Resolved ({(profile.createdEvents || []).filter(e => e.resolved).length})
                  </Button>
                </div>

                {/* Markets Table */}
                {filteredMarkets.length > 0 ? (
                  <div className="space-y-2">
                    {filteredMarkets.slice(0, 10).map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between py-3 px-4 bg-gray-800/20 rounded-lg hover:bg-gray-800/30 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              variant={event.resolved ? "success" : "default"}
                            >
                              {event.resolved ? "RESOLVED" : event.status}
                            </Badge>
                            <span className="text-sm text-gray-400">{event.category}</span>
                          </div>
                          <h4 className="font-medium text-white truncate pr-4">
                            {event.title}
                          </h4>
                          <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                            <span>
                              Created {new Date(event.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/market/${event.id}`)}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            View →
                          </Button>
                        </div>
                      </div>
                    ))}
                    {filteredMarkets.length > 10 && (
                      <div className="text-center pt-3">
                        <p className="text-sm text-gray-400">
                          Showing 10 of {filteredMarkets.length} markets
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Calendar className="h-8 w-8 mx-auto mb-2" />
                    <p>No {marketFilter !== "all" ? marketFilter : ""} markets found</p>
                    <p className="text-sm">
                      {marketFilter === "all" ? "Create your first market!" : "Try changing the filter above"}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
