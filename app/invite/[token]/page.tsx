'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface InvitationData {
  email: string
  organizationName: string
  role: string
  inviterName: string
}

export default function InvitePage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [invitation, setInvitation] = useState<InvitationData | null>(null)

  useEffect(() => {
    async function fetchInvitation() {
      try {
        const res = await fetch(`/api/invitations/${token}`)
        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Invalid or expired invitation')
          return
        }

        setInvitation(data.data)
      } catch (err) {
        setError('Failed to load invitation')
      } finally {
        setLoading(false)
      }
    }

    fetchInvitation()
  }, [token])

  const handleAccept = () => {
    // Redirect to login with the invite token
    router.push(`/login?invite=${token}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Loading invitation...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-red-600">Invalid Invitation</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <Button onClick={() => router.push('/login')}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">You are Invited!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            <strong>{invitation?.inviterName}</strong> has invited you to join
          </p>
          <p className="text-xl font-semibold">{invitation?.organizationName}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            You will be joining as a <strong>{invitation?.role}</strong>
          </p>

          <div className="pt-4">
            <Button onClick={handleAccept} className="w-full" size="lg">
              Accept Invitation
            </Button>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            By accepting, you will create an account with {invitation?.email}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
