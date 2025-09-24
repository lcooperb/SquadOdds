'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import SearchDropdown from '@/components/SearchDropdown'
import { Menu, X, User, LogOut, Settings, TrendingUp, Users } from 'lucide-react'

export default function Navigation() {
  const { data: session } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [userBalance, setUserBalance] = useState<number | null>(null)

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  useEffect(() => {
    if (session?.user) {
      fetchUserBalance()
    }
  }, [session])

  const fetchUserBalance = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const user = await response.json()
        setUserBalance(Number(user.virtualBalance))
      }
    } catch (error) {
      console.error('Error fetching user balance:', error)
    }
  }


  return (
    <nav className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          {/* Left side - Logo and Search */}
          <div className="flex items-center space-x-4">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-purple-500" />
              <span className="text-xl font-bold text-white">
                Friend<span className="text-purple-500">Bets</span>
              </span>
            </Link>

            {/* Search Bar */}
            {session && (
              <div className="ml-8">
                <SearchDropdown />
              </div>
            )}
          </div>

          {/* Right side - Navigation Links and User Menu */}
          <div className="ml-auto flex items-center space-x-4">
            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-4">
              {session ? (
                <>
                  <Link
                    href="/"
                    className="text-gray-300 hover:text-white text-sm font-normal transition-colors"
                  >
                    Markets
                  </Link>
                  <Link
                    href="/leaderboard"
                    className="text-gray-300 hover:text-white text-sm font-normal transition-colors"
                  >
                    Leaderboard
                  </Link>
                  <Link
                    href="/profile"
                    className="text-gray-300 hover:text-white text-sm font-normal transition-colors"
                  >
                    Portfolio
                  </Link>
                  {session.user.isAdmin && (
                    <Link
                      href="/admin"
                      className="text-gray-300 hover:text-white text-sm font-normal transition-colors"
                    >
                      Admin
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link
                    href="/how-it-works"
                    className="text-gray-300 hover:text-white text-sm font-normal transition-colors"
                  >
                    How it works
                  </Link>
                </>
              )}
            </div>

            {/* Balance and User Menu */}
            {session ? (
              <>
                {/* Balance Display */}
                <div className="text-sm text-gray-300 whitespace-nowrap">
                  <span className="text-green-400 font-semibold">
                    {userBalance !== null
                      ? `₺${userBalance.toLocaleString()}`
                      : "..."}
                  </span>
                </div>

                  {/* User Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                      className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
                    >
                      <User className="h-5 w-5" />
                      <span className="text-sm font-medium">{session.user.displayName}</span>
                    </button>

                    {/* Dropdown */}
                    {isMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 border border-gray-700">
                        <Link
                          href="/profile"
                          className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <User className="h-4 w-4 mr-2" />
                          Profile
                        </Link>
                        <Link
                          href="/settings"
                          className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </Link>
                        <button
                          onClick={() => {
                            setIsMenuOpen(false)
                            handleSignOut()
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Sign out
                        </button>
                      </div>
                    )}
                  </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/auth/signin">
                  <Button variant="ghost">Sign in</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button>Get Started</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-700">
              {session ? (
                <>
                  <Link
                    href="/"
                    className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-normal transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Markets
                  </Link>
                  <Link
                    href="/leaderboard"
                    className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-normal transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Leaderboard
                  </Link>
                  <Link
                    href="/profile"
                    className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-normal transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Portfolio
                  </Link>
                  {session.user.isAdmin && (
                    <Link
                      href="/admin"
                      className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-normal transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setIsMenuOpen(false)
                      handleSignOut()
                    }}
                    className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-normal transition-colors w-full text-left"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/how-it-works"
                    className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-normal transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    How it works
                  </Link>
                  <Link
                    href="/auth/signin"
                    className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-normal transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-normal transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}