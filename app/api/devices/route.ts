import { NextRequest, NextResponse } from 'next/server'
import { requireMobileAuth, getOrganizationFilter } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/db'
import DeviceTokenModel from '@/models/DeviceToken'
import { z } from 'zod'

const registerDeviceSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  platform: z.enum(['ios', 'android']),
})

const unregisterDeviceSchema = z.object({
  token: z.string().min(1, 'Token is required'),
})

// POST /api/devices - Register a device token
export async function POST(request: NextRequest) {
  try {
    const { error, user } = await requireMobileAuth(request)
    if (error) return error

    const body = await request.json()
    const validation = registerDeviceSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { token, platform } = validation.data

    await connectDB()

    // Upsert device token with user and organization context
    await DeviceTokenModel.findOneAndUpdate(
      { token },
      {
        token,
        platform,
        isActive: true,
        userId: user!.id,
        organizationId: user!.organizationId,
      },
      { upsert: true, new: true }
    )

    return NextResponse.json({
      success: true,
      message: 'Device registered successfully',
    })
  } catch (error) {
    console.error('Device registration error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to register device' },
      { status: 500 }
    )
  }
}

// DELETE /api/devices - Unregister a device token
export async function DELETE(request: NextRequest) {
  try {
    const { error, user } = await requireMobileAuth(request)
    if (error) return error

    const body = await request.json()
    const validation = unregisterDeviceSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { token } = validation.data

    await connectDB()

    // Mark device as inactive (soft delete) - only if belongs to user
    await DeviceTokenModel.findOneAndUpdate(
      {
        token,
        userId: user!.id,
      },
      { isActive: false }
    )

    return NextResponse.json({
      success: true,
      message: 'Device unregistered successfully',
    })
  } catch (error) {
    console.error('Device unregistration error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to unregister device' },
      { status: 500 }
    )
  }
}

// GET /api/devices - Get all active device tokens for the organization
export async function GET(request: NextRequest) {
  try {
    const { error, user } = await requireMobileAuth(request)
    if (error) return error

    await connectDB()

    // Get devices for the user's organization
    const devices = await DeviceTokenModel.find({
      ...getOrganizationFilter(user!),
      isActive: true,
    })
      .select('token platform userId createdAt updatedAt')
      .sort({ createdAt: -1 })

    return NextResponse.json({
      success: true,
      data: devices,
    })
  } catch (error) {
    console.error('Get devices error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get devices' },
      { status: 500 }
    )
  }
}
