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
  username: string;
  displayName: string;
  venmoHandle: string | null;
  virtualBalance: number;
}

interface Redemption {
  id: string;
  tokenAmount: number;
  dollarAmount: number;
  venmoHandle: string;
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
  const [venmoHandle, setVenmoHandle] = useState("");
  

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
        setVenmoHandle(userData.venmoHandle || "");
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
    if (!venmoHandle.trim()) {
      alert("Please enter your Venmo handle");
      return;
    }

    const tokens = parseInt(redeemAmount);
    if (tokens < 100) {
      alert("Minimum redemption is 100 tokens");
      return;
    }

    if (!profile || tokens > profile.virtualBalance) {
      alert("Insufficient token balance");
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
          tokenAmount: tokens,
          venmoHandle: venmoHandle.trim(),
        }),
      });

      if (response.ok) {
        alert(
          "Redemption request submitted successfully! Admin will process your request."
        );
        setRedeemAmount("");
        fetchUserData();
      } else {
        const error = await response.json();
        alert(error.message || "Failed to submit redemption request");
      }
    } catch (error) {
      console.error("Error submitting redemption:", error);
      alert("An error occurred while submitting your request");
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

  const dollarValue = profile.virtualBalance / 100;
  const heldAmount = redemptions
    .filter((r) => r.status === "PENDING")
    .reduce((sum, r) => sum + Number(r.tokenAmount), 0);

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Redeem Tokens</h1>
        <p className="text-gray-400">Convert your tokens to real money via Venmo</p>
      </div>

      {/* Current Balance */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Current Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-4 bg-gray-800/30 rounded-lg">
            <div className="text-3xl font-bold text-green-400 mb-2">
              ₺{Math.round(profile.virtualBalance).toLocaleString("en-US")}
            </div>
            <div className="text-gray-400">
              Available Balance ($
              {dollarValue.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} USD)
            </div>
            {heldAmount > 0 && (
              <div className="text-sm text-yellow-300 mt-1">
                Held (pending): ₺{Math.round(heldAmount).toLocaleString("en-US")}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Redemption Form */}
      <Card className="mb-6">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDownCircle className="h-5 w-5" />
              Request Redemption
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRedeem} className="space-y-4">
              <div>
                <label
                  htmlFor="venmoHandle"
                  className="block text-sm font-medium text-white mb-2"
                >
                  Venmo Handle *
                </label>
                <input
                  type="text"
                  id="venmoHandle"
                  value={venmoHandle}
                  onChange={(e) => setVenmoHandle(e.target.value)}
                  placeholder="@your-venmo-handle"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="mt-1 text-xs text-gray-400">
                  Admin will send payment to this Venmo handle
                </p>
              </div>

              <div>
                <label
                  htmlFor="redeemAmount"
                  className="block text-sm font-medium text-white mb-2"
                >
                  Token Amount *
                </label>
                <input
                  type="number"
                  id="redeemAmount"
                  value={redeemAmount}
                  onChange={(e) => setRedeemAmount(e.target.value)}
                  placeholder="Enter token amount (minimum 100)"
                  min="100"
                  max={profile.virtualBalance}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <div className="flex justify-between mt-1 text-xs text-gray-400">
                  <span>Minimum: 100 tokens</span>
                  <span>
                    Available: ₺{Math.round(profile.virtualBalance).toLocaleString("en-US")}
                  </span>
                </div>
                {/* Quick-select partial redemption buttons */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {[
                    { label: "25%", value: Math.floor(profile.virtualBalance * 0.25) },
                    { label: "50%", value: Math.floor(profile.virtualBalance * 0.5) },
                    { label: "75%", value: Math.floor(profile.virtualBalance * 0.75) },
                    { label: "Max", value: profile.virtualBalance },
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

              {redeemAmount && parseInt(redeemAmount) >= 100 && (
                <div className="bg-blue-600/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white">You will redeem:</span>
                    <div className="text-right">
                      <div className="font-bold text-green-400">
                        ₺{Math.round(parseInt(redeemAmount || "0")).toLocaleString("en-US")}
                      </div>
                      <div className="text-xs text-gray-300">
                        ≈ ${((parseInt(redeemAmount || "0") || 0) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-300">
                    <p className="mb-2">
                      <strong>How it works:</strong>
                    </p>
                    <ul className="space-y-1 text-gray-400">
                      <li>
                        • Your redemption request will be reviewed by an admin
                      </li>
                      <li>• Processing typically takes 1-2 business days</li>
                      <li>
                        • Payment will be sent via Venmo to the handle you
                        provide
                      </li>
                      <li>
                        • Funds will be removed from your available balance
                        until approved
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={
                  submitting ||
                  !redeemAmount ||
                  !venmoHandle.trim() ||
                  parseInt(redeemAmount) < 100
                }
                className="w-full"
              >
                {submitting ? "Submitting..." : "Submit Redemption Request"}
              </Button>
            </form>
          </CardContent>
      </Card>

      {/* Redemption History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Redemption History ({redemptions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {redemptions.length > 0 ? (
            <div className="space-y-4">
              {redemptions.map((redemption) => (
                <div
                  key={redemption.id}
                  className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg"
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
                        to {redemption.venmoHandle}
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
