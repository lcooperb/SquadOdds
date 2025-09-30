"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  DollarSign,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  X,
} from "lucide-react";

export default function TopUp() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedAmount, setSelectedAmount] = useState<number>(10);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Preset amounts in USD
  const predefinedAmounts: number[] = [5, 10, 25, 50, 100, 200];

  // Redirect unauthenticated users to sign-in without running during render
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <>
                <div className="min-h-screen flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      </>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    if (value && !isNaN(Number(value))) {
      setSelectedAmount(Number(value));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  };

  const handleContinueToPayment = () => {
    if (selectedAmount > 0) {
      setShowPaymentDetails(true);
    }
  };

  const handleSubmitPayment = async () => {
    setError(null);
    if (!selectedAmount || selectedAmount <= 0) {
      setError("Please select a valid amount.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(selectedAmount),
          // no transactionId required; server will auto-generate one
          paymentMethod: "applecash",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const message = data?.message || "Failed to submit payment request";
        setError(message);
        return;
      }

      setSuccessMessage(
        "Payment request submitted! An admin will review and approve your top-up shortly."
      );

      // Redirect after showing success message
      setTimeout(() => {
        router.push("/profile");
      }, 3000);
    } catch (e) {
      console.error(e);
      setError("An unexpected error occurred while submitting your payment.");
    } finally {
      setLoading(false);
    }
  };

  // All amounts are in USD, using Apple Pay for payments.

  return (
    <>
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Add Funds</h1>
          <div className="space-y-2 text-gray-300">
            <p>Pay Leo via Apple Cash and we will approve adding the same amount of dollars to your SquadOdds account.</p>
            <p className="text-gray-400 text-sm">We use a shared group pile for wagers: everyone pays into the same pool, and whatever goes in will also come out over time.</p>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-600/10 border border-green-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-green-400 font-medium mb-1">Success!</h4>
                <p className="text-green-300 text-sm">{successMessage}</p>
                <p className="text-green-300/70 text-xs mt-2">Redirecting to your profile...</p>
              </div>
              <button
                onClick={() => setSuccessMessage(null)}
                className="text-green-400 hover:text-green-300 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-600/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-red-400 font-medium mb-1">Error</h4>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {!showPaymentDetails ? (
          /* Amount Selection */
          <Card className="bg-gray-800/90 border-0 shadow-lg">
            <CardHeader className="p-4">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Select Amount
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-6">
              {/* Predefined Amounts */}
              <div>
                <label className="block text-sm font-medium text-white mb-3">Choose Amount (USD)</label>
                <div className="grid grid-cols-3 gap-3">
                  {predefinedAmounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handleAmountSelect(amount)}
                      className={`p-3 rounded-lg transition-all text-sm font-semibold ${
                        selectedAmount === amount && !customAmount
                          ? "bg-purple-600 hover:bg-purple-700 text-white ring-1 ring-purple-400/50"
                          : "bg-gray-800 text-gray-200 border border-gray-700 hover:bg-gray-700"
                      }`}
                    >
                      <div className="text-white font-semibold">
                        $
                        {amount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <div>
                <label
                  htmlFor="custom-amount"
                  className="block text-sm font-medium text-white mb-2"
                >
                  Or Enter Custom Amount (USD)
                </label>
                <input
                  type="number"
                  id="custom-amount"
                  min="1"
                  max="1000"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  placeholder="Enter amount in USD ($)"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Summary */}
              {selectedAmount > 0 && (
                <div className="bg-blue-600/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white">Payment Amount:</span>
                    <span className="font-bold text-white">
                      $
                      {selectedAmount.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              )}

              {/* Continue Button */}
              <Button
                onClick={handleContinueToPayment}
                disabled={selectedAmount <= 0}
                className="w-full"
              >
                Continue to Payment
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Payment Details */
          <div className="space-y-6">
            <Card className="bg-gray-800/90 border-0 shadow-lg">
              <CardHeader className="p-4">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Instructions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-4">
                <div className="bg-yellow-600/10 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                    <div>
                      <h4 className="text-white font-medium mb-1">
                        Payment Required
                      </h4>
                      <p className="text-yellow-300 text-sm">
                        Send <strong>$
                          {selectedAmount.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </strong> via Apple Cash to <strong>Leo</strong>, then hit Submit. We'll review and credit your balance with the same amount.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment Method - Apple Cash */}
                <div className="space-y-4">
                  <h3 className="text-white font-medium">
                    Send Payment via Apple Cash
                  </h3>

                  <div className="bg-gray-800/30 rounded-lg p-4 space-y-2">
                    <h4 className="text-white font-medium">Instructions</h4>
                    <p className="text-sm text-gray-300">
                      Use Apple Cash in the Messages app to send <strong>${selectedAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> to <strong>Leo</strong>.
                    </p>
                    <div className="mt-2 p-3 bg-blue-600/10 border border-blue-500/20 rounded-md">
                      <p className="text-sm text-blue-300">
                        We keep a shared group pile for bets—everyone pays into the same pool, and whatever goes in will also come out to winners.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submission Instructions (No Verification Required) */}
            <Card className="bg-gray-800/90 border-0 shadow-lg">
              <CardHeader className="p-4">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Submit Request
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-4">
                <p className="text-gray-300">
                  After sending payment, hit <strong>Submit</strong> for review.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => setShowPaymentDetails(false)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmitPayment}
                    disabled={loading || selectedAmount <= 0}
                    className="flex-1"
                  >
                    {loading ? "Submitting..." : "Submit"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </>
  );
}
