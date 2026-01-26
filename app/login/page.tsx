'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Step = 'email' | 'otp' | 'register'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  const inviteToken = searchParams.get('invite') || undefined

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [name, setName] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [isNewUser, setIsNewUser] = useState(false)
  const [pendingInvitation, setPendingInvitation] = useState<{ organizationName: string; role: string } | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const hasInvitation = !!inviteToken || !!pendingInvitation

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to send OTP')
        return
      }

      setIsNewUser(data.isNewUser)
      if (data.pendingInvitation) {
        setPendingInvitation(data.pendingInvitation)
      }
      setStep('otp')
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // For new users, show registration form first
      if (isNewUser && step === 'otp') {
        setStep('register')
        setLoading(false)
        return
      }

      // For existing users, sign in directly with NextAuth
      const result = await signIn('otp', {
        email,
        code: otp,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid OTP code')
      } else if (result?.ok) {
        window.location.href = callbackUrl
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Sign in with NextAuth, passing registration data
      // NextAuth authorize will auto-detect pending invitations
      const result = await signIn('otp', {
        email,
        code: otp,
        name,
        organizationName: hasInvitation ? '' : organizationName,
        inviteToken: inviteToken || '',
        redirect: false,
      })

      if (result?.ok) {
        window.location.href = callbackUrl
      } else {
        setError('Registration failed. Your code may have expired. Please start over.')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Uptime Monitor</CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {step === 'email' && 'Enter your email to sign in'}
            {step === 'otp' && 'Enter the code sent to your email'}
            {step === 'register' && (hasInvitation ? 'Complete your registration' : 'Create your account')}
          </p>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="p-3 text-sm bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md mb-4">
              {error}
            </div>
          )}

          {step === 'email' && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending code...' : 'Send Code'}
              </Button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">
                  Verification Code
                </label>
                <Input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  autoComplete="one-time-code"
                  autoFocus
                  className="text-center text-2xl tracking-widest"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Code sent to {email}
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
                {loading ? 'Verifying...' : 'Verify Code'}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setStep('email')
                  setOtp('')
                  setError('')
                }}
              >
                Use different email
              </Button>
            </form>
          )}

          {step === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              {pendingInvitation && (
                <div className="p-3 text-sm bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-md border border-green-200 dark:border-green-800">
                  <p className="font-medium">You&apos;ve been invited!</p>
                  <p className="mt-1 text-xs">
                    You&apos;ll be joining <strong>{pendingInvitation.organizationName}</strong> as a {pendingInvitation.role}.
                  </p>
                </div>
              )}

              {!hasInvitation && (
                <div className="p-3 text-sm bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 rounded-md border border-amber-200 dark:border-amber-800">
                  <p className="font-medium">New account detected</p>
                  <p className="mt-1 text-xs">
                    This will create a new organization. If you were invited to join an existing team, please use the invitation link instead.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">
                  Your Name
                </label>
                <Input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              {!hasInvitation && (
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-white">
                    Organization Name
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter organization name"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    required
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    You can change this later in settings
                  </p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating account...' : hasInvitation ? 'Join Team' : 'Create Account'}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setStep('email')
                  setOtp('')
                  setName('')
                  setOrganizationName('')
                  setPendingInvitation(null)
                  setError('')
                }}
              >
                Start over
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
