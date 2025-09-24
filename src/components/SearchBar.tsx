"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  onFilterCategory: (category: string | null) => void;
  selectedCategory: string | null;
}

const categories = [
  "All",
  "Career",
  "Relationships",
  "Personal",
  "Life Events",
  "Random",
];

export default function SearchBar({
  onSearch,
  onFilterCategory,
  selectedCategory,
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    onSearch("");
  };

  const handleCategoryClick = (category: string) => {
    const newCategory = category === "All" ? null : category;
    onFilterCategory(newCategory);
  };

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
        <Input
          type="text"
          placeholder="Search markets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 pr-8 h-8 text-sm"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </form>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-1.5">
        {categories.map((category) => {
          const isSelected =
            selectedCategory === category ||
            (category === "All" && selectedCategory === null);

          return (
            <button
              key={category}
              onClick={() => handleCategoryClick(category)}
              className={`px-2 py-0.5 rounded-full text-xs font-medium transition-all ${
                isSelected
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>

      {/* Active Filters */}
      {(searchQuery || selectedCategory) && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400">Active filters:</span>
          {searchQuery && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Search: &quot;{searchQuery}&quot;
              <button
                onClick={handleClearSearch}
                className="ml-1 hover:text-white transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedCategory && (
            <Badge variant="default" className="flex items-center gap-1">
              {selectedCategory}
              <button
                onClick={() => onFilterCategory(null)}
                className="ml-1 hover:text-white transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
