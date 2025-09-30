"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import MarketCard from "@/components/MarketCard";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";

interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  yesPrice: number;
  totalVolume: number;
  endDate: string | null;
  createdAt: string;
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
  const [closedEvents, setClosedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [closedLoading, setClosedLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState<number>(100);
  const [portfolioValue, setPortfolioValue] = useState<number>(0);
  const [showSection, setShowSection] = useState<'active' | 'closed'>('active');

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
      params.append("status", "ACTIVE");

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

  const fetchClosedEvents = async () => {
    try {
      setClosedLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory) params.append("category", selectedCategory);
      if (searchQuery) params.append("search", searchQuery);
      params.append("status", "CLOSED,RESOLVED");

      const response = await fetch(`/api/events?${params}`);
      if (response.ok) {
        const data = await response.json();
        setClosedEvents(data);
      }
    } catch (error) {
      console.error("Error fetching closed events:", error);
    } finally {
      setClosedLoading(false);
    }
  };

  const fetchUserBalance = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const user = await response.json();
        setUserBalance(Number(user.virtualBalance));
        // Calculate portfolio: sum of ACTIVE bets' amount on ACTIVE events
        const activeBets = (user.bets || []).filter((b: any) => (b?.status === 'ACTIVE') && (b?.event?.status === 'ACTIVE'));
        const portfolio = activeBets.reduce((sum: number, b: any) => sum + Number(b.amount || 0), 0);
        setPortfolioValue(portfolio);
      }
    } catch (error) {
      console.error("Error fetching user balance:", error);
    }
  };

  useEffect(() => {
    if (showSection === 'active') {
      fetchEvents();
    } else {
      fetchClosedEvents();
    }
  }, [searchQuery, selectedCategory, showSection]);

  return (
    <>
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Header - only show if logged in */}
        {session && (
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome back, {session.user.name}!
            </h1>
            <p className="text-gray-400">
              Explore prediction markets and place your bets
            </p>
          </div>
        )}

        {/* Stats Cards - only show if logged in */}
        {session && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-gray-800/90 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400 mb-1">
                ${userBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-sm text-gray-400">Cash</div>
            </div>

            <div className="bg-gray-800/90 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400 mb-1">
                ${portfolioValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-sm text-gray-400">Portfolio</div>
            </div>

            <div className="bg-gray-800/90 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {events.filter((e) => e.status === "ACTIVE").length}
              </div>
              <div className="text-sm text-gray-400">Active Markets</div>
            </div>

            <div className="bg-gray-800/90 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white mb-1">
                ${events.reduce((sum, e) => sum + Number(e.totalVolume), 0).toFixed(0)}
              </div>
              <div className="text-sm text-gray-400">Total Volume</div>
            </div>
          </div>
        )}

        {/* Section Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setShowSection('active')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              showSection === 'active'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            Active Markets
          </button>
          <button
            onClick={() => setShowSection('closed')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              showSection === 'closed'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            Closed Markets
          </button>
        </div>

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
        {(showSection === 'active' ? loading : closedLoading) ? (
          <div className="text-center py-8">
            <div className="text-white">Loading {showSection} markets...</div>
          </div>
        ) : (showSection === 'active' ? events : closedEvents).length === 0 ? (
          <div className="text-center py-8">
            <h3 className="text-xl font-semibold text-white mb-2">
              No {showSection} markets found
            </h3>
            <p className="text-gray-400 mb-4">
              {searchQuery || selectedCategory
                ? "Try adjusting your search filters"
                : showSection === 'active'
                  ? "Be the first to create a prediction market!"
                  : "No markets have been closed yet"}
            </p>
            {session && showSection === 'active' && (
              <Link href="/create">
                <Button>Create Your First Market</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {(showSection === 'active' ? events : closedEvents).map((event) => (
              <MarketCard key={event.id} event={event} hideOngoingTag={true} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
