import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import ContactListModel from '@/models/ContactList'
import OrganizationModel from '@/models/Organization'
import { requireUniversalAuth, getOrganizationFilter, requireRole } from '@/lib/auth-helpers'
import { z } from 'zod'

const ContactListSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  description: z.string().optional(),
  emails: z.array(z.string().email('Invalid email format')).default([]),
  phones: z.array(z.string()).default([]),
  webhooks: z.array(z.string().url('Invalid webhook URL')).default([]),
})

// GET /api/contact-lists - List contact lists for current organization
export async function GET(request: NextRequest) {
  try {
    const { error, user } = await requireUniversalAuth(request)
    if (error) return error

    await connectDB()

    const contactLists = await ContactListModel.find(getOrganizationFilter(user!))
      .sort({ createdAt: -1 })

    return NextResponse.json({
      success: true,
      data: contactLists,
    })
  } catch (error) {
    console.error('Error fetching contact lists:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch contact lists' },
      { status: 500 }
    )
  }
}

// POST /api/contact-lists - Create a new contact list in current organization
export async function POST(request: NextRequest) {
  try {
    const { error, user } = await requireUniversalAuth(request)
    if (error) return error

    // Only owners and admins can create contact lists
    const roleError = requireRole(user!, ['owner', 'admin'])
    if (roleError) return roleError

    const body = await request.json()
    const validatedData = ContactListSchema.parse(body)

    await connectDB()

    // Check organization limits
    const organization = await OrganizationModel.findById(user!.organizationId)
    const contactListCount = await ContactListModel.countDocuments(
      getOrganizationFilter(user!)
    )

    if (contactListCount >= (organization?.settings.maxContactLists || 3)) {
      return NextResponse.json(
        { success: false, error: 'Contact list limit reached for your plan' },
        { status: 403 }
      )
    }

    const contactList = await ContactListModel.create({
      ...validatedData,
      organizationId: user!.organizationId,
    })

    return NextResponse.json({
      success: true,
      data: contactList,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Error creating contact list:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create contact list' },
      { status: 500 }
    )
  }
}
