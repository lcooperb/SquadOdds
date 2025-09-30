'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import TutorialCard from '@/components/tutorial/TutorialCard'
import InteractiveExample from '@/components/tutorial/InteractiveExample'
import {
  TrendingUp,
  DollarSign,
  BarChart3,
  Target,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Smartphone
} from 'lucide-react'

interface FAQItem {
  question: string
  answer: string
}

const faqItems: FAQItem[] = [
  {
    question: "How do I add money?",
    answer: "Send $5-$200 via Apple Cash and your balance updates in minutes."
  },
  {
    question: "How does pricing work?",
    answer: "Prices change based on betting activity. More popular outcomes get more expensive."
  },
  {
    question: "When do I get paid?",
    answer: "Winnings are added immediately when markets resolve. Withdraw anytime."
  },
  {
    question: "Can I sell before a market ends?",
    answer: "Yes! Buy and sell positions anytime before resolution."
  },
  {
    question: "Are there fees?",
    answer: "No trading fees. Apple Cash may have standard transfer limits."
  }
]

export default function HowItWorks() {
  const { data: session } = useSession()
  const [activeSection, setActiveSection] = useState<string>('getting-started')
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)

  const sections = [
    { id: 'getting-started', title: 'Getting Started', icon: Target },
    { id: 'money', title: 'Money', icon: DollarSign },
    { id: 'betting', title: 'Markets', icon: BarChart3 },
    { id: 'faq', title: 'FAQ', icon: HelpCircle }
  ]

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId)
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <>
      <main className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center mb-3">
              <TrendingUp className="h-12 w-12 text-purple-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              How SquadOdds Works
            </h1>
            <p className="text-base text-gray-300 max-w-3xl">
              Bet on anything with your friends. Simple, fun, and straightforward.
            </p>

            {!session && (
              <div className="mt-4">
                <Link href="/auth/signup">
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    Get Started Now
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex flex-wrap justify-start gap-2 mb-4">
            {sections.map((section) => {
              const IconComponent = section.icon
              return (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                    activeSection === section.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                  <span className="hidden sm:inline">{section.title}</span>
                </button>
              )
            })}
          </div>

          {/* Content Sections */}
          <div className="space-y-10">
            {/* Getting Started */}
            <section id="getting-started" className="scroll-mt-24">
              <h2 className="text-xl font-semibold text-white mb-4 text-left">Getting Started</h2>

              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <TutorialCard
                  title="1. Sign Up"
                  description="Create your account in seconds"
                  icon={<Target className="h-6 w-6" />}
                />
                <TutorialCard
                  title="2. Add Money"
                  description="Send cash via Apple Cash"
                  icon={<DollarSign className="h-6 w-6" />}
                />
                <TutorialCard
                  title="3. Start Betting"
                  description="Create or join markets"
                  icon={<TrendingUp className="h-6 w-6" />}
                />
              </div>

              <div>
                <p className="text-gray-300 text-base">
                  That&apos;s it. Create markets about anything - who&apos;ll be late to dinner, which team wins, what happens next in your friend group.
                </p>
              </div>
            </section>

            {/* Money */}
            <section id="money" className="scroll-mt-24">
              <h2 className="text-xl font-semibold text-white mb-4 text-left">Money</h2>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <TutorialCard
                  title="Adding Money"
                  description="Send $5-$200 via Apple Cash. Your balance updates in minutes."
                  icon={<CreditCard className="h-6 w-6" />}
                />

                <TutorialCard
                  title="Withdrawing"
                  description="Request withdrawals anytime. Processed within 24 hours."
                  icon={<Smartphone className="h-6 w-6" />}
                />
              </div>

              <div className="bg-gray-800/90 rounded-lg p-4 md:p-5 border-0 shadow-lg text-center">
                <p className="text-gray-300">
                  Think of it like sending money to any friend via Apple Cash. Easy transfers, no complicated setup or verification processes.
                </p>
              </div>
            </section>

            {/* Markets */}
            <section id="betting" className="scroll-mt-24">
              <h2 className="text-xl font-semibold text-white mb-4 text-left">Markets</h2>

              <div className="grid md:grid-cols-2 gap-4 items-start">
                <div>
                  <TutorialCard
                    title="How Pricing Works"
                    description="Prices change based on what people are betting on. More popular outcomes get more expensive."
                    icon={<BarChart3 className="h-6 w-6" />}
                  >
                    <div className="bg-gray-800/30 rounded-lg p-3 md:p-4 border-0 mt-3">
                      <p className="text-gray-300 text-sm">
                        If everyone&apos;s betting YES, the YES price goes up. If you think they&apos;re wrong, you can get NO for cheaper.
                        It&apos;s like a stock market for any question.
                      </p>
                    </div>
                  </TutorialCard>
                </div>
                <InteractiveExample
                  title="Try It Out"
                  description="See how your bet affects prices"
                />
              </div>
            </section>

            {/* FAQ */}
            <section id="faq" className="scroll-mt-24">
              <h2 className="text-xl font-semibold text-white mb-4 text-left">FAQ</h2>

              <div className="space-y-3">
                {faqItems.map((item, index) => (
                  <div key={index} className="bg-gray-800/90 rounded-lg border-0 shadow-lg">
                    <button
                      onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                      className="w-full flex items-center justify-between p-3 md:p-4 text-left hover:bg-gray-700/30 transition-colors"
                    >
                      <span className="text-white font-medium">{item.question}</span>
                      {expandedFAQ === index ? (
                        <ChevronUp className="h-5 w-5 text-purple-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                    {expandedFAQ === index && (
                      <div className="px-3 md:px-4 pb-3 md:pb-4">
                        <p className="text-gray-300">{item.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* CTA */}
          {!session && (
            <div className="mt-10 pt-6 border-t border-gray-700">
              <h2 className="text-xl font-semibold text-left text-white mb-2">Ready to start?</h2>
              <p className="text-gray-300 text-left mb-4">Join your friends on SquadOdds today.</p>
              <Link href="/auth/signup">
                <Button className="bg-purple-600 hover:bg-purple-700 px-6 py-2.5">
                  Get Started Now
                </Button>
              </Link>
            </div>
          )}
      </main>
    </>
  )
}