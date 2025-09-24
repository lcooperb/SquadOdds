"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import MarketCard from "@/components/MarketCard";
import SearchBar from "@/components/SearchBar";
import { Button } from "@/components/ui/Button";
import { Plus, TrendingUp, DollarSign, Users } from "lucide-react";

interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  yesPrice: number;
  totalVolume: number;
  endDate: string;
  status: string;
  _count?: {
    bets: number;
  };
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState<number>(100);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
      return;
    }

    fetchEvents();
    fetchUserBalance();
  }, [session, status, router]);

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
    if (session) {
      fetchEvents();
    }
  }, [searchQuery, selectedCategory]);

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome back, {session.user.displayName}!
        </h1>
        <p className="text-gray-400">
          Explore prediction markets and place your bets
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Your Balance</p>
              <p className="text-2xl font-bold text-green-400 text-numbers">
                ₺{Math.round(userBalance).toLocaleString("en-US")}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-400" />
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Markets</p>
              <p className="text-2xl font-bold text-white text-numbers">
                {events.filter((e) => e.status === "ACTIVE").length}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Volume</p>
              <p className="text-2xl font-bold text-white text-numbers">
                ₺{Math.round(
                  events.reduce((sum, e) => sum + Number(e.totalVolume), 0)
                ).toLocaleString("en-US")}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Traders</p>
              <p className="text-2xl font-bold text-white text-numbers">4</p>
            </div>
            <Users className="h-8 w-8 text-orange-400" />
          </div>
        </div>
      </div>

      {/* Search and Create */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <SearchBar
            onSearch={setSearchQuery}
            onFilterCategory={setSelectedCategory}
            selectedCategory={selectedCategory}
          />
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Market
        </Button>
      </div>

      {/* Markets Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-white">Loading markets...</div>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-white mb-2">
            No markets found
          </h3>
          <p className="text-gray-400 mb-4">
            {searchQuery || selectedCategory
              ? "Try adjusting your search filters"
              : "Be the first to create a prediction market!"}
          </p>
          <Button>Create Your First Market</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <MarketCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </main>
  );
}
