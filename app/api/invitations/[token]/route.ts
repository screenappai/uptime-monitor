import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import InvitationModel from '@/models/Invitation'
import OrganizationModel from '@/models/Organization'
import UserModel from '@/models/User'

// GET /api/invitations/[token] - Get invitation details (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    await connectDB()

    const invitation = await InvitationModel.findOne({
      token,
      expiresAt: { $gt: new Date() },
      acceptedAt: null,
    })

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired invitation' },
        { status: 404 }
      )
    }

    const organization = await OrganizationModel.findById(invitation.organizationId)
    const inviter = await UserModel.findById(invitation.invitedBy)

    return NextResponse.json({
      success: true,
      data: {
        email: invitation.email,
        organizationName: organization?.name || 'Organization',
        role: invitation.role,
        inviterName: inviter?.name || inviter?.email || 'A team member',
      },
    })
  } catch (error) {
    console.error('Error fetching invitation:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invitation' },
      { status: 500 }
    )
  }
}
