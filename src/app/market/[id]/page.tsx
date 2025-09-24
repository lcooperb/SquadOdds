"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import BettingModal from "@/components/BettingModal";
import BettingCard from "@/components/BettingCard";
import { calculateUserPosition } from "@/lib/positions";
import AddOptionModal from "@/components/AddOptionModal";
import PriceChart from "@/components/PriceChart";
import MarketComments from "@/components/MarketComments";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Calendar,
  Clock,
  BarChart3,
  MessageCircle,
  Plus,
} from "lucide-react";

interface MarketOption {
  id: string;
  title: string;
  price: number;
  totalVolume: number;
}

interface EventDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  marketType: string;
  yesPrice: number;
  totalVolume: number;
  endDate: string | null;
  isOngoing?: boolean;
  status: string;
  createdAt: string;
  resolved: boolean;
  outcome: boolean | null;
  winningOptionId: string | null;
  options?: MarketOption[];
  createdBy: {
    id: string;
    displayName: string;
    username: string;
  };
  bets: Array<{
    id: string;
    side: string | null;
    optionId: string | null;
    amount: number;
    price: number;
    shares: number;
    createdAt: string;
    user: {
      id: string;
      displayName: string;
      username: string;
    };
    option?: {
      id: string;
      title: string;
    };
  }>;
  _count: {
    bets: number;
  };
}

export default function MarketPage() {
  const params = useParams();
  const { data: session } = useSession();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBettingModal, setShowBettingModal] = useState(false);
  const [showAddOptionModal, setShowAddOptionModal] = useState(false);
  const [selectedOption, setSelectedOption] = useState<MarketOption | null>(
    null
  );
  const [selectedSide, setSelectedSide] = useState<"YES" | "NO">("YES");
  const [optionChanges, setOptionChanges] = useState<{
    [optionId: string]: number;
  }>({});
  const [binaryPriceChange, setBinaryPriceChange] = useState<number | null>(
    null
  );

  // Set default option to most likely for multiple choice markets
  useEffect(() => {
    if (
      event &&
      event.marketType === "MULTIPLE" &&
      event.options &&
      event.options.length > 0 &&
      !selectedOption
    ) {
      const mostLikelyOption = event.options.reduce((prev, current) =>
        prev.price > current.price ? prev : current
      );
      setSelectedOption(mostLikelyOption);
    }
  }, [event, selectedOption]);
  const [userBalance, setUserBalance] = useState<number>(100);
  const [refreshChart, setRefreshChart] = useState(0);

  useEffect(() => {
    if (params.id) {
      fetchEvent();
      if (session?.user) {
        fetchUserBalance();
      }
    }
  }, [params.id, session]);

  useEffect(() => {
    if (event && event.marketType === "MULTIPLE" && event.options) {
      fetchOptionPriceChanges();
    } else if (event && event.marketType === "BINARY") {
      fetchBinaryPriceChange();
    }
  }, [event]);

  const fetchBinaryPriceChange = async () => {
    try {
      const response = await fetch(`/api/events/${params.id}/price-history`);
      if (response.ok) {
        const history = await response.json();

        if (history && history.length >= 2) {
          // Sort by timestamp
          const sortedHistory = history.sort(
            (a: any, b: any) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );

          const currentPrice = event?.yesPrice || 0;
          const now = new Date();
          const twentyFourHoursAgo = new Date(
            now.getTime() - 24 * 60 * 60 * 1000
          );

          // Find price from 24h ago or use first available price
          let comparePrice = sortedHistory[0].yesPrice;
          for (let i = sortedHistory.length - 1; i >= 0; i--) {
            if (new Date(sortedHistory[i].timestamp) <= twentyFourHoursAgo) {
              comparePrice = sortedHistory[i].yesPrice;
              break;
            }
          }

          // Calculate percentage point change (absolute difference)
          const change = currentPrice - comparePrice;
          setBinaryPriceChange(change);
        }
      }
    } catch (error) {
      console.error("Error fetching binary price change:", error);
    }
  };

  const fetchOptionPriceChanges = async () => {
    try {
      const response = await fetch(
        `/api/events/${params.id}/options/price-history`
      );
      if (response.ok) {
        const history = await response.json();

        if (history && history.length > 0) {
          // Group by option ID to get price points for each option
          const optionHistory: {
            [optionId: string]: { price: number; timestamp: string }[];
          } = {};

          history.forEach((point: any) => {
            if (!optionHistory[point.optionId]) {
              optionHistory[point.optionId] = [];
            }
            optionHistory[point.optionId].push({
              price: point.price,
              timestamp: point.timestamp,
            });
          });

          // Calculate percentage change for each option (current vs 24h ago or first price)
          const changes: { [optionId: string]: number } = {};
          const now = new Date();
          const twentyFourHoursAgo = new Date(
            now.getTime() - 24 * 60 * 60 * 1000
          );

          Object.keys(optionHistory).forEach((optionId) => {
            const pricePoints = optionHistory[optionId].sort(
              (a, b) =>
                new Date(a.timestamp).getTime() -
                new Date(b.timestamp).getTime()
            );

            if (pricePoints.length >= 2) {
              const currentPrice = pricePoints[pricePoints.length - 1].price;

              // Find price from 24h ago or use first available price
              let comparePrice = pricePoints[0].price;
              for (let i = pricePoints.length - 1; i >= 0; i--) {
                if (new Date(pricePoints[i].timestamp) <= twentyFourHoursAgo) {
                  comparePrice = pricePoints[i].price;
                  break;
                }
              }

              // Calculate percentage point change (absolute difference)
              const change = currentPrice - comparePrice;
              changes[optionId] = change;
            }
          });

          setOptionChanges(changes);
        }
      }
    } catch (error) {
      console.error("Error fetching option price changes:", error);
    }
  };

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setEvent(data);
      }
    } catch (error) {
      console.error("Error fetching event:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBalance = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const user = await response.json();
        setUserBalance(Number(user.virtualBalance));
      }
    } catch (error) {
      console.error("Error fetching user balance:", error);
    }
  };

  const handlePlaceBet = async (
    eventId: string,
    side: "YES" | "NO" | null,
    amount: number,
    optionId?: string
  ) => {
    try {
      const response = await fetch("/api/bets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId,
          side,
          amount,
          optionId,
        }),
      });

      if (response.ok) {
        fetchEvent();
        fetchUserBalance();
        setRefreshChart((prev) => prev + 1);
        // Refresh price changes after a short delay to ensure the price history is updated
        setTimeout(() => {
          if (event?.marketType === "MULTIPLE") {
            fetchOptionPriceChanges();
          } else if (event?.marketType === "BINARY") {
            fetchBinaryPriceChange();
          }
        }, 500);
      } else {
        throw new Error("Failed to place bet");
      }
    } catch (error) {
      console.error("Error placing bet:", error);
      throw error;
    }
  };

  const handleAddOption = async (eventId: string, title: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/options`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title }),
      });

      if (response.ok) {
        fetchEvent();
        setRefreshChart((prev) => prev + 1);
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to add option");
      }
    } catch (error) {
      console.error("Error adding option:", error);
      throw error;
    }
  };

  if (loading) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-white">Loading market...</div>
        </div>
      </>
    );
  }

  if (!event) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-2">
              Market not found
            </h1>
            <p className="text-gray-400">
              This market may have been removed or doesn&apos;t exist.
            </p>
          </div>
        </div>
      </>
    );
  }

  const yesPrice = Math.round(Number(event.yesPrice));
  const noPrice = 100 - yesPrice;
  const endDate = event.endDate ? new Date(event.endDate) : null;
  const isExpired = endDate ? endDate < new Date() : false;
  const isOngoing = event.isOngoing || !endDate;

  // Calculate user position for current selection
  const userPosition =
    session?.user && event
      ? calculateUserPosition(
          event.bets,
          session.user.id,
          event.marketType === "MULTIPLE" ? selectedOption?.id : undefined
        )
      : null;

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
      <main className="container mx-auto px-4 py-8 min-h-screen">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:items-start">
          {/* Left Column - Market Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant={getCategoryColor(event.category)}>
                  {event.category}
                </Badge>
                {event.resolved && (
                  <Badge variant={event.outcome ? "success" : "error"}>
                    Resolved: {event.outcome ? "YES" : "NO"}
                  </Badge>
                )}
                {isOngoing && !event.resolved && (
                  <Badge variant="warning">
                    <Clock className="h-3 w-3 mr-1" />
                    Ongoing
                  </Badge>
                )}
                {!isOngoing && isExpired && !event.resolved && (
                  <Badge variant="warning">Expired</Badge>
                )}
              </div>

              <h1 className="text-3xl font-bold text-white leading-tight">
                {event.title}
              </h1>

              <p className="text-gray-300 text-lg leading-relaxed">
                {event.description}
              </p>

              {/* Market Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                  <div className="flex items-center text-gray-400 text-sm mb-1">
                    <DollarSign className="h-4 w-4 mr-1" />
                    Volume
                  </div>
                  <div className="text-white font-semibold">
                    ₺{Math.round(Number(event.totalVolume)).toLocaleString("en-US")}
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                  <div className="flex items-center text-gray-400 text-sm mb-1">
                    <Users className="h-4 w-4 mr-1" />
                    Traders
                  </div>
                  <div className="text-white font-semibold">
                    {event._count.bets}
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                  <div className="flex items-center text-gray-400 text-sm mb-1">
                    {isOngoing ? (
                      <>
                        <Clock className="h-4 w-4 mr-1" />
                        Status
                      </>
                    ) : (
                      <>
                        <Calendar className="h-4 w-4 mr-1" />
                        Ends
                      </>
                    )}
                  </div>
                  <div className="text-white font-semibold text-sm">
                    {isOngoing ? "Ongoing" : endDate?.toLocaleDateString()}
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                  <div className="flex items-center text-gray-400 text-sm mb-1">
                    <Clock className="h-4 w-4 mr-1" />
                    Created
                  </div>
                  <div className="text-white font-semibold text-sm">
                    {new Date(event.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Price Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  {event.marketType === "MULTIPLE" ? (
                    "Probability Over Time"
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>{yesPrice}% chance</span>
                      {binaryPriceChange !== null &&
                        Math.abs(binaryPriceChange) >= 0.1 && (
                          <div className="flex items-center gap-1">
                            {binaryPriceChange > 0 ? (
                              <TrendingUp className="h-4 w-4 text-green-400" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-400" />
                            )}
                            <span
                              className={`text-sm ${binaryPriceChange > 0 ? "text-green-400" : "text-red-400"}`}
                            >
                              {binaryPriceChange > 0 ? "+" : ""}
                              {binaryPriceChange.toFixed(0)}%
                            </span>
                          </div>
                        )}
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PriceChart
                  eventId={event.id}
                  marketType={event.marketType}
                  options={event.options}
                  currentYesPrice={event.yesPrice}
                  key={refreshChart}
                />
              </CardContent>
            </Card>

            {/* Multiple Choice Options - Display prominently under chart */}
            {event.marketType === "MULTIPLE" && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Betting Options
                    </CardTitle>
                    {session?.user?.isAdmin &&
                      !event.resolved &&
                      event.bets.length === 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAddOptionModal(true)}
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add Option
                        </Button>
                      )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {event.options?.map((option, index) => (
                      <div
                        key={option.id}
                        className={`flex items-center py-3 px-1 ${
                          index !== 0 ? "border-t border-gray-700" : ""
                        } ${
                          event.resolved && event.winningOptionId === option.id
                            ? "bg-green-500/5"
                            : "hover:bg-gray-800/30"
                        } transition-colors`}
                      >
                        {/* Left side - Option name and volume */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-white truncate">
                              {option.title}
                            </h4>
                            {event.resolved &&
                              event.winningOptionId === option.id && (
                                <span className="text-green-400 font-medium text-xs">
                                  Winner!
                                </span>
                              )}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            ₺{Math.round(Number(option.totalVolume)).toLocaleString("en-US")} vol
                          </div>
                        </div>

                        {/* Middle - Percentage with trend indicator */}
                        <div className="flex-1 mx-6">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-lg font-semibold text-white">
                              {Number(option.price).toFixed(1)}%
                            </span>
                            {/* Show trend indicator if there's actual price change */}
                            {(() => {
                              const changePercent = optionChanges[option.id];

                              // Only show if we have a meaningful change (> 0.1%)
                              if (
                                changePercent === undefined ||
                                Math.abs(changePercent) < 0.1
                              )
                                return null;

                              const isPositive = changePercent > 0;

                              return (
                                <div className="flex items-center">
                                  {isPositive ? (
                                    <TrendingUp className="h-4 w-4 text-green-400" />
                                  ) : (
                                    <TrendingDown className="h-4 w-4 text-red-400" />
                                  )}
                                  <span
                                    className={`text-xs ml-1 ${isPositive ? "text-green-400" : "text-red-400"}`}
                                  >
                                    {isPositive ? "+" : ""}
                                    {changePercent.toFixed(1)}%
                                  </span>
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Right side - Betting buttons */}
                        <div className="flex-shrink-0">
                          {session &&
                          !event.resolved &&
                          (isOngoing || !isExpired) ? (
                            <div className="flex gap-2">
                              <Button
                                variant="yes"
                                size="sm"
                                className="min-w-[60px] px-3 py-1.5 text-xs font-medium"
                                onClick={() => {
                                  setSelectedOption(option);
                                  setSelectedSide("YES");
                                }}
                              >
                                {Number(option.price).toFixed(1)}¢
                              </Button>
                              <Button
                                variant="no"
                                size="sm"
                                className="min-w-[60px] px-3 py-1.5 text-xs font-medium"
                                onClick={() => {
                                  setSelectedOption(option);
                                  setSelectedSide("NO");
                                }}
                              >
                                {(100 - Number(option.price)).toFixed(1)}¢
                              </Button>
                            </div>
                          ) : !session ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="px-3 py-1.5 text-xs"
                              onClick={() =>
                                (window.location.href = "/auth/signin")
                              }
                            >
                              Sign in
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>

                  {(!session ||
                    event.resolved ||
                    (!isOngoing && isExpired)) && (
                    <div className="text-center py-6 text-gray-400">
                      {event.resolved
                        ? "Market Resolved"
                        : !isOngoing
                          ? "Market Expired"
                          : "Market Inactive"}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Market Discussion */}
            <MarketComments eventId={event.id} activity={event.bets} />
          </div>

          {/* Right Column - Trading Interface */}
          {(event.marketType === "BINARY" ||
            event.marketType === "MULTIPLE") && (
            <div className="space-y-6 sticky top-24 self-start">
              {/* Multiple Choice Betting Card */}
              {event.marketType === "MULTIPLE" ? (
                <BettingCard
                  selectedOption={selectedOption}
                  selectedSide={selectedSide}
                  event={{
                    id: event.id,
                    title: event.title,
                    marketType: event.marketType,
                    yesPrice: event.yesPrice,
                  }}
                  userBalance={userBalance}
                  userPosition={userPosition}
                  onPlaceBet={handlePlaceBet}
                />
              ) : (
                <>
                  {/* Binary Market Betting Card */}
                  <BettingCard
                    selectedOption={null}
                    event={{
                      id: event.id,
                      title: event.title,
                      marketType: event.marketType,
                      yesPrice: event.yesPrice,
                    }}
                    userBalance={userBalance}
                    userPosition={userPosition}
                    onPlaceBet={handlePlaceBet}
                  />

                  {/* Market Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Market Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Created by</span>
                        <span className="text-white">
                          {event.createdBy.displayName}
                        </span>
                      </div>
                      {!isOngoing && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">End date</span>
                          <span className="text-white">
                            {endDate?.toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {isOngoing && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Type</span>
                          <Badge variant="warning">
                            <Clock className="h-3 w-3 mr-1" />
                            Ongoing
                          </Badge>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status</span>
                        <span className="text-white capitalize">
                          {event.status.toLowerCase()}
                        </span>
                      </div>
                      {event.resolved && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Outcome</span>
                          <Badge variant={event.outcome ? "success" : "error"}>
                            {event.outcome ? "YES" : "NO"}
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Betting Modal */}
      {showBettingModal && session && (
        <BettingModal
          isOpen={showBettingModal}
          onClose={() => {
            setShowBettingModal(false);
            setSelectedOption(null);
            setSelectedSide("YES");
          }}
          event={{
            id: event.id,
            title: event.title,
            marketType: event.marketType,
            yesPrice: event.yesPrice,
          }}
          selectedOption={selectedOption}
          selectedSide={selectedSide}
          userBalance={userBalance}
          onPlaceBet={handlePlaceBet}
        />
      )}

      {/* Add Option Modal */}
      {showAddOptionModal && session?.user?.isAdmin && (
        <AddOptionModal
          isOpen={showAddOptionModal}
          onClose={() => setShowAddOptionModal(false)}
          eventId={event.id}
          eventTitle={event.title}
          onAddOption={handleAddOption}
        />
      )}
    </>
  );
}
