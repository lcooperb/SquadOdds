'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import {
  MessageCircle,
  Heart,
  Reply,
  TrendingUp,
  Users,
  Activity,
  Send,
  ChevronDown,
  ChevronUp,
  Crown
} from 'lucide-react'

interface Comment {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    name: string
    image?: string
  }
  likes: Array<{ userId: string }>
  replies?: Comment[]
  _count: {
    likes: number
    replies: number
  }
}

interface Holder {
  rank: number
  user: {
    id: string
    name: string
    image?: string
  }
  totalAmount: number
  currentValue: number
  profitLoss: number
  positionDescription: string
  position: 'YES' | 'NO' | 'NEUTRAL' | 'MULTIPLE'
  // Optional detailed data for expand/collapse
  yesPosition?: number
  noPosition?: number
  primarySide?: 'YES' | 'NO'
  primaryPosition?: number
  primaryOption?: {
    optionId: string,
    title: string,
    value: number,
    amount: number
  }
  optionPositions?: { [optionId: string]: {
    optionTitle: string,
    yesPosition: number,
    noPosition: number,
    amount: number,
    currentValue: number,
    yesAvgPrice: number,
    noAvgPrice: number
  } }
}

interface Activity {
  id: string
  side: string | null
  amount: number
  price: number
  positionSize: number
  createdAt: string
  user: {
    id: string
    name: string
  }
  option?: {
    id: string
    title: string
  }
}

interface MarketCommentsProps {
  eventId: string
  activity: Activity[]
}

export default function MarketComments({ eventId, activity }: MarketCommentsProps) {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<'comments' | 'holders' | 'activity'>('comments')
  const [comments, setComments] = useState<Comment[]>([])
  const [holders, setHolders] = useState<Holder[]>([])
  const [loading, setLoading] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (activeTab === 'comments') {
      fetchComments()
    } else if (activeTab === 'holders') {
      fetchHolders()
    }
  }, [activeTab, eventId, sortBy])

  // Fetch holders on mount to show positions in comments
  useEffect(() => {
    fetchHolders()
  }, [eventId])

  const fetchComments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/events/${eventId}/comments?sort=${sortBy}`)
      if (response.ok) {
        const data = await response.json()
        setComments(data)
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchHolders = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/events/${eventId}/holders`)
      if (response.ok) {
        const data = await response.json()
        setHolders(data)
      }
    } catch (error) {
      console.error('Error fetching holders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !session) return

    try {
      const response = await fetch(`/api/events/${eventId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      })

      if (response.ok) {
        setNewComment('')
        fetchComments()
      } else {
        const errorData = await response.json()
        console.error('Error posting comment:', errorData.message)
        alert(`Failed to post comment: ${errorData.message}`)
      }
    } catch (error) {
      console.error('Error posting comment:', error)
      alert('Failed to post comment. Please try again.')
    }
  }

  const handleSubmitReply = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault()
    if (!replyContent.trim() || !session) return

    try {
      const response = await fetch(`/api/events/${eventId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent, parentId }),
      })

      if (response.ok) {
        setReplyContent('')
        setReplyingTo(null)
        fetchComments()
      }
    } catch (error) {
      console.error('Error posting reply:', error)
    }
  }

  const handleLikeComment = async (commentId: string) => {
    if (!session) return

    try {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: 'POST',
      })

      if (response.ok) {
        fetchComments()
      }
    } catch (error) {
      console.error('Error liking comment:', error)
    }
  }

  const toggleReplies = (commentId: string) => {
    const newExpanded = new Set(expandedReplies)
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId)
    } else {
      newExpanded.add(commentId)
    }
    setExpandedReplies(newExpanded)
  }

  const isLikedByUser = (comment: Comment) => {
    return session ? comment.likes.some(like => like.userId === session.user?.id) : false
  }

  const getUserPosition = (userId: string): Holder | null => {
    if (holders.length === 0) return null
    return holders.find(holder => holder.user.id === userId) || null
  }

  const getPositionBadge = (position: string) => {
    switch (position) {
      case 'YES': return <Badge variant="success" className="text-xs">YES</Badge>
      case 'NO': return <Badge variant="error" className="text-xs">NO</Badge>
      default: return null
    }
  }

  const renderComment = (comment: Comment, isReply = false) => {
    const userPosition = getUserPosition(comment.user.id)
    const isExpanded = expandedReplies.has(comment.id)

    return (
      <div key={comment.id} className={`${isReply ? 'ml-8 border-l border-gray-700 pl-4' : ''} space-y-3`}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-medium">
              {comment.user.name.charAt(0).toUpperCase()}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white font-medium">{comment.user.name}</span>
              {userPosition && getPositionBadge(userPosition.position)}
              {userPosition?.rank === 1 && <Crown className="h-3 w-3 text-yellow-400" />}
              <span className="text-gray-400 text-sm">
                {new Date(comment.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                })}
              </span>
            </div>

            <div className="text-gray-300 break-words" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
              {comment.content}
            </div>

            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={() => handleLikeComment(comment.id)}
                disabled={!session}
                className={`flex items-center gap-1 text-sm transition-colors ${
                  isLikedByUser(comment)
                    ? 'text-red-400 hover:text-red-300'
                    : 'text-gray-400 hover:text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Heart className={`h-4 w-4 ${isLikedByUser(comment) ? 'fill-current' : ''}`} />
                <span>{comment._count.likes}</span>
              </button>

              {!isReply && (
                <button
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  disabled={!session}
                  className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Reply className="h-4 w-4" />
                  <span>Reply</span>
                </button>
              )}

              {!isReply && comment.replies && comment.replies.length > 0 && (
                <button
                  onClick={() => toggleReplies(comment.id)}
                  className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  <span>{comment._count.replies} {comment._count.replies === 1 ? 'reply' : 'replies'}</span>
                </button>
              )}
            </div>

            {replyingTo === comment.id && (
              <form onSubmit={(e) => handleSubmitReply(e, comment.id)} className="mt-3">
                <div className="flex gap-2">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write a reply..."
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={2}
                    maxLength={1000}
                  />
                  <Button type="submit" size="sm" disabled={!replyContent.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>

        {!isReply && isExpanded && comment.replies && (
          <div className="ml-8 space-y-4">
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      {/* Tab Navigation */}
      <div className="border-b border-gray-700">
        <div className="flex">
          <button
            onClick={() => setActiveTab('comments')}
            className={`px-6 py-4 text-left font-medium transition-colors relative ${
              activeTab === 'comments'
                ? 'text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Comments ({comments.length})
          </button>
          <button
            onClick={() => setActiveTab('holders')}
            className={`px-6 py-4 text-left font-medium transition-colors relative ${
              activeTab === 'holders'
                ? 'text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Top Holders
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-6 py-4 text-left font-medium transition-colors relative ${
              activeTab === 'activity'
                ? 'text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Activity
          </button>
        </div>
      </div>
      <div className="pt-6">
        {activeTab === 'comments' && (
          <div className="space-y-6">
            {/* New Comment Form */}
            {session ? (
              <div className="bg-gray-800/30 rounded-lg border border-gray-700 p-4">
                <form onSubmit={handleSubmitComment} className="space-y-3">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment"
                    className="w-full px-3 py-3 bg-transparent border-0 text-white placeholder-gray-500 focus:outline-none resize-none text-base"
                    rows={1}
                    maxLength={1000}
                    style={{ minHeight: '44px', wordWrap: 'break-word' }}
                  />
                  <div className="flex items-center justify-end">
                    <Button
                      type="submit"
                      disabled={!newComment.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium"
                    >
                      Post
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-400">
                <MessageCircle className="h-12 w-12 mx-auto mb-2" />
                <p>Sign in to join the discussion</p>
              </div>
            )}

            {/* Sort Options */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="most_liked">Most Liked</option>
                </select>
                <label className="flex items-center gap-2 text-gray-400 text-sm ml-4">
                  <input type="checkbox" className="rounded border-gray-600 bg-gray-800" />
                  Holders
                </label>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-gray-400">Loading comments...</div>
              ) : comments.length > 0 ? (
                comments.map(comment => renderComment(comment))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <MessageCircle className="h-12 w-12 mx-auto mb-2" />
                  <p>No comments yet</p>
                  <p className="text-sm">Be the first to share your thoughts!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'holders' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-gray-400">Loading holders...</div>
            ) : holders.length > 0 ? (
              holders.map((holder) => (
                <div key={holder.user.id} className="bg-gray-800/30 rounded-lg">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-gray-700 rounded-full">
                        {holder.rank <= 3 ? (
                          <Crown className={`h-4 w-4 ${
                            holder.rank === 1 ? 'text-yellow-400' :
                            holder.rank === 2 ? 'text-gray-300' : 'text-orange-400'
                          }`} />
                        ) : (
                          <span className="text-gray-400 font-bold text-sm">#{holder.rank}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-medium">{holder.user.name}</span>
                        </div>
                        <div className="text-gray-300 text-sm">
                          {holder.positionDescription}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-medium ${
                        holder.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {holder.profitLoss >= 0 ? '✅ Up' : '❌ Down'} ${Math.abs(holder.profitLoss).toFixed(0)}
                      </div>
                      <div className="text-gray-400 text-xs">
                        Portfolio: ${Math.round(holder.currentValue).toLocaleString("en-US")}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Users className="h-12 w-12 mx-auto mb-2" />
                <p>No active positions</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-4">
            {activity.length > 0 ? (
              activity.slice(0, 20).map((bet) => (
                <div key={bet.id} className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${bet.side === 'YES' ? 'bg-green-400' : bet.side === 'NO' ? 'bg-red-400' : 'bg-gray-400'}`} />
                    <div>
                      <div className="text-white font-medium">
                        {bet.user.name} bought {bet.side || 'UNKNOWN'}{bet.option ? ` on ${bet.option.title}` : ''}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {new Date(bet.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-medium">${Math.round(Number(bet.amount)).toLocaleString("en-US")}</div>
                    <div className="text-gray-400 text-sm">
                      @ {Number(bet.price).toFixed(0)}¢
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Activity className="h-12 w-12 mx-auto mb-2" />
                <p>No trading activity yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}