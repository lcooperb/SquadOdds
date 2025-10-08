"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { Target, Calendar } from "lucide-react";
import { gradientFromString, initialsFromName } from "@/lib/avatar";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  image?: string;
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

  // Check if viewing own profile or someone else's
  const isOwnProfile = userId === session?.user?.id;

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
      return;
    }

    fetchProfile();
  }, [session, status, router]);

  // Reset to bets tab when viewing another user's profile
  useEffect(() => {
    if (!isOwnProfile && activeTab === "created") {
      setActiveTab("bets");
    }
  }, [isOwnProfile]);

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

  // Consolidate bets by market
  const consolidatedBets = filteredBets.reduce((acc, bet) => {
    const key = bet.event.id;
    if (!acc[key]) {
      acc[key] = {
        event: bet.event,
        bets: [],
        totalAmount: 0,
        positions: {} as Record<string, { side: string; amount: number; avgPrice: number; count: number; option?: { id: string; title: string } }>,
      };
    }
    acc[key].bets.push(bet);
    acc[key].totalAmount += Number(bet.amount || 0);

    // Track positions by side and option
    const posKey = bet.option ? `${bet.side}-${bet.option.id}` : bet.side;
    if (!acc[key].positions[posKey]) {
      acc[key].positions[posKey] = {
        side: bet.side,
        amount: 0,
        avgPrice: 0,
        count: 0,
        option: bet.option,
        totalWeightedPrice: 0,
      };
    }
    const pos = acc[key].positions[posKey];
    const betAmount = Number(bet.amount || 0);
    const betPrice = Number(bet.price || 0);
    
    // Calculate weighted average price
    if (betPrice > 0) {
      pos.totalWeightedPrice += betPrice * betAmount;
    }
    pos.amount += betAmount;
    pos.count += 1;
    
    // Update average price
    if (pos.amount > 0 && pos.totalWeightedPrice > 0) {
      pos.avgPrice = pos.totalWeightedPrice / pos.amount;
    }

    return acc;
  }, {} as Record<string, any>);

  const consolidatedBetsArray = Object.values(consolidatedBets).sort((a: any, b: any) => {
    const aDate = Math.max(...a.bets.map((bet: any) => new Date(bet.createdAt).getTime()));
    const bDate = Math.max(...b.bets.map((bet: any) => new Date(bet.createdAt).getTime()));
    return bDate - aDate;
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
          <div className="mb-6 flex items-center gap-4">
            <div
              className="h-14 w-14 rounded-full flex items-center justify-center text-base font-semibold text-gray-900/90"
              style={gradientFromString(profile.id || profile.email || profile.name)}
            >
              {initialsFromName(profile.name)}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">
                {profile.name}
              </h1>
              <p className="text-gray-400">
                Member since {new Date(profile.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-gray-800/90 rounded-lg p-4 text-center">
              <div
                className={`text-2xl font-bold mb-1 ${netProfit >= 0 ? "text-green-400" : "text-red-400"}`}
              >
                {netProfit >= 0 ? "+" : ""}${Math.round(Math.abs(netProfit)).toLocaleString("en-US")}
              </div>
              <div className="text-sm text-gray-400">Net Profit</div>
            </div>

            <div className="bg-gray-800/90 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {winRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-400">Win Rate</div>
            </div>

            <div className="bg-gray-800/90 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {profile._count?.bets || 0}
              </div>
              <div className="text-sm text-gray-400">Total Bets</div>
            </div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
          <div className="bg-gray-800/90 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Performance</h3>
            <div className="space-y-3">
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
              <div className="flex justify-between border-t border-gray-700/50 pt-3">
                <span className="text-white font-medium">Net P&L</span>
                <span
                  className={`font-bold ${netProfit >= 0 ? "text-green-400" : "text-red-400"}`}
                >
                  {netProfit >= 0 ? "+" : ""}${Math.round(Math.abs(netProfit)).toLocaleString("en-US")}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/90 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Betting Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Active Bets</span>
                <span className="text-white font-semibold">{activeBets.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Won Bets</span>
                <span className="text-green-400 font-semibold">{wonBets.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Lost Bets</span>
                <span className="text-red-400 font-semibold">{completedBets.length - wonBets.length}</span>
              </div>
              <div className="border-t border-gray-700/50 pt-3">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Win Rate</span>
                  <span className="text-white font-semibold">{winRate.toFixed(1)}%</span>
                </div>
                <Progress value={winRate} variant="yes" />
              </div>
            </div>
          </div>

          {isOwnProfile && (
            <div className="bg-gray-800/90 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Markets</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Created</span>
                  <span className="text-white font-semibold">{profile._count?.createdEvents || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Active</span>
                  <span className="text-white font-semibold">
                    {(profile.createdEvents || []).filter(e => e.status === "ACTIVE").length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Resolved</span>
                  <span className="text-white font-semibold">
                    {(profile.createdEvents || []).filter(e => e.resolved).length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Activity Section */}
        <div className="bg-gray-800/90 rounded-lg p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
            <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
            <div className="flex gap-2">
              <Button
                variant={activeTab === "bets" ? "primary" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("bets")}
                className="text-xs md:text-sm"
              >
                Bets ({(profile.bets || []).length})
              </Button>
              {isOwnProfile && (
                <Button
                  variant={activeTab === "created" ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("created")}
                  className="text-xs md:text-sm"
                >
                  Markets ({(profile.createdEvents || []).length})
                </Button>
              )}
            </div>
          </div>

          <div>
            {activeTab === "bets" || !isOwnProfile ? (
              <div className="space-y-4">
                {/* Bet Filters */}
                <div className="flex flex-wrap gap-2 border-b border-gray-700 pb-3">
                  <Button
                    variant={betFilter === "all" ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setBetFilter("all")}
                    className="text-xs md:text-sm"
                  >
                    All ({(profile.bets || []).length})
                  </Button>
                  <Button
                    variant={betFilter === "active" ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setBetFilter("active")}
                    className="text-xs md:text-sm"
                  >
                    Active ({activeBets.length})
                  </Button>
                  <Button
                    variant={betFilter === "won" ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setBetFilter("won")}
                    className="text-xs md:text-sm"
                  >
                    Won ({wonBets.length})
                  </Button>
                  <Button
                    variant={betFilter === "lost" ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setBetFilter("lost")}
                    className="text-xs md:text-sm"
                  >
                    Lost ({completedBets.length - wonBets.length})
                  </Button>
                </div>

                {/* Bets Table */}
                {consolidatedBetsArray.length > 0 ? (
                  <div className="space-y-3">
                    {consolidatedBetsArray.slice(0, 10).map((consolidated: any) => {
                      const allStatuses = consolidated.bets.map((b: any) => b.status);
                      const hasActive = allStatuses.includes("ACTIVE");
                      const hasWon = allStatuses.includes("WON");
                      const hasLost = allStatuses.includes("LOST");
                      let overallStatus = "ACTIVE";
                      if (!hasActive && hasWon && !hasLost) overallStatus = "WON";
                      else if (!hasActive && !hasWon && hasLost) overallStatus = "LOST";
                      else if (!hasActive) overallStatus = "MIXED";

                      return (
                        <div
                          key={consolidated.event.id}
                          className="bg-gray-900/30 rounded-lg p-4 hover:bg-gray-700/30 transition-colors cursor-pointer"
                          onClick={() => router.push(`/market/${consolidated.event.id}`)}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant={getBetStatusColor(overallStatus)}>
                                  {overallStatus}
                                </Badge>
                                <span className="text-sm text-gray-400">{consolidated.event.category}</span>
                              </div>
                              <h4 className="font-medium text-white mb-1">
                                {consolidated.event.title}
                              </h4>
                            </div>
                            <div className="text-right ml-4">
                              <div className="text-white font-bold text-lg">
                                ${consolidated.totalAmount.toFixed(2)}
                              </div>
                              <div className="text-xs text-gray-400">Total Staked</div>
                            </div>
                          </div>

                          {/* Position Summary by Side/Option */}
                          <div className="space-y-2 mt-3 pt-3 border-t border-gray-700/50">
                            {Object.entries(consolidated.positions).map(([key, pos]: [string, any]) => {
                              const positionBets = consolidated.bets.filter((b: any) => {
                                const betPosKey = b.option ? `${b.side}-${b.option.id}` : b.side;
                                const currentPosKey = pos.option ? `${pos.side}-${pos.option.id}` : pos.side;
                                return betPosKey === currentPosKey;
                              });
                              const hasActive = positionBets.some((b: any) => b.status === "ACTIVE");
                              const allWon = positionBets.every((b: any) => b.status === "WON");
                              const allLost = positionBets.every((b: any) => b.status === "LOST");
                              
                              let statusDisplay;
                              if (hasActive) {
                                if (pos.avgPrice > 0) {
                                  statusDisplay = (
                                    <span className="text-gray-400">
                                      @ {pos.avgPrice.toFixed(0)}¢ avg
                                    </span>
                                  );
                                } else {
                                  statusDisplay = null;
                                }
                              } else if (allWon) {
                                statusDisplay = (
                                  <Badge variant="success" className="text-xs">WON</Badge>
                                );
                              } else if (allLost) {
                                statusDisplay = (
                                  <Badge variant="error" className="text-xs">LOST</Badge>
                                );
                              } else {
                                statusDisplay = (
                                  <Badge variant="secondary" className="text-xs">MIXED</Badge>
                                );
                              }

                              return (
                                <div key={key} className="flex items-center justify-between text-sm py-1">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <span className={`font-medium ${pos.side === "YES" ? "text-green-400" : "text-red-400"}`}>
                                      {pos.side}
                                    </span>
                                    {pos.option && (
                                      <span className="text-gray-300 truncate">
                                        • {pos.option.title}
                                      </span>
                                    )}
                                    {statusDisplay}
                                  </div>
                                  <div className="flex items-center gap-3 ml-2">
                                    <span className="text-white font-medium">
                                      ${pos.amount.toFixed(2)}
                                    </span>
                                    <span className="text-gray-500 text-xs">
                                      {pos.count} bet{pos.count > 1 ? 's' : ''}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="text-xs text-gray-500 mt-3 pt-2 border-t border-gray-700/30">
                            {consolidated.bets.length} bet{consolidated.bets.length > 1 ? 's' : ''} • Total: ${consolidated.totalAmount.toFixed(2)}
                          </div>
                        </div>
                      );
                    })}
                    {consolidatedBetsArray.length > 10 && (
                      <div className="text-center py-3 bg-gray-800/30 rounded-lg">
                        <p className="text-sm text-gray-400">
                          Showing 10 of {consolidatedBetsArray.length} markets
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
                <div className="flex flex-wrap gap-2 border-b border-gray-700 pb-3">
                  <Button
                    variant={marketFilter === "all" ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setMarketFilter("all")}
                    className="text-xs md:text-sm"
                  >
                    All ({(profile.createdEvents || []).length})
                  </Button>
                  <Button
                    variant={marketFilter === "active" ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setMarketFilter("active")}
                    className="text-xs md:text-sm"
                  >
                    Active ({(profile.createdEvents || []).filter(e => e.status === "ACTIVE" && !e.resolved).length})
                  </Button>
                  <Button
                    variant={marketFilter === "resolved" ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setMarketFilter("resolved")}
                    className="text-xs md:text-sm"
                  >
                    Resolved ({(profile.createdEvents || []).filter(e => e.resolved).length})
                  </Button>
                </div>

                {/* Markets Table */}
                {filteredMarkets.length > 0 ? (
                  <div className="space-y-0 bg-gray-900/30 rounded-lg overflow-hidden">
                    {filteredMarkets.slice(0, 10).map((event, index) => (
                      <div
                        key={event.id}
                        className={`flex items-center justify-between py-4 px-4 hover:bg-gray-700/30 transition-colors ${
                          index !== Math.min(filteredMarkets.length, 10) - 1 ? "border-b border-gray-700/50" : ""
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={event.resolved ? "success" : "default"}>
                              {event.resolved ? "RESOLVED" : event.status}
                            </Badge>
                            <span className="text-sm text-gray-400">{event.category}</span>
                          </div>
                          <h4 className="font-medium text-white truncate pr-4 mb-1">
                            {event.title}
                          </h4>
                          <div className="text-sm text-gray-400">
                            Created {new Date(event.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/market/${event.id}`)}
                            className="text-purple-400 hover:text-purple-300"
                          >
                            View →
                          </Button>
                        </div>
                      </div>
                    ))}
                    {filteredMarkets.length > 10 && (
                      <div className="text-center py-3 border-t border-gray-700/50 bg-gray-800/30">
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
          </div>
        </div>
      </main>
    </>
  );
}
