'use client'

import { useState, useEffect } from 'react'
import { Monitor } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trash2, Play, Pause, RefreshCw, BarChart3, Edit, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'
import { formatDuration } from '@/lib/utils'
import MonitorForm from './MonitorForm'
import { ContactList } from '@/types'

interface MonitorCardProps {
  monitor: Monitor
  onDelete: () => void
  onUpdate?: () => void
  canManage?: boolean
}

export default function MonitorCard({ monitor, onDelete, onUpdate, canManage = true }: MonitorCardProps) {
  const [stats, setStats] = useState<any>(null)
  const [checking, setChecking] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [contactLists, setContactLists] = useState<ContactList[]>([])

  useEffect(() => {
    fetchStats()
    if (monitor.contactLists && monitor.contactLists.length > 0) {
      fetchContactLists()
    }
  }, [monitor._id, monitor.contactLists])

  const fetchContactLists = async () => {
    try {
      const response = await fetch('/api/contact-lists')
      const result = await response.json()
      if (result.success) {
        const attachedLists = result.data.filter((list: ContactList) =>
          list._id && monitor.contactLists?.includes(list._id)
        )
        setContactLists(attachedLists)
      }
    } catch (error) {
      console.error('Failed to fetch contact lists:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/monitors/${monitor._id}/stats`)
      const result = await response.json()

      if (result.success) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const handleCheck = async () => {
    setChecking(true)
    try {
      const response = await fetch(`/api/monitors/${monitor._id}/check`, {
        method: 'POST',
      })

      if (response.ok) {
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      }
    } catch (error) {
      console.error('Failed to check monitor:', error)
    } finally {
      setChecking(false)
    }
  }

  const handleTogglePause = async () => {
    setUpdating(true)
    try {
      const newStatus = monitor.status === 'paused' ? 'up' : 'paused'

      const response = await fetch(`/api/monitors/${monitor._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        window.location.reload()
      }
    } catch (error) {
      console.error('Failed to toggle pause:', error)
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete monitor "${monitor.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/monitors/${monitor._id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        onDelete()
      }
    } catch (error) {
      console.error('Failed to delete monitor:', error)
    }
  }

  const getStatusBadge = () => {
    switch (monitor.status) {
      case 'up':
        return <Badge variant="success">UP</Badge>
      case 'down':
        return <Badge variant="destructive">DOWN</Badge>
      case 'paused':
        return <Badge variant="warning">PAUSED</Badge>
      default:
        return <Badge variant="outline">UNKNOWN</Badge>
    }
  }

  const handleEditSuccess = () => {
    setIsEditing(false)
    if (onUpdate) {
      onUpdate()
    } else {
      window.location.reload()
    }
  }

  if (isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Edit Monitor</CardTitle>
        </CardHeader>
        <CardContent>
          <MonitorForm
            monitor={monitor}
            onSuccess={handleEditSuccess}
            onCancel={() => setIsEditing(false)}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <CardTitle className="text-base sm:text-xl truncate">{monitor.name}</CardTitle>
              {getStatusBadge()}
            </div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">{monitor.url}</p>
            {monitor.lastCheck && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Last: {new Date(monitor.lastCheck).toLocaleString()}
              </p>
            )}
          </div>

          <div className="flex gap-1.5 sm:gap-2 flex-wrap">
            {canManage && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCheck}
                  disabled={checking}
                  title="Check now"
                  className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                >
                  <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${checking ? 'animate-spin' : ''}`} />
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTogglePause}
                  disabled={updating}
                  title={monitor.status === 'paused' ? 'Resume' : 'Pause'}
                  className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                >
                  {monitor.status === 'paused' ? (
                    <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  ) : (
                    <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  title="Edit"
                  className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                >
                  <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Button>
              </>
            )}

            <Link href={`/dashboard/monitors/${monitor._id}`}>
              <Button size="sm" variant="outline" title="View details" className="h-8 w-8 p-0 sm:h-9 sm:w-9">
                <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>
            </Link>

            {canManage && (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDelete}
                title="Delete"
                className="h-8 w-8 p-0 sm:h-9 sm:w-9"
              >
                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {stats && (
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">24h Uptime</p>
              <p className="text-base sm:text-lg font-semibold dark:text-white">
                {stats.uptime24h.toFixed(1)}%
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">7d Uptime</p>
              <p className="text-base sm:text-lg font-semibold dark:text-white">
                {stats.uptime7d.toFixed(1)}%
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">30d Uptime</p>
              <p className="text-base sm:text-lg font-semibold dark:text-white">
                {stats.uptime30d.toFixed(1)}%
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Avg Response</p>
              <p className="text-base sm:text-lg font-semibold dark:text-white">
                {formatDuration(stats.avgResponseTime)}
              </p>
            </div>
          </div>

          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t dark:border-gray-700">
            <div
              className="flex flex-wrap items-center justify-between gap-2 cursor-pointer"
              onClick={() => setExpanded(!expanded)}
            >
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  {monitor.interval}s interval
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  {monitor.timeout}s timeout
                </span>
                {contactLists.length > 0 && (
                  <span className="text-gray-600 dark:text-gray-400">
                    {contactLists.length} contact list{contactLists.length > 1 ? 's' : ''}
                  </span>
                )}
                {monitor.alerts?.email && monitor.alerts.email.length > 0 && (
                  <span className="text-gray-600 dark:text-gray-400">
                    {monitor.alerts.email.length} email{monitor.alerts.email.length > 1 ? 's' : ''}
                  </span>
                )}
                {monitor.alerts?.phone && monitor.alerts.phone.length > 0 && (
                  <span className="text-gray-600 dark:text-gray-400">
                    {monitor.alerts.phone.length} phone{monitor.alerts.phone.length > 1 ? 's' : ''}
                  </span>
                )}
                {monitor.alerts?.webhook && monitor.alerts.webhook.length > 0 && (
                  <span className="text-gray-600 dark:text-gray-400">
                    {monitor.alerts.webhook.length} webhook{monitor.alerts.webhook.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <button
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                aria-label={expanded ? "Collapse" : "Expand"}
              >
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {expanded && (
              <div className="mt-3 space-y-2 text-xs sm:text-sm">
                {contactLists.length > 0 && (
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Lists:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-gray-600 dark:text-gray-400">
                      {contactLists.map((list) => {
                        const totalContacts = list.emails.length + list.phones.length + list.webhooks.length
                        return (
                          <li key={list._id}>
                            {list.name} ({totalContacts} contact{totalContacts !== 1 ? 's' : ''})
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}
                {monitor.alerts?.email && monitor.alerts.email.length > 0 && (
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Email Alerts:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-gray-600 dark:text-gray-400">
                      {monitor.alerts.email.map((email, index) => (
                        <li key={index} className="truncate">{email}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {monitor.alerts?.phone && monitor.alerts.phone.length > 0 && (
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Alerts:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-gray-600 dark:text-gray-400">
                      {monitor.alerts.phone.map((phone, index) => (
                        <li key={index}>{phone}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {monitor.alerts?.webhook && monitor.alerts.webhook.length > 0 && (
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Webhook Alerts:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-gray-600 dark:text-gray-400">
                      {monitor.alerts.webhook.map((webhook, index) => (
                        <li key={index} className="truncate">{webhook}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
