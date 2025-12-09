import { APIGatewayProxyEvent, APIGatewayProxyResult, ScheduledEvent } from 'aws-lambda'

/**
 * Lambda handler for scheduled cron job
 * Triggered by EventBridge (CloudWatch Events) every 1 minute
 */
export async function monitorCron(
  event: ScheduledEvent
): Promise<{ statusCode: number; body: string }> {
  console.log('Cron event triggered:', JSON.stringify(event, null, 2))

  try {
    // Import the monitor function
    const { runMonitorChecks } = await import('../lib/monitor')

    console.log('Starting monitor checks from AWS Lambda cron...')
    const result = await runMonitorChecks()

    console.log('Monitor checks completed:', result)

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Monitor checks completed',
        ...result,
        timestamp: new Date().toISOString(),
      }),
    }
  } catch (error) {
    console.error('Cron job failed:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }),
    }
  }
}

/**
 * Lambda handler for manual HTTP trigger
 * Can be called via API Gateway for manual checks
 */
export async function manualCheck(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  console.log('Manual trigger received:', JSON.stringify(event, null, 2))

  try {
    // Verify authorization if CRON_SECRET is set
    const cronSecret = process.env.CRON_SECRET
    const authHeader = event.headers?.authorization || event.headers?.Authorization

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error('Unauthorized request')
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Unauthorized' }),
      }
    }

    // Import the monitor function
    const { runMonitorChecks } = await import('../lib/monitor')

    console.log('Starting manual monitor checks...')
    const result = await runMonitorChecks()

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Monitor checks completed',
        ...result,
        timestamp: new Date().toISOString(),
      }),
    }
  } catch (error) {
    console.error('Manual check failed:', error)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }),
    }
  }
}
