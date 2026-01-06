const { onRequest } = require('firebase-functions/v2/https');
const { defineString } = require('firebase-functions/params');
const admin = require('firebase-admin');

// Define environment parameters (modern approach)
const relayApiKey = defineString('RELAY_API_KEY', {
  description: 'API key for FCM relay service',
  default: 'uptime-monitor-community-2026',
});

// Initialize Firebase Admin SDK
admin.initializeApp();

/**
 * FCM Relay Service for Uptime Monitor
 *
 * Allows self-hosted backends to send push notifications
 * without exposing Firebase service account credentials.
 *
 * POST /sendNotification
 * Headers:
 *   X-API-Key: <relay-api-key>
 * Body:
 *   {
 *     "deviceToken": "FCM device token",
 *     "title": "Notification title",
 *     "body": "Notification body",
 *     "data": { "key": "value" } // optional
 *   }
 */
exports.sendNotification = onRequest(async (req, res) => {
  // CORS headers (allow self-hosted backends to call)
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    });
  }

  // Validate API key
  const apiKey = req.headers['x-api-key'];
  const validKey = relayApiKey.value();

  if (!apiKey || apiKey !== validKey) {
    console.warn('Invalid API key attempt:', {
      key: apiKey?.substring(0, 10) + '...',
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });

    return res.status(401).json({
      success: false,
      error: 'Invalid API key. Request access at: https://github.com/yourrepo/uptime-monitor/issues'
    });
  }

  // Validate request body
  const { deviceToken, title, body, data } = req.body;

  if (!deviceToken || typeof deviceToken !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Missing or invalid "deviceToken" field'
    });
  }

  if (!title || typeof title !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Missing or invalid "title" field'
    });
  }

  if (!body || typeof body !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Missing or invalid "body" field'
    });
  }

  // Build notification message
  const message = {
    token: deviceToken,
    notification: {
      title: title,
      body: body,
    },
    data: data || {},
    android: {
      priority: 'high',
      notification: {
        channelId: 'monitor_alerts',
        priority: 'high',
        sound: 'default',
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
  };

  // Send notification
  try {
    const response = await admin.messaging().send(message);

    console.log('Notification sent successfully:', {
      messageId: response,
      title: title.substring(0, 50),
      timestamp: new Date().toISOString(),
    });

    return res.json({
      success: true,
      messageId: response
    });

  } catch (error) {
    console.error('Error sending notification:', {
      error: error.message,
      code: error.code,
      title: title.substring(0, 50),
      timestamp: new Date().toISOString(),
    });

    // Handle specific FCM errors
    if (error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered') {
      return res.status(400).json({
        success: false,
        error: 'Invalid or unregistered device token',
        code: error.code,
      });
    }

    return res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
    });
  }
});

/**
 * Health check endpoint
 */
exports.health = onRequest((req, res) => {
  res.json({
    status: 'ok',
    service: 'uptime-monitor-fcm-relay',
    timestamp: new Date().toISOString(),
  });
});
