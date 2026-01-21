import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import InvitationModel from '@/models/Invitation'
import UserModel from '@/models/User'
import OrganizationModel from '@/models/Organization'
import { requireUniversalAuth, canManageOrganization } from '@/lib/auth-helpers'
import { sendInvitationEmail } from '@/lib/email'
import { z } from 'zod'
import crypto from 'crypto'
import mongoose from 'mongoose'

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member']).default('member'),
})

// GET /api/organization/invitations - List pending invitations
export async function GET(request: NextRequest) {
  try {
    const { error, user } = await requireUniversalAuth(request)
    if (error) return error

    await connectDB()

    const invitations = await InvitationModel.find({
      organizationId: user!.organizationId,
      expiresAt: { $gt: new Date() },
      acceptedAt: null,
    })
      .populate('invitedBy', 'name email')
      .sort({ createdAt: -1 })

    return NextResponse.json({
      success: true,
      data: invitations,
    })
  } catch (error) {
    console.error('Error fetching invitations:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invitations' },
      { status: 500 }
    )
  }
}

// POST /api/organization/invitations - Send invitation (owner/admin only)
export async function POST(request: NextRequest) {
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
    const { email, role } = inviteSchema.parse(body)
    const normalizedEmail = email.toLowerCase()

    await connectDB()

    // Check organization member limits
    const organization = await OrganizationModel.findById(user!.organizationId)
    const memberCount = await UserModel.countDocuments({
      organizationId: user!.organizationId,
    })

    if (memberCount >= (organization?.settings.maxMembers || 1)) {
      return NextResponse.json(
        { success: false, error: 'Member limit reached for your plan' },
        { status: 403 }
      )
    }

    // Check if user already exists in any organization
    const existingUser = await UserModel.findOne({
      email: normalizedEmail,
    })

    if (existingUser) {
      const isSameOrg = existingUser.organizationId.toString() === user!.organizationId
      return NextResponse.json(
        {
          success: false,
          error: isSameOrg
            ? 'User is already a member of this organization'
            : 'User already belongs to another organization'
        },
        { status: 400 }
      )
    }

    // Check for pending invitation
    const existingInvite = await InvitationModel.findOne({
      email: normalizedEmail,
      organizationId: user!.organizationId,
      expiresAt: { $gt: new Date() },
      acceptedAt: null,
    })

    if (existingInvite) {
      return NextResponse.json(
        { success: false, error: 'Invitation already pending' },
        { status: 400 }
      )
    }

    // Create invitation
    const token = crypto.randomBytes(32).toString('hex')
    const invitation = await InvitationModel.create({
      email: normalizedEmail,
      organizationId: user!.organizationId,
      role,
      invitedBy: user!.id,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    })

    // Get inviter info (organization already fetched above for limit check)
    const inviter = await UserModel.findById(user!.id)

    // Send invitation email
    const inviteUrl = `${process.env.NEXTAUTH_URL}/invite/${token}`
    await sendInvitationEmail(
      normalizedEmail,
      organization?.name || 'Organization',
      inviter?.name || inviter?.email || 'A team member',
      inviteUrl
    )

    return NextResponse.json({
      success: true,
      data: invitation,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Error sending invitation:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send invitation' },
      { status: 500 }
    )
  }
}

// DELETE /api/organization/invitations - Cancel invitation
export async function DELETE(request: NextRequest) {
  try {
    const { error, user } = await requireUniversalAuth(request)
    if (error) return error

    if (!canManageOrganization(user!)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const invitationId = searchParams.get('id')

    if (!invitationId) {
      return NextResponse.json(
        { success: false, error: 'Invitation ID is required' },
        { status: 400 }
      )
    }

    await connectDB()

    const invitation = await InvitationModel.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(invitationId),
      organizationId: user!.organizationId,
    })

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: 'Invitation not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation cancelled',
    })
  } catch (error) {
    console.error('Error cancelling invitation:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to cancel invitation' },
      { status: 500 }
    )
  }
}
