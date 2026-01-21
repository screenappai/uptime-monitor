'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ContactListForm from '@/components/ContactListForm'
import ContactListCard from '@/components/ContactListCard'
import { Plus, RefreshCw, ArrowLeft } from 'lucide-react'
import { ContactList } from '@/types'
import Link from 'next/link'

export default function ContactListsPage() {
  const { data: session } = useSession()
  const [contactLists, setContactLists] = useState<ContactList[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const fetchContactLists = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/contact-lists')
      const result = await response.json()

      if (result.success) {
        setContactLists(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch contact lists:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContactLists()
  }, [])

  const handleContactListCreated = () => {
    setShowForm(false)
    fetchContactLists()
  }

  const handleContactListDeleted = () => {
    fetchContactLists()
  }

  const handleContactListUpdated = () => {
    fetchContactLists()
  }

  const totalContacts = contactLists.reduce(
    (acc, list) => acc + list.emails.length + list.phones.length + list.webhooks.length,
    0
  )

  // Check if user can manage (create/edit/delete) resources
  const canManage = session?.user?.role === 'owner' || session?.user?.role === 'admin'

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
              Contact Lists
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              Manage reusable contact lists for monitor alerts
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={fetchContactLists}
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
                <span className="hidden sm:inline">Add Contact List</span>
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="p-4 sm:pb-3">
              <CardDescription className="text-xs sm:text-sm">Total Lists</CardDescription>
              <CardTitle className="text-2xl sm:text-3xl">{contactLists.length}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="p-4 sm:pb-3">
              <CardDescription className="text-xs sm:text-sm">Total Contacts</CardDescription>
              <CardTitle className="text-2xl sm:text-3xl text-blue-600">{totalContacts}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="p-4 sm:pb-3">
              <CardDescription className="text-xs sm:text-sm">Avg per List</CardDescription>
              <CardTitle className="text-2xl sm:text-3xl text-green-600">
                {contactLists.length > 0 ? Math.round(totalContacts / contactLists.length) : 0}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {showForm && canManage && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Create New Contact List</CardTitle>
              <CardDescription>
                Add a reusable list of email addresses, phone numbers, and webhooks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContactListForm
                onSuccess={handleContactListCreated}
                onCancel={() => setShowForm(false)}
              />
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">Loading contact lists...</p>
          </div>
        ) : contactLists.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {canManage
                  ? 'No contact lists yet. Create your first contact list to get started!'
                  : 'No contact lists yet. Ask an admin to create contact lists.'}
              </p>
              {canManage && (
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Contact List
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {contactLists.map((contactList) => (
              <ContactListCard
                key={contactList._id}
                contactList={contactList}
                onDelete={handleContactListDeleted}
                onUpdate={handleContactListUpdated}
                canManage={canManage}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
