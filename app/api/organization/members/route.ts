import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import UserModel from '@/models/User'
import { requireUniversalAuth, canManageOrganization, isOwner } from '@/lib/auth-helpers'
import { z } from 'zod'
import mongoose from 'mongoose'

const updateMemberSchema = z.object({
  id: z.string().min(1, 'Member ID is required'),
  role: z.enum(['admin', 'member']),
})

// GET /api/organization/members - List organization members
export async function GET(request: NextRequest) {
  try {
    const { error, user } = await requireUniversalAuth(request)
    if (error) return error

    await connectDB()

    const members = await UserModel.find({
      organizationId: user!.organizationId,
    })
      .select('email name role lastLoginAt createdAt')
      .sort({ createdAt: -1 })

    return NextResponse.json({
      success: true,
      data: members,
    })
  } catch (error) {
    console.error('Error fetching members:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch members' },
      { status: 500 }
    )
  }
}

// PUT /api/organization/members - Update member role
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
    const { id: memberId, role } = updateMemberSchema.parse(body)

    await connectDB()

    // Find the member
    const member = await UserModel.findOne({
      _id: new mongoose.Types.ObjectId(memberId),
      organizationId: user!.organizationId,
    })

    if (!member) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      )
    }

    // Cannot change owner's role
    if (member.role === 'owner') {
      return NextResponse.json(
        { success: false, error: 'Cannot change owner role' },
        { status: 403 }
      )
    }

    // Only owner can promote to admin
    if (role === 'admin' && !isOwner(user!)) {
      return NextResponse.json(
        { success: false, error: 'Only owner can promote to admin' },
        { status: 403 }
      )
    }

    const updatedMember = await UserModel.findByIdAndUpdate(
      memberId,
      { role },
      { new: true }
    ).select('email name role lastLoginAt createdAt')

    return NextResponse.json({
      success: true,
      data: updatedMember,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Error updating member:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update member' },
      { status: 500 }
    )
  }
}

// DELETE /api/organization/members - Remove member
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
    const memberId = searchParams.get('id')

    if (!memberId) {
      return NextResponse.json(
        { success: false, error: 'Member ID is required' },
        { status: 400 }
      )
    }

    await connectDB()

    // Find the member
    const member = await UserModel.findOne({
      _id: new mongoose.Types.ObjectId(memberId),
      organizationId: user!.organizationId,
    })

    if (!member) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      )
    }

    // Cannot remove owner
    if (member.role === 'owner') {
      return NextResponse.json(
        { success: false, error: 'Cannot remove organization owner' },
        { status: 403 }
      )
    }

    // Cannot remove yourself
    if (member._id.toString() === user!.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot remove yourself' },
        { status: 403 }
      )
    }

    await UserModel.findByIdAndDelete(memberId)

    return NextResponse.json({
      success: true,
      message: 'Member removed successfully',
    })
  } catch (error) {
    console.error('Error removing member:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to remove member' },
      { status: 500 }
    )
  }
}
