'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2, Edit, ChevronDown, ChevronUp } from 'lucide-react'
import { ContactList } from '@/types'
import ContactListForm from './ContactListForm'

interface ContactListCardProps {
  contactList: ContactList
  onDelete: () => void
  onUpdate: () => void
  canManage?: boolean
}

export default function ContactListCard({ contactList, onDelete, onUpdate, canManage = true }: ContactListCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete contact list "${contactList.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/contact-lists/${contactList._id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        onDelete()
      }
    } catch (error) {
      console.error('Failed to delete contact list:', error)
    }
  }

  const handleEditSuccess = () => {
    setIsEditing(false)
    onUpdate()
  }

  const totalContacts = contactList.emails.length + contactList.phones.length + contactList.webhooks.length

  if (isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Edit Contact List</CardTitle>
        </CardHeader>
        <CardContent>
          <ContactListForm
            contactList={contactList}
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
              <CardTitle className="text-base sm:text-xl truncate">{contactList.name}</CardTitle>
              <Badge variant="outline">{totalContacts} contacts</Badge>
            </div>
            {contactList.description && (
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                {contactList.description}
              </p>
            )}
          </div>

          {canManage && (
            <div className="flex gap-1.5 sm:gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
                title="Edit"
                className="h-8 w-8 p-0 sm:h-9 sm:w-9"
              >
                <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>

              <Button
                size="sm"
                variant="destructive"
                onClick={handleDelete}
                title="Delete"
                className="h-8 w-8 p-0 sm:h-9 sm:w-9"
              >
                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
        <div
          className="flex flex-wrap items-center justify-between gap-2 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
            {contactList.emails.length > 0 && (
              <span className="text-gray-600 dark:text-gray-400">
                {contactList.emails.length} email{contactList.emails.length > 1 ? 's' : ''}
              </span>
            )}
            {contactList.phones.length > 0 && (
              <span className="text-gray-600 dark:text-gray-400">
                {contactList.phones.length} phone{contactList.phones.length > 1 ? 's' : ''}
              </span>
            )}
            {contactList.webhooks.length > 0 && (
              <span className="text-gray-600 dark:text-gray-400">
                {contactList.webhooks.length} webhook{contactList.webhooks.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <button
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {expanded && (
          <div className="mt-3 space-y-2 text-xs sm:text-sm">
            {contactList.emails.length > 0 && (
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Email Addresses:</p>
                <ul className="list-disc list-inside space-y-0.5 text-gray-600 dark:text-gray-400">
                  {contactList.emails.map((email, index) => (
                    <li key={index} className="truncate">{email}</li>
                  ))}
                </ul>
              </div>
            )}
            {contactList.phones.length > 0 && (
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Numbers:</p>
                <ul className="list-disc list-inside space-y-0.5 text-gray-600 dark:text-gray-400">
                  {contactList.phones.map((phone, index) => (
                    <li key={index}>{phone}</li>
                  ))}
                </ul>
              </div>
            )}
            {contactList.webhooks.length > 0 && (
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Webhook URLs:</p>
                <ul className="list-disc list-inside space-y-0.5 text-gray-600 dark:text-gray-400">
                  {contactList.webhooks.map((webhook, index) => (
                    <li key={index} className="truncate">{webhook}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
