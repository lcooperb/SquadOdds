"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  DollarSign,
  ArrowDownCircle,
  AlertCircle,
  Clock,
  CheckCircle,
  X,
} from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  virtualBalance: number;
}

interface Redemption {
  id: string;
  tokenAmount: number;
  dollarAmount: number;
  status: string;
  requestedAt: string;
  processedAt: string | null;
  adminNotes: string | null;
}

export default function RedeemPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [redeemAmount, setRedeemAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);


  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    fetchUserData();
  }, [session, status, router]);

  const fetchUserData = async () => {
    try {
      const [profileRes, redemptionsRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/redemptions"),
      ]);

      if (profileRes.ok) {
        const userData = await profileRes.json();
        setProfile(userData);
      }

      if (redemptionsRes.ok) {
        const redemptionsData = await redemptionsRes.json();
        setRedemptions(redemptionsData);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const dollars = parseFloat(redeemAmount);
    if (isNaN(dollars) || dollars < 1) {
      setError("Minimum redemption is $1");
      return;
    }

    if (!profile || dollars > Number(profile.virtualBalance)) {
      setError("Insufficient balance");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/redemptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dollarAmount: dollars,
        }),
      });

      if (response.ok) {
        setSuccessMessage(
          "Redemption request submitted successfully! Admin will process your request."
        );
        setRedeemAmount("");
        fetchUserData();
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to submit redemption request");
      }
    } catch (error) {
      console.error("Error submitting redemption:", error);
      setError("An error occurred while submitting your request");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "success";
      case "APPROVED":
        return "warning";
      case "PENDING":
        return "default";
      case "REJECTED":
        return "error";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="container mx-auto px-4 py-8">
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
      </main>
    );
  }

  const dollarValue = Number(profile.virtualBalance);
  const heldAmount = redemptions
    .filter((r) => r.status === "PENDING")
    .reduce((sum, r) => sum + Number(r.tokenAmount), 0);

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Redeem Funds</h1>
        <p className="text-gray-400">Cash out your balance via Apple Cash</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 bg-green-600/10 border border-green-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-green-400 font-medium mb-1">Success!</h4>
              <p className="text-green-300 text-sm">{successMessage}</p>
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
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
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

      {/* Current Balance */}
      <Card className="mb-6 bg-gray-800/90 border-0 shadow-lg">
        <CardHeader className="p-4">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Current Balance
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-center p-4 bg-gray-700/50 rounded-lg">
            <div className="text-3xl font-bold text-green-400 mb-2">
              ${Number(profile.virtualBalance).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-gray-400">
              Available Balance ($
              {dollarValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD)
            </div>
            {heldAmount > 0 && (
              <div className="text-sm text-yellow-300 mt-1">
                Held (pending): ${Number(heldAmount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Redemption Form */}
      <Card className="mb-6 bg-gray-800/90 border-0 shadow-lg">
        <CardHeader className="p-4">
            <CardTitle className="flex items-center gap-2">
              <ArrowDownCircle className="h-5 w-5" />
              Request Redemption
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <form onSubmit={handleRedeem} className="space-y-4">

              <div>
                <label
                  htmlFor="redeemAmount"
                  className="block text-sm font-medium text-white mb-2"
                >
                  Amount (USD) *
                </label>
                <input
                  type="number"
                  id="redeemAmount"
                  value={redeemAmount}
                  onChange={(e) => setRedeemAmount(e.target.value)}
                  placeholder="Enter amount in USD (minimum $1)"
                  min="1"
                  max={Number(profile.virtualBalance)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <div className="flex justify-between mt-1 text-xs text-gray-400">
                  <span>Minimum: $1</span>
                  <span>
                    Available: ${Number(profile.virtualBalance).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                {/* Quick-select partial redemption buttons */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {[
                    { label: "25%", value: Math.floor(Number(profile.virtualBalance) * 0.25) },
                    { label: "50%", value: Math.floor(Number(profile.virtualBalance) * 0.5) },
                    { label: "75%", value: Math.floor(Number(profile.virtualBalance) * 0.75) },
                    { label: "Max", value: Number(profile.virtualBalance) },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setRedeemAmount(String(opt.value))}
                      className="px-3 py-1 text-xs rounded-md border border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {redeemAmount && parseFloat(redeemAmount) >= 1 && (
                <div className="bg-blue-600/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white">You will redeem:</span>
                    <div className="text-right">
                      <div className="font-bold text-green-400">
                        ${Number(redeemAmount || "0").toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-300">
                    <p>
                      Requests are reviewed within 1-2 business days. Payment sent via Apple Cash.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={
                  submitting ||
                  !redeemAmount ||
                  parseFloat(redeemAmount) < 1
                }
                className="w-full"
              >
                {submitting ? "Submitting..." : "Submit Redemption Request"}
              </Button>
            </form>
          </CardContent>
      </Card>

      {/* Redemption History */}
      <Card className="bg-gray-800/90 border-0 shadow-lg">
        <CardHeader className="p-4">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Redemption History ({redemptions.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {redemptions.length > 0 ? (
            <div className="space-y-4">
              {redemptions.map((redemption) => (
                <div
                  key={redemption.id}
                  className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={getStatusColor(redemption.status)}>
                        {redemption.status === "COMPLETED" && (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        )}
                        {redemption.status === "PENDING" && (
                          <Clock className="h-3 w-3 mr-1" />
                        )}
                        {redemption.status === "REJECTED" && (
                          <X className="h-3 w-3 mr-1" />
                        )}
                        {redemption.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-white font-medium">
                        $
                        {redemption.dollarAmount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      <span className="text-gray-400">
                        {new Date(redemption.requestedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {redemption.adminNotes && (
                      <div className="mt-2 text-sm text-gray-400">
                        <strong>Admin note:</strong> {redemption.adminNotes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <ArrowDownCircle className="h-12 w-12 mx-auto mb-2" />
              <p>No redemption requests yet</p>
              <p className="text-sm">
                Submit your first redemption request to see it here
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
