"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { calculateUserPosition } from "@/lib/positions";
import { Calculator, DollarSign, TrendingUp, TrendingDown } from "lucide-react";

interface UserPosition {
  side: "YES" | "NO";
  shares: number;
  averagePrice: number;
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
    optionId?: string
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

  // Sync internal side state with prop when it changes
  useEffect(() => {
    if (selectedSide) {
      setSelectedSide(selectedSide);
    }
  }, [selectedSide]);

  const isMultipleChoice = event.marketType === "MULTIPLE";

  // Calculate the user's position for the specific option and side being traded
  const currentPosition = userId && event.bets
    ? calculateUserPosition(
        event.bets,
        userId,
        isMultipleChoice ? selectedOption?.id : undefined
      )
    : null;

  // Check if user has a position to enable sell mode
  // For sell mode, we need to check if they have shares on the SAME side they want to sell
  const hasPosition = currentPosition &&
    currentPosition.shares > 0 &&
    currentPosition.side === localSelectedSide;

  // Get prices
  let yesPrice, noPrice;
  if (isMultipleChoice && selectedOption) {
    yesPrice = Math.round(selectedOption.price);
    noPrice = 100 - yesPrice;
  } else {
    yesPrice = Math.round(event.yesPrice);
    noPrice = 100 - yesPrice;
  }

  // Calculate potential payout
  const amountNum = parseFloat(amount) || 0;
  const currentPrice = localSelectedSide === "YES" ? yesPrice : noPrice;
  const shares = currentPrice > 0 ? (amountNum / currentPrice) * 100 : 0;
  const potentialPayout = shares;

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
        localSelectedSide,
        parseFloat(amount),
        isMultipleChoice ? selectedOption?.id : undefined
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

        {/* YES/NO Selection */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={localSelectedSide === "YES" ? "yes" : "outline"}
            onClick={() => setSelectedSide("YES")}
            className="w-full"
          >
            {isMultipleChoice ? "Yes" : "Yes"} {yesPrice}¢
          </Button>
          <Button
            variant={localSelectedSide === "NO" ? "no" : "outline"}
            onClick={() => setSelectedSide("NO")}
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
                +₺{value}
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
                ₺
                {potentialPayout.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
            <div className="text-sm text-gray-400 mt-1">
              Avg. Price {currentPrice}¢ ⓘ
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && <div className="text-red-400 text-sm">{error}</div>}

        {/* Position Info for Sell Mode */}
        {mode === "sell" && (
          <div className="bg-gray-700/50 rounded-lg p-3">
            <div className="text-sm text-gray-400 mb-1">
              Your Position{isMultipleChoice && selectedOption ? ` - ${selectedOption.title}` : ""}
            </div>
            {hasPosition && currentPosition ? (
              <div className="flex justify-between items-center">
                <span className="text-white">
                  {currentPosition.shares.toFixed(2)} {currentPosition.side} shares
                </span>
                <span className="text-gray-300">
                  Avg: {currentPosition.averagePrice.toFixed(1)}¢
                </span>
              </div>
            ) : (
              <div className="text-gray-400 text-sm">
                {isMultipleChoice && selectedOption
                  ? `No ${localSelectedSide} position for ${selectedOption.title}`
                  : `No ${localSelectedSide} position to sell`
                }
              </div>
            )}
          </div>
        )}

        {/* Trade Button */}
        <Button
          onClick={handlePlaceBet}
          disabled={
            loading ||
            !amount ||
            parseFloat(amount) <= 0 ||
            (mode === "sell" && !hasPosition)
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
