# Uptime Monitor

An open-source uptime monitoring system built with Next.js, MongoDB, and TypeScript. Monitor your websites and services with real-time uptime tracking, alerts, and beautiful public status pages.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.0-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-8.0-green)
[![Discord](https://img.shields.io/discord/1234567890?color=7289da&label=Discord&logo=discord&logoColor=white)](https://discord.gg/frS8QgUygn)

## Features

- **HTTP/HTTPS Monitoring** - Monitor any HTTP or HTTPS endpoint with customizable check intervals
- **Real-time Alerts** - Get notified via email or webhooks when your services go down
- **Public Status Pages** - Create beautiful, branded status pages for your services
- **Historical Analytics** - Track uptime percentages and response times over 24h, 7d, and 30d periods
- **Response Time Tracking** - Visualize response times with interactive charts
- **Incident Reports** - Automatic incident detection and tracking
- **Self-hosted** - Full control over your monitoring data
- **Open Source** - MIT licensed, contribute and customize freely

## Screenshots

### Dashboard
The main dashboard shows all your monitors at a glance with status indicators and uptime statistics.

### Monitor Details
Detailed view of each monitor with response time charts and check history.

### Public Status Page
Beautiful public status pages that you can share with your users.

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: NextAuth.js with credentials provider
- **UI Components**: shadcn/ui
- **Charts**: Recharts
- **Email**: Nodemailer
- **Scheduling**: node-cron

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

**Access:** http://localhost:3200

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

7. Start the monitoring service (in a separate terminal):
```bash
npm run monitor
```

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
- ✅ Full stack - MongoDB + App + Monitor service

**3. Access:**
- Web UI: http://localhost:3200
- MongoDB: localhost:27017

**4. Stop:**
```bash
docker compose down
```

#### Production Setup

Choose your deployment option based on your infrastructure:

##### **Option 1: Self-Hosted (Includes MongoDB)**

Use this if you want to run everything in Docker containers on your own server.

**1. Configure `.env` file (same as development)**

**2. Build and start:**
```bash
docker compose -f docker-compose.selfhosted.yml up -d --build
```

**Features:**
- ✅ All-in-one - MongoDB included in the stack
- ✅ Multi-stage build - optimized image size
- ✅ Production-ready - runs as non-root user
- ✅ Auto-restart - services restart on failure

**3. View logs:**
```bash
# All services
docker compose -f docker-compose.selfhosted.yml logs -f

# Specific service
docker compose -f docker-compose.selfhosted.yml logs -f app
```

**4. Stop services:**
```bash
docker compose -f docker-compose.selfhosted.yml down
```

---

##### **Option 2: Managed Database (External MongoDB)**

Use this if you're using MongoDB Atlas, AWS DocumentDB, or other managed MongoDB services. **Ideal for small instances like AWS t3a.nano**.

**1. Configure `.env` file with external MongoDB:**
```bash
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/uptime-monitor
# ... other environment variables
```

**2. Pull and start:**
```bash
# Pull pre-built image from GitHub Container Registry
docker pull ghcr.io/screenappai/uptime-monitor:latest

# Start services
docker compose -f docker-compose.managed.yml up -d
```

**Features:**
- ✅ Lightweight - no MongoDB container (saves ~200-400 MB RAM)
- ✅ Pre-built image - no build step required
- ✅ Perfect for small instances (t3a.nano, t3a.micro)
- ✅ Uses managed database services

**3. View logs:**
```bash
docker compose -f docker-compose.managed.yml logs -f
```

**4. Stop services:**
```bash
docker compose -f docker-compose.managed.yml down
```

### VPS / Self-hosted

1. Install Node.js and MongoDB
2. Clone the repository
3. Install dependencies with `npm install`
4. Build the application with `npm run build`
5. Start the application with `npm start`
6. Use PM2 to run the monitoring service:
```bash
npm install -g pm2
pm2 start scripts/monitor.js --name uptime-monitor
pm2 startup
pm2 save
```

### Vercel / Serverless (Not Recommended)

While you can deploy the Next.js app to Vercel, **this is not recommended** because:
- ❌ Vercel functions have time limits (won't work for background monitoring)
- ❌ Need to run monitoring service separately on a VPS
- ❌ More complex setup with multiple deployment targets

**If you must use Vercel:**
1. Deploy the Next.js app to Vercel
2. Deploy the monitoring service (`scripts/monitor.js`) to a VPS
3. Use external MongoDB (Atlas)

**Better alternative:** Use Docker Compose on any VPS for a complete, unified deployment.

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

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run monitoring service
npm run monitor

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

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
- [ ] Mobile app

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

## Author

**ScreenApp** - [https://screenapp.io](https://screenapp.io)

Project Link: [https://github.com/screenappai/uptime-monitor](https://github.com/screenappai/uptime-monitor)
