'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import OnboardingWizard from '@/components/tutorial/OnboardingWizard'

export default function OnboardingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    // Redirect unauthenticated users to sign up
    if (status === 'unauthenticated') {
      router.push('/auth/signup')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <>
      <OnboardingWizard />
    </>
  )
}