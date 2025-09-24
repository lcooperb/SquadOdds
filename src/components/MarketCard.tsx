import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import {
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  Clock,
} from "lucide-react";

interface MarketCardProps {
  event: {
    id: string;
    title: string;
    description: string;
    category: string;
    yesPrice: number;
    totalVolume: number;
    endDate: string | null;
    isOngoing?: boolean;
    status: string;
    marketType?: string;
    options?: Array<{
      id: string;
      title: string;
      price: number;
    }>;
    _count?: {
      bets: number;
    };
  };
  compact?: boolean;
}

export default function MarketCard({
  event,
  compact = false,
}: MarketCardProps) {
  const yesPercentage = Math.round(Number(event.yesPrice));
  const noPercentage = 100 - yesPercentage;

  const formatCompactNumber = (value: number) => {
    const abs = Math.abs(value);
    let result = '';
    if (abs >= 1_000_000_000) {
      const v = value / 1_000_000_000;
      result = Number.isInteger(v) ? `${v}b` : `${v.toFixed(1)}b`;
    } else if (abs >= 1_000_000) {
      const v = value / 1_000_000;
      result = Number.isInteger(v) ? `${v}m` : `${v.toFixed(1)}m`;
    } else if (abs >= 1_000) {
      const v = value / 1_000;
      result = Number.isInteger(v) ? `${v}k` : `${v.toFixed(1)}k`;
    } else {
      result = Math.round(value).toString();
    }
    return result;
  };
  const endDate = event.endDate ? new Date(event.endDate) : null;
  const isExpiringSoon = endDate
    ? endDate.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
    : false; // 7 days
  const isOngoing = event.isOngoing || !endDate;
  const isMultipleChoice =
    event.marketType === "MULTIPLE" &&
    event.options &&
    event.options.length > 0;

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "career":
        return "default";
      case "relationships":
        return "error";
      case "personal":
        return "success";
      case "life events":
        return "warning";
      default:
        return "secondary";
    }
  };

  // For multiple choice markets, show top 2 options
  const topOptions = isMultipleChoice
    ? event.options!.sort((a, b) => b.price - a.price).slice(0, 2)
    : [];

  if (compact) {
    return (
      <Link href={`/market/${event.id}`} className="block h-full">
        <Card className="market-card hover:border-blue-500 transition-all duration-200 cursor-pointer h-full flex flex-col">
          <CardContent className="p-3 flex-1">
            <div className="flex items-start justify-between h-full">
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge
                      variant={getCategoryColor(event.category)}
                      className="text-xs"
                    >
                      {event.category}
                    </Badge>
                    {isOngoing && (
                      <Badge variant="warning" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        Ongoing
                      </Badge>
                    )}
                    {!isOngoing && isExpiringSoon && (
                      <Badge variant="warning" className="text-xs">
                        Ending Soon
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-white text-base leading-tight mb-2 line-clamp-2 min-h-[2.5rem]">
                    {event.title}
                  </h3>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />₺
                    {formatCompactNumber(Number(event.totalVolume))}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {formatCompactNumber(event._count?.bets || 0)}
                  </span>
                </div>
              </div>
              <div className="ml-3 text-right flex flex-col justify-center">
                <div className="text-lg font-bold text-green-400 mb-1">
                  {yesPercentage}¢
                </div>
                <div className="text-xs text-gray-400">YES</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  // Multiple choice market layout
  if (isMultipleChoice) {
    return (
      <Link href={`/market/${event.id}`} className="block h-full">
        <Card className="market-card hover:border-blue-500 transition-all duration-200 cursor-pointer h-full flex flex-col bg-gray-800/50 border-gray-700">
          <CardContent className="p-3 flex-1 flex flex-col">
            {/* Header with title */}
            <div className="mb-2">
              <h3 className="text-base font-semibold text-white leading-tight line-clamp-2 min-h-[2.5rem]">
                {event.title}
              </h3>
            </div>

            {/* Top 2 options with percentages and buttons */}
            <div className="space-y-2.5 mb-3 flex-1">
              {topOptions.map((option, index) => (
                <div
                  key={option.id}
                  className="flex items-center justify-between"
                >
                  <span className="text-white font-medium text-sm flex-1">
                    {option.title}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">
                      {Math.round(option.price)}%
                    </span>
                    <div className="flex gap-2">
                      <button className="bg-green-600/20 hover:bg-green-600/30 rounded px-3 py-1 text-xs font-semibold text-green-400 border border-green-500/30 transition-colors">
                        Yes
                      </button>
                      <button className="bg-red-600/20 hover:bg-red-600/30 rounded px-3 py-1 text-xs font-semibold text-red-400 border border-red-500/30 transition-colors">
                        No
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Stats */}
            <div className="flex items-center justify-between text-sm text-gray-400 mt-auto">
              <div className="flex items-center gap-1">
                <span>
                  ₺{formatCompactNumber(Number(event.totalVolume))} Vol.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={getCategoryColor(event.category)}
                  className="text-xs"
                >
                  {event.category}
                </Badge>
                {isOngoing && (
                  <Badge variant="warning" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    Ongoing
                  </Badge>
                )}
                {!isOngoing && isExpiringSoon && (
                  <Badge variant="warning" className="text-xs">
                    Ending Soon
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  // Binary market layout (existing)
  return (
    <Link href={`/market/${event.id}`} className="block h-full">
      <Card className="market-card hover:border-blue-500 transition-all duration-200 cursor-pointer h-full flex flex-col bg-gray-800/50 border-gray-700">
        <CardContent className="p-4 flex-1 flex flex-col">
          {/* Header with title and percentage circle */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1 pr-4">
              <h3 className="text-base font-semibold text-white leading-tight line-clamp-2 min-h-[2.5rem]">
                {event.title}
              </h3>
            </div>
            <div className="flex-shrink-0 text-center">
              {/* Half circle progress */}
              <div className="relative w-20 h-12">
                <svg className="w-20 h-12" viewBox="0 0 80 48">
                  {/* Background arc */}
                  <path
                    d="M 10 35 A 30 30 0 0 1 70 35"
                    fill="none"
                    stroke="#374151"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                  {/* Progress arc */}
                  <path
                    d="M 10 35 A 30 30 0 0 1 70 35"
                    fill="none"
                    stroke={yesPercentage >= 50 ? "#10b981" : "#ef4444"}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${(yesPercentage / 100) * 94.25} 94.25`}
                    className="transition-all duration-300"
                  />
                </svg>
                {/* Percentage text inside arc */}
                <div className="absolute inset-0 flex items-center justify-center mt-4">
                  <div className="text-base font-bold text-white">
                    {yesPercentage}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* YES/NO Buttons */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-green-600/20 hover:bg-green-600/30 rounded-lg py-2 px-3 text-center transition-colors cursor-pointer border border-green-500/30">
              <div className="text-sm font-semibold text-green-400">Yes</div>
            </div>
            <div className="bg-red-600/20 hover:bg-red-600/30 rounded-lg py-2 px-3 text-center transition-colors cursor-pointer border border-red-500/30">
              <div className="text-sm font-semibold text-red-400">No</div>
            </div>
          </div>

          {/* Bottom Stats */}
          <div className="flex items-center justify-between text-sm text-gray-400 mt-auto">
            <div className="flex items-center gap-1">
              <span>
                ₺{formatCompactNumber(Number(event.totalVolume))} Vol.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={getCategoryColor(event.category)}
                className="text-xs"
              >
                {event.category}
              </Badge>
              {isOngoing && (
                <Badge variant="warning" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  Ongoing
                </Badge>
              )}
              {!isOngoing && isExpiringSoon && (
                <Badge variant="warning" className="text-xs">
                  Ending Soon
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
