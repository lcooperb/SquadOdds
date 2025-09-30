"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import BettingModal from "@/components/BettingModal";
import BettingCard from "@/components/BettingCard";
import EditMarketModal from "@/components/EditMarketModal";
import Navigation from "@/components/Navigation";
import { calculateUserPosition } from "@/lib/positions";
import { cn } from "@/lib/utils";
import AddOptionModal from "@/components/AddOptionModal";
import PriceChart from "@/components/PriceChart";
import MarketComments from "@/components/MarketComments";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
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
  Edit,
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
    name: string;
    username: string;
  };
  bets: Array<{
    id: string;
    side: string | null;
    optionId: string | null;
    amount: number;
    price: number;
    shares: number;
    positionSize: number; // Database 'shares' field stores position values in AMM
    createdAt: string;
    user: {
      id: string;
      name: string;
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
  const [selectedOptionAndSide, setSelectedOptionAndSide] = useState<{
    optionId: string;
    side: "YES" | "NO";
  } | null>(null);
  const [optionChanges, setOptionChanges] = useState<{
    [optionId: string]: number;
  }>({});
  const [binaryPriceChange, setBinaryPriceChange] = useState<number | null>(
    null
  );
  const [showEditModal, setShowEditModal] = useState(false);

  // Set default option to most likely for multiple choice markets and auto-select YES
  useEffect(() => {
    if (
      event &&
      event.marketType === "MULTIPLE" &&
      event.options &&
      event.options.length > 0
    ) {
      const mostLikelyOption = event.options.reduce((prev, current) =>
        prev.price > current.price ? prev : current
      );
      setSelectedOption(mostLikelyOption);
      setSelectedSide("YES");
      setSelectedOptionAndSide({
        optionId: mostLikelyOption.id,
        side: "YES"
      });
    }
  }, [event]);
  const [userBalance, setUserBalance] = useState<number>(100);
  const [refreshChart, setRefreshChart] = useState(0);
  const [showMobileBettingModal, setShowMobileBettingModal] = useState(false);

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
    optionId?: string,
    type?: string
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
          type: type === 'sell' ? 'SELL' : 'BUY', // Convert lowercase to uppercase
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
  const createdAt = new Date(event.createdAt);
  const isNew = Date.now() - createdAt.getTime() < 24 * 60 * 60 * 1000; // 24 hours

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
      <main className={cn(
        "container mx-auto px-4 py-4 md:py-8 min-h-screen",
        event.marketType === "BINARY" && session && !event.resolved && (isOngoing || !isExpired)
          ? "pb-24 lg:pb-8"
          : ""
      )}>
        <div className="flex gap-6">
          {/* Left Column - Market Info */}
          <div className="flex-1 max-w-4xl space-y-4 md:space-y-6">
            {/* Resolved Banner - Show prominently for resolved markets */}
            {event.resolved && (
              <div className={`rounded-lg p-4 md:p-5 border-2 ${
                event.marketType === 'BINARY'
                  ? event.outcome
                    ? 'bg-green-900/30 border-green-500/50'
                    : 'bg-red-900/30 border-red-500/50'
                  : 'bg-blue-900/30 border-blue-500/50'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-300 mb-1">Market Resolved</div>
                    <div className={`text-2xl md:text-3xl font-bold ${
                      event.marketType === 'BINARY'
                        ? event.outcome ? 'text-green-400' : 'text-red-400'
                        : 'text-blue-400'
                    }`}>
                      {event.marketType === 'BINARY'
                        ? (event.outcome ? "YES" : "NO")
                        : event.winningOptionId && event.options
                          ? event.options.find(opt => opt.id === event.winningOptionId)?.title || 'Winner Determined'
                          : 'Winner Determined'
                      }
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">Final Price</div>
                    <div className="text-xl md:text-2xl font-bold text-white">
                      {event.marketType === 'BINARY'
                        ? `${event.outcome ? yesPrice : noPrice}¢`
                        : event.winningOptionId && event.options
                          ? `${Math.round(event.options.find(opt => opt.id === event.winningOptionId)?.price || 0)}¢`
                          : '-'
                      }
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Header */}
            <div className="space-y-2 md:space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={getCategoryColor(event.category)}>
                    {event.category}
                  </Badge>
                  {isNew && (
                    <Badge variant="primary">
                      New
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

                {/* Edit Button - only for creators */}
                {session?.user && event.createdBy.id === session.user.id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEditModal(true)}
                    className="flex items-center gap-2 text-gray-400 hover:text-white"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                )}
              </div>

              {/* Market Creator */}
              <div className="text-sm text-gray-400">
                Created by <span className="text-gray-300 font-medium">{event.createdBy.name}</span>
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                {event.title}
              </h1>

              <p className="text-gray-300 leading-relaxed">
                {event.description}
              </p>

              {/* Market Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-800/90 rounded-lg p-2">
                  <div className="flex items-center text-gray-400 text-xs mb-1">
                    <DollarSign className="h-3 w-3 mr-1" />
                    Volume
                  </div>
                  <div className="text-white font-semibold text-sm">
                    ${Math.round(Number(event.totalVolume)).toLocaleString("en-US")}
                  </div>
                </div>

                <div className="bg-gray-800/90 rounded-lg p-2">
                  <div className="flex items-center text-gray-400 text-xs mb-1">
                    <Users className="h-3 w-3 mr-1" />
                    Traders
                  </div>
                  <div className="text-white font-semibold text-sm">
                    {event._count.bets}
                  </div>
                </div>

                <div className="bg-gray-800/90 rounded-lg p-2">
                  <div className="flex items-center text-gray-400 text-xs mb-1">
                    {isOngoing ? (
                      <>
                        <Clock className="h-3 w-3 mr-1" />
                        Status
                      </>
                    ) : (
                      <>
                        <Calendar className="h-3 w-3 mr-1" />
                        Ends
                      </>
                    )}
                  </div>
                  <div className="text-white font-semibold text-xs">
                    {isOngoing ? "Ongoing" : endDate?.toLocaleDateString()}
                  </div>
                </div>

                <div className="bg-gray-800/90 rounded-lg p-2">
                  <div className="flex items-center text-gray-400 text-xs mb-1">
                    <Clock className="h-3 w-3 mr-1" />
                    Created
                  </div>
                  <div className="text-white font-semibold text-xs">
                    {new Date(event.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Price Chart */}
            <div className="border-t border-gray-700 pt-4 md:pt-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5" />
                <h2 className="text-lg font-semibold text-white">
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
                </h2>
              </div>
              <PriceChart
                eventId={event.id}
                marketType={event.marketType}
                options={event.options}
                currentYesPrice={event.yesPrice}
                key={refreshChart}
              />
            </div>

            {/* Multiple Choice Options - Display prominently under chart */}
            {event.marketType === "MULTIPLE" && (
              <div className="border-t border-gray-700 pt-4 md:pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    <h2 className="text-lg font-semibold text-white">Betting Options</h2>
                  </div>
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
                <div className="space-y-1">
                    {event.options &&
                      [...event.options]
                        .sort((a, b) => Number(b.price) - Number(a.price))
                        .map((option, index) => (
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
                            ${Math.round(Number(option.totalVolume)).toLocaleString("en-US")} vol
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

                        {/* Right side - Large Betting buttons */}
                        <div className="flex-shrink-0">
                          {session &&
                          !event.resolved &&
                          (isOngoing || !isExpired) ? (
                            <div className="flex gap-3">
                              <Button
                                variant="primary"
                                size="lg"
                                className={`min-w-[80px] md:min-w-[120px] px-2 md:px-4 py-2 md:py-4 text-sm md:text-base font-semibold transition-colors !bg-green-700/30 hover:!bg-green-600/50 !text-white !border-green-700/30 ${
                                  selectedOptionAndSide?.optionId === option.id &&
                                  selectedOptionAndSide?.side === "YES"
                                    ? "md:!bg-green-500 md:ring-2 md:ring-green-400 md:ring-opacity-50"
                                    : ""
                                }`}
                                onClick={() => {
                                  // On mobile, open modal instead of selecting
                                  if (window.innerWidth < 768) {
                                    setSelectedOption(option);
                                    setSelectedSide("YES");
                                    setShowMobileBettingModal(true);
                                  } else {
                                    setSelectedOption(option);
                                    setSelectedSide("YES");
                                    setSelectedOptionAndSide({
                                      optionId: option.id,
                                      side: "YES"
                                    });
                                  }
                                }}
                              >
                                <div className="flex items-center justify-between w-full gap-1 md:gap-2">
                                  <div className="text-xs md:text-sm">Buy Yes</div>
                                  <div className="font-bold text-sm md:text-lg">{Number(option.price).toFixed(1)}¢</div>
                                </div>
                              </Button>
                              <Button
                                variant="primary"
                                size="lg"
                                className={`min-w-[80px] md:min-w-[120px] px-2 md:px-4 py-2 md:py-4 text-sm md:text-base font-semibold transition-colors !bg-red-700/30 hover:!bg-red-600/50 !text-white !border-red-700/30 ${
                                  selectedOptionAndSide?.optionId === option.id &&
                                  selectedOptionAndSide?.side === "NO"
                                    ? "md:!bg-red-500 md:ring-2 md:ring-red-400 md:ring-opacity-50"
                                    : ""
                                }`}
                                onClick={() => {
                                  // On mobile, open modal instead of selecting
                                  if (window.innerWidth < 768) {
                                    setSelectedOption(option);
                                    setSelectedSide("NO");
                                    setShowMobileBettingModal(true);
                                  } else {
                                    setSelectedOption(option);
                                    setSelectedSide("NO");
                                    setSelectedOptionAndSide({
                                      optionId: option.id,
                                      side: "NO"
                                    });
                                  }
                                }}
                              >
                                <div className="flex items-center justify-between w-full gap-1 md:gap-2">
                                  <div className="text-xs md:text-sm">Buy No</div>
                                  <div className="font-bold text-sm md:text-lg">{(100 - Number(option.price)).toFixed(1)}¢</div>
                                </div>
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
              </div>
            )}

            {/* Market Discussion */}
            <MarketComments eventId={event.id} activity={event.bets} />
          </div>

          {/* Right Column - Trading Interface (Desktop only) */}
          {(event.marketType === "BINARY" ||
            event.marketType === "MULTIPLE") && (
            <div className="w-80 flex-shrink-0 hidden lg:block">
              <div className="sticky top-8">
                {/* Betting Card */}
                <BettingCard
                  selectedOption={event.marketType === "MULTIPLE" ? selectedOption : null}
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
              </div>
            </div>
          )}
        </div>

        {/* Mobile Betting Bar for Binary Markets */}
        {event.marketType === "BINARY" && session && !event.resolved && (isOngoing || !isExpired) && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 p-4 z-50">
            <div className="flex gap-3 max-w-md mx-auto">
              <Button
                variant="yes"
                size="lg"
                className="flex-1 py-3 font-semibold"
                onClick={() => {
                  setSelectedSide("YES");
                  setShowMobileBettingModal(true);
                }}
              >
                Buy Yes {yesPrice}¢
              </Button>
              <Button
                variant="no"
                size="lg"
                className="flex-1 py-3 font-semibold"
                onClick={() => {
                  setSelectedSide("NO");
                  setShowMobileBettingModal(true);
                }}
              >
                Buy No {noPrice}¢
              </Button>
            </div>
          </div>
        )}
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
            bets: event.bets,
            totalVolume: event.totalVolume,
          }}
          selectedOption={selectedOption}
          selectedSide={selectedSide}
          userBalance={userBalance}
          userPosition={userPosition}
          userId={session?.user?.id}
          onPlaceBet={handlePlaceBet}
        />
      )}

      {/* Mobile Betting Modal */}
      {showMobileBettingModal && session && (
        <BettingModal
          isOpen={showMobileBettingModal}
          onClose={() => {
            setShowMobileBettingModal(false);
            setSelectedOption(null);
            setSelectedSide("YES");
          }}
          event={{
            id: event.id,
            title: event.title,
            marketType: event.marketType,
            yesPrice: event.yesPrice,
            bets: event.bets,
            totalVolume: event.totalVolume,
          }}
          selectedOption={selectedOption}
          selectedSide={selectedSide}
          userBalance={userBalance}
          userPosition={userPosition}
          userId={session?.user?.id}
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

      {/* Edit Market Modal */}
      {showEditModal && session?.user && event.createdBy.id === session.user.id && (
        <EditMarketModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          event={event}
          onEventUpdated={(updatedEvent) => {
            setEvent(updatedEvent);
          }}
        />
      )}
    </>
  );
}
