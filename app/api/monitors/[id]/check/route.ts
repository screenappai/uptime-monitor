import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import MonitorModel from '@/models/Monitor'
import MonitorCheckModel from '@/models/MonitorCheck'
import { checkEndpointWithRetry } from '@/lib/monitor'
import { sendEmailAlert, sendWebhookAlert } from '@/lib/notifications'

// POST /api/monitors/[id]/check - Manually trigger a check
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await connectDB()

    const monitor = await MonitorModel.findById(id)

    if (!monitor) {
      return NextResponse.json(
        { success: false, error: 'Monitor not found' },
        { status: 404 }
      )
    }

    // Perform the check
    const checkResult = await checkEndpointWithRetry(monitor.url, monitor.timeout * 1000)

    // Save check result
    await MonitorCheckModel.create({
      monitorId: id,
      ...checkResult,
    })

    // Update monitor status
    const previousStatus = monitor.status
    const newStatus = checkResult.success ? 'up' : 'down'

    await MonitorModel.findByIdAndUpdate(id, {
      status: newStatus,
      lastCheck: new Date(),
    })

    // Send alerts if status changed from up to down
    if (previousStatus === 'up' && newStatus === 'down') {
      // Send email alerts
      if (monitor.alerts?.email) {
        for (const email of monitor.alerts.email) {
          try {
            await sendEmailAlert(
              monitor.name,
              monitor.url,
              checkResult.error || 'Check failed',
              email
            )
          } catch (error) {
            console.error('Failed to send email alert:', error)
          }
        }
      }

      // Send webhook alerts
      if (monitor.alerts?.webhook) {
        for (const webhook of monitor.alerts.webhook) {
          try {
            await sendWebhookAlert(
              webhook,
              monitor.name,
              monitor.url,
              checkResult.error || 'Check failed'
            )
          } catch (error) {
            console.error('Failed to send webhook alert:', error)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        checkResult,
        previousStatus,
        currentStatus: newStatus,
      },
    })
  } catch (error) {
    console.error('Error performing check:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to perform check' },
      { status: 500 }
    )
  }
}
