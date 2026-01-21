'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Building, Users, Monitor, AlertCircle, Save } from 'lucide-react'
import Link from 'next/link'

interface Organization {
  _id: string
  name: string
  slug: string
  plan: 'free' | 'pro' | 'enterprise'
  settings: {
    maxMonitors: number
    maxContactLists: number
    maxMembers: number
    checkInterval: number
  }
  memberCount: number
  monitorCount: number
  contactListCount: number
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const currentUserRole = (session?.user as any)?.role
  const canEdit = currentUserRole === 'owner' || currentUserRole === 'admin'

  const fetchOrganization = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/organization')
      const data = await res.json()

      if (data.success) {
        setOrganization(data.data)
        setName(data.data.name)
      }
    } catch (error) {
      console.error('Failed to fetch organization:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrganization()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      const res = await fetch('/api/organization', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to update organization')
        return
      }

      setSuccess('Organization updated successfully')
      fetchOrganization()
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'enterprise':
        return <Badge className="bg-purple-600">Enterprise</Badge>
      case 'pro':
        return <Badge className="bg-blue-600">Pro</Badge>
      default:
        return <Badge variant="secondary">Free</Badge>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Organization Settings
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              Manage your organization settings and view usage
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 text-sm bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 text-sm bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-md mb-4">
            {success}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Organization Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Organization Details
              </CardTitle>
              <CardDescription>Basic information about your organization</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-white">
                    Organization Name
                  </label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!canEdit}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-white">Slug</label>
                  <Input type="text" value={organization?.slug || ''} disabled />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Used in URLs. Cannot be changed.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-white">Plan</label>
                  <div className="flex items-center gap-2">
                    {organization && getPlanBadge(organization.plan)}
                  </div>
                </div>

                {canEdit && (
                  <Button type="submit" disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Usage Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Usage & Limits
              </CardTitle>
              <CardDescription>Current usage vs plan limits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm dark:text-white">Team Members</span>
                  </div>
                  <span className="text-sm font-medium dark:text-white">
                    {organization?.memberCount || 0} / {organization?.settings.maxMembers || 1}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-gray-500" />
                    <span className="text-sm dark:text-white">Monitors</span>
                  </div>
                  <span className="text-sm font-medium dark:text-white">
                    {organization?.monitorCount || 0} / {organization?.settings.maxMonitors}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm dark:text-white">Contact Lists</span>
                  </div>
                  <span className="text-sm font-medium dark:text-white">
                    {organization?.contactListCount || 0} / {organization?.settings.maxContactLists}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard/team">
                <Button variant="outline">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Team
                </Button>
              </Link>
              <Link href="/dashboard/contact-lists">
                <Button variant="outline">
                  <Users className="w-4 h-4 mr-2" />
                  Contact Lists
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline">
                  <Monitor className="w-4 h-4 mr-2" />
                  Monitors
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
