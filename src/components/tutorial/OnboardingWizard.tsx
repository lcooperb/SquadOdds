'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import ProgressIndicator from './ProgressIndicator'
import TutorialCard from './TutorialCard'
import InteractiveExample from './InteractiveExample'
import {
  TrendingUp,
  DollarSign,
  CreditCard,
  Smartphone,
  ArrowRight,
  ArrowLeft,
  BarChart3,
  Target
} from 'lucide-react'

const onboardingSteps = ['Welcome', 'Money', 'Markets']

interface OnboardingStep {
  title: string
  content: React.ReactNode
}

export default function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(0)
  const router = useRouter()

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Complete onboarding
      router.push('/')
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    router.push('/')
  }

  const steps: OnboardingStep[] = [
    // Step 1: Welcome
    {
      title: "Welcome to SquadOdds!",
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <TrendingUp className="h-16 w-16 text-purple-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Bet on anything with your friends
            </h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Create markets, place bets, and win money when you&apos;re right. Simple as that.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-8">
            <TutorialCard
              title="Create Markets"
              description="Ask any question about the future"
              icon={<Target className="h-6 w-6" />}
            />
            <TutorialCard
              title="Place Bets"
              description="Predict outcomes and earn money"
              icon={<TrendingUp className="h-6 w-6" />}
            />
            <TutorialCard
              title="Win Money"
              description="Get paid when you're right"
              icon={<DollarSign className="h-6 w-6" />}
            />
          </div>
        </div>
      )
    },

    // Step 2: Money Management
    {
      title: "Adding & Withdrawing Money",
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <p className="text-gray-300 text-lg">
              Use Apple Cash to add money and withdraw winnings
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <TutorialCard
              title="Adding Money"
              description="Send $5-$200 via Apple Cash and your balance updates in minutes"
              icon={<CreditCard className="h-6 w-6" />}
            />

            <TutorialCard
              title="Withdrawing"
              description="Request withdrawals anytime - processed within 24 hours"
              icon={<Smartphone className="h-6 w-6" />}
            />
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 text-center">
            <p className="text-gray-300 text-sm">
              Just send money via Apple Cash like you would to any friend. Easy transfers, no complicated setup.
            </p>
          </div>
        </div>
      )
    },

    // Step 3: How Markets Work
    {
      title: "How Markets Work",
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <p className="text-gray-300 text-lg">
              Prices change based on what people are betting on
            </p>
          </div>

          <TutorialCard
            title="Dynamic Pricing"
            description="More popular outcomes become more expensive. Less popular ones get cheaper."
            icon={<BarChart3 className="h-6 w-6" />}
          >
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-600 mt-3">
              <p className="text-gray-300 text-sm">
                If everyone&apos;s betting YES, the YES price goes up. If you think they&apos;re wrong, you can get NO cheaper.
              </p>
            </div>
          </TutorialCard>

          <InteractiveExample
            title="Try It Out"
            description="See how your bet affects prices"
          />
        </div>
      )
    }
  ]

  return (
    <div className="min-h-screen bg-gray-900 pt-20 pb-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Progress Indicator */}
        <ProgressIndicator
          steps={onboardingSteps}
          currentStep={currentStep}
          className="mb-8"
        />

        {/* Step Content */}
        <Card className="bg-gray-800/50 border-gray-700 mb-8">
          <CardContent className="p-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-white mb-2">
                {steps[currentStep].title}
              </h1>
            </div>

            {steps[currentStep].content}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button
                onClick={handlePrevious}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>
            )}

            <Button
              onClick={handleSkip}
              variant="ghost"
              className="text-gray-400 hover:text-white"
            >
              Skip Tutorial
            </Button>
          </div>

          <Button
            onClick={handleNext}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
          >
            {currentStep === steps.length - 1 ? 'Start Exploring' : 'Next'}
            {currentStep < steps.length - 1 && <ArrowRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}