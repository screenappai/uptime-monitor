# FCM Relay Service for Uptime Monitor

This Firebase Cloud Function acts as a relay service, allowing self-hosted Uptime Monitor backends to send push notifications without exposing Firebase service account credentials.

## Architecture

```
Self-Hosted Backend → FCM Relay → Firebase → User's Mobile Device
```

**Why a relay?**
- Single Play Store app works with all self-hosted instances
- No need to share Firebase service account credentials
- Self-hosters only need a simple API key

## Setup & Deployment

### 1. Prerequisites

- Node.js 18+
- Firebase CLI: `npm install -g firebase-tools`
- Firebase project (the same one used for your mobile app)

### 2. Initialize Firebase

```bash
cd relay
firebase login
firebase init functions
```

Select:
- Use existing project (your Uptime Monitor Firebase project)
- Language: JavaScript
- ESLint: No (or Yes, your choice)
- Install dependencies: Yes

### 3. Set Environment Variables (Optional)

The relay function has a default API key (`uptime-monitor-community-2026`) set in `functions/index.js`.

**For Community Deployment:**
- No setup needed! The default key is already configured in the code.
- Skip to step 4 (Deploy).

**For Custom/Private Deployment:**

To use your own API key:

1. **Create `.env` file:**
   ```bash
   cd functions
   cp .env.example .env
   ```

2. **Edit `.env` and set your custom key:**
   ```bash
   RELAY_API_KEY=your-secure-api-key-here
   ```

3. **Generate a secure API key:**
   ```bash
   # On Linux/Mac/Windows (Git Bash)
   openssl rand -hex 32

   # Or use Node.js
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

**Important Notes:**
- ⚠️ **DO NOT** use `firebase functions:config:set` - it doesn't work with the modern params approach
- ✅ Use `.env` file in `functions/` directory instead
- The `.env` file is automatically loaded during deployment
- Add `functions/.env` to `.gitignore` to avoid committing secrets

### 4. Install Dependencies & Deploy

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

The Firebase CLI will automatically load environment variables from `functions/.env` during deployment.

### 5. Get Your Relay URL

After deployment, you'll see:
```
✔  functions[sendNotification(us-central1)]: Successful create operation.
Function URL (sendNotification): https://us-central1-YOUR-PROJECT.cloudfunctions.net/sendNotification
```

Copy this URL - you'll share it with self-hosters.

## Configuration for Self-Hosters

### Option 1: Use Community Relay (Recommended for most users)

Add to `.env`:
```bash
FCM_RELAY_URL=https://us-central1-uptime-monitor-483415.cloudfunctions.net/sendNotification
FCM_RELAY_API_KEY=uptime-monitor-community-2026
```

### Option 2: Use Your Own Relay

If you deployed your own relay:
```bash
FCM_RELAY_URL=https://us-central1-YOUR-PROJECT.cloudfunctions.net/sendNotification
FCM_RELAY_API_KEY=your-secure-api-key-here
```

### Option 3: Direct FCM (For advanced users with their own Firebase)

Add to `.env`:
```bash
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"...",...}'
```

### Option 4: No Notifications

Don't add any FCM configuration. Push notifications will be disabled.

## API Reference

### POST /sendNotification

Send a push notification to a device.

**Headers:**
```
Content-Type: application/json
X-API-Key: your-relay-api-key
```

**Body:**
```json
{
  "deviceToken": "eXaMpLeToKeN123...",
  "title": "Monitor Down!",
  "body": "example.com is not responding",
  "data": {
    "monitorId": "abc123",
    "type": "monitor_down"
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "messageId": "projects/your-project/messages/0:1234567890"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Invalid device token",
  "code": "messaging/invalid-registration-token"
}
```

## Security & Privacy

### What the relay sees:
- Device tokens (anonymous identifiers)
- Notification content (title, body, data)
- Request metadata (timestamp, IP)

### What the relay does NOT see:
- User credentials or authentication tokens
- Backend URLs or identities (unless you log them)
- Monitor configurations or sensitive data

### Rate Limiting

Firebase free tier includes:
- 125,000 function invocations/day
- 10GB network egress/month

For higher usage, consider:
1. Upgrading to Blaze (pay-as-you-go) plan
2. Implementing rate limiting in the function
3. Asking high-volume users to use direct FCM

## Monitoring & Logs

View logs:
```bash
firebase functions:log
```

Or in Firebase Console → Functions → Logs

## Cost Estimates

**Firebase Free Tier:**
- First 2M invocations/month: Free
- First 400K GB-seconds: Free
- First 200K CPU-seconds: Free

**This should handle ~4,000 notifications/day across all self-hosted instances for free.**

For Blaze plan pricing: https://firebase.google.com/pricing

## Troubleshooting

### Invalid API Key
```json
{ "success": false, "error": "Invalid API key..." }
```
**Solution:** Check that `FCM_RELAY_API_KEY` in backend `.env` matches the deployed function's config.

### Function Not Found (404)
**Solution:** Ensure function is deployed: `firebase deploy --only functions`

### CORS Errors
**Solution:** The function already includes CORS headers. Check browser console for details.

### Invalid Device Token
```json
{ "success": false, "code": "messaging/invalid-registration-token" }
```
**Solution:** Device token expired or invalid. App will get new token on next launch.

## Updating the Relay

1. Edit `functions/index.js`
2. Deploy: `firebase deploy --only functions`
3. No changes needed on self-hosted backends (same URL/API key)

## Community vs Private Keys

You have two options for API key distribution:

### Option A: Single Community Key (Simplest)
- Use one shared API key for all self-hosters
- Document it publicly in your README
- Rely on Firebase free tier + rate limits
- Easy for users, minimal management

### Option B: Individual Keys (More Control)
- Generate unique API keys per user/instance
- Store in Firebase Realtime Database or Firestore
- Update function to validate against database
- Allows usage tracking and revocation
- More work to manage

Example for Option B:
```javascript
// In functions/index.js
const db = admin.firestore();

async function isValidApiKey(key) {
  const doc = await db.collection('api_keys').doc(key).get();
  return doc.exists && doc.data().active === true;
}
```

## Alternative: Self-Service API Keys

Create a simple web page where users can:
1. Sign in with GitHub
2. Auto-generate API key
3. Display relay URL + their key
4. Track their usage (optional)

This reduces manual key distribution work.

## Support

For issues:
- Check Firebase Console → Functions → Logs
- Open issue on GitHub
- Contact via [your support channel]
