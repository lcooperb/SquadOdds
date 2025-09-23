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
    displayName: string
    username: string
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
    displayName: string
    username: string
    image?: string
  }
  yesShares: number
  noShares: number
  yesAmount: number
  noAmount: number
  totalAmount: number
  position: 'YES' | 'NO' | 'NEUTRAL'
}

interface Activity {
  id: string
  side: string | null
  amount: number
  price: number
  shares: number
  createdAt: string
  user: {
    id: string
    displayName: string
    username: string
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
      <div key={comment.id} className={`${isReply ? 'ml-8 border-l border-gray-700 pl-4' : ''}`}>
        <div className="bg-gray-800/30 rounded-lg p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {comment.user.displayName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{comment.user.displayName}</span>
                  {userPosition && getPositionBadge(userPosition.position)}
                  {userPosition?.rank === 1 && <Crown className="h-3 w-3 text-yellow-400" />}
                </div>
                <span className="text-gray-400 text-sm">@{comment.user.username}</span>
              </div>
            </div>
            <span className="text-gray-400 text-sm">
              {new Date(comment.createdAt).toLocaleString()}
            </span>
          </div>

          <p className="text-gray-300 mb-3">{comment.content}</p>

          <div className="flex items-center gap-4">
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
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
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

        {!isReply && isExpanded && comment.replies && (
          <div className="mt-4 space-y-4">
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Discussion
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'comments' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('comments')}
            >
              Comments
            </Button>
            <Button
              variant={activeTab === 'holders' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('holders')}
            >
              <Users className="h-4 w-4 mr-1" />
              Top Holders
            </Button>
            <Button
              variant={activeTab === 'activity' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('activity')}
            >
              <Activity className="h-4 w-4 mr-1" />
              Activity
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activeTab === 'comments' && (
          <div className="space-y-6">
            {/* New Comment Form */}
            {session ? (
              <form onSubmit={handleSubmitComment} className="space-y-3">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts on this market..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={3}
                  maxLength={1000}
                />
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">
                    {1000 - newComment.length} characters remaining
                  </span>
                  <Button type="submit" disabled={!newComment.trim()}>
                    Post Comment
                  </Button>
                </div>
              </form>
            ) : (
              <div className="text-center py-4 text-gray-400">
                <MessageCircle className="h-12 w-12 mx-auto mb-2" />
                <p>Sign in to join the discussion</p>
              </div>
            )}

            {/* Sort Options */}
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="most_liked">Most Liked</option>
              </select>
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
                <div key={holder.user.id} className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
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
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{holder.user.displayName}</span>
                        {getPositionBadge(holder.position)}
                      </div>
                      <span className="text-gray-400 text-sm">@{holder.user.username}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-medium">${holder.totalAmount.toFixed(2)}</div>
                    <div className="text-gray-400 text-sm">
                      {holder.yesShares.toFixed(0)} YES, {holder.noShares.toFixed(0)} NO
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
                        {bet.user.displayName} bought {bet.side || 'UNKNOWN'}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {new Date(bet.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-medium">
                      ${Number(bet.amount).toFixed(2)}
                    </div>
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
      </CardContent>
    </Card>
  )
}