'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Calculator, DollarSign, TrendingUp, TrendingDown } from 'lucide-react'

interface BettingModalProps {
  isOpen: boolean
  onClose: () => void
  event: {
    id: string
    title: string
    marketType: string
    yesPrice: number
  }
  selectedOption?: {
    id: string
    title: string
    price: number
  } | null
  selectedSide?: 'YES' | 'NO'
  userBalance: number
  onPlaceBet: (eventId: string, side: 'YES' | 'NO' | null, amount: number, optionId?: string) => Promise<void>
}

export default function BettingModal({
  isOpen,
  onClose,
  event,
  selectedOption,
  selectedSide = 'YES',
  userBalance,
  onPlaceBet
}: BettingModalProps) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isMultipleChoice = event.marketType === 'MULTIPLE'
  const yesPrice = Number(event.yesPrice)
  const noPrice = 100 - yesPrice

  // For multiple choice, calculate the price based on the selected side
  const optionPrice = selectedOption ? Number(selectedOption.price) : 0
  const optionNoPrice = selectedOption ? (100 - Number(selectedOption.price)) : 0

  const currentPrice = isMultipleChoice
    ? (selectedSide === 'YES' ? optionPrice : optionNoPrice)
    : (selectedSide === 'YES' ? yesPrice : noPrice)
  const betAmount = Number(amount) || 0
  const maxShares = betAmount > 0 ? (betAmount / currentPrice * 100) : 0
  const maxPayout = betAmount > 0 ? (betAmount / currentPrice * 100) : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!amount || betAmount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (betAmount > userBalance) {
      setError('Insufficient balance')
      return
    }

    setLoading(true)
    try {
      if (isMultipleChoice && selectedOption) {
        await onPlaceBet(event.id, selectedSide, betAmount, selectedOption.id)
      } else {
        await onPlaceBet(event.id, selectedSide, betAmount)
      }
      onClose()
      setAmount('')
    } catch (err) {
      setError('Failed to place bet')
    } finally {
      setLoading(false)
    }
  }

  const handlePresetAmount = (preset: number) => {
    const maxAmount = Math.min(preset, userBalance)
    setAmount(maxAmount.toString())
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Place Bet">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Event Info */}
        <div className="text-center p-4 bg-gray-700/50 rounded-lg">
          <h3 className="font-semibold text-white mb-2 line-clamp-2">
            {event.title}
          </h3>
          {isMultipleChoice && selectedOption ? (
            <div className="flex justify-center">
              <div className="flex items-center text-purple-400">
                <TrendingUp className="h-4 w-4 mr-1" />
                {selectedOption.title} {Number(selectedOption.price).toFixed(1)}¢
              </div>
            </div>
          ) : (
            <div className="flex justify-center gap-4 text-sm">
              <div className="flex items-center text-green-400">
                <TrendingUp className="h-4 w-4 mr-1" />
                YES {yesPrice}¢
              </div>
              <div className="flex items-center text-red-400">
                <TrendingDown className="h-4 w-4 mr-1" />
                NO {noPrice}¢
              </div>
            </div>
          )}
        </div>

        {/* Side Selection - Only for Binary Markets */}
        {!isMultipleChoice && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Choose your position
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedSide('YES')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedSide === 'YES'
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-gray-600 hover:border-green-500/50'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{yesPrice}¢</div>
                  <div className="text-sm text-gray-300">YES</div>
                </div>
            </button>
            <button
              type="button"
              onClick={() => setSelectedSide('NO')}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedSide === 'NO'
                  ? 'border-red-500 bg-red-500/10'
                  : 'border-gray-600 hover:border-red-500/50'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{noPrice}¢</div>
                <div className="text-sm text-gray-300">NO</div>
              </div>
            </button>
          </div>
        </div>
        )}

        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Amount to bet
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              max={userBalance}
              step="0.01"
              className="pl-10"
            />
          </div>
          <div className="mt-2 text-xs text-gray-400">
            Available balance: ${userBalance.toFixed(2)}
          </div>
        </div>

        {/* Preset Amounts */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Quick amounts
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[5, 10, 25, 50].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handlePresetAmount(preset)}
                disabled={preset > userBalance}
                className="px-3 py-2 text-sm border border-gray-600 rounded-md hover:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ${preset}
              </button>
            ))}
          </div>
        </div>

        {/* Bet Summary */}
        {betAmount > 0 && (
          <div className="p-4 bg-gray-700/50 rounded-lg space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-medium text-white">Bet Summary</span>
            </div>
            <div className="space-y-1 text-sm">
              {!isMultipleChoice && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Side:</span>
                  <Badge variant={selectedSide === 'YES' ? 'success' : 'error'}>
                    {selectedSide}
                  </Badge>
                </div>
              )}
              {isMultipleChoice && selectedOption && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Option:</span>
                  <span className="text-white">{selectedOption.title}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400">Amount:</span>
                <span className="text-white">${betAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Price:</span>
                <span className="text-white">{currentPrice.toFixed(1)}¢</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Max payout:</span>
                <span className="text-green-400 font-semibold">
                  ${maxPayout.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

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
            variant={isMultipleChoice ? 'default' : (selectedSide === 'YES' ? 'yes' : 'no')}
            className="flex-1"
            disabled={loading || !amount || betAmount <= 0 || betAmount > userBalance}
          >
            {loading ? 'Placing...' : isMultipleChoice ? 'Place Bet' : `Bet ${selectedSide}`}
          </Button>
        </div>
      </form>
    </Modal>
  )
}