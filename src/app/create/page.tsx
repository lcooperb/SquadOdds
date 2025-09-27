"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Plus, Calendar, Info, Clock, BarChart3 } from "lucide-react";

const categories = [
  "Career",
  "Relationships",
  "Personal",
  "Life Events",
  "Sports",
  "Entertainment",
  "Other",
];

export default function CreateMarket() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    endDate: "",
    isOngoing: false,
    marketType: "BINARY", // BINARY or MULTIPLE
  });
  const [options, setOptions] = useState<string[]>([""]);
  const [newOption, setNewOption] = useState("");
  const [binaryOdds, setBinaryOdds] = useState({ yes: 50, no: 50 });
  const [investment, setInvestment] = useState(10);
  const [multipleOdds, setMultipleOdds] = useState<{ [index: number]: number }>(
    {}
  );

  if (status === "loading") {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      </>
    );
  }

  if (!session) {
    router.push("/auth/signin");
    return null;
  }

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const addOption = () => {
    if (newOption.trim() && !options.includes(newOption.trim())) {
      setOptions((prev) => [
        ...prev.filter((opt) => opt.trim()),
        newOption.trim(),
      ]);
      setNewOption("");
    }
  };

  const removeOption = (index: number) => {
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, value: string) => {
    setOptions((prev) => prev.map((opt, i) => (i === index ? value : opt)));
  };

  const updateBinaryOdds = (yesPercentage: number) => {
    const constrainedValue = Math.max(1, Math.min(99, yesPercentage));
    setBinaryOdds({
      yes: constrainedValue,
      no: 100 - constrainedValue,
    });
  };

  const updateMultipleOdds = (index: number, value: number) => {
    const constrainedValue = Math.max(1, Math.min(99, value));
    setMultipleOdds((prev) => ({ ...prev, [index]: constrainedValue }));
  };

  // Initialize multiple choice odds when options change
  const validOptions = options.filter((opt) => opt.trim());
  const totalMultipleOdds = Object.values(multipleOdds).reduce(
    (sum, val) => sum + (val || 0),
    0
  );

  // Auto-distribute remaining percentage for multiple choice
  const distributeRemainingOdds = () => {
    const remaining = 100 - totalMultipleOdds;
    const optionsWithoutOdds = validOptions.filter((_, i) => !multipleOdds[i]);

    if (optionsWithoutOdds.length > 0) {
      const perOption = Math.floor(remaining / optionsWithoutOdds.length);
      const newOdds = { ...multipleOdds };
      validOptions.forEach((_, i) => {
        if (!newOdds[i]) {
          newOdds[i] = perOption;
        }
      });
      setMultipleOdds(newOdds);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          endDate: formData.isOngoing ? null : formData.endDate,
          isOngoing: formData.isOngoing,
          marketType: formData.marketType,
          options:
            formData.marketType === "MULTIPLE"
              ? options.filter((opt) => opt.trim())
              : undefined,
          initialOdds:
            formData.marketType === "BINARY" ? binaryOdds : multipleOdds,
          investment: investment, // Investment amount from creator
        }),
      });

      if (response.ok) {
        const event = await response.json();
        router.push(`/market/${event.id}`);
      } else {
        const error = await response.json();
        alert(error.message || "Failed to create market");
      }
    } catch (error) {
      console.error("Error creating market:", error);
      alert("Failed to create market");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    formData.title &&
    formData.description &&
    formData.category &&
    (formData.isOngoing || formData.endDate) &&
    (formData.marketType === "BINARY"
      ? binaryOdds.yes + binaryOdds.no === 100
      : options.filter((opt) => opt.trim()).length >= 2 &&
        totalMultipleOdds === 100);

  return (
    <>
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Create New Market
          </h1>
          <p className="text-gray-400">
            Create a prediction market for your friends to bet on
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <p className="text-gray-400 text-sm mt-1">
                Start with the essential details about your market
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-white mb-2"
                >
                  Market Question *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Will John get the promotion by end of year?"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-white mb-2"
                >
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Provide more context about this prediction..."
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-white mb-2"
                >
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Market Type */}
              <div>
                <label
                  htmlFor="marketType"
                  className="block text-sm font-medium text-white mb-2"
                >
                  Market Type *
                </label>
                <select
                  id="marketType"
                  name="marketType"
                  value={formData.marketType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="BINARY">Yes/No Question</option>
                  <option value="MULTIPLE">Multiple Choice</option>
                </select>
                <p className="text-sm text-gray-400 mt-1">
                  {formData.marketType === "BINARY"
                    ? "Users bet on YES or NO for your question"
                    : "Users bet on specific options you provide (e.g., who will win)"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Market Configuration Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Market Configuration
              </CardTitle>
              <p className="text-gray-400 text-sm mt-1">
                Set up initial odds and options for your market
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Initial Investment */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Initial Investment *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400 text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    step="1"
                    value={investment}
                    onChange={(e) => setInvestment(Math.max(10, parseInt(e.target.value) || 10))}
                    className="w-full pl-8 pr-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="10"
                  />
                </div>
                <div className="bg-blue-600/10 border border-blue-500/20 rounded-lg p-3 mt-3">
                  <div className="flex items-start gap-2">
                    <div className="bg-blue-600 rounded-full p-1">
                      <Info className="h-3 w-3 text-white" />
                    </div>
                    <div>
                      <p className="text-gray-300 text-sm">
                        Your initial investment provides liquidity and sets realistic odds.
                        This amount will be distributed across options based on your specified probabilities.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Binary Market Odds - Slider */}
              {formData.marketType === "BINARY" && (
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-white mb-4">
                    Set Initial Odds *
                  </label>

                  {/* Slider Container */}
                  <div className="relative mb-6">
                    <div className="flex justify-between text-xs text-gray-400 mb-2">
                      <span>More likely NO</span>
                      <span>50/50</span>
                      <span>More likely YES</span>
                    </div>

                    {/* Custom Slider */}
                    <div className="relative">
                      <input
                        type="range"
                        min="1"
                        max="99"
                        value={binaryOdds.no}
                        onChange={(e) => updateBinaryOdds(100 - parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${binaryOdds.no}%, #10b981 ${binaryOdds.no}%, #10b981 100%)`
                        }}
                      />
                      {/* Slider thumb styling handled by CSS */}
                    </div>

                    {/* Current Value Display */}
                    <div className="flex justify-center mt-3">
                      <div className="bg-gray-700 rounded-lg px-4 py-2 text-center">
                        <div className="text-white font-medium text-lg">
                          {binaryOdds.no}% NO / {binaryOdds.yes}% YES
                        </div>
                        <div className="text-gray-400 text-sm mt-1">
                          {binaryOdds.yes > 50 ? 'Favoring YES' : binaryOdds.yes < 50 ? 'Favoring NO' : 'Even odds'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Investment Distribution */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                      <div className="text-red-400 font-medium text-sm mb-1">NO Position</div>
                      <div className="text-white font-semibold">
                        ${(((binaryOdds.no || 0) / 100) * investment).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {binaryOdds.no}% probability
                      </div>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                      <div className="text-green-400 font-medium text-sm mb-1">YES Position</div>
                      <div className="text-white font-semibold">
                        ${(((binaryOdds.yes || 0) / 100) * investment).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {binaryOdds.yes}% probability
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Multiple Choice Options */}
              {formData.marketType === "MULTIPLE" && (
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-white mb-3">
                    Market Options *
                  </label>

                  {/* Existing Options */}
                  <div className="space-y-3 mb-4">
                    {options
                      .filter((opt) => opt.trim())
                      .map((option, index) => (
                        <div
                          key={index}
                          className="bg-gray-700/50 rounded-lg p-3"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <input
                              type="text"
                              value={option}
                              onChange={(e) =>
                                updateOption(index, e.target.value)
                              }
                              placeholder={`Option ${index + 1}`}
                              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => removeOption(index)}
                              className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-400 min-w-[80px]">
                              Probability:
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="99"
                              value={multipleOdds[index] || ""}
                              onChange={(e) =>
                                updateMultipleOdds(
                                  index,
                                  parseInt(e.target.value) || 0
                                )
                              }
                              placeholder="0"
                              className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <span className="text-xs text-gray-400">%</span>
                            <span className="text-xs text-gray-400 ml-auto">
                              Investment: $
                              {((((multipleOdds[index] || 0) as number) / 100) * investment).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
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
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) =>
                        e.key === "Enter" && (e.preventDefault(), addOption())
                      }
                    />
                    <button
                      type="button"
                      onClick={addOption}
                      disabled={!newOption.trim()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Total Probability:</span>
                      <span
                        className={`font-medium ${totalMultipleOdds === 100 ? "text-green-400" : "text-red-400"}`}
                      >
                        {totalMultipleOdds}%{" "}
                        {totalMultipleOdds === 100 ? "✓" : "(must equal 100%)"}
                      </span>
                    </div>
                    {totalMultipleOdds !== 100 && validOptions.length > 0 && (
                      <button
                        type="button"
                        onClick={distributeRemainingOdds}
                        className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                      >
                        Auto-distribute remaining {100 - totalMultipleOdds}%
                      </button>
                    )}
                  </div>

                  <p className="text-sm text-gray-400 mt-2">
                    Add at least 2 options. Examples: &quot;Alice&quot;,
                    &quot;Bob&quot;, &quot;Charlie&quot; for &quot;Who will get
                    married first?&quot;
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timing & Duration Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timing & Duration
              </CardTitle>
              <p className="text-gray-400 text-sm mt-1">
                Set when your market should close for betting
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Ongoing Event Toggle */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="isOngoing"
                    className="text-sm font-medium text-white"
                  >
                    Ongoing Event
                  </label>
                  <input
                    type="checkbox"
                    id="isOngoing"
                    name="isOngoing"
                    checked={formData.isOngoing}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                  />
                </div>
                <div className="flex items-start gap-2 text-gray-400 text-sm">
                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p>
                    Check this for events without a specific end date (like
                    &quot;Will Sarah get married?&quot; or &quot;Will Mike move
                    to a new city?&quot;). These markets stay open until
                    manually resolved.
                  </p>
                </div>
              </div>

              {/* End Date (only show if not ongoing) */}
              {!formData.isOngoing && (
                <div>
                  <label
                    htmlFor="endDate"
                    className="block text-sm font-medium text-white mb-2"
                  >
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
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required={!formData.isOngoing}
                    />
                    <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                  <p className="text-gray-400 text-sm mt-1">
                    When should betting close for this market?
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preview & Actions Section */}
          {formData.title && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Preview & Create
                </CardTitle>
                <p className="text-gray-400 text-sm mt-1">
                  Review your market before creating
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Preview */}
                <div className="bg-gray-800/30 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-3">
                    Market Preview
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="default">
                        {formData.category || "Category"}
                      </Badge>
                      {formData.isOngoing && (
                        <Badge variant="warning">
                          <Clock className="h-3 w-3 mr-1" />
                          Ongoing
                        </Badge>
                      )}
                    </div>
                    <h4 className="text-white font-medium text-lg">
                      {formData.title}
                    </h4>
                    {formData.description && (
                      <p className="text-gray-400 text-sm leading-relaxed">
                        {formData.description}
                      </p>
                    )}
                    {!formData.isOngoing && formData.endDate && (
                      <p className="text-gray-400 text-sm">
                        <Calendar className="h-3 w-3 inline mr-1" />
                        Ends: {new Date(
                          formData.endDate
                        ).toLocaleDateString()}{" "}
                        at {new Date(formData.endDate).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>

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
                    {loading ? "Creating..." : `Create Market ($${investment})`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </form>
      </main>
    </>
  );
}
