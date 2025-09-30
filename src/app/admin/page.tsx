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

export default function AdminPanel() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"events" | "users">(
    "events"
  );
  const [eventsSubTab, setEventsSubTab] = useState<"active" | "resolved">("active");
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

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
      const [eventsRes, usersRes] = await Promise.all([
        fetch("/api/admin/events"),
        fetch("/api/admin/users"),
      ]);

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(eventsData);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
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

  const openCancellationModal = (
    eventId: string,
    eventTitle: string,
    betCount: number
  ) => {
    setCancellationModal({
      isOpen: true,
      eventId,
      eventTitle,
      betCount,
    });
  };

  const closeCancellationModal = () => {
    setCancellationModal({
      isOpen: false,
      eventId: "",
      eventTitle: "",
      betCount: 0,
    });
  };

  const confirmCancellation = async () => {
    try {
      const response = await fetch(`/api/events/${cancellationModal.eventId}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Market cancelled successfully. ${result.voidedBets} bets voided totaling $${result.totalVoided.toFixed(2)}`);
        fetchData(); // Refresh data
        closeCancellationModal();
      } else {
        const error = await response.json();
        alert(`Error cancelling market: ${error.message}`);
      }
    } catch (error) {
      console.error("Error cancelling market:", error);
      alert("Error cancelling market");
    }
  };

  const openDeletionModal = (
    eventId: string,
    eventTitle: string,
    betCount: number
  ) => {
    setDeletionModal({
      isOpen: true,
      eventId,
      eventTitle,
      betCount,
    });
  };

  const closeDeletionModal = () => {
    setDeletionModal({
      isOpen: false,
      eventId: "",
      eventTitle: "",
      betCount: 0,
    });
  };

  const confirmDeletion = async () => {
    try {
      const response = await fetch(`/api/events/${deletionModal.eventId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Market deleted successfully");
        fetchData(); // Refresh data
        closeDeletionModal();
      } else {
        const error = await response.json();
        alert(`Error deleting market: ${error.message}`);
      }
    } catch (error) {
      console.error("Error deleting market:", error);
      alert("Error deleting market");
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

  // Cancellation confirmation modal state
  const [cancellationModal, setCancellationModal] = useState<{
    isOpen: boolean;
    eventId: string;
    eventTitle: string;
    betCount: number;
  }>({
    isOpen: false,
    eventId: "",
    eventTitle: "",
    betCount: 0,
  });

  // Deletion confirmation modal state
  const [deletionModal, setDeletionModal] = useState<{
    isOpen: boolean;
    eventId: string;
    eventTitle: string;
    betCount: number;
  }>({
    isOpen: false,
    eventId: "",
    eventTitle: "",
    betCount: 0,
  });

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
        <div className="flex gap-2 md:gap-4 mb-6">
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

                      <div className="pt-2 border-t border-gray-700">
                        <Button
                          onClick={() => openCancellationModal(event.id, event.title, event._count.bets)}
                          className="bg-orange-600 hover:bg-orange-700 w-full md:w-auto"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel Market
                        </Button>
                      </div>
                    </div>
                  )}

                  {event.resolved && (
                    <div className="space-y-3">
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <h4 className="font-medium text-white mb-2">
                          Resolution:
                        </h4>
                        {event.marketType === "BINARY" ? (
                          <Badge variant={event.outcome ? "success" : "error"}>
                            {event.outcome ? "YES" : "NO"}
                          </Badge>
                        ) : event.status === "CANCELLED" ? (
                          <Badge variant="secondary">CANCELLED</Badge>
                        ) : (
                          <Badge variant="success">
                            {event.options?.find(
                              (opt) => opt.id === event.winningOptionId
                            )?.title || "Unknown"}
                          </Badge>
                        )}
                      </div>

                      <div className="pt-2 border-t border-gray-700">
                        <Button
                          onClick={() => openDeletionModal(event.id, event.title, event._count.bets)}
                          className="bg-red-600 hover:bg-red-700 w-full md:w-auto"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Delete Market
                        </Button>
                      </div>
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

        {/* Cancellation Confirmation Modal */}
        {cancellationModal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="h-6 w-6 text-orange-500" />
                <h3 className="text-lg font-semibold text-white">
                  Confirm Market Cancellation
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-gray-300 mb-2">
                    You are about to cancel this market:
                  </p>
                  <div className="bg-gray-700 rounded p-3">
                    <p className="text-white font-medium">
                      {cancellationModal.eventTitle}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-gray-300 mb-2">Impact:</p>
                  <div className="bg-gray-700 rounded p-3">
                    <p className="text-orange-400 font-medium">
                      {cancellationModal.betCount} bet{cancellationModal.betCount !== 1 ? 's' : ''} will be voided and removed from portfolios
                    </p>
                  </div>
                </div>

                <div className="bg-orange-500/10 border border-orange-500/20 rounded p-3">
                  <p className="text-orange-300 text-sm">
                    ⚠️ <strong>Warning:</strong> This action cannot be undone.
                    All bets will be voided (no payout) and removed from user portfolios. Users will receive notifications.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={closeCancellationModal}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmCancellation}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  <X className="h-4 w-4 mr-2" />
                  Confirm Cancellation
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Deletion Confirmation Modal */}
        {deletionModal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="h-6 w-6 text-red-500" />
                <h3 className="text-lg font-semibold text-white">
                  Confirm Market Deletion
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-gray-300 mb-2">
                    You are about to permanently delete this market:
                  </p>
                  <div className="bg-gray-700 rounded p-3">
                    <p className="text-white font-medium">
                      {deletionModal.eventTitle}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-gray-300 mb-2">This will delete:</p>
                  <div className="bg-gray-700 rounded p-3 space-y-1">
                    <p className="text-red-400 text-sm">
                      • {deletionModal.betCount} bet record{deletionModal.betCount !== 1 ? 's' : ''}
                    </p>
                    <p className="text-red-400 text-sm">
                      • All price history
                    </p>
                    <p className="text-red-400 text-sm">
                      • All comments and likes
                    </p>
                    <p className="text-red-400 text-sm">
                      • All market options
                    </p>
                  </div>
                </div>

                <div className="bg-red-500/10 border border-red-500/20 rounded p-3">
                  <p className="text-red-300 text-sm">
                    ⚠️ <strong>Warning:</strong> This action is PERMANENT and cannot be undone.
                    All data associated with this market will be permanently deleted from the database.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={closeDeletionModal}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDeletion}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  <X className="h-4 w-4 mr-2" />
                  Permanently Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
