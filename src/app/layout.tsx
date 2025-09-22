import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Providers from '@/components/Providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FriendBets - Friend Group Predictions',
  description: 'A prediction market for your friend group to bet on personal life events',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}