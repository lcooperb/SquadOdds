"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { calculateUserPosition, getAllUserPositions } from "@/lib/positions";
import { previewMarketImpact } from "@/lib/marketImpact";
import { Calculator, DollarSign, TrendingUp, TrendingDown } from "lucide-react";

interface UserPosition {
  side: "YES" | "NO";
  positionValue: number;
  averagePrice: number;
  potentialPayout: number;
}

interface BettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    id: string;
    title: string;
    marketType: string;
    yesPrice: number;
    bets?: any[]; // Include bets for position calculation
    totalVolume?: number;
  };
  selectedOption?: {
    id: string;
    title: string;
    price: number;
  } | null;
  selectedSide?: "YES" | "NO";
  userBalance: number;
  userPosition?: UserPosition | null;
  userId?: string;
  onPlaceBet: (
    eventId: string,
    side: "YES" | "NO" | null,
    amount: number,
    optionId?: string,
    type?: string
  ) => Promise<void>;
}

export default function BettingModal({
  isOpen,
  onClose,
  event,
  selectedOption,
  selectedSide = "YES",
  userBalance,
  userPosition,
  userId,
  onPlaceBet,
}: BettingModalProps) {
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [localSelectedSide, setSelectedSide] = useState<"YES" | "NO">(
    selectedSide
  );
  const [selectedPosition, setSelectedPosition] = useState<UserPosition | null>(null);

  // Sync internal side state with prop when it changes
  useEffect(() => {
    if (selectedSide) {
      setSelectedSide(selectedSide);
    }
  }, [selectedSide]);

  // Reset selected position when switching modes or when bets data changes
  useEffect(() => {
    setSelectedPosition(null);
  }, [mode, event.bets]);

  const isMultipleChoice = event.marketType === "MULTIPLE";

  // Calculate the user's position for the specific option and side being traded
  const currentPosition = userId && event.bets
    ? calculateUserPosition(
        event.bets,
        userId,
        isMultipleChoice ? selectedOption?.id : undefined
      )
    : null;

  // Get all user positions (both YES and NO)
  const allUserPositions = userId && event.bets
    ? getAllUserPositions(
        event.bets,
        userId,
        isMultipleChoice ? selectedOption?.id : undefined
      )
    : [];

  // Check if user has positions to enable sell mode
  const hasAnyPosition = allUserPositions.length > 0;

  // For selling, use the selected position or default to the first available position
  const positionToSell = selectedPosition || allUserPositions[0] || null;

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
  const currentPrice = localSelectedSide === "YES" ? yesPrice : noPrice;
  const totalVolume = event.totalVolume || 0;

  // Use market impact calculation for better estimate
  const marketImpact = amountNum > 0 ? previewMarketImpact(
    amountNum,
    currentPrice,
    totalVolume,
    localSelectedSide
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
      // Pass type based on the current mode
      await onPlaceBet(
        event.id,
        mode === 'sell' && positionToSell ? positionToSell.side : localSelectedSide,
        parseFloat(amount),
        isMultipleChoice ? selectedOption?.id : undefined,
        mode // Pass the type as 'buy' or 'sell'
      );
      setAmount("");
      onClose();
    } catch (error) {
      setError("Failed to place bet");
    } finally {
      setLoading(false);
    }
  };


  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Trade" isBottomSheet={true}>
      <div className="space-y-4">
        {/* Buy/Sell Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-700 pb-1">
          <button
            onClick={() => setMode("buy")}
            className={`font-semibold pb-1 px-1 ${
              mode === "buy"
                ? "text-white border-b-2 border-white"
                : "text-gray-400 border-b-2 border-transparent"
            }`}
          >
            Buy
          </button>
          <button
            onClick={() => setMode("sell")}
            className={`font-semibold pb-1 px-1 ${
              mode === "sell"
                ? "text-white border-b-2 border-white"
                : "text-gray-400 border-b-2 border-transparent"
            }`}
          >
            Sell
          </button>
        </div>

        {/* Option Selection Info for Multiple Choice */}
        {isMultipleChoice && selectedOption && (
          <div className="bg-gray-700/30 rounded-lg p-3">
            <div className="text-sm text-gray-400 mb-1">You&apos;re betting on:</div>
            <div className="text-white font-medium">{selectedOption.title}</div>
          </div>
        )}

        {mode === "buy" ? (
          <>
            {/* YES/NO Selection */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={localSelectedSide === "YES" ? "yes" : "outline"}
                selected={localSelectedSide === "YES"}
                onClick={() => setSelectedSide("YES")}
                className="w-full"
              >
                {isMultipleChoice ? "Yes" : "Yes"} ${yesPrice}
              </Button>
              <Button
                variant={localSelectedSide === "NO" ? "no" : "outline"}
                selected={localSelectedSide === "NO"}
                onClick={() => setSelectedSide("NO")}
                className="w-full"
              >
                {isMultipleChoice ? "No" : "No"} ${noPrice}
              </Button>
            </div>

            {/* Amount Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-white font-medium">Amount</label>
                <div className="flex items-center">
                  <span className="text-3xl font-bold text-gray-500 mr-1">$</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="text-3xl font-bold text-gray-300 bg-transparent border-none outline-none text-right w-28"
                    min="0"
                    max={userBalance}
                    step="0.01"
                  />
                </div>
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
              <div className="space-y-3">
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
                    Avg. Price ${averagePrice.toFixed(1)}
                    {priceImpact > 0.5 && (
                      <span className="ml-2 text-orange-400">
                        (+${priceImpact.toFixed(1)} impact)
                      </span>
                    )}
                  </div>
                </div>

                {/* Market Impact Preview */}
                {priceImpact > 0.1 && (
                  <div className="hidden md:block bg-blue-600/10 border border-blue-500/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-blue-400 text-sm font-medium">Market Impact</span>
                      <span className="text-blue-400">📈</span>
                    </div>
                    <div className="text-sm text-gray-300">
                      Market will move from <span className="font-semibold text-white">${currentPrice}</span> → <span className="font-semibold text-white">${marketImpact.estimatedFinalPrice}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Your bet moves the {localSelectedSide} price by ${priceImpact.toFixed(1)}
                    </div>
                  </div>
                )}

                {/* Position Size Info */}
                {positionValue !== amountNum && (
                  <div className="bg-gray-700/20 rounded-lg p-3">
                    <div className="text-sm text-gray-400 mb-1">Position Details</div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Amount invested:</span>
                      <span className="text-white font-medium">${amountNum.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Position value:</span>
                      <span className="text-white font-medium">${positionValue.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            {/* Sell Mode - Show All Positions */}
            <div className="bg-gray-700/30 rounded-lg p-4">
              <div className="text-white font-medium mb-3">Your Positions</div>
              {hasAnyPosition ? (
                <div className="space-y-3">
                  {allUserPositions.map((position, index) => {
                    const isSelected = selectedPosition?.side === position.side;
                    const currentPrice = position.side === "YES" ? yesPrice : noPrice;
                    return (
                      <div
                        key={position.side}
                        onClick={() => setSelectedPosition(position)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? "border-blue-500 bg-blue-500/20"
                            : "border-gray-600 hover:border-gray-500"
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-white font-medium">
                            ${position.positionValue.toFixed(2)} {position.side} position
                          </span>
                          <span className="text-gray-400 text-sm">
                            Avg: ${position.averagePrice.toFixed(1)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400">Potential Payout:</span>
                          <span className="text-green-400 font-medium">
                            ${position.potentialPayout.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-gray-400 text-sm">
                  {isMultipleChoice && selectedOption
                    ? `No positions for ${selectedOption.title}`
                    : `No positions to sell`
                  }
                </div>
              )}
            </div>

            {hasAnyPosition && positionToSell && (
              <>
                {/* Sell Amount Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-white font-medium">Position to sell</label>
                    <div className="flex items-center">
                      <span className="text-2xl font-bold text-gray-500 mr-1">$</span>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0"
                        className="text-2xl font-bold text-gray-300 bg-transparent border-none outline-none text-right w-28"
                        min="0"
                        max={positionToSell.positionValue}
                        step="0.01"
                      />
                    </div>
                  </div>

                  {/* Quick Sell Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount((positionToSell.positionValue * 0.25).toFixed(2))}
                      className="text-xs"
                    >
                      25%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount((positionToSell.positionValue * 0.5).toFixed(2))}
                      className="text-xs"
                    >
                      50%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount((positionToSell.positionValue * 0.75).toFixed(2))}
                      className="text-xs"
                    >
                      75%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount(positionToSell.positionValue.toString())}
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
                      Selling ${amountNum.toFixed(2)} of your ${positionToSell.positionValue.toFixed(2)} position
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
            (mode === "sell" && (!hasAnyPosition || !positionToSell || parseFloat(amount) > (positionToSell?.positionValue || 0))) ||
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
      </div>
    </Modal>
  );
}
