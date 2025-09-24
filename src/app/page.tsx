"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import MarketCard from "@/components/MarketCard";
import { Button } from "@/components/ui/Button";
import { Plus, TrendingUp, DollarSign, Users } from "lucide-react";

interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  yesPrice: number;
  totalVolume: number;
  endDate: string | null;
  isOngoing?: boolean;
  status: string;
  _count?: {
    bets: number;
  };
}

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState<number>(100);

  useEffect(() => {
    fetchEvents();
    if (session?.user) {
      fetchUserBalance();
    }
  }, [session]);

  const fetchEvents = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append("category", selectedCategory);
      if (searchQuery) params.append("search", searchQuery);

      const response = await fetch(`/api/events?${params}`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBalance = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const user = await response.json();
        setUserBalance(Number(user.virtualBalance));
      }
    } catch (error) {
      console.error("Error fetching user balance:", error);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [searchQuery, selectedCategory]);

  return (
    <>
      <main className="container mx-auto px-3 py-4">
        {/* Welcome Header - only show if logged in */}
        {session && (
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome back, {session.user.displayName}!
            </h1>
            <p className="text-gray-400">
              Explore prediction markets and place your bets
            </p>
          </div>
        )}

        {/* Stats Cards - only show if logged in */}
        {session && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Your Balance</p>
                  <p className="text-2xl font-bold text-green-400">
                    ₺{userBalance.toFixed(2)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-400" />
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Active Markets</p>
                  <p className="text-2xl font-bold text-white">
                    {events.filter((e) => e.status === "ACTIVE").length}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-400" />
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Volume</p>
                  <p className="text-2xl font-bold text-white">
                    ₺
                    {events
                      .reduce((sum, e) => sum + Number(e.totalVolume), 0)
                      .toFixed(0)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-400" />
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Traders</p>
                  <p className="text-2xl font-bold text-white">4</p>
                </div>
                <Users className="h-8 w-8 text-orange-400" />
              </div>
            </div>
          </div>
        )}

        {/* Category Filters and Create */}
        <div className="flex flex-col md:flex-row gap-3 mb-4 items-start">
          <div className="flex-1">
            {/* Category Filters */}
            <div className="flex flex-wrap gap-2">
              {[
                "All",
                "Career",
                "Relationships",
                "Personal",
                "Life Events",
                "Random",
              ].map((category) => {
                const isSelected =
                  selectedCategory === category ||
                  (category === "All" && selectedCategory === null);

                return (
                  <button
                    key={category}
                    onClick={() =>
                      setSelectedCategory(category === "All" ? null : category)
                    }
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                      isSelected
                        ? "bg-purple-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>
          {session ? (
            <Link href="/create">
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Market
              </Button>
            </Link>
          ) : (
            <Link href="/auth/signup">
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Market
              </Button>
            </Link>
          )}
        </div>

        {/* Markets Grid */}
        {loading ? (
          <div className="text-center py-8">
            <div className="text-white">Loading markets...</div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8">
            <h3 className="text-xl font-semibold text-white mb-2">
              No markets found
            </h3>
            <p className="text-gray-400 mb-4">
              {searchQuery || selectedCategory
                ? "Try adjusting your search filters"
                : "Be the first to create a prediction market!"}
            </p>
            {session && <Button>Create Your First Market</Button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {events.map((event) => (
              <MarketCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
