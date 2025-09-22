'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Search, TrendingUp, Users, DollarSign, Clock, Calendar } from 'lucide-react'

interface SearchResult {
  id: string
  title: string
  description: string
  category: string
  yesPrice: number
  totalVolume: number
  endDate: string | null
  isOngoing?: boolean
  _count?: {
    bets: number
  }
}

export default function SearchDropdown() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (query.trim().length > 0) {
      searchMarkets(query)
    } else {
      setResults([])
      setIsOpen(false)
    }
  }, [query])

  const searchMarkets = async (searchQuery: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/events?search=${encodeURIComponent(searchQuery)}`)
      if (response.ok) {
        const data = await response.json()
        setResults(data.slice(0, 6)) // Limit to 6 results
        setIsOpen(true)
      }
    } catch (error) {
      console.error('Error searching markets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleResultClick = () => {
    setQuery('')
    setResults([])
    setIsOpen(false)
    inputRef.current?.blur()
  }

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'career': return 'default'
      case 'relationships': return 'error'
      case 'personal': return 'success'
      case 'life events': return 'warning'
      default: return 'secondary'
    }
  }

  return (
    <div ref={searchRef} className="relative flex-1 max-w-lg mx-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search markets..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim() && results.length > 0) {
              setIsOpen(true)
            }
          }}
          className="pl-10 h-9"
        />
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-400">
              <div className="animate-pulse">Searching...</div>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((market) => {
                const yesPrice = Math.round(Number(market.yesPrice))
                const isOngoing = market.isOngoing || !market.endDate

                return (
                  <Link
                    key={market.id}
                    href={`/market/${market.id}`}
                    onClick={handleResultClick}
                    className="block px-4 py-3 hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={getCategoryColor(market.category)} className="text-xs">
                            {market.category}
                          </Badge>
                          {isOngoing && (
                            <Badge variant="warning" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              Ongoing
                            </Badge>
                          )}
                        </div>
                        <h4 className="text-white font-medium text-sm line-clamp-1 mb-1">
                          {market.title}
                        </h4>
                        <p className="text-gray-400 text-xs line-clamp-2 mb-2">
                          {market.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            ${Number(market.totalVolume).toFixed(0)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {market._count?.bets || 0}
                          </span>
                          {!isOngoing && market.endDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(market.endDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="text-green-400 font-bold text-sm">
                          {yesPrice}¢
                        </div>
                        <div className="text-gray-400 text-xs">YES</div>
                      </div>
                    </div>
                  </Link>
                )
              })}

              {results.length === 6 && (
                <div className="px-4 py-2 text-center text-gray-400 text-sm border-t border-gray-700">
                  Showing top {results.length} results
                </div>
              )}
            </div>
          ) : query.trim() && !loading ? (
            <div className="p-4 text-center text-gray-400">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No markets found for "{query}"</p>
              <p className="text-xs mt-1">Try searching with different keywords</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}