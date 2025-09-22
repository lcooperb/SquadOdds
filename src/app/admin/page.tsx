'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  Shield,
  CheckCircle,
  XCircle,
  Users,
  TrendingUp,
  Calendar,
  DollarSign,
  Settings
} from 'lucide-react'

interface User {
  id: string
  email: string
  username: string
  displayName: string
  virtualBalance: number
  isAdmin: boolean
  createdAt: string
  _count: {
    bets: number
    createdEvents: number
  }
}

interface Event {
  id: string
  title: string
  description: string
  category: string
  status: string
  marketType: string
  endDate: string | null
  isOngoing: boolean
  totalVolume: number
  resolved: boolean
  outcome: boolean | null
  winningOptionId: string | null
  createdAt: string
  createdBy: {
    displayName: string
    username: string
  }
  options?: Array<{
    id: string
    title: string
    price: number
    totalVolume: number
  }>
  _count: {
    bets: number
  }
}

export default function AdminPanel() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'events' | 'users'>('events')
  const [events, setEvents] = useState<Event[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user) {
      router.push('/auth/signin')
      return
    }

    // Check if user is admin
    fetchUserData()
  }, [session, status, router])

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const userData = await response.json()
        if (!userData.isAdmin) {
          router.push('/')
          return
        }
      } else {
        router.push('/')
        return
      }
    } catch (error) {
      console.error('Error checking admin status:', error)
      router.push('/')
      return
    }

    // If we get here, user is admin
    fetchData()
  }

  const fetchData = async () => {
    try {
      const [eventsRes, usersRes] = await Promise.all([
        fetch('/api/admin/events'),
        fetch('/api/admin/users')
      ])

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json()
        setEvents(eventsData)
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData)
      }
    } catch (error) {
      console.error('Error fetching admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const resolveEvent = async (eventId: string, resolution: 'YES' | 'NO' | string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          outcome: resolution === 'YES' ? true : resolution === 'NO' ? false : undefined,
          winningOptionId: resolution !== 'YES' && resolution !== 'NO' ? resolution : undefined
        }),
      })

      if (response.ok) {
        fetchData() // Refresh data
      } else {
        const error = await response.json()
        alert(`Error resolving event: ${error.message}`)
      }
    } catch (error) {
      console.error('Error resolving event:', error)
      alert('Error resolving event')
    }
  }

  const toggleUserAdmin = async (userId: string, isAdmin: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isAdmin: !isAdmin }),
      })

      if (response.ok) {
        fetchData() // Refresh data
      } else {
        const error = await response.json()
        alert(`Error updating user: ${error.message}`)
      }
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Error updating user')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-white">Loading admin panel...</div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <Shield className="h-8 w-8 text-purple-500" />
            Admin Panel
          </h1>
          <p className="text-gray-400">
            Manage events and users for SquadOdds
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('events')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'events'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <TrendingUp className="inline h-4 w-4 mr-2" />
            Events ({events.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'users'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Users className="inline h-4 w-4 mr-2" />
            Users ({users.length})
          </button>
        </div>

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">Event Management</h2>
            {events.map((event) => (
              <Card key={event.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{event.title}</CardTitle>
                      <p className="text-gray-400 text-sm mt-1">{event.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary">{event.category}</Badge>
                        <Badge variant={event.marketType === 'BINARY' ? 'default' : 'secondary'}>
                          {event.marketType === 'BINARY' ? 'Yes/No' : 'Multiple Choice'}
                        </Badge>
                        <Badge variant={event.status === 'ACTIVE' ? 'default' : 'secondary'}>
                          {event.status}
                        </Badge>
                        {event.resolved && (
                          <Badge variant="success">Resolved</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-400">
                      <div>by @{event.createdBy.username}</div>
                      <div>{event._count.bets} bets</div>
                      <div>${Number(event.totalVolume).toFixed(2)} volume</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {!event.resolved && event.status === 'ACTIVE' && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-white">Resolve Event:</h4>

                      {event.marketType === 'BINARY' ? (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => resolveEvent(event.id, 'YES')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Resolve YES
                          </Button>
                          <Button
                            onClick={() => resolveEvent(event.id, 'NO')}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Resolve NO
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-400">Select winning option:</p>
                          <div className="flex flex-wrap gap-2">
                            {event.options?.map((option) => (
                              <Button
                                key={option.id}
                                onClick={() => resolveEvent(event.id, option.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                {option.title} ({option.price.toFixed(1)}%)
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {event.resolved && (
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <h4 className="font-medium text-white mb-2">Resolution:</h4>
                      {event.marketType === 'BINARY' ? (
                        <Badge variant={event.outcome ? 'success' : 'error'}>
                          {event.outcome ? 'YES' : 'NO'}
                        </Badge>
                      ) : (
                        <Badge variant="success">
                          {event.options?.find(opt => opt.id === event.winningOptionId)?.title || 'Unknown'}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {events.length === 0 && (
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No events found</p>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">User Management</h2>
            <div className="grid gap-4">
              {users.map((user) => (
                <Card key={user.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-white">{user.displayName}</h3>
                        <p className="text-gray-400 text-sm">@{user.username} • {user.email}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            ${Number(user.virtualBalance).toFixed(2)}
                          </span>
                          <span>{user._count.bets} bets</span>
                          <span>{user._count.createdEvents} markets</span>
                          <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {user.isAdmin && (
                          <Badge variant="default">Admin</Badge>
                        )}
                        <Button
                          onClick={() => toggleUserAdmin(user.id, user.isAdmin)}
                          variant={user.isAdmin ? 'destructive' : 'default'}
                          size="sm"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
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
      </main>
    </>
  )
}