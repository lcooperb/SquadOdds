'use client'

import { Check } from 'lucide-react'

interface ProgressIndicatorProps {
  steps: string[]
  currentStep: number
  className?: string
}

export default function ProgressIndicator({
  steps,
  currentStep,
  className = ''
}: ProgressIndicatorProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      {steps.map((step, index) => (
        <div key={step} className="flex items-center">
          {/* Step Circle */}
          <div className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                index < currentStep
                  ? 'bg-green-600 text-white'
                  : index === currentStep
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-400'
              }`}
            >
              {index < currentStep ? (
                <Check className="h-4 w-4" />
              ) : (
                index + 1
              )}
            </div>

            {/* Step Label */}
            <span
              className={`ml-2 text-sm font-medium hidden md:inline-block ${
                index <= currentStep ? 'text-white' : 'text-gray-400'
              }`}
            >
              {step}
            </span>
          </div>

          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div
              className={`w-8 md:w-16 h-0.5 mx-2 md:mx-4 transition-colors ${
                index < currentStep ? 'bg-green-600' : 'bg-gray-700'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}