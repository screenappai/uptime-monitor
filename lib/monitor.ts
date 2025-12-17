import axios, { AxiosError } from 'axios'
import { RetryConfig } from '@/types'

export interface MonitorCheckResult {
  success: boolean
  responseTime: number
  statusCode?: number
  error?: string
  timestamp: Date
  attemptNumber?: number
}

export function getRetryConfig(): RetryConfig {
  return {
    retryCount: parseInt(process.env.RETRY_COUNT || '3', 10),
    initialDelay: parseInt(process.env.RETRY_INITIAL_DELAY || '1000', 10),
    multiplier: parseFloat(process.env.RETRY_MULTIPLIER || '2'),
    maxDelay: parseInt(process.env.RETRY_MAX_DELAY || '5000', 10),
  }
}

/**
 * Calculate the delay for the next retry attempt using exponential backoff
 * @param attemptNumber - The current retry attempt number (0-indexed)
 * @param config - Retry configuration
 * @returns Delay in milliseconds
 */
function calculateBackoffDelay(attemptNumber: number, config: RetryConfig): number {
  const delay = config.initialDelay * Math.pow(config.multiplier, attemptNumber)
  return Math.min(delay, config.maxDelay)
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function checkEndpoint(
  url: string,
  timeout: number = 30000
): Promise<MonitorCheckResult> {
  const startTime = Date.now()

  try {
    const response = await axios.get(url, {
      timeout,
      validateStatus: () => true, // Don't throw on any status code
      maxRedirects: 5,
    })

    const responseTime = Date.now() - startTime
    const success = response.status >= 200 && response.status < 400

    return {
      success,
      responseTime,
      statusCode: response.status,
      timestamp: new Date(),
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    const axiosError = error as AxiosError

    return {
      success: false,
      responseTime,
      error: axiosError.message || 'Unknown error',
      statusCode: axiosError.response?.status,
      timestamp: new Date(),
    }
  }
}

/**
 * Enhanced endpoint check with retry logic and exponential backoff
 * Only returns the final result after all retry attempts
 * @param url - The URL to check
 * @param timeout - Request timeout in milliseconds
 * @param config - Retry configuration (uses default if not provided)
 * @returns Final check result after all retries
 */
export async function checkEndpointWithRetry(
  url: string,
  timeout: number = 30000,
  config?: RetryConfig
): Promise<MonitorCheckResult> {
  const retryConfig = config || getRetryConfig()
  const totalAttempts = retryConfig.retryCount + 1
  const overallStartTime = Date.now()

  let lastResult: MonitorCheckResult | null = null

  for (let attempt = 0; attempt < totalAttempts; attempt++) {
    const result = await checkEndpoint(url, timeout)
    lastResult = result

    // Success - return immediately with metadata
    if (result.success) {
      return {
        ...result,
        responseTime: Date.now() - overallStartTime,
        attemptNumber: attempt + 1,
      }
    }

    // Not the last attempt - wait before retry
    if (attempt < totalAttempts - 1) {
      const backoffDelay = calculateBackoffDelay(attempt, retryConfig)
      console.log(
        `Check failed for ${url} (attempt ${attempt + 1}/${totalAttempts}). ` +
        `Retrying in ${backoffDelay}ms...`
      )
      await sleep(backoffDelay)
    }
  }

  // All attempts failed - return last result
  return {
    ...lastResult!,
    responseTime: Date.now() - overallStartTime,
    attemptNumber: totalAttempts,
  }
}

export function shouldSendAlert(
  previousStatus: 'up' | 'down',
  currentSuccess: boolean
): boolean {
  // Send alert when status changes from up to down
  return previousStatus === 'up' && !currentSuccess
}

export function calculateAverageResponseTime(responseTimes: number[]): number {
  if (responseTimes.length === 0) return 0
  return responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
}

export function calculateUptime(checks: { success: boolean }[]): number {
  if (checks.length === 0) return 100
  const successful = checks.filter(c => c.success).length
  return (successful / checks.length) * 100
}

/**
 * Expands contact lists to get all emails, phones, and webhooks
 * Merges with direct alerts and removes duplicates
 */
async function expandContactLists(
  contactListIds: string[] | undefined,
  directAlerts: { email?: string[], phone?: string[], webhook?: string[] } | undefined
) {
  const allEmails = new Set<string>(directAlerts?.email || [])
  const allPhones = new Set<string>(directAlerts?.phone || [])
  const allWebhooks = new Set<string>(directAlerts?.webhook || [])

  try {
    if (contactListIds && contactListIds.length > 0) {
      const ContactList = (await import('@/models/ContactList')).default
      const contactLists = await ContactList.find({ _id: { $in: contactListIds } })

      for (const list of contactLists) {
        if (list.emails) {
          list.emails.forEach((email: string) => allEmails.add(email))
        }
        if (list.phones) {
          list.phones.forEach((phone: string) => allPhones.add(phone))
        }
        if (list.webhooks) {
          list.webhooks.forEach((webhook: string) => allWebhooks.add(webhook))
        }
      }
    }
  } catch (error) {
    console.error('Error expanding contact lists:', error)
    // Continue with direct alerts only if contact list expansion fails
  }

  return {
    emails: Array.from(allEmails),
    phones: Array.from(allPhones),
    webhooks: Array.from(allWebhooks),
  }
}

/**
 * Main function to run monitor checks for all active monitors
 * This can be called from a cron job, API route, or scheduled task
 */
export async function runMonitorChecks() {
  const { connectDB } = await import('./db')
  const Monitor = (await import('@/models/Monitor')).default
  const MonitorCheck = (await import('@/models/MonitorCheck')).default
  const { sendEmailAlert } = await import('./notifications')
  const { sendTwilioCall } = await import('./twilio')

  try {
    await connectDB()

    // Get all active monitors (not paused)
    const monitors = await Monitor.find({
      status: { $in: ['up', 'down'] },
    })

    console.log(`Checking ${monitors.length} active monitors...`)

    const startTime = Date.now()
    const MAX_EXECUTION_TIME = 55000 // 55 seconds safety margin

    for (const monitor of monitors) {
      // Check if we're approaching timeout limit
      if (Date.now() - startTime > MAX_EXECUTION_TIME) {
        console.log('Approaching timeout limit, stopping checks')
        break
      }

      try {
        const now = new Date()
        const lastCheck = monitor.lastCheck ? new Date(monitor.lastCheck) : new Date(0)
        const timeSinceLastCheck = (now.getTime() - lastCheck.getTime()) / 1000 // in seconds

        // Only check if enough time has passed since last check
        if (timeSinceLastCheck >= monitor.interval) {
          console.log(`Checking monitor: ${monitor.name} (${monitor.url})`)

          const checkResult = await checkEndpointWithRetry(
            monitor.url,
            monitor.timeout * 1000
          )

          // Log retry information
          if (checkResult.attemptNumber && checkResult.attemptNumber > 1) {
            console.log(
              `Monitor ${monitor.name}: ${checkResult.success ? 'Succeeded' : 'Failed'} ` +
              `after ${checkResult.attemptNumber} attempts`
            )
          }

          // Save check result
          await MonitorCheck.create({
            monitorId: monitor._id.toString(),
            success: checkResult.success,
            responseTime: checkResult.responseTime,
            statusCode: checkResult.statusCode,
            error: checkResult.error,
            timestamp: checkResult.timestamp,
            attemptNumber: checkResult.attemptNumber,
          })

          // Update monitor status
          const previousStatus = monitor.status
          const newStatus = checkResult.success ? 'up' : 'down'

          await Monitor.findByIdAndUpdate(monitor._id, {
            status: newStatus,
            lastCheck: now,
          })

          console.log(`Monitor ${monitor.name}: ${newStatus} (${checkResult.responseTime}ms)`)

          // Send alerts if status changed from up to down
          if (previousStatus === 'up' && newStatus === 'down') {
            console.log(`Sending alerts for ${monitor.name}`)

            // Expand contact lists and merge with direct alerts
            const expandedContacts = await expandContactLists(monitor.contactLists, monitor.alerts)

            // Send email alerts
            if (expandedContacts.emails.length > 0) {
              for (const email of expandedContacts.emails) {
                try {
                  await sendEmailAlert(
                    monitor.name,
                    monitor.url,
                    checkResult.error || 'Unknown error',
                    email
                  )
                  console.log(`Alert email sent to ${email}`)
                } catch (error) {
                  console.error(`Failed to send email to ${email}:`, error)
                }
              }
            }

            // Send webhook alerts
            if (expandedContacts.webhooks.length > 0) {
              const { sendWebhookAlert } = await import('./notifications')
              for (const webhookUrl of expandedContacts.webhooks) {
                try {
                  await sendWebhookAlert(
                    webhookUrl,
                    monitor.name,
                    monitor.url,
                    checkResult.error || 'Unknown error'
                  )
                  console.log(`Webhook alert sent to ${webhookUrl}`)
                } catch (error) {
                  console.error(`Failed to send webhook to ${webhookUrl}:`, error)
                }
              }
            }

            // Send Twilio phone call alerts
            if (expandedContacts.phones.length > 0) {
              for (const phoneNumber of expandedContacts.phones) {
                try {
                  await sendTwilioCall({
                    to: phoneNumber,
                    monitorName: monitor.name,
                    url: monitor.url,
                    status: 'down',
                  })
                  console.log(`Twilio call alert sent to ${phoneNumber}`)
                } catch (error) {
                  console.error(`Failed to send Twilio call to ${phoneNumber}:`, error)
                }
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error checking monitor ${monitor.name}:`, error)
        // Continue with next monitor even if this one fails
      }
    }

    console.log('Monitor check cycle completed')
    return { success: true, monitorsChecked: monitors.length }
  } catch (error) {
    console.error('Error running monitor checks:', error)
    throw error
  }
}
