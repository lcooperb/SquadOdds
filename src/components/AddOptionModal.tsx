'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Plus } from 'lucide-react'

interface AddOptionModalProps {
  isOpen: boolean
  onClose: () => void
  eventId: string
  eventTitle: string
  onAddOption: (eventId: string, title: string) => Promise<void>
}

export default function AddOptionModal({
  isOpen,
  onClose,
  eventId,
  eventTitle,
  onAddOption
}: AddOptionModalProps) {
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Option title is required')
      return
    }

    setLoading(true)
    try {
      await onAddOption(eventId, title.trim())
      onClose()
      setTitle('')
    } catch (err) {
      setError('Failed to add option')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Option">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Event Info */}
        <div className="text-center p-4 bg-gray-700/50 rounded-lg">
          <h3 className="font-semibold text-white mb-2 line-clamp-2">
            {eventTitle}
          </h3>
          <p className="text-sm text-gray-400">
            Adding a new betting option to this multiple choice market
          </p>
        </div>

        {/* Option Title Input */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Option Title
          </label>
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter option title (e.g., 'Team Name', 'Outcome')"
            className="w-full"
            maxLength={100}
          />
          <div className="mt-2 text-xs text-gray-400">
            This will be a new betting option that users can choose from
          </div>
        </div>

        {/* Warning Message */}
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-yellow-400 text-sm">
            <strong>Note:</strong> New options can only be added to markets with no existing bets.
            All option prices will be redistributed equally.
          </p>
        </div>

        {error && (
          <div className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1 flex items-center gap-2"
            disabled={loading || !title.trim()}
          >
            {loading ? (
              'Adding...'
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Add Option
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}