import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import MonitorModel from '@/models/Monitor'
import { requireUniversalAuth, getOrganizationFilter, requireRole } from '@/lib/auth-helpers'
import { z } from 'zod'
import mongoose from 'mongoose'

const updateMonitorSchema = z.object({
  name: z.string().min(1).optional(),
  url: z.string().url().optional(),
  type: z.enum(['http', 'https']).optional(),
  interval: z.number().min(30).optional(),
  timeout: z.number().min(5).max(60).optional(),
  status: z.enum(['up', 'down', 'paused']).optional(),
  contactLists: z.array(z.string()).optional(),
  alerts: z.object({
    email: z.array(z.string().email()).optional(),
    phone: z.array(z.string()).optional(),
    webhook: z.array(z.string().url()).optional(),
  }).optional(),
})

// GET /api/monitors/[id] - Get a specific monitor (scoped to organization)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, user } = await requireUniversalAuth(request)
    if (error) return error

    const { id } = await params
    await connectDB()

    const monitor = await MonitorModel.findOne({
      _id: new mongoose.Types.ObjectId(id),
      ...getOrganizationFilter(user!),
    })

    if (!monitor) {
      return NextResponse.json(
        { success: false, error: 'Monitor not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: monitor,
    })
  } catch (error) {
    console.error('Error fetching monitor:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch monitor' },
      { status: 500 }
    )
  }
}

// PUT /api/monitors/[id] - Update a monitor (scoped to organization)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, user } = await requireUniversalAuth(request)
    if (error) return error

    // Only owners and admins can update monitors
    const roleError = requireRole(user!, ['owner', 'admin'])
    if (roleError) return roleError

    const { id } = await params
    const body = await request.json()
    const validatedData = updateMonitorSchema.parse(body)

    await connectDB()

    const monitor = await MonitorModel.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        ...getOrganizationFilter(user!),
      },
      { $set: validatedData },
      { new: true, runValidators: true }
    )

    if (!monitor) {
      return NextResponse.json(
        { success: false, error: 'Monitor not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: monitor,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating monitor:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update monitor' },
      { status: 500 }
    )
  }
}

// DELETE /api/monitors/[id] - Delete a monitor (scoped to organization)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, user } = await requireUniversalAuth(request)
    if (error) return error

    // Only owners and admins can delete monitors
    const roleError = requireRole(user!, ['owner', 'admin'])
    if (roleError) return roleError

    const { id } = await params
    await connectDB()

    const monitor = await MonitorModel.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      ...getOrganizationFilter(user!),
    })

    if (!monitor) {
      return NextResponse.json(
        { success: false, error: 'Monitor not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Monitor deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting monitor:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete monitor' },
      { status: 500 }
    )
  }
}
