'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Plus, Calendar, Info, Clock } from 'lucide-react'

const categories = [
  'Career',
  'Relationships',
  'Personal',
  'Life Events',
  'Sports',
  'Entertainment',
  'Other'
]

export default function CreateMarket() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    endDate: '',
    isOngoing: false,
    marketType: 'BINARY', // BINARY or MULTIPLE
  })
  const [options, setOptions] = useState<string[]>([''])
  const [newOption, setNewOption] = useState('')

  if (status === 'loading') {
    return (
      <>
        <Navigation />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      </>
    )
  }

  if (!session) {
    router.push('/auth/signin')
    return null
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const addOption = () => {
    if (newOption.trim() && !options.includes(newOption.trim())) {
      setOptions(prev => [...prev.filter(opt => opt.trim()), newOption.trim()])
      setNewOption('')
    }
  }

  const removeOption = (index: number) => {
    setOptions(prev => prev.filter((_, i) => i !== index))
  }

  const updateOption = (index: number, value: string) => {
    setOptions(prev => prev.map((opt, i) => i === index ? value : opt))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          endDate: formData.isOngoing ? null : formData.endDate,
          isOngoing: formData.isOngoing,
          marketType: formData.marketType,
          options: formData.marketType === 'MULTIPLE' ? options.filter(opt => opt.trim()) : undefined,
        }),
      })

      if (response.ok) {
        const event = await response.json()
        router.push(`/market/${event.id}`)
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to create market')
      }
    } catch (error) {
      console.error('Error creating market:', error)
      alert('Failed to create market')
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = formData.title && formData.description && formData.category &&
    (formData.isOngoing || formData.endDate) &&
    (formData.marketType === 'BINARY' || (formData.marketType === 'MULTIPLE' && options.filter(opt => opt.trim()).length >= 2))

  return (
    <>
      <Navigation />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create New Market</h1>
          <p className="text-gray-400">
            Create a prediction market for your friends to bet on
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Market Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-white mb-2">
                  Market Question *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Will John get the promotion by end of year?"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-white mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Provide more context about this prediction..."
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-white mb-2">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Market Type */}
              <div>
                <label htmlFor="marketType" className="block text-sm font-medium text-white mb-2">
                  Market Type *
                </label>
                <select
                  id="marketType"
                  name="marketType"
                  value={formData.marketType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="BINARY">Yes/No Question</option>
                  <option value="MULTIPLE">Multiple Choice</option>
                </select>
                <p className="text-sm text-gray-400 mt-1">
                  {formData.marketType === 'BINARY'
                    ? 'Users bet on YES or NO for your question'
                    : 'Users bet on specific options you provide (e.g., who will win)'}
                </p>
              </div>

              {/* Multiple Choice Options */}
              {formData.marketType === 'MULTIPLE' && (
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-white mb-3">
                    Market Options *
                  </label>

                  {/* Existing Options */}
                  <div className="space-y-2 mb-4">
                    {options.filter(opt => opt.trim()).map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add New Option */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newOption}
                      onChange={(e) => setNewOption(e.target.value)}
                      placeholder="Add new option..."
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                    />
                    <button
                      type="button"
                      onClick={addOption}
                      disabled={!newOption.trim()}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="text-sm text-gray-400 mt-2">
                    Add at least 2 options. Examples: &quot;Alice&quot;, &quot;Bob&quot;, &quot;Charlie&quot; for &quot;Who will get married first?&quot;
                  </p>
                </div>
              )}

              {/* Ongoing Event Toggle */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="isOngoing" className="text-sm font-medium text-white">
                    Ongoing Event
                  </label>
                  <input
                    type="checkbox"
                    id="isOngoing"
                    name="isOngoing"
                    checked={formData.isOngoing}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                  />
                </div>
                <div className="flex items-start gap-2 text-gray-400 text-sm">
                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p>
                    Check this for events without a specific end date (like &quot;Will Sarah get married?&quot; or &quot;Will Mike move to a new city?&quot;).
                    These markets stay open until manually resolved.
                  </p>
                </div>
              </div>

              {/* End Date (only show if not ongoing) */}
              {!formData.isOngoing && (
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-white mb-2">
                    End Date *
                  </label>
                  <div className="relative">
                    <input
                      type="datetime-local"
                      id="endDate"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      min={new Date().toISOString().slice(0, 16)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required={!formData.isOngoing}
                    />
                    <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                  <p className="text-gray-400 text-sm mt-1">
                    When should betting close for this market?
                  </p>
                </div>
              )}

              {/* Preview */}
              {formData.title && (
                <div className="bg-gray-800/30 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-2">Preview</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="default">{formData.category || 'Category'}</Badge>
                      {formData.isOngoing && (
                        <Badge variant="warning">
                          <Clock className="h-3 w-3 mr-1" />
                          Ongoing
                        </Badge>
                      )}
                    </div>
                    <h4 className="text-white font-medium">{formData.title}</h4>
                    {formData.description && (
                      <p className="text-gray-400 text-sm">{formData.description}</p>
                    )}
                    {!formData.isOngoing && formData.endDate && (
                      <p className="text-gray-400 text-sm">
                        Ends: {new Date(formData.endDate).toLocaleDateString()} at {new Date(formData.endDate).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.back()}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!isFormValid || loading}
                  className="flex-1"
                >
                  {loading ? 'Creating...' : 'Create Market'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </>
  )
}