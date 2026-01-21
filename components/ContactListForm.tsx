'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { X } from 'lucide-react'
import { ContactList } from '@/types'

interface ContactListFormProps {
  contactList?: ContactList
  onSuccess: () => void
  onCancel: () => void
}

export default function ContactListForm({ contactList, onSuccess, onCancel }: ContactListFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState(contactList?.name || '')
  const [description, setDescription] = useState(contactList?.description || '')
  const [emails, setEmails] = useState<string[]>(contactList?.emails || [])
  const [phones, setPhones] = useState<string[]>(contactList?.phones || [])
  const [webhooks, setWebhooks] = useState<string[]>(contactList?.webhooks || [])

  const [emailInput, setEmailInput] = useState('')
  const [phoneInput, setPhoneInput] = useState('')
  const [webhookInput, setWebhookInput] = useState('')

  const handleAddEmail = () => {
    if (emailInput.trim() && !emails.includes(emailInput.trim())) {
      setEmails([...emails, emailInput.trim()])
      setEmailInput('')
    }
  }

  const handleRemoveEmail = (email: string) => {
    setEmails(emails.filter(e => e !== email))
  }

  const handleAddPhone = () => {
    if (phoneInput.trim() && !phones.includes(phoneInput.trim())) {
      setPhones([...phones, phoneInput.trim()])
      setPhoneInput('')
    }
  }

  const handleRemovePhone = (phone: string) => {
    setPhones(phones.filter(p => p !== phone))
  }

  const handleAddWebhook = () => {
    if (webhookInput.trim() && !webhooks.includes(webhookInput.trim())) {
      setWebhooks([...webhooks, webhookInput.trim()])
      setWebhookInput('')
    }
  }

  const handleRemoveWebhook = (webhook: string) => {
    setWebhooks(webhooks.filter(w => w !== webhook))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const url = contactList
        ? `/api/contact-lists/${contactList._id}`
        : '/api/contact-lists'

      const method = contactList ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          emails,
          phones,
          webhooks,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save contact list')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save contact list')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="On-call team"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Primary on-call contacts for production systems"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>Email Addresses</Label>
        <div className="flex gap-2">
          <Input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddEmail())}
            placeholder="user@example.com"
          />
          <Button type="button" onClick={handleAddEmail} variant="outline">
            Add
          </Button>
        </div>
        {emails.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {emails.map((email, index) => (
              <div
                key={index}
                className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-sm"
              >
                <span>{email}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveEmail(email)}
                  className="hover:text-blue-600 dark:hover:text-blue-200"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Phone Numbers</Label>
        <div className="flex gap-2">
          <Input
            type="tel"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPhone())}
            placeholder="+1234567890"
          />
          <Button type="button" onClick={handleAddPhone} variant="outline">
            Add
          </Button>
        </div>
        {phones.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {phones.map((phone, index) => (
              <div
                key={index}
                className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-3 py-1 rounded-full text-sm"
              >
                <span>{phone}</span>
                <button
                  type="button"
                  onClick={() => handleRemovePhone(phone)}
                  className="hover:text-green-600 dark:hover:text-green-200"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Webhook URLs</Label>
        <div className="flex gap-2">
          <Input
            type="url"
            value={webhookInput}
            onChange={(e) => setWebhookInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddWebhook())}
            placeholder="https://hooks.slack.com/..."
          />
          <Button type="button" onClick={handleAddWebhook} variant="outline">
            Add
          </Button>
        </div>
        {webhooks.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {webhooks.map((webhook, index) => (
              <div
                key={index}
                className="flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-3 py-1 rounded-full text-sm"
              >
                <span className="truncate max-w-[200px]">{webhook}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveWebhook(webhook)}
                  className="hover:text-purple-600 dark:hover:text-purple-200"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : contactList ? 'Update' : 'Create'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
