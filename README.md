# Uptime Monitor

An open-source uptime monitoring system built with Next.js, MongoDB, and TypeScript. Monitor your websites and services with real-time uptime tracking, alerts, and beautiful public status pages.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.0-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-8.0-green)
[![Discord](https://img.shields.io/discord/1234567890?color=7289da&label=Discord&logo=discord&logoColor=white)](https://discord.gg/frS8QgUygn)
[![Get it on Google Play](https://img.shields.io/badge/Google_Play-414141?style=flat&logo=google-play&logoColor=white)](https://play.google.com/store/apps/details?id=io.screenapp.uptime_monitor_mobile)

## Components

This project consists of three main components:

- **Server** (root directory) - Next.js web dashboard + API backend
- **[Mobile App](./mobile/README.md)** - Flutter mobile app for Android/iOS with push notifications
  - 📱 [Download on Google Play](https://play.google.com/store/apps/details?id=io.screenapp.uptime_monitor_mobile)
- **[Relay](./relay/README.md)** - FCM relay service for push notifications

> **📖 For detailed setup, configuration, and development guides for each component, please refer to their respective README files linked above.**

## Features

- **HTTP/HTTPS Monitoring** - Monitor any HTTP or HTTPS endpoint with customizable check intervals
- **Real-time Alerts** - Get notified via email, webhooks, or phone calls when your services go down
- **Mobile App** - Native Flutter app for Android/iOS with push notifications ([Download on Google Play](https://play.google.com/store/apps/details?id=io.screenapp.uptime_monitor_mobile))
- **Public Status Pages** - Create beautiful, branded status pages for your services
- **Historical Analytics** - Track uptime percentages and response times over 24h, 7d, and 30d periods
- **Response Time Tracking** - Visualize response times with interactive charts (red dots for failures)
- **Incident Reports** - Automatic incident detection and tracking
- **Contact Lists** - Organize alert recipients into reusable contact lists
- **Self-hosted** - Full control over your monitoring data
- **Open Source** - MIT licensed, contribute and customize freely

## How Monitoring Works

The monitoring system uses a **unified API-based architecture** for maximum flexibility:

**Core API Endpoint:** `/api/cron/monitor`
- Fetches all active monitors from MongoDB
- Checks each endpoint sequentially
- Saves check results with response time and status
- Sends alerts (email/webhook/phone) when status changes from up → down

**Cron Triggers** (choose based on your deployment):

| Deployment | Trigger Method | How it Works |
|-----------|----------------|--------------|
| **Docker (Dev)** | `cron-monitor.sh` | Shell script calls API every minute via curl |
| **AWS Lambda** | EventBridge | Lambda function calls API every minute |
| **Vercel** | Vercel Cron | Built-in cron calls API every minute |
| **Manual** | System Cron | Your own cron job calls API endpoint |

**Benefits of API-based approach:**
- ✅ Single source of truth - all monitoring logic in Next.js app
- ✅ Easy to test - just call the API endpoint
- ✅ Flexible deployment - works with any cron service
- ✅ No code duplication - same logic everywhere
- ✅ Simple debugging - check API logs, not scattered cron logs

**Visual Feedback:**
- Response time charts show green dots for successful checks
- Red dots indicate failures, making issues easy to spot
- Hover over dots to see exact response time and status

## Screenshots

### Web Dashboard
The main dashboard shows all your monitors at a glance with status indicators and uptime statistics.

![Dashboard](https://download.meetrix.io/uptimemonitor/uptimemonitor-dashboard.png)

### Monitor Details
Detailed view of each monitor with response time charts and flexible time range controls.

![Monitor Details](https://download.meetrix.io/uptimemonitor/uptimemonitor-stats.png)

### Mobile App

Monitor your services on the go with the native mobile app. [Download on Google Play](https://play.google.com/store/apps/details?id=io.screenapp.uptime_monitor_mobile)

<p float="left">
  <img src="https://download.meetrix.io/uptimemonitor/android/dashboard.jpg" width="200" alt="Mobile Dashboard" />
  <img src="https://download.meetrix.io/uptimemonitor/android/monitor-details.jpg" width="200" alt="Monitor Details" />
  <img src="https://download.meetrix.io/uptimemonitor/android/stats.jpg" width="200" alt="Stats & Analytics" />
  <img src="https://download.meetrix.io/uptimemonitor/android/response-chart.jpg" width="200" alt="Response Time Chart" />
</p>

**Features:**
- Real-time monitor status at a glance
- Push notifications for downtime alerts
- Detailed uptime statistics (24h, 7d, 30d)
- Interactive response time charts
- Monitor configuration and management

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: NextAuth.js with credentials provider
- **UI Components**: shadcn/ui
- **Charts**: Recharts
- **Email**: Nodemailer
- **Alerts**: Nodemailer (email), Twilio (phone), Webhooks
- **Monitoring**: API-based cron architecture

## Getting Started

### 🚀 Quick Start with Docker (Recommended)

The easiest way to get started - one command starts everything!

**Prerequisites:** Docker and Docker Compose installed

**1. Clone and configure:**
```bash
git clone https://github.com/screenappai/uptime-monitor.git
cd uptime-monitor
cp .env.example .env
# Edit .env with your credentials
```

**2. Start everything:**
```bash
docker compose up
```

That's it! 🎉 This single command starts:
- ✅ MongoDB database
- ✅ Next.js application with hot reload
- ✅ Background monitoring service
- ✅ Mailpit (local email testing)

**Access:**
- App: http://localhost:3200
- Mailpit (view emails): http://localhost:8027

**Why Docker Compose?**
- 📦 No need to install MongoDB separately
- 🔄 Everything in sync - one command to rule them all
- 🧹 Clean environment - no conflicts with other projects
- 🚀 Same setup for all developers

---

### Manual Installation (Alternative)

If you prefer to run without Docker:

**Prerequisites:**
- Node.js 18+ and npm
- MongoDB instance (local or cloud like MongoDB Atlas)
- SMTP server credentials (for email alerts)

**Steps:**

1. Clone the repository:
```bash
git clone https://github.com/screenappai/uptime-monitor.git
cd uptime-monitor
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/uptime-monitor

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3200

# Authentication Configuration
NEXTAUTH_URL=http://localhost:3200
NEXTAUTH_SECRET=your-random-secret-key-here-change-this-in-production
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password-here

# Email Configuration (for alerts)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@uptimemonitor.com

# Twilio Configuration (optional - for phone call alerts)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Monitoring Configuration
MONITOR_INTERVAL_SECONDS=60
MONITOR_TIMEOUT_SECONDS=30

# Optional: API Key
API_SECRET_KEY=your-secret-key-here
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3200](http://localhost:3200) in your browser

7. **Monitoring in Manual Setup:**

For manual installation, you have two options:

**Option A: Use Docker for monitoring only** (Recommended)
```bash
# Start just the monitor service
docker compose up monitor
```

**Option B: Set up external cron**
Create a cron job that calls your API endpoint:
```bash
# Example: Add to crontab (Linux/Mac)
* * * * * curl -X GET http://localhost:3200/api/cron/monitor -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Note:** All monitoring logic runs through the `/api/cron/monitor` API endpoint

## Authentication Setup

The application uses NextAuth.js for authentication to protect the dashboard and management APIs.

### Quick Setup

1. **Generate NextAuth Secret**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output and set it as `NEXTAUTH_SECRET` in your `.env` file.

2. **Set Admin Credentials**:

**Option A: Plain Text (Quick Setup - Development Only)**
```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=mySecurePassword123
```

**Option B: Hashed Password (Recommended for Production)**
```bash
node scripts/hash-password.js mySecurePassword123
```
Copy the generated hash and use it as `ADMIN_PASSWORD` in your `.env` file:
```env
ADMIN_PASSWORD=$2b$10$... (the full hash)
```

### Accessing the Dashboard

1. Navigate to `http://localhost:3200`
2. Click "Go to Dashboard"
3. You'll be redirected to the login page at `/login`
4. Enter your admin credentials
5. After successful login, you'll access the dashboard

### Protected Routes

- `/dashboard/*` - All dashboard pages (requires authentication)
- `/api/monitors/*` - Monitor management APIs (requires authentication)
- `/api/status-pages/*` - Status page management APIs (requires authentication)

### Public Routes

- `/` - Landing page (public)
- `/login` - Login page (public)
- `/status/[slug]` - Public status pages (public)
- `/api/status-pages/[slug]` - Status page API for public viewing (GET only, public)

### Security Best Practices

- Always use HTTPS in production (set `NEXTAUTH_URL` to your HTTPS domain)
- Use strong passwords (minimum 12 characters with mixed case, numbers, and symbols)
- Never commit `.env` file to version control
- Use bcrypt hashed passwords in production
- Rotate `NEXTAUTH_SECRET` periodically

## Push Notifications Setup (Optional)

The mobile app supports push notifications for monitor alerts. You have three options:

### Option 1: Community Relay (Recommended - No Setup Required)

Use the shared community FCM relay service. Add to `.env`:

```env
FCM_RELAY_URL=https://us-central1-uptime-monitor-483415.cloudfunctions.net/sendNotification
FCM_RELAY_API_KEY=uptime-monitor-community-2026
```

**Pros:**
- ✅ Zero configuration - works immediately
- ✅ No Firebase account needed
- ✅ Free community service

**Cons:**
- ⚠️ Shared infrastructure (rate limits apply)
- ⚠️ Community service availability dependent on project maintainer

### Option 2: Direct Firebase (Advanced)

Use your own Firebase project for full control.

**Steps to generate FIREBASE_SERVICE_ACCOUNT:**

1. **Create Firebase Project:**
   - Go to https://console.firebase.google.com
   - Click "Add project" and follow the wizard

2. **Generate Service Account Key:**
   - In Firebase Console, go to **Project Settings** (gear icon) → **Service accounts**
   - Click **"Generate new private key"**
   - Click **"Generate key"** - a JSON file will download

3. **Configure Environment Variable:**

   Open the downloaded JSON file and copy its entire contents. Add to `.env`:

   ```env
   FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'
   ```

   **Important:** Wrap the entire JSON in single quotes and keep it on one line.

4. **Build Custom Mobile App:**
   - You'll need to build your own version of the mobile app
   - Add your `google-services.json` to the Flutter project
   - See [mobile/README.md](./mobile/README.md) for details

**Pros:**
- ✅ Full control over infrastructure
- ✅ No rate limit concerns
- ✅ Better for high-volume deployments

**Cons:**
- ⚠️ Requires Firebase account
- ⚠️ Requires building custom mobile app
- ⚠️ More complex setup

### Option 3: Deploy Your Own Relay

Deploy your own FCM relay service. See [relay/README.md](./relay/README.md) for setup instructions.

### Option 4: No Notifications

Don't configure any FCM settings - push notifications will be disabled.

## Usage

### Creating a Monitor

1. Navigate to the dashboard at `http://localhost:3200/dashboard`
2. Click "Add Monitor"
3. Fill in the monitor details:
   - **Name**: A friendly name for your monitor
   - **URL**: The endpoint to monitor
   - **Type**: HTTP or HTTPS
   - **Interval**: How often to check (minimum 30 seconds)
   - **Timeout**: Maximum time to wait for a response
   - **Alert Emails**: Comma-separated list of email addresses
   - **Phone Numbers**: Comma-separated list of phone numbers (with country code, e.g., +1234567890)
   - **Webhook URLs**: Comma-separated list of webhook URLs

### Creating a Status Page

1. Create a status page via API:
```bash
curl -X POST http://localhost:3200/api/status-pages \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "my-services",
    "title": "My Services Status",
    "description": "Current status of all our services",
    "monitors": ["monitor-id-1", "monitor-id-2"],
    "branding": {
      "primaryColor": "#3b82f6"
    }
  }'
```

2. Access your status page at `http://localhost:3200/status/my-services`

### API Endpoints

#### Monitors

- `GET /api/monitors` - List all monitors
- `POST /api/monitors` - Create a new monitor
- `GET /api/monitors/:id` - Get a specific monitor
- `PUT /api/monitors/:id` - Update a monitor
- `DELETE /api/monitors/:id` - Delete a monitor
- `GET /api/monitors/:id/checks` - Get check history
- `GET /api/monitors/:id/stats` - Get uptime statistics
- `POST /api/monitors/:id/check` - Trigger manual check

#### Status Pages

- `GET /api/status-pages` - List all status pages
- `POST /api/status-pages` - Create a new status page
- `GET /api/status-pages/:slug` - Get a status page with monitor data

## Email Configuration

For Gmail:
1. Enable 2-factor authentication
2. Create an App Password at https://myaccount.google.com/apppasswords
3. Use the app password in `EMAIL_PASSWORD`

For other providers, use their SMTP settings.

## Twilio Phone Call Alerts

This application supports automated phone call alerts via Twilio when monitors go down.

### Setup Twilio

1. **Create a Twilio Account**:
   - Sign up at https://www.twilio.com
   - Get your Account SID and Auth Token from the console

2. **Get a Phone Number**:
   - Purchase a phone number from Twilio (or use a trial number for testing)
   - Trial accounts can only call verified numbers

3. **Configure Environment Variables**:
```env
TWILIO_ACCOUNT_SID=your-account-sid-here
TWILIO_AUTH_TOKEN=your-auth-token-here
TWILIO_PHONE_NUMBER=+1234567890
```

4. **Add Phone Numbers to Monitors**:
   - In the monitor form, add phone numbers in the "Phone Numbers" field
   - Use E.164 format: `+[country code][number]`
   - Example: `+12125551234`
   - Multiple numbers: separate with commas

### How It Works

When a monitor detects downtime:
1. The system initiates an automated call to configured phone numbers
2. Recipients hear a voice message with the monitor name and URL
3. Calls are made using Twilio's voice API with TwiML

**Note**: Twilio charges apply per call. Check pricing at https://www.twilio.com/voice/pricing

## Deployment

### Docker (Recommended for All Environments)

Docker Compose makes deployment consistent across development, staging, and production.

#### Development Setup (Default)

For local development with live code reloading:

**1. Create a `.env` file in the project root:**
```env
# Copy from .env.example and fill in your values
NEXTAUTH_SECRET=your-secret-here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-password

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@uptimemonitor.com

# Optional: Twilio for phone alerts
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

**2. Start development environment:**
```bash
docker compose up
```

**Features:**
- ✅ Hot reload - code changes reflect immediately
- ✅ Volume mounting - edit files on your machine
- ✅ Fast iteration - no rebuild needed
- ✅ Full stack - MongoDB + App + Cron service
- ✅ API-based monitoring - cron service calls `/api/cron/monitor` endpoint

**3. Access:**
- Web UI: http://localhost:3200
- MongoDB: localhost:27017

**4. Stop:**
```bash
docker compose down
```

#### Production Setup

Both deployment options use the **same API-based cron architecture**:
- 🔄 **Monitor Service**: Lightweight curl container (only ~32MB RAM!)
- 📡 **How it works**: Calls `/api/cron/monitor` API endpoint every minute
- ✅ **Benefits**: Simple, consistent, easy to debug

Choose your deployment option based on your infrastructure:

##### **Option 1: Self-Hosted (All-in-One - Includes MongoDB)**

Best for: Single-server deployments, full control, isolated environments

**1. Setup environment:**
```bash
cp .env.example .env
# Edit .env with your production settings
```

**Important:** Set these URLs to your production domain in `.env`:
```env
NEXT_PUBLIC_APP_URL=https://monitor.yourdomain.com
NEXTAUTH_URL=https://monitor.yourdomain.com
NEXTAUTH_SECRET=your-secret-here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
# ... other credentials
```

**2. Deploy:**
```bash
# Pull latest image and start all services
docker pull ghcr.io/screenappai/uptime-monitor:latest
docker compose -f docker-compose.selfhosted.yml up -d
```

**What's included:**
- MongoDB database (persistent storage)
- Next.js app (pre-built from GHCR)
- Monitor service (curl-based cron)

**Requirements:**
- 1GB+ RAM recommended
- Docker & Docker Compose

---

##### **Option 2: Managed Database (Use MongoDB Atlas)**

Best for: Small VPS (t3a.nano), cost optimization, managed database

**1. Setup environment:**
```bash
cp .env.example .env
# Edit .env with your MongoDB Atlas connection string
```

**2. Deploy:**
```bash
docker pull ghcr.io/screenappai/uptime-monitor:latest
docker compose -f docker-compose.managed.yml up -d
```

**What's included:**
- Next.js app (pre-built from GHCR)
- Monitor service (curl-based cron)

**Requirements:**
- 512MB+ RAM (works on t3a.nano!)
- MongoDB Atlas account (free tier available)
- Docker & Docker Compose

**Environment Variables Required:**
```env
# .env file
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/uptime-monitor
CRON_SECRET=your-random-secret  # Optional but recommended
# ... other vars (EMAIL_*, TWILIO_*, etc.)
```

### Vercel with Vercel Cron ⚡ (Serverless)

Deploy to Vercel with built-in cron jobs for automated monitoring. Perfect for **low to medium traffic** sites.

**Prerequisites:**
- Vercel account (free tier available)
- MongoDB Atlas account (free tier available)

**Deployment Steps:**

**1. Prepare your repository:**
```bash
# Make sure vercel.json exists (already included in the repo)
# It configures cron to run every minute
```

**2. Set up MongoDB Atlas:**
- Sign up at https://www.mongodb.com/cloud/atlas/register
- Create a free cluster (512 MB shared)
- Get your connection string (e.g., `mongodb+srv://user:pass@cluster.mongodb.net/uptime-monitor`)

**3. Deploy to Vercel:**

**Option A: Using Vercel CLI (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Set environment variables
vercel env add MONGODB_URI
vercel env add NEXTAUTH_SECRET
vercel env add CRON_SECRET
vercel env add ADMIN_USERNAME
vercel env add ADMIN_PASSWORD
# Add other env vars as needed (EMAIL_*, TWILIO_*)

# Deploy to production
vercel --prod
```

**Option B: Using Vercel Dashboard**
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure environment variables in the Vercel dashboard:
   - `MONGODB_URI` - Your MongoDB Atlas connection string
   - `NEXTAUTH_URL` - Your Vercel domain (e.g., `https://your-app.vercel.app`)
   - `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
   - `CRON_SECRET` - Generate with `openssl rand -base64 32`
   - `ADMIN_USERNAME` - Your admin username
   - `ADMIN_PASSWORD` - Your admin password
   - Add email and Twilio variables as needed
4. Click "Deploy"

**4. Verify Cron is Running:**

After deployment, check:
- Go to your Vercel project → Settings → Cron Jobs
- You should see `/api/cron/monitor` scheduled to run every minute
- Check the "Logs" tab to see cron executions

**Cost:** Free tier available, Pro $20/month for production. **Limitation:** 60s timeout (10s Hobby), 1-min minimum check interval.

---

### 🌩️ AWS Deployment (Recommended for Production)

Deploy to AWS using Lambda (cron) + Amplify (frontend) for better performance and lower costs.

**Why AWS?** 15-min timeout, $0-9/month (vs $20/month Vercel Pro), 1M free Lambda requests.

**Prerequisites:** AWS account, AWS CLI, Node.js 18+

**Deploy:**

1. **Install Serverless Framework:**
```bash
npm install -g serverless
```

2. **Configure AWS Credentials:**
```bash
aws configure
# Enter your AWS Access Key ID and Secret Access Key
# Region: us-east-1 (or your preferred region)
```

3. **Set Environment Variables:**

```bash
cp .env.lambda.example .env.lambda
# Edit with: NEXT_PUBLIC_APP_URL (your deployed app) and CRON_SECRET
```

**Note:** Lambda only needs these 2 variables. All other config lives in your Next.js app.

4. **Deploy Lambda:**

```bash
npm install
npm run deploy:lambda
```

Creates: Lambda function (~1-5 MB), EventBridge cron (1 min), API Gateway endpoints.

5. **Deploy Frontend:** Use [AWS Amplify Console](https://console.aws.amazon.com/amplify/) - connect Git repo, add env vars, deploy.

**Test Deployment:**
```bash
# Test Lambda function
npm run invoke:cron

# View logs
npm run logs:cron
```

**Useful commands:** `npm run invoke:cron` (test), `npm run logs:cron` (logs), `npm run remove:lambda` (cleanup)

**Cost Breakdown:**

| Component | Free Tier | Typical Cost |
|-----------|-----------|--------------|
| **Lambda** | 1M requests + 400K GB-seconds | $0-2/month |
| **Amplify** | 1K build mins + 15 GB transfer | $0-7/month |
| **MongoDB Atlas** | 512 MB storage | $0/month |
| **Total** | | **$0-9/month** |

**Monitoring:**
- Lambda logs: CloudWatch Logs
- Lambda metrics: CloudWatch Metrics
- Amplify builds: Amplify Console
- Set up CloudWatch alarms for errors





## CI/CD with GitHub Actions

### Automated Docker Image Builds

This project includes GitHub Actions workflows to automatically build and publish Docker images.

#### GitHub Container Registry (GHCR) - Default

The project is configured to automatically push images to GitHub Container Registry when you push to `main` or create tags.

**Automatic tags created:**
- `latest` - Always points to the latest main branch build
- `main-<sha>` - Tagged with short commit SHA (e.g., `main-a1b2c3d`)
- `v1.0.0` - Semantic version tags (when you create git tags)
- `v1.0`, `v1` - Major and minor version tags

**Pull the image:**
```bash
# Latest version
docker pull ghcr.io/screenappai/uptime-monitor:latest

# Specific SHA
docker pull ghcr.io/screenappai/uptime-monitor:main-a1b2c3d

# Specific version
docker pull ghcr.io/screenappai/uptime-monitor:v1.0.0
```

**No setup required!** GitHub Container Registry works automatically with your repository.

#### Docker Hub (Optional)

To use Docker Hub instead:

1. Rename `.github/workflows/docker-build-dockerhub.yml.example` to `docker-build-dockerhub.yml`
2. Update `IMAGE_NAME` in the file to your Docker Hub username
3. Add repository secrets:
   - `DOCKERHUB_USERNAME` - Your Docker Hub username
   - `DOCKERHUB_TOKEN` - Docker Hub access token

**Multi-architecture support:**
Both workflows build for `linux/amd64` and `linux/arm64` (Apple Silicon compatible).

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request



## Roadmap

- [x] Basic authentication with NextAuth.js
- [x] Docker Compose setup
- [x] Twilio phone call alerts
- [ ] Multi-user authentication and role-based access
- [ ] More monitor types (TCP, Ping, DNS)
- [ ] Custom alert thresholds
- [ ] Maintenance windows
- [ ] Incident management
- [ ] Slack integration
- [ ] Discord integration
- [x] Mobile app (Android/iOS with push notifications)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Inspired by [UptimeRobot](https://uptimerobot.com/)

## Community & Support

We're here to help! Connect with us through any of these channels:

### 💬 Get Help

- **Discord Community**: [Join our Discord](https://discord.gg/frS8QgUygn) - Our main forum for discussions, support, and real-time collaboration
- **GitHub Issues**: [Report bugs or request features](https://github.com/screenappai/uptime-monitor/issues)
- **GitHub Discussions**: Ask questions and share ideas
- **Documentation**: Check our [Wiki](https://github.com/screenappai/uptime-monitor/wiki) for detailed guides

### 🤝 Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) file for:
- Development setup
- Code standards
- Pull request process
- Commit message guidelines

### ⭐ Show Your Support

If you find this project helpful, please give it a star on GitHub! It helps others discover the project.

## Quick Reference

### Environment Variables

| File | Purpose | Required Variables |
|------|---------|-------------------|
| `.env` | Local development (Docker) | All variables (MongoDB, email, Twilio, etc.) |
| `.env.lambda` | AWS Lambda deployment | `NEXT_PUBLIC_APP_URL`, `CRON_SECRET` |
| Amplify/Vercel env | Next.js app production | All variables (MongoDB, email, Twilio, etc.) |

### API Endpoints

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/cron/monitor` | GET | Run monitor checks (called by cron) | Optional (CRON_SECRET) |
| `/api/monitors` | GET/POST | List/create monitors | Yes |
| `/api/monitors/[id]` | GET/PUT/DELETE | Monitor operations | Yes |
| `/api/monitors/[id]/check` | POST | Manual check | Yes |
| `/api/status-pages` | GET/POST | List/create status pages | Yes |
| `/status/[slug]` | GET | Public status page | No |

### Deployment Commands

```bash
# Docker development
docker compose up                          # Start all services
docker compose up monitor                  # Start only monitor service

# AWS Lambda (uses .env.lambda)
npm run deploy:lambda                      # Deploy to production (uses dotenv-cli)
npm run invoke:cron                        # Test Lambda function
npm run logs:cron                          # View Lambda logs
npm run remove:lambda                      # Remove all Lambda resources

# Vercel (if using Vercel instead)
vercel                                     # Deploy to preview
vercel --prod                              # Deploy to production
```

### Monitoring Architecture

```
┌─────────────────┐
│  Cron Trigger   │  (EventBridge/Vercel Cron/Docker Script)
└────────┬────────┘
         │ Calls every minute
         ▼
┌─────────────────┐
│  Next.js API    │  /api/cron/monitor
│                 │  - Fetches monitors
│                 │  - Checks endpoints
│                 │  - Saves results
│                 │  - Sends alerts
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    MongoDB      │  Stores monitors & check history
└─────────────────┘
```

## Author

**ScreenApp** - [https://screenapp.io](https://screenapp.io)

Project Link: [https://github.com/screenappai/uptime-monitor](https://github.com/screenappai/uptime-monitor)
