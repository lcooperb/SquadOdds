"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Shield,
  CheckCircle,
  XCircle,
  Users,
  TrendingUp,
  Calendar,
  DollarSign,
  Settings,
  Plus,
  Clock,
  AlertCircle,
  X,
  ArrowDownCircle,
} from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string;
  virtualBalance: number;
  isAdmin: boolean;
  createdAt: string;
  _count: {
    bets: number;
    createdEvents: number;
  };
}

interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  marketType: string;
  endDate: string | null;
  isOngoing: boolean;
  totalVolume: number;
  resolved: boolean;
  outcome: boolean | null;
  winningOptionId: string | null;
  createdAt: string;
  createdBy: {
    name: string;
  };
  options?: Array<{
    id: string;
    title: string;
    price: number;
    totalVolume: number;
  }>;
  _count: {
    bets: number;
  };
}

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
    name: string;
  };
}

interface Redemption {
  id: string;
  tokenAmount: number;
  dollarAmount: number;
  appleCashEmail: string;
  status: string;
  requestedAt: string;
  processedAt: string | null;
  adminNotes: string | null;
  user: {
    email: string;
    name: string;
  };
}

export default function AdminPanel() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"events" | "users" | "payments" | "redemptions">(
    "events"
  );
  const [eventsSubTab, setEventsSubTab] = useState<"active" | "resolved">("active");
  const [paymentsSubTab, setPaymentsSubTab] = useState<"pending" | "processed">("pending");
  const [redemptionsSubTab, setRedemptionsSubTab] = useState<"pending" | "completed">("pending");
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);

  // Payment form state
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("venmo");
  const [showForm, setShowForm] = useState(false);
  const [approvingPayment, setApprovingPayment] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      router.push("/auth/signin");
      return;
    }

    // Check if user is admin
    fetchUserData();
  }, [session, status, router]);

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const userData = await response.json();
        if (!userData.isAdmin) {
          router.push("/");
          return;
        }
      } else {
        router.push("/");
        return;
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
      router.push("/");
      return;
    }

    // If we get here, user is admin
    fetchData();
  };

  const fetchData = async () => {
    try {
      const [eventsRes, usersRes, paymentsRes, redemptionsRes] = await Promise.all([
        fetch("/api/admin/events"),
        fetch("/api/admin/users"),
        fetch("/api/admin/payments/process"),
        fetch("/api/admin/redemptions"),
      ]);

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(eventsData);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }

      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        setPayments(paymentsData);
      }
      if (redemptionsRes.ok) {
        const redemptionsData = await redemptionsRes.json();
        setRedemptions(redemptionsData);
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      setPaymentLoading(true);
      const response = await fetch("/api/admin/payments/process");
      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setPaymentLoading(false);
    }
  };

  const openResolutionModal = (
    eventId: string,
    eventTitle: string,
    resolution: "YES" | "NO" | string,
    resolutionLabel: string
  ) => {
    setResolutionModal({
      isOpen: true,
      eventId,
      eventTitle,
      resolution,
      resolutionLabel
    });
  };

  const closeResolutionModal = () => {
    setResolutionModal({
      isOpen: false,
      eventId: "",
      eventTitle: "",
      resolution: "",
      resolutionLabel: ""
    });
  };

  const confirmResolution = async () => {
    try {
      const response = await fetch(`/api/events/${resolutionModal.eventId}/resolve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          outcome:
            resolutionModal.resolution === "YES"
              ? true
              : resolutionModal.resolution === "NO"
                ? false
                : undefined,
          winningOptionId:
            resolutionModal.resolution !== "YES" && resolutionModal.resolution !== "NO"
              ? resolutionModal.resolution
              : undefined,
        }),
      });

      if (response.ok) {
        fetchData(); // Refresh data
        closeResolutionModal();
      } else {
        const error = await response.json();
        alert(`Error resolving event: ${error.message}`);
      }
    } catch (error) {
      console.error("Error resolving event:", error);
      alert("Error resolving event");
    }
  };

  const toggleUserAdmin = async (userId: string, isAdmin: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isAdmin: !isAdmin }),
      });

      if (response.ok) {
        fetchData(); // Refresh data
      } else {
        const error = await response.json();
        alert(`Error updating user: ${error.message}`);
      }
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Error updating user");
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
      case "APPROVED":
        return "default";
      case "COMPLETED":
        return "success";
      case "REJECTED":
        return "error";
      default:
        return "secondary";
    }
  };

  const [processingRedemptionId, setProcessingRedemptionId] = useState<string | null>(null);

  // Resolution confirmation modal state
  const [resolutionModal, setResolutionModal] = useState<{
    isOpen: boolean;
    eventId: string;
    eventTitle: string;
    resolution: "YES" | "NO" | string;
    resolutionLabel: string;
  }>({
    isOpen: false,
    eventId: "",
    eventTitle: "",
    resolution: "",
    resolutionLabel: ""
  });
  const handleRedemptionAction = async (
    redemptionId: string,
    action: "approve" | "complete" | "reject",
    adminNotes?: string
  ) => {
    setProcessingRedemptionId(redemptionId);
    try {
      const response = await fetch(`/api/admin/redemptions/${redemptionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, adminNotes }),
      });
      if (response.ok) {
        const result = await response.json();
        alert(result.message || `Redemption ${action}d`);
        fetchData();
      } else {
        const err = await response.json();
        alert(err.message || `Failed to ${action} redemption`);
      }
    } catch (error) {
      console.error(`Error ${action} redemption:`, error);
      alert(`An error occurred while processing redemption`);
    } finally {
      setProcessingRedemptionId(null);
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
      <>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-white">Loading admin panel...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-500" />
            Admin Panel
          </h1>
          <p className="text-gray-400">Manage events and users for SquadOdds</p>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:flex gap-2 md:gap-4 mb-6">
          <button
            onClick={() => setActiveTab("events")}
            className={`px-3 md:px-4 py-2 rounded-lg font-medium transition-colors text-sm md:text-base ${
              activeTab === "events"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            <TrendingUp className="inline h-4 w-4 mr-2" />
            Events ({events.filter(e => !e.resolved).length})
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-3 md:px-4 py-2 rounded-lg font-medium transition-colors text-sm md:text-base ${
              activeTab === "users"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            <Users className="inline h-4 w-4 mr-2" />
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab("payments")}
            className={`px-3 md:px-4 py-2 rounded-lg font-medium transition-colors text-sm md:text-base ${
              activeTab === "payments"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            <DollarSign className="inline h-4 w-4 mr-2" />
            Payments ({payments.filter(p => p.status === "PENDING").length})
          </button>
          <button
            onClick={() => setActiveTab("redemptions")}
            className={`px-3 md:px-4 py-2 rounded-lg font-medium transition-colors text-sm md:text-base ${
              activeTab === "redemptions"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            <ArrowDownCircle className="inline h-4 w-4 mr-2" />
            Redemptions ({redemptions.filter(r => r.status === "PENDING").length})
          </button>
        </div>

        {/* Events Tab */}
        {activeTab === "events" && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 className="text-xl font-semibold text-white">
                Event Management
              </h2>
              <div className="flex flex-col md:flex-row gap-2">
                <Button
                  variant={eventsSubTab === "active" ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setEventsSubTab("active")}
                  className="text-xs md:text-sm"
                >
                  Active ({events.filter(e => !e.resolved).length})
                </Button>
                <Button
                  variant={eventsSubTab === "resolved" ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setEventsSubTab("resolved")}
                  className="text-xs md:text-sm"
                >
                  Resolved ({events.filter(e => e.resolved).length})
                </Button>
              </div>
            </div>
            {events
              .filter(event => eventsSubTab === "active" ? !event.resolved : event.resolved)
              .map((event) => (
              <Card key={event.id} className="bg-gray-800/90 border-0 shadow-lg hover:bg-gray-800 transition-colors">
                <CardHeader className="p-4">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-base md:text-lg">{event.title}</CardTitle>
                      <p className="text-gray-400 text-sm mt-1">
                        {event.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge variant="secondary">{event.category}</Badge>
                        <Badge
                          variant={
                            event.marketType === "BINARY"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {event.marketType === "BINARY"
                            ? "Yes/No"
                            : "Multiple Choice"}
                        </Badge>
                        <Badge
                          variant={
                            event.status === "ACTIVE" ? "default" : "secondary"
                          }
                        >
                          {event.status}
                        </Badge>
                        {event.resolved && (
                          <Badge variant="success">Resolved</Badge>
                        )}
                      </div>
                    </div>
                    <div className="md:text-right text-sm text-gray-400 flex md:flex-col gap-2 md:gap-1">
                      <div className="text-xs md:text-sm">by {event.createdBy.name}</div>
                      <div className="text-xs md:text-sm">{event._count.bets} bets</div>
                      <div className="text-xs md:text-sm">
                        $
                        {Number(event.totalVolume).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        volume
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {!event.resolved && event.status === "ACTIVE" && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-white">Resolve Event:</h4>

                      {event.marketType === "BINARY" ? (
                        <div className="flex flex-col md:flex-row gap-2">
                          <Button
                            onClick={() => openResolutionModal(event.id, event.title, "YES", "YES")}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Resolve YES
                          </Button>
                          <Button
                            onClick={() => openResolutionModal(event.id, event.title, "NO", "NO")}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Resolve NO
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-400">
                            Select winning option:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {event.options?.map((option) => (
                              <Button
                                key={option.id}
                                onClick={() =>
                                  openResolutionModal(
                                    event.id,
                                    event.title,
                                    option.id,
                                    `${option.title} (${Number(option.price).toFixed(1)}%)`
                                  )
                                }
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                {option.title} (
                                {Number(option.price).toFixed(1)}%)
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {event.resolved && (
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <h4 className="font-medium text-white mb-2">
                        Resolution:
                      </h4>
                      {event.marketType === "BINARY" ? (
                        <Badge variant={event.outcome ? "success" : "error"}>
                          {event.outcome ? "YES" : "NO"}
                        </Badge>
                      ) : (
                        <Badge variant="success">
                          {event.options?.find(
                            (opt) => opt.id === event.winningOptionId
                          )?.title || "Unknown"}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {events.filter(event => eventsSubTab === "active" ? !event.resolved : event.resolved).length === 0 && (
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No {eventsSubTab} events found</p>
              </div>
            )}
          </div>
        )}

        {/* Redemptions Tab */}
        {activeTab === "redemptions" && (
          <div className="space-y-6">
            <Card className="bg-gray-800/90 border-0 shadow-lg">
              <CardHeader className="p-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <ArrowDownCircle className="h-5 w-5" />
                    Redemption Requests ({redemptions.length})
                    {redemptions.filter((r) => r.status === "PENDING").length > 0 && (
                      <Badge variant="warning" className="ml-2">
                        {redemptions.filter((r) => r.status === "PENDING").length} Pending
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="flex flex-col md:flex-row gap-2">
                    <Button
                      variant={redemptionsSubTab === "pending" ? "primary" : "outline"}
                      size="sm"
                      onClick={() => setRedemptionsSubTab("pending")}
                      className="text-xs md:text-sm"
                    >
                      Pending ({redemptions.filter(r => r.status === "PENDING").length})
                    </Button>
                    <Button
                      variant={redemptionsSubTab === "completed" ? "primary" : "outline"}
                      size="sm"
                      onClick={() => setRedemptionsSubTab("completed")}
                      className="text-xs md:text-sm"
                    >
                      Completed ({redemptions.filter(r => r.status === "COMPLETED" || r.status === "REJECTED").length})
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {redemptions.filter(r => redemptionsSubTab === "pending" ? r.status === "PENDING" : (r.status === "COMPLETED" || r.status === "REJECTED")).length > 0 ? (
                  <div className="space-y-4">
                    {redemptions
                      .filter(r => redemptionsSubTab === "pending" ? r.status === "PENDING" : (r.status === "COMPLETED" || r.status === "REJECTED"))
                      .map((r) => (
                      <div key={r.id} className="flex flex-col md:flex-row md:items-center md:justify-between p-3 md:p-4 bg-gray-800/30 rounded-lg gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={getStatusColor(r.status)}>
                              {r.status === "PENDING" && <Clock className="h-3 w-3 mr-1" />}
                              {r.status === "APPROVED" && <CheckCircle className="h-3 w-3 mr-1" />}
                              {r.status === "COMPLETED" && <CheckCircle className="h-3 w-3 mr-1" />}
                              {r.status === "REJECTED" && <AlertCircle className="h-3 w-3 mr-1" />}
                              {r.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-400 space-y-1">
                            <div className="text-white font-medium">{r.user.name} ({r.user.email})</div>
                            <div className="text-xs md:text-sm">Apple Cash: {r.appleCashEmail}</div>
                            <div className="text-xs md:text-sm">{new Date(r.requestedAt).toLocaleString()}</div>
                          </div>
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center gap-3">
                          <div className="text-center md:text-right">
                            <div className="text-white font-semibold text-lg">
                              ${Number(r.dollarAmount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          </div>

                          {r.status === "PENDING" && (
                            <div className="flex flex-col md:flex-row gap-2">
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 w-full md:w-auto"
                                onClick={() => handleRedemptionAction(r.id, "complete")}
                                disabled={processingRedemptionId === r.id}
                              >
                                {processingRedemptionId === r.id ? "Processing..." : "Complete"}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRedemptionAction(r.id, "reject")}
                                disabled={processingRedemptionId === r.id}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 w-full md:w-auto"
                              >
                                <X className="h-4 w-4 mr-1" /> Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <ArrowDownCircle className="h-12 w-12 mx-auto mb-2" />
                    <p>No {redemptionsSubTab} redemption requests</p>
                  </div>
                )}
                </CardContent>
            </Card>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">
              User Management
            </h2>
            <div className="grid gap-4">
              {users.map((user) => (
                <Card key={user.id} className="bg-gray-800/90 border-0 shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-medium text-white">
                          {user.name}
                        </h3>
                        <p className="text-gray-400 text-sm">
                          {user.email}
                        </p>
                        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 mt-2 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            ${Number(user.virtualBalance).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className="text-xs md:text-sm">{user._count.bets} bets</span>
                          <span className="text-xs md:text-sm">{user._count.createdEvents} markets</span>
                          <span className="text-xs md:text-sm">
                            Joined{" "}
                            {new Date(user.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
                        {user.isAdmin && <Badge variant="default">Admin</Badge>}
                        <Button
                          onClick={() => toggleUserAdmin(user.id, user.isAdmin)}
                          variant="outline"
                          size="sm"
                          className="w-full md:w-auto text-xs md:text-sm"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          {user.isAdmin ? "Remove Admin" : "Make Admin"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {users.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No users found</p>
              </div>
            )}
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === "payments" && (
          <div className="space-y-6">
            {/* Quick Process Form */}
            <Card className="bg-gray-800/90 border-0 shadow-lg">
              <CardHeader className="p-4">
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
                <CardContent className="p-4 pt-0 space-y-4">
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
                    disabled={
                      processing || !userEmail || !amount || !transactionId
                    }
                    className="w-full"
                  >
                    {processing ? "Processing..." : "Process Payment"}
                  </Button>
                </CardContent>
              )}
            </Card>

            {/* Recent Payments */}
            <Card className="bg-gray-800/90 border-0 shadow-lg">
              <CardHeader className="p-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Recent Payments ({payments.length})
                    {payments.filter((p) => p.status === "PENDING").length >
                      0 && (
                      <Badge variant="warning" className="ml-2">
                        {payments.filter((p) => p.status === "PENDING").length}{" "}
                        Pending
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant={paymentsSubTab === "pending" ? "primary" : "outline"}
                      size="sm"
                      onClick={() => setPaymentsSubTab("pending")}
                    >
                      Pending ({payments.filter(p => p.status === "PENDING").length})
                    </Button>
                    <Button
                      variant={paymentsSubTab === "processed" ? "primary" : "outline"}
                      size="sm"
                      onClick={() => setPaymentsSubTab("processed")}
                    >
                      Processed ({payments.filter(p => p.status === "VERIFIED" || p.status === "REJECTED").length})
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {paymentLoading ? (
                  <div className="text-center py-8 text-gray-400">
                    <DollarSign className="h-12 w-12 mx-auto mb-2 animate-pulse" />
                    <p>Loading payments...</p>
                  </div>
                ) : payments.filter(p => paymentsSubTab === "pending" ? p.status === "PENDING" : (p.status === "VERIFIED" || p.status === "REJECTED")).length > 0 ? (
                  <div className="space-y-4">
                    {payments
                      .filter(p => paymentsSubTab === "pending" ? p.status === "PENDING" : (p.status === "VERIFIED" || p.status === "REJECTED"))
                      .map((payment) => (
                      <div
                        key={payment.id}
                        className="flex flex-col md:flex-row md:items-center md:justify-between p-3 md:p-4 bg-gray-800/30 rounded-lg gap-3 md:gap-0"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge
                              variant={getPaymentMethodColor(
                                payment.paymentMethod
                              )}
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
                          <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 text-sm">
                            <span className="text-white font-medium">
                              {payment.user.name} ({payment.user.email})
                            </span>
                            <span className="text-gray-400 text-xs md:text-sm">
                              {new Date(payment.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center justify-between md:justify-end gap-3">
                          <div className="md:text-right">
                            <div className="text-white font-semibold">
                              ${Number(payment.amount).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                            <div className="text-sm text-green-400">
                              +$
                              {Number(payment.amount).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}{" "}
                              added
                            </div>
                          </div>
                          {payment.status === "PENDING" && (
                            <div className="flex gap-2 w-full md:w-auto justify-center md:justify-end">
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
                    <p>No {paymentsSubTab} payments found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Resolution Confirmation Modal */}
        {resolutionModal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="h-6 w-6 text-yellow-500" />
                <h3 className="text-lg font-semibold text-white">
                  Confirm Event Resolution
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-gray-300 mb-2">
                    You are about to resolve this event:
                  </p>
                  <div className="bg-gray-700 rounded p-3">
                    <p className="text-white font-medium">
                      {resolutionModal.eventTitle}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-gray-300 mb-2">Resolution outcome:</p>
                  <div className="bg-gray-700 rounded p-3">
                    <p className="text-green-400 font-medium text-lg">
                      {resolutionModal.resolutionLabel}
                    </p>
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-3">
                  <p className="text-yellow-300 text-sm">
                    ⚠️ <strong>Warning:</strong> This action cannot be undone.
                    All bets will be resolved and payouts distributed based on this outcome.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={closeResolutionModal}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmResolution}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm Resolution
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
