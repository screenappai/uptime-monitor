import { Types } from 'mongoose'

export interface RetryConfig {
  retryCount: number
  initialDelay: number
  multiplier: number
  maxDelay: number
}

// Helper type for Mongoose ObjectId fields - can be string or ObjectId
type ObjectIdField = string | Types.ObjectId

// Organization types
export interface Organization {
  _id?: string
  name: string
  slug: string
  plan: 'free' | 'pro' | 'enterprise'
  settings: {
    maxMonitors: number
    maxContactLists: number
    maxMembers: number
    checkInterval: number
  }
  createdAt: Date
  updatedAt: Date
}

// User types
export type UserRole = 'owner' | 'admin' | 'member'

export interface User {
  _id?: string
  email: string
  name?: string
  emailVerified: boolean
  organizationId: string
  role: UserRole
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
}

// OTP types
export interface OTPToken {
  _id?: string
  email: string
  code: string
  expiresAt: Date
  used: boolean
  attempts: number
  createdAt: Date
}

// Invitation types
export interface Invitation {
  _id?: string
  email: string
  organizationId: string
  role: 'admin' | 'member'
  invitedBy: string
  token: string
  expiresAt: Date
  acceptedAt?: Date
  createdAt: Date
}

// Monitor types
export interface Monitor {
  _id?: string
  name: string
  url: string
  type: 'http' | 'https'
  interval: number // in seconds
  timeout: number // in seconds
  status: 'up' | 'down' | 'paused'
  lastCheck?: Date
  organizationId: string
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

// Status Page types
export interface StatusPage {
  _id?: string
  slug: string
  title: string
  description?: string
  monitors: string[] // Monitor IDs
  customDomain?: string
  organizationId: string
  branding: {
    logo?: string
    primaryColor?: string
  }
  createdAt: Date
  updatedAt: Date
}

// Contact List types
export interface ContactList {
  _id?: string
  name: string
  description?: string
  emails: string[]
  phones: string[]
  webhooks: string[]
  organizationId: string
  createdAt: Date
  updatedAt: Date
}

// Device Token types
export interface DeviceToken {
  _id?: string
  token: string
  platform: 'ios' | 'android'
  isActive: boolean
  userId: string
  organizationId: string
  createdAt: Date
  updatedAt: Date
}

// Incident Report types
export interface IncidentReport {
  _id?: string
  monitorId: string
  startTime: Date
  endTime?: Date
  duration?: number // in milliseconds
  resolved: boolean
  affectedChecks: number
}

// Auth types
export interface AuthenticatedUser {
  id: string
  email: string
  name?: string
  organizationId: string
  role: UserRole
}

export interface AuthResult {
  error: Response | null
  user: AuthenticatedUser | null
}
