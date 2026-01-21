import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import MonitorModel from '@/models/Monitor'
import MonitorCheckModel from '@/models/MonitorCheck'
import { requireUniversalAuth, getOrganizationFilter } from '@/lib/auth-helpers'
import mongoose from 'mongoose'

// GET /api/monitors/[id]/checks - Get checks for a monitor (scoped to organization)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, user } = await requireUniversalAuth(request)
    if (error) return error

    const { id } = await params
    await connectDB()

    // Verify monitor belongs to user's organization
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

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')

    let startDate: Date
    let endDate: Date | undefined

    // Check if custom date range is provided
    const customStartDate = searchParams.get('startDate')
    const customEndDate = searchParams.get('endDate')

    if (customStartDate && customEndDate) {
      startDate = new Date(customStartDate)
      endDate = new Date(customEndDate)
    } else {
      const hours = parseInt(searchParams.get('hours') || '24')
      startDate = new Date()
      startDate.setHours(startDate.getHours() - hours)
    }

    const query: Record<string, unknown> = {
      monitorId: id,
      timestamp: { $gte: startDate } as Record<string, Date>,
    }

    if (endDate) {
      (query.timestamp as Record<string, Date>).$lte = endDate
    }

    const checks = await MonitorCheckModel.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)

    return NextResponse.json({
      success: true,
      data: checks,
    })
  } catch (error) {
    console.error('Error fetching checks:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch checks' },
      { status: 500 }
    )
  }
}
