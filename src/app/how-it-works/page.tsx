import { Button } from '@/components/ui/Button'
import Link from 'next/link'

export default function HowItWorks() {
  return (
    <>
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8 text-center">How SquadOdds Works</h1>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center p-6 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-white mb-4">Create Markets</h3>
              <p className="text-gray-400">
                Anyone in your squad can create prediction markets about personal events,
                achievements, or future outcomes. Set an end date and let the betting begin!
              </p>
            </div>

            <div className="text-center p-6 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-semibold text-white mb-4">Place Bets</h3>
              <p className="text-gray-400">
                Bet virtual money on YES or NO outcomes. Prices adjust dynamically based on
                demand - early bets get better odds! Everyone starts with $100.
              </p>
            </div>

            <div className="text-center p-6 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-xl font-semibold text-white mb-4">Settle Up</h3>
              <p className="text-gray-400">
                When events resolve, winners collect virtual winnings. Track who owes whom
                and settle up with real money between friends manually.
              </p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
              <h2 className="text-2xl font-semibold text-white mb-4">Example Markets</h2>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>&quot;Will Sarah get promoted by the end of the year?&quot;</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>&quot;Will Mike finish his marathon training program?&quot;</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>&quot;Will our group take a vacation together this summer?&quot;</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>&quot;Will Alex ask out their crush before Valentine&apos;s Day?&quot;</span>
                </li>
              </ul>
            </div>

            <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
              <h2 className="text-2xl font-semibold text-white mb-4">How Pricing Works</h2>
              <p className="text-gray-300 mb-4">
                SquadOdds uses a simple market maker algorithm. Prices represent the collective
                opinion of your squad:
              </p>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">•</span>
                  <span>If YES is trading at 70¢, the market thinks there&apos;s a 70% chance it happens</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">•</span>
                  <span>More YES bets push the price up, more NO bets push it down</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">•</span>
                  <span>Early bets get better odds before the market finds its equilibrium</span>
                </li>
              </ul>
            </div>

            <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
              <h2 className="text-2xl font-semibold text-white mb-4">Settling Up</h2>
              <p className="text-gray-300 mb-4">
                SquadOdds tracks virtual winnings and losses. When you&apos;re ready to settle:
              </p>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start">
                  <span className="text-gray-400 mr-2">•</span>
                  <span>Check your net winnings/losses in your profile</span>
                </li>
                <li className="flex items-start">
                  <span className="text-gray-400 mr-2">•</span>
                  <span>Agree on a conversion rate (e.g., $1 virtual = $0.10 real)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-gray-400 mr-2">•</span>
                  <span>Winners collect from losers using Venmo, cash, or however you prefer</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="text-center mt-12">
            <h2 className="text-2xl font-semibold text-white mb-4">Ready to Start?</h2>
            <p className="text-gray-400 mb-6">
              Join your squad&apos;s prediction market and start making your bets!
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg">Get Started</Button>
              </Link>
              <Link href="/">
                <Button variant="outline" size="lg">Browse Markets</Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}