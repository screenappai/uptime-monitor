export interface RetryConfig {
  retryCount: number
  initialDelay: number
  multiplier: number
  maxDelay: number
}

export interface Monitor {
  _id?: string
  name: string
  url: string
  type: 'http' | 'https'
  interval: number // in seconds
  timeout: number // in seconds
  status: 'up' | 'down' | 'paused'
  lastCheck?: Date
  createdAt: Date
  updatedAt: Date
  contactLists?: string[] // Contact List IDs
  alerts: {
    email?: string[]
    webhook?: string[]
    phone?: string[]
  }
}

export interface MonitorCheck {
  _id?: string
  monitorId: string
  success: boolean
  responseTime: number
  statusCode?: number
  error?: string
  timestamp: Date
  attemptNumber?: number
}

export interface MonitorStats {
  monitorId: string
  uptime24h: number
  uptime7d: number
  uptime30d: number
  avgResponseTime: number
  totalChecks: number
  successfulChecks: number
  failedChecks: number
  lastUpdated: Date
}

export interface StatusPage {
  _id?: string
  slug: string
  title: string
  description?: string
  monitors: string[] // Monitor IDs
  customDomain?: string
  branding: {
    logo?: string
    primaryColor?: string
  }
  createdAt: Date
  updatedAt: Date
}

export interface IncidentReport {
  _id?: string
  monitorId: string
  startTime: Date
  endTime?: Date
  duration?: number // in milliseconds
  resolved: boolean
  affectedChecks: number
}
