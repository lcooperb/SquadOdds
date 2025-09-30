"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { previewMarketImpact } from "@/lib/marketImpact";
import { ChevronDown } from "lucide-react";

interface UserPosition {
  side: "YES" | "NO";
  positionValue: number;
  averagePrice: number;
  potentialPayout: number;
}

interface BettingCardProps {
  selectedOption?: {
    id: string;
    title: string;
    price: number;
  } | null;
  selectedSide?: "YES" | "NO";
  event: {
    id: string;
    title: string;
    marketType: string;
    yesPrice: number;
    totalVolume?: number;
  };
  userBalance: number;
  userPosition?: UserPosition | null;
  onPlaceBet: (
    eventId: string,
    side: "YES" | "NO" | null,
    amount: number,
    optionId?: string,
    type?: string
  ) => Promise<void>;
}

export default function BettingCard({
  selectedOption,
  selectedSide,
  event,
  userBalance,
  userPosition,
  onPlaceBet,
}: BettingCardProps) {
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [side, setSide] = useState<"YES" | "NO">("YES");
  const [amount, setAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Sync internal side state with prop when it changes
  useEffect(() => {
    if (selectedSide) {
      setSide(selectedSide);
    }
  }, [selectedSide]);

  // Check if user has a position to enable sell mode
  const hasPosition = userPosition && userPosition.positionValue > 0;

  const isMultipleChoice = event.marketType === "MULTIPLE";

  // Get prices
  let yesPrice, noPrice;
  if (isMultipleChoice && selectedOption) {
    yesPrice = Math.round(selectedOption.price);
    noPrice = 100 - yesPrice;
  } else {
    yesPrice = Math.round(event.yesPrice);
    noPrice = 100 - yesPrice;
  }

  // Calculate market impact and potential payout
  const amountNum = parseFloat(amount) || 0;
  const currentPrice = side === "YES" ? yesPrice : noPrice;
  const totalVolume = event.totalVolume || 0;

  // Use market impact calculation for better estimate
  const marketImpact = amountNum > 0 ? previewMarketImpact(
    amountNum,
    currentPrice,
    totalVolume,
    side
  ) : {
    estimatedPosition: 0,
    estimatedAveragePrice: currentPrice,
    priceImpact: 0,
    estimatedFinalPrice: currentPrice
  };

  const positionValue = marketImpact.estimatedPosition;
  const averagePrice = marketImpact.estimatedAveragePrice;
  const priceImpact = marketImpact.priceImpact;

  // Calculate actual potential payout: what you win if your side wins
  const potentialPayout = averagePrice > 0 ? positionValue / (averagePrice / 100) : positionValue;

  // Quick amount buttons
  const quickAmounts = [1, 20, 100];
  const maxAmount = Math.floor(userBalance);

  const handleQuickAmount = (value: number | "max") => {
    if (value === "max") {
      setAmount(maxAmount.toString());
    } else {
      const currentAmount = parseFloat(amount) || 0;
      setAmount((currentAmount + value).toString());
    }
  };

  const handlePlaceBet = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (parseFloat(amount) > userBalance) {
      setError("Insufficient balance");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await onPlaceBet(
        event.id,
        side,
        parseFloat(amount),
        isMultipleChoice ? selectedOption?.id : undefined,
        mode // Pass the type as 'buy' or 'sell'
      );
      setAmount("");
    } catch (error) {
      setError("Failed to place bet");
    } finally {
      setLoading(false);
    }
  };

  if (!selectedOption && isMultipleChoice) {
    return (
      <Card className="bg-gray-800/90 border border-gray-700">
        <CardContent className="p-6 text-center">
          <div className="text-gray-400">Select an option to start trading</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800/90 border border-gray-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode("buy")}
              className={`font-semibold pb-1 ${
                mode === "buy"
                  ? "text-white border-b-2 border-white"
                  : "text-gray-400 border-b-2 border-transparent"
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => setMode("sell")}
              className={`font-semibold pb-1 ${
                mode === "sell"
                  ? "text-white border-b-2 border-white"
                  : "text-gray-400 border-b-2 border-transparent"
              }`}
            >
              Sell
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Option Selection Info for Multiple Choice */}
        {isMultipleChoice && selectedOption && (
          <div className="bg-gray-700/30 rounded-lg p-3 mb-4">
            <div className="text-sm text-gray-400 mb-1">You&apos;re betting on:</div>
            <div className="text-white font-medium">{selectedOption.title}</div>
          </div>
        )}

        {mode === "buy" ? (
          <>
            {/* YES/NO Selection */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={side === "YES" ? "yes" : "outline"}
                selected={side === "YES"}
                onClick={() => setSide("YES")}
                className="w-full"
              >
                {isMultipleChoice ? "Yes" : "Yes"} {yesPrice}¢
              </Button>
              <Button
                variant={side === "NO" ? "no" : "outline"}
                selected={side === "NO"}
                onClick={() => setSide("NO")}
                className="w-full"
              >
                {isMultipleChoice ? "No" : "No"} {noPrice}¢
              </Button>
            </div>

            {/* Amount Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-white font-medium">Amount</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="text-3xl font-bold text-gray-300 bg-transparent border-none outline-none text-right w-32"
                  min="0"
                  max={userBalance}
                  step="0.01"
                />
              </div>

              {/* Quick Amount Buttons */}
              <div className="flex gap-2">
                {quickAmounts.map((value) => (
                  <Button
                    key={value}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAmount(value)}
                    className="text-xs"
                  >
                    +${value}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount("max")}
                  className="text-xs"
                >
                  Max
                </Button>
              </div>
            </div>

            {/* Potential Payout */}
            {amountNum > 0 && (
              <div className="bg-gray-700/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">To win</span>
                    <span className="text-green-400">💸</span>
                  </div>
                  <div className="text-3xl font-bold text-green-400">
                    $
                    {potentialPayout.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  Avg. Price {averagePrice.toFixed(1)}¢
                  {priceImpact > 0.5 && (
                    <span className="ml-2 text-orange-400">
                      (+{priceImpact.toFixed(1)}¢ impact)
                    </span>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            {/* Sell Mode - Show Positions */}
            <div className="bg-gray-700/30 rounded-lg p-4">
              <div className="text-white font-medium mb-3">Your Position</div>
              {hasPosition ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">
                      ${userPosition!.positionValue.toFixed(2)} {userPosition!.side} position
                    </span>
                    <span className="text-gray-400 text-sm">
                      Avg: {userPosition!.averagePrice.toFixed(1)}¢
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Potential Payout:</span>
                    <span className="text-green-400 font-medium">
                      ${userPosition!.potentialPayout.toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-gray-400 text-sm">No position to sell</div>
              )}
            </div>

            {hasPosition && (
              <>
                {/* Sell Amount Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-white font-medium">Position to sell</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0"
                      className="text-2xl font-bold text-gray-300 bg-transparent border-none outline-none text-right w-32"
                      min="0"
                      max={userPosition!.positionValue}
                      step="0.01"
                    />
                  </div>

                  {/* Quick Sell Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount((userPosition!.positionValue * 0.25).toFixed(2))}
                      className="text-xs"
                    >
                      25%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount((userPosition!.positionValue * 0.5).toFixed(2))}
                      className="text-xs"
                    >
                      50%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount((userPosition!.positionValue * 0.75).toFixed(2))}
                      className="text-xs"
                    >
                      75%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount(userPosition!.positionValue.toString())}
                      className="text-xs"
                    >
                      All
                    </Button>
                  </div>
                </div>

                {/* Sell Payout Preview */}
                {amountNum > 0 && (
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">You&apos;ll receive</span>
                        <span className="text-blue-400">💰</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-400">
                        ${amountNum.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      Selling ${amountNum.toFixed(2)} of your ${userPosition!.positionValue.toFixed(2)} position
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && <div className="text-red-400 text-sm">{error}</div>}


        {/* Trade Button */}
        <Button
          onClick={handlePlaceBet}
          disabled={
            loading ||
            !amount ||
            parseFloat(amount) <= 0 ||
            (mode === "sell" && (!hasPosition || parseFloat(amount) > (userPosition?.positionValue || 0))) ||
            (mode === "buy" && parseFloat(amount) > userBalance)
          }
          className={`w-full py-3 text-white ${
            mode === "sell"
              ? "bg-red-600 hover:bg-red-700"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Trading..." : mode === "buy" ? "Buy" : "Sell"}
        </Button>
      </CardContent>
    </Card>
  );
}
