import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import MonitorModel from '@/models/Monitor'
import MonitorCheckModel from '@/models/MonitorCheck'
import { calculateUptime, calculateAverageResponseTime } from '@/lib/monitor'
import { requireUniversalAuth, getOrganizationFilter } from '@/lib/auth-helpers'
import mongoose from 'mongoose'

// GET /api/monitors/[id]/stats - Get stats for a monitor (scoped to organization)
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

    const now = new Date()

    // Get checks for different time periods
    const get24hDate = () => {
      const date = new Date(now)
      date.setHours(date.getHours() - 24)
      return date
    }

    const get7dDate = () => {
      const date = new Date(now)
      date.setDate(date.getDate() - 7)
      return date
    }

    const get30dDate = () => {
      const date = new Date(now)
      date.setDate(date.getDate() - 30)
      return date
    }

    const [checks24h, checks7d, checks30d] = await Promise.all([
      MonitorCheckModel.find({
        monitorId: id,
        timestamp: { $gte: get24hDate() },
      }),
      MonitorCheckModel.find({
        monitorId: id,
        timestamp: { $gte: get7dDate() },
      }),
      MonitorCheckModel.find({
        monitorId: id,
        timestamp: { $gte: get30dDate() },
      }),
    ])

    const uptime24h = calculateUptime(checks24h)
    const uptime7d = calculateUptime(checks7d)
    const uptime30d = calculateUptime(checks30d)

    const responseTimes30d = checks30d
      .filter(c => c.success)
      .map(c => c.responseTime)
    const avgResponseTime = calculateAverageResponseTime(responseTimes30d)

    const totalChecks = checks30d.length
    const successfulChecks = checks30d.filter(c => c.success).length
    const failedChecks = totalChecks - successfulChecks

    return NextResponse.json({
      success: true,
      data: {
        monitorId: id,
        uptime24h,
        uptime7d,
        uptime30d,
        avgResponseTime,
        totalChecks,
        successfulChecks,
        failedChecks,
        lastUpdated: now,
      },
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
