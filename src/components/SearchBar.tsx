'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Search, X } from 'lucide-react'

interface SearchBarProps {
  onSearch: (query: string) => void
  onFilterCategory: (category: string | null) => void
  selectedCategory: string | null
}

const categories = [
  'All',
  'Career',
  'Relationships',
  'Personal',
  'Life Events',
  'Random'
]

export default function SearchBar({
  onSearch,
  onFilterCategory,
  selectedCategory
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(searchQuery)
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    onSearch('')
  }

  const handleCategoryClick = (category: string) => {
    const newCategory = category === 'All' ? null : category
    onFilterCategory(newCategory)
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search markets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </form>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const isSelected = selectedCategory === category ||
            (category === 'All' && selectedCategory === null)

          return (
            <button
              key={category}
              onClick={() => handleCategoryClick(category)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                isSelected
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {category}
            </button>
          )
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
  )
}