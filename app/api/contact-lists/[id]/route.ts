import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import ContactListModel from '@/models/ContactList'
import { requireUniversalAuth, getOrganizationFilter, requireRole } from '@/lib/auth-helpers'
import { z } from 'zod'
import mongoose from 'mongoose'

const ContactListUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').trim().optional(),
  description: z.string().optional(),
  emails: z.array(z.string().email('Invalid email format')).optional(),
  phones: z.array(z.string()).optional(),
  webhooks: z.array(z.string().url('Invalid webhook URL')).optional(),
})

// GET /api/contact-lists/[id] - Get a specific contact list (scoped to organization)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, user } = await requireUniversalAuth(request)
    if (error) return error

    const { id } = await params
    await connectDB()

    const contactList = await ContactListModel.findOne({
      _id: new mongoose.Types.ObjectId(id),
      ...getOrganizationFilter(user!),
    })

    if (!contactList) {
      return NextResponse.json(
        { success: false, error: 'Contact list not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: contactList,
    })
  } catch (error) {
    console.error('Error fetching contact list:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch contact list' },
      { status: 500 }
    )
  }
}

// PUT /api/contact-lists/[id] - Update a contact list (scoped to organization)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, user } = await requireUniversalAuth(request)
    if (error) return error

    // Only owners and admins can update contact lists
    const roleError = requireRole(user!, ['owner', 'admin'])
    if (roleError) return roleError

    const { id } = await params
    const body = await request.json()
    const validatedData = ContactListUpdateSchema.parse(body)

    await connectDB()

    const contactList = await ContactListModel.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        ...getOrganizationFilter(user!),
      },
      validatedData,
      { new: true, runValidators: true }
    )

    if (!contactList) {
      return NextResponse.json(
        { success: false, error: 'Contact list not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: contactList,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Error updating contact list:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update contact list' },
      { status: 500 }
    )
  }
}

// DELETE /api/contact-lists/[id] - Delete a contact list (scoped to organization)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, user } = await requireUniversalAuth(request)
    if (error) return error

    // Only owners and admins can delete contact lists
    const roleError = requireRole(user!, ['owner', 'admin'])
    if (roleError) return roleError

    const { id } = await params
    await connectDB()

    const contactList = await ContactListModel.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      ...getOrganizationFilter(user!),
    })

    if (!contactList) {
      return NextResponse.json(
        { success: false, error: 'Contact list not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Contact list deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting contact list:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete contact list' },
      { status: 500 }
    )
  }
}
