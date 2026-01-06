import * as admin from 'firebase-admin'
import DeviceTokenModel from '@/models/DeviceToken'
import { connectDB } from '@/lib/db'

// FCM Configuration Type
type FCMConfig =
  | { type: 'direct'; app: admin.app.App }
  | { type: 'relay'; url: string; apiKey: string }
  | { type: 'disabled' }

// Initialize Firebase Admin SDK for direct FCM
function initializeFirebase(): admin.app.App | null {
  if (admin.apps.length > 0) {
    return admin.apps[0]
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT

  if (!serviceAccountJson) {
    return null
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountJson)
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    })
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error)
    return null
  }
}

// Determine FCM configuration
function getFCMConfig(): FCMConfig {
  // Option 1: Direct FCM (if service account is configured)
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT
  if (serviceAccountJson) {
    const app = initializeFirebase()
    if (app) {
      console.log('✓ FCM: Using direct Firebase connection')
      return { type: 'direct', app }
    }
  }

  // Option 2: Relay (if relay URL and API key are configured)
  const relayUrl = process.env.FCM_RELAY_URL
  const relayApiKey = process.env.FCM_RELAY_API_KEY
  if (relayUrl && relayApiKey) {
    console.log('✓ FCM: Using relay service at', relayUrl)
    return { type: 'relay', url: relayUrl, apiKey: relayApiKey }
  }

  // Option 3: Disabled
  console.warn('⚠ FCM: Push notifications disabled (no Firebase service account or relay configured)')
  return { type: 'disabled' }
}

export async function getActiveDeviceTokens(): Promise<string[]> {
  try {
    await connectDB()
    const devices = await DeviceTokenModel.find({ isActive: true }).select('token')
    return devices.map(device => device.token)
  } catch (error) {
    console.error('Failed to get active device tokens:', error)
    return []
  }
}

// Send via relay service
async function sendViaRelay(
  token: string,
  title: string,
  body: string,
  data: Record<string, string> | undefined,
  relayUrl: string,
  apiKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(relayUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({
        deviceToken: token,
        title,
        body,
        data: data || {},
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return { success: false, error: `Relay returned ${response.status}: ${errorText}` }
    }

    const result = await response.json()
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function sendPushNotification(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  if (tokens.length === 0) {
    console.log('No device tokens to send push notification to')
    return
  }

  const config = getFCMConfig()

  if (config.type === 'disabled') {
    console.warn('FCM disabled. Skipping push notification.')
    return
  }

  // Direct FCM
  if (config.type === 'direct') {
    try {
      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title,
          body,
        },
        data,
        android: {
          priority: 'high',
          notification: {
            channelId: 'monitor_alerts',
            priority: 'high',
            defaultSound: true,
            defaultVibrateTimings: true,
          },
        },
        apns: {
          payload: {
            aps: {
              alert: { title, body },
              sound: 'default',
              badge: 1,
            },
          },
          headers: {
            'apns-priority': '10',
          },
        },
      }

      const response = await admin.messaging().sendEachForMulticast(message)

      console.log(`Push notification sent (direct): ${response.successCount} successful, ${response.failureCount} failed`)

      // Handle failed tokens (mark as inactive)
      if (response.failureCount > 0) {
        const failedTokens: string[] = []
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const errorCode = resp.error?.code
            if (
              errorCode === 'messaging/registration-token-not-registered' ||
              errorCode === 'messaging/invalid-registration-token'
            ) {
              failedTokens.push(tokens[idx])
            }
          }
        })

        if (failedTokens.length > 0) {
          await connectDB()
          await DeviceTokenModel.updateMany(
            { token: { $in: failedTokens } },
            { isActive: false }
          )
          console.log(`Marked ${failedTokens.length} invalid tokens as inactive`)
        }
      }
    } catch (error) {
      console.error('Failed to send push notification (direct):', error)
    }
  }

  // Relay FCM
  if (config.type === 'relay') {
    let successCount = 0
    let failureCount = 0
    const failedTokens: string[] = []

    // Send to each token individually via relay
    for (const token of tokens) {
      const result = await sendViaRelay(token, title, body, data, config.url, config.apiKey)

      if (result.success) {
        successCount++
      } else {
        failureCount++
        console.error(`Failed to send via relay to token ${token.substring(0, 10)}...: ${result.error}`)

        // Mark token as inactive if it's invalid
        if (result.error?.includes('invalid') || result.error?.includes('not-registered')) {
          failedTokens.push(token)
        }
      }
    }

    console.log(`Push notification sent (relay): ${successCount} successful, ${failureCount} failed`)

    // Mark failed tokens as inactive
    if (failedTokens.length > 0) {
      await connectDB()
      await DeviceTokenModel.updateMany(
        { token: { $in: failedTokens } },
        { isActive: false }
      )
      console.log(`Marked ${failedTokens.length} invalid tokens as inactive`)
    }
  }
}

export async function sendMonitorDownPush(
  monitorId: string,
  monitorName: string,
  url: string,
  error: string
): Promise<void> {
  const tokens = await getActiveDeviceTokens()

  await sendPushNotification(
    tokens,
    `🚨 ${monitorName} is DOWN`,
    `${url} - ${error}`,
    {
      type: 'monitor_down',
      monitorId,
      monitorName,
      url,
      error,
      timestamp: new Date().toISOString(),
    }
  )
}

export async function sendMonitorRecoveryPush(
  monitorId: string,
  monitorName: string,
  url: string
): Promise<void> {
  const tokens = await getActiveDeviceTokens()

  await sendPushNotification(
    tokens,
    `✅ ${monitorName} is UP`,
    `${url} has recovered and is now operational`,
    {
      type: 'monitor_recovery',
      monitorId,
      monitorName,
      url,
      timestamp: new Date().toISOString(),
    }
  )
}
