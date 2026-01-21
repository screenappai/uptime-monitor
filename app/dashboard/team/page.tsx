'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, Trash2, UserPlus, Mail, Clock, X } from 'lucide-react'
import Link from 'next/link'

interface Member {
  _id: string
  email: string
  name?: string
  role: 'owner' | 'admin' | 'member'
  lastLoginAt?: string
  createdAt: string
}

interface Invitation {
  _id: string
  email: string
  role: 'admin' | 'member'
  expiresAt: string
  createdAt: string
}

export default function TeamPage() {
  const { data: session } = useSession()
  const [members, setMembers] = useState<Member[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member')
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const currentUserRole = (session?.user as any)?.role

  const fetchTeam = async () => {
    try {
      setLoading(true)
      const [membersRes, invitationsRes] = await Promise.all([
        fetch('/api/organization/members'),
        fetch('/api/organization/invitations'),
      ])

      const membersData = await membersRes.json()
      const invitationsData = await invitationsRes.json()

      if (membersData.success) {
        setMembers(membersData.data)
      }
      if (invitationsData.success) {
        setInvitations(invitationsData.data)
      }
    } catch (error) {
      console.error('Failed to fetch team:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeam()
  }, [])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setInviting(true)

    try {
      const res = await fetch('/api/organization/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to send invitation')
        return
      }

      setSuccess(`Invitation sent to ${inviteEmail}`)
      setInviteEmail('')
      fetchTeam()
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setInviting(false)
    }
  }

  const handleCancelInvitation = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) return

    try {
      const res = await fetch(`/api/organization/invitations?id=${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchTeam()
      }
    } catch (error) {
      console.error('Failed to cancel invitation:', error)
    }
  }

  const handleRemoveMember = async (id: string, email: string) => {
    if (!confirm(`Are you sure you want to remove ${email} from the team?`)) return

    try {
      const res = await fetch(`/api/organization/members?id=${id}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to remove member')
        return
      }

      fetchTeam()
    } catch (error) {
      console.error('Failed to remove member:', error)
    }
  }

  const handleUpdateRole = async (id: string, newRole: 'admin' | 'member') => {
    try {
      const res = await fetch('/api/organization/members', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, role: newRole }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to update role')
        return
      }

      fetchTeam()
    } catch (error) {
      console.error('Failed to update role:', error)
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return <Badge variant="default">Owner</Badge>
      case 'admin':
        return <Badge variant="secondary">Admin</Badge>
      case 'member':
        return <Badge variant="outline">Member</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  const canManage = currentUserRole === 'owner' || currentUserRole === 'admin'

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
              Team Management
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              Manage your organization team members
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 text-sm bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md mb-4">
            {error}
            <button onClick={() => setError('')} className="float-right">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="p-3 text-sm bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-md mb-4">
            {success}
            <button onClick={() => setSuccess('')} className="float-right">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Invite Form */}
        {canManage && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Invite Team Member
              </CardTitle>
              <CardDescription>
                Send an invitation to add someone to your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="flex-1"
                />
                <select
                  className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <Button type="submit" disabled={inviting}>
                  <Mail className="w-4 h-4 mr-2" />
                  {inviting ? 'Sending...' : 'Send Invite'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Pending Invitations
              </CardTitle>
              <CardDescription>
                Invitations that have not been accepted yet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invitations.map((invitation) => (
                  <div
                    key={invitation._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div>
                      <p className="font-medium dark:text-white">{invitation.email}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getRoleBadge(invitation.role)}
                      {canManage && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCancelInvitation(invitation._id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              {members.length} {members.length === 1 ? 'member' : 'members'} in your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-gray-600 dark:text-gray-400 py-4 text-center">
                Loading team members...
              </p>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div>
                      <p className="font-medium dark:text-white">
                        {member.name || member.email}
                        {(session?.user as any)?.id === member._id && (
                          <span className="text-xs text-gray-500 ml-2">(you)</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {member.email}
                      </p>
                      {member.lastLoginAt && (
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Last login: {new Date(member.lastLoginAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {member.role === 'owner' ? (
                        getRoleBadge(member.role)
                      ) : canManage && (session?.user as any)?.id !== member._id ? (
                        <select
                          className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                          value={member.role}
                          onChange={(e) =>
                            handleUpdateRole(member._id, e.target.value as 'admin' | 'member')
                          }
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        getRoleBadge(member.role)
                      )}

                      {canManage &&
                        member.role !== 'owner' &&
                        (session?.user as any)?.id !== member._id && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveMember(member._id, member.email)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
