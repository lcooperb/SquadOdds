"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Edit, Save, X } from "lucide-react";

interface EventData {
  id: string;
  title: string;
  description: string;
  category: string;
  endDate: string | null;
  isOngoing?: boolean;
  resolved: boolean;
  _count: {
    bets: number;
  };
}

interface EditMarketModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventData;
  onEventUpdated: (updatedEvent: any) => void;
}

export default function EditMarketModal({
  isOpen,
  onClose,
  event,
  onEventUpdated,
}: EditMarketModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Categories (should match the ones in create page)
  const categories = [
    "Career",
    "Relationships",
    "Personal",
    "Life Events",
    "Other"
  ];

  // Initialize form with event data when modal opens
  useEffect(() => {
    if (isOpen && event) {
      setTitle(event.title);
      setDescription(event.description);
      setCategory(event.category);
      setEndDate(event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : "");
      setError("");
    }
  }, [isOpen, event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          endDate: endDate || null,
        }),
      });

      if (response.ok) {
        const updatedEvent = await response.json();
        onEventUpdated(updatedEvent);
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to update market");
      }
    } catch (error) {
      console.error("Error updating market:", error);
      setError("Failed to update market. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const canEditEndDate = !event.resolved && event._count.bets === 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Market"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-white font-medium mb-2">
            Market Title
          </label>
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter market title"
            required
            maxLength={200}
            className="w-full"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-white font-medium mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the market and resolution criteria"
            required
            maxLength={1000}
            rows={4}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
          />
        </div>

        {/* Category and End Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category */}
          <div>
            <label className="block text-white font-medium mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* End Date */}
          <div>
            <label className="block text-white font-medium mb-2">
              End Date (Optional)
            </label>
            <Input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={!canEditEndDate}
              className="w-full"
            />
            {!canEditEndDate && (
              <p className="text-gray-400 text-sm mt-1">
                {event.resolved
                  ? "Cannot change end date of resolved markets"
                  : "Cannot change end date after betting has started"
                }
              </p>
            )}
          </div>
        </div>

        {/* Restrictions Notice */}
        <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
          <h4 className="text-white font-medium mb-2 flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Edit Restrictions
          </h4>
          <ul className="text-gray-400 text-sm space-y-1">
            <li>• Market type and options cannot be changed</li>
            <li>• Initial odds and prices are fixed</li>
            <li>• End date can only be changed before betting starts</li>
            <li>• Market status can only be changed by admins</li>
          </ul>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}