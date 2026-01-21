import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import OrganizationModel from '@/models/Organization'
import UserModel from '@/models/User'
import MonitorModel from '@/models/Monitor'
import ContactListModel from '@/models/ContactList'
import { requireUniversalAuth, requireRole, canManageOrganization } from '@/lib/auth-helpers'
import { z } from 'zod'

const updateOrgSchema = z.object({
  name: z.string().min(1).optional(),
})

// GET /api/organization - Get current organization details
export async function GET(request: NextRequest) {
  try {
    const { error, user } = await requireUniversalAuth(request)
    if (error) return error

    await connectDB()

    const organization = await OrganizationModel.findById(user!.organizationId)

    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Count all resources in parallel
    const [memberCount, monitorCount, contactListCount] = await Promise.all([
      UserModel.countDocuments({ organizationId: user!.organizationId }),
      MonitorModel.countDocuments({ organizationId: user!.organizationId }),
      ContactListModel.countDocuments({ organizationId: user!.organizationId }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        ...organization.toObject(),
        memberCount,
        monitorCount,
        contactListCount,
      },
    })
  } catch (error) {
    console.error('Error fetching organization:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch organization' },
      { status: 500 }
    )
  }
}

// PUT /api/organization - Update organization (owner/admin only)
export async function PUT(request: NextRequest) {
  try {
    const { error, user } = await requireUniversalAuth(request)
    if (error) return error

    if (!canManageOrganization(user!)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateOrgSchema.parse(body)

    await connectDB()

    const organization = await OrganizationModel.findByIdAndUpdate(
      user!.organizationId,
      validatedData,
      { new: true }
    )

    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: organization,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Error updating organization:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update organization' },
      { status: 500 }
    )
  }
}
