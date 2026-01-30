import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import MonitorModel from '@/models/Monitor'
import MonitorCheckModel from '@/models/MonitorCheck'
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

    const date24h = new Date(now)
    date24h.setHours(date24h.getHours() - 24)
    const date7d = new Date(now)
    date7d.setDate(date7d.getDate() - 7)
    const date30d = new Date(now)
    date30d.setDate(date30d.getDate() - 30)

    // Single aggregation pipeline computes all stats server-side
    const [stats] = await MonitorCheckModel.aggregate([
      {
        $match: {
          monitorId: id,
          timestamp: { $gte: date30d },
        },
      },
      {
        $group: {
          _id: null,
          totalChecks: { $sum: 1 },
          successfulChecks: {
            $sum: { $cond: ['$success', 1, 0] },
          },
          avgResponseTime: {
            $avg: {
              $cond: ['$success', '$responseTime', null],
            },
          },
          // 7-day stats
          total7d: {
            $sum: { $cond: [{ $gte: ['$timestamp', date7d] }, 1, 0] },
          },
          success7d: {
            $sum: {
              $cond: [
                { $and: [{ $gte: ['$timestamp', date7d] }, '$success'] },
                1,
                0,
              ],
            },
          },
          // 24-hour stats
          total24h: {
            $sum: { $cond: [{ $gte: ['$timestamp', date24h] }, 1, 0] },
          },
          success24h: {
            $sum: {
              $cond: [
                { $and: [{ $gte: ['$timestamp', date24h] }, '$success'] },
                1,
                0,
              ],
            },
          },
        },
      },
    ])

    const totalChecks = stats?.totalChecks ?? 0
    const successfulChecks = stats?.successfulChecks ?? 0
    const failedChecks = totalChecks - successfulChecks
    const avgResponseTime = Math.round(stats?.avgResponseTime ?? 0)
    const uptime24h =
      stats?.total24h > 0
        ? Math.round((stats.success24h / stats.total24h) * 10000) / 100
        : 100
    const uptime7d =
      stats?.total7d > 0
        ? Math.round((stats.success7d / stats.total7d) * 10000) / 100
        : 100
    const uptime30d =
      totalChecks > 0
        ? Math.round((successfulChecks / totalChecks) * 10000) / 100
        : 100

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
