"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  DollarSign,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
} from "lucide-react";

interface Payment {
  id: string;
  amount: number;
  transactionId: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
  verifiedAt: string | null;
  user: {
    email: string;
    displayName: string;
  };
}

export default function AdminPayments() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Form state for manual payment entry
  const [userEmail, setUserEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("venmo");
  const [showForm, setShowForm] = useState(false);
  const [approvingPayment, setApprovingPayment] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user?.isAdmin) {
      router.push("/");
      return;
    }
    fetchPayments();
  }, [session, status, router]);

  const fetchPayments = async () => {
    try {
      const response = await fetch("/api/admin/payments/process");
      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async () => {
    if (!userEmail || !amount || !transactionId) {
      alert("Please fill in all fields");
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch("/api/admin/payments/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userEmail,
          amount: Number(amount),
          paymentMethod,
          externalTransactionId: transactionId,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(
          `Success! Added $${Number(result.dollarsAdded).toFixed(2)} to ${result.user.name}'s account`
        );

        // Reset form
        setUserEmail("");
        setAmount("");
        setTransactionId("");
        setShowForm(false);

        // Refresh payments list
        fetchPayments();
      } else {
        const error = await response.json();
        alert(error.message || "Failed to process payment");
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      alert("An error occurred while processing the payment");
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentAction = async (
    paymentId: string,
    action: "approve" | "reject"
  ) => {
    setApprovingPayment(paymentId);
    try {
      const response = await fetch(`/api/admin/payments/${paymentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        fetchPayments(); // Refresh the list
      } else {
        const error = await response.json();
        alert(error.message || `Failed to ${action} payment`);
      }
    } catch (error) {
      console.error(`Error ${action}ing payment:`, error);
      alert(`An error occurred while ${action}ing the payment`);
    } finally {
      setApprovingPayment(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return "success";
      case "PENDING":
        return "warning";
      case "REJECTED":
        return "error";
      default:
        return "secondary";
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method.toLowerCase()) {
      case "venmo":
        return "default";
      case "cashapp":
        return "success";
      case "paypal":
        return "warning";
      default:
        return "secondary";
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!session?.user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400">Admin access required</p>
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Payment Administration
        </h1>
        <p className="text-gray-400">
          Process external payments and manage user deposits
        </p>
      </div>

      {/* Quick Process Form */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Process External Payment
            </CardTitle>
            <Button
              variant={showForm ? "ghost" : "primary"}
              size="sm"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? "Cancel" : "Add Payment"}
            </Button>
          </div>
        </CardHeader>
        {showForm && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  User Email *
                </label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Amount (USD) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="10.00"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Transaction ID *
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Venmo/CashApp transaction ID"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="venmo">Venmo</option>
                  <option value="cashapp">Cash App</option>
                  <option value="paypal">PayPal</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>
            </div>

            {amount && (
              <div className="bg-blue-600/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-white">Amount to add:</span>
                  <span className="font-bold text-green-400">
                    ${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}

            <Button
              onClick={processPayment}
              disabled={processing || !userEmail || !amount || !transactionId}
              className="w-full"
            >
              {processing ? "Processing..." : "Process Payment"}
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Recent Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Recent Payments ({payments.length})
            {payments.filter((p) => p.status === "PENDING").length > 0 && (
              <Badge variant="warning" className="ml-2">
                {payments.filter((p) => p.status === "PENDING").length} Pending
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length > 0 ? (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant={getPaymentMethodColor(payment.paymentMethod)}
                      >
                        {payment.paymentMethod.toUpperCase()}
                      </Badge>
                      <Badge variant={getStatusColor(payment.status)}>
                        {payment.status === "VERIFIED" && (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        )}
                        {payment.status === "PENDING" && (
                          <Clock className="h-3 w-3 mr-1" />
                        )}
                        {payment.status === "REJECTED" && (
                          <AlertCircle className="h-3 w-3 mr-1" />
                        )}
                        {payment.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-white font-medium">
                        {payment.user.name} ({payment.user.email})
                      </span>
                      <span className="text-gray-400">
                        ID: {payment.transactionId}
                      </span>
                      <span className="text-gray-400">
                        {new Date(payment.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <div className="text-white font-semibold">
                        $
                        {Number(payment.amount).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                      <div className="text-sm text-green-400">
                        +$
                        {Number(payment.amount).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                        {" "}added
                      </div>
                    </div>
                    {payment.status === "PENDING" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            handlePaymentAction(payment.id, "approve")
                          }
                          disabled={approvingPayment === payment.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {approvingPayment === payment.id ? (
                            "Processing..."
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            handlePaymentAction(payment.id, "reject")
                          }
                          disabled={approvingPayment === payment.id}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <DollarSign className="h-12 w-12 mx-auto mb-2" />
              <p>No payments processed yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
