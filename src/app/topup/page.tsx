"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  DollarSign,
  CreditCard,
  CheckCircle,
  Copy,
  AlertTriangle,
} from "lucide-react";

export default function TopUp() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedAmount, setSelectedAmount] = useState<number>(10);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);

  // Venmo payment account details
  const paymentAccount = {
    venmo: "@leo-cooperband",
  };

  const predefinedAmounts = [5, 10, 25, 50, 100, 200];

  if (status === "loading") {
    return (
      <>
                <div className="min-h-screen flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      </>
    );
  }

  if (!session) {
    router.push("/auth/signin");
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
    setLoading(true);
    try {
      alert(
        "Thanks! After your Venmo payment goes through, hit Submit. Your top-up will be approved within the next day or two."
      );
      router.push("/profile");
    } finally {
      setLoading(false);
    }
  };

  // Tokens are no longer used; all amounts are in Lira.

  return (
    <>
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Add Lira</h1>
          <p className="text-gray-400">
            Add funds to your account balance in Turkish Lira (₺)
          </p>
        </div>

        {!showPaymentDetails ? (
          /* Amount Selection */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Select Amount
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Predefined Amounts */}
              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  Choose Amount (₺)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {predefinedAmounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handleAmountSelect(amount)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedAmount === amount && !customAmount
                          ? "border-blue-500 bg-blue-500/20"
                          : "border-gray-600 bg-gray-800/50 hover:border-gray-500"
                      }`}
                    >
                      <div className="text-white font-semibold">
                        ₺
                        {amount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                      <div className="text-sm text-gray-400">Instant balance top-up</div>
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
                  Or Enter Custom Amount (₺)
                </label>
                <input
                  type="number"
                  id="custom-amount"
                  min="1"
                  max="1000"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  placeholder="Enter amount in Lira (₺)"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Summary */}
              {selectedAmount > 0 && (
                <div className="bg-blue-600/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white">Payment Amount:</span>
                    <span className="font-bold text-white">
                      ₺
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Instructions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-yellow-600/10 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                    <div>
                      <h4 className="text-white font-medium mb-1">
                        Payment Required
                      </h4>
                      <p className="text-yellow-300 text-sm">
                        Send exactly <strong>₺
                          {selectedAmount.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </strong> to the Venmo account below. After your payment goes through, hit Submit. Your top-up will be approved within the next day or two.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment Method - Venmo Only */
                /* Updated to reflect new Venmo handle and no verification step */}
                <div className="space-y-4">
                  <h3 className="text-white font-medium">
                    Send Payment via Venmo:
                  </h3>

                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-medium">Venmo</h4>
                      <button
                        onClick={() => copyToClipboard(paymentAccount.venmo)}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-gray-300 font-mono text-lg">
                      {paymentAccount.venmo}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      Include your email address in the payment note so we can
                      identify your account.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submission Instructions (No Verification Required) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Submit Request
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300">
                  After your Venmo payment goes through, hit <strong>Submit</strong>. Your top-up will be
                  approved within the next day or two.
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
                    disabled={loading}
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
