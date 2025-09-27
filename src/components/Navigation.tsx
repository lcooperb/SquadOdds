'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import SearchDropdown from '@/components/SearchDropdown'
import { Menu, X, User, LogOut, Settings, TrendingUp, Users, CreditCard, ArrowDownCircle } from 'lucide-react'

export default function Navigation() {
  const { data: session } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [userBalance, setUserBalance] = useState<number | null>(null)
  const [pendingAdminCount, setPendingAdminCount] = useState<number>(0)

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  useEffect(() => {
    const fetchAdminPending = async () => {
      if (!session?.user?.isAdmin) return
      try {
        const [paymentsRes, redemptionsRes] = await Promise.all([
          fetch('/api/admin/payments/process'),
          fetch('/api/admin/redemptions'),
        ])
        let pending = 0
        if (paymentsRes.ok) {
          const payments = await paymentsRes.json()
          pending += (payments || []).filter((p: any) => p.status === 'PENDING').length
        }
        if (redemptionsRes.ok) {
          const redemptions = await redemptionsRes.json()
          pending += (redemptions || []).filter((r: any) => r.status === 'PENDING').length
        }
        setPendingAdminCount(pending)
      } catch (e) {
        console.error('Error fetching pending admin counts', e)
      }
    }
    fetchAdminPending()
  }, [session])

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
    <nav className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 fixed top-0 left-0 right-0 z-40 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-purple-500" />
              <span className="text-xl font-bold">
                <span className="text-white">Squad</span>
                <span className="text-purple-500">Odds</span>
              </span>
            </Link>

            {/* Desktop Search Bar */}
            {session && (
              <div className="hidden md:block ml-8">
                <SearchDropdown />
              </div>
            )}
          </div>

          {/* Right side - Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Desktop Navigation Links */}
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
                    className="text-gray-300 hover:text-white text-sm font-normal transition-colors relative"
                  >
                    Admin
                    {pendingAdminCount > 0 && (
                      <span className="ml-1 inline-flex items-center justify-center rounded-full bg-red-600 text-white text-[10px] px-1.5 py-0.5 align-middle">
                        {pendingAdminCount}
                      </span>
                    )}
                  </Link>
                )}

                {/* Balance Display */}
                <div className="text-sm text-gray-300 whitespace-nowrap">
                  <span className="text-green-400 font-semibold">
                    {userBalance !== null
                      ? `$${Number(userBalance).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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
                    <span className="text-sm font-medium">{session.user.name}</span>
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
                      <Link
                        href="/topup"
                        className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Top Up
                      </Link>
                      <Link
                        href="/redeem"
                        className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <ArrowDownCircle className="h-4 w-4 mr-2" />
                        Redeem
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
              <>
                <Link href="/auth/signin">
                  <Button variant="ghost">Sign in</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile right side - Balance and Menu button */}
          <div className="flex md:hidden items-center space-x-3">
            {session && (
              <div className="text-sm text-gray-300 whitespace-nowrap">
                <span className="text-green-400 font-semibold">
                  {userBalance !== null
                    ? `$${Number(userBalance).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : "..."}
                </span>
              </div>
            )}

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
            <div className="px-4 pt-4 pb-3 space-y-3 border-t border-gray-700">
              {session ? (
                <>
                  {/* Mobile Search Bar */}
                  <div className="mb-4">
                    <SearchDropdown />
                  </div>

                  {/* Navigation Links */}
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
                      {pendingAdminCount > 0 && (
                        <span className="ml-2 inline-flex items-center justify-center rounded-full bg-red-600 text-white text-[10px] px-1.5 py-0.5 align-middle">
                          {pendingAdminCount}
                        </span>
                      )}
                    </Link>
                  )}

                  {/* Account Options */}
                  <div className="border-t border-gray-700 pt-3 mt-3">
                    <div className="px-3 py-2 text-sm text-gray-400">Account</div>
                    <Link
                      href="/settings"
                      className="flex items-center px-3 py-2 text-base text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4 mr-3" />
                      Settings
                    </Link>
                    <Link
                      href="/topup"
                      className="flex items-center px-3 py-2 text-base text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <CreditCard className="h-4 w-4 mr-3" />
                      Top Up
                    </Link>
                    <Link
                      href="/redeem"
                      className="flex items-center px-3 py-2 text-base text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <ArrowDownCircle className="h-4 w-4 mr-3" />
                      Redeem
                    </Link>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false)
                        handleSignOut()
                      }}
                      className="flex items-center w-full px-3 py-2 text-base text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Sign out
                    </button>
                  </div>
                </>
              ) : (
                <>
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