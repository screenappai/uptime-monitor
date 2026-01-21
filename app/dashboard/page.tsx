'use client'

import { useEffect, useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { Monitor } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import MonitorForm from '@/components/MonitorForm'
import MonitorCard from '@/components/MonitorCard'
import { Plus, RefreshCw, LogOut, Users, Settings, UserPlus } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { data: session } = useSession()
  const [monitors, setMonitors] = useState<Monitor[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const fetchMonitors = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/monitors')
      const result = await response.json()

      if (result.success) {
        setMonitors(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch monitors:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMonitors()
  }, [])

  const handleMonitorCreated = () => {
    setShowForm(false)
    fetchMonitors()
  }

  const handleMonitorDeleted = () => {
    fetchMonitors()
  }

  const handleMonitorUpdated = () => {
    fetchMonitors()
  }

  const upMonitors = monitors.filter(m => m.status === 'up').length
  const downMonitors = monitors.filter(m => m.status === 'down').length
  const pausedMonitors = monitors.filter(m => m.status === 'paused').length

  // Check if user can manage (create/edit/delete) resources
  const canManage = session?.user?.role === 'owner' || session?.user?.role === 'admin'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Uptime Monitor
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              Monitor and track your services in real-time
            </p>
            {session?.user && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Logged in as {session.user.name}
              </p>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href="/dashboard/team">
              <Button
                variant="outline"
                size="sm"
                title="Team"
              >
                <UserPlus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Team</span>
              </Button>
            </Link>
            <Link href="/dashboard/contact-lists">
              <Button
                variant="outline"
                size="sm"
                title="Contact Lists"
              >
                <Users className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Contacts</span>
              </Button>
            </Link>
            <Link href="/dashboard/settings">
              <Button
                variant="outline"
                size="sm"
                title="Settings"
              >
                <Settings className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
            </Link>
            <Button
              onClick={fetchMonitors}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            {canManage && (
              <Button
                onClick={() => setShowForm(!showForm)}
                size="sm"
              >
                <Plus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Add Monitor</span>
              </Button>
            )}
            <Button
              onClick={() => signOut({ callbackUrl: '/' })}
              variant="outline"
              size="sm"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="p-4 sm:pb-3">
              <CardDescription className="text-xs sm:text-sm">Total Monitors</CardDescription>
              <CardTitle className="text-2xl sm:text-3xl">{monitors.length}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="p-4 sm:pb-3">
              <CardDescription className="text-xs sm:text-sm">Up</CardDescription>
              <CardTitle className="text-2xl sm:text-3xl text-green-600">{upMonitors}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="p-4 sm:pb-3">
              <CardDescription className="text-xs sm:text-sm">Down</CardDescription>
              <CardTitle className="text-2xl sm:text-3xl text-red-600">{downMonitors}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="p-4 sm:pb-3">
              <CardDescription className="text-xs sm:text-sm">Paused</CardDescription>
              <CardTitle className="text-2xl sm:text-3xl text-yellow-600">{pausedMonitors}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {showForm && canManage && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Create New Monitor</CardTitle>
              <CardDescription>
                Add a new HTTP/HTTPS endpoint to monitor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MonitorForm
                onSuccess={handleMonitorCreated}
                onCancel={() => setShowForm(false)}
              />
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">Loading monitors...</p>
          </div>
        ) : monitors.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {canManage
                  ? 'No monitors yet. Create your first monitor to get started!'
                  : 'No monitors yet. Ask an admin to create monitors.'}
              </p>
              {canManage && (
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Monitor
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {monitors.map((monitor) => (
              <MonitorCard
                key={monitor._id}
                monitor={monitor}
                onDelete={handleMonitorDeleted}
                onUpdate={handleMonitorUpdated}
                canManage={canManage}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
