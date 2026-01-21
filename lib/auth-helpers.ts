import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { AuthenticatedUser, UserRole } from '@/types'

export interface AuthResult {
  error: NextResponse | null
  user: AuthenticatedUser | null
}

// Get session from NextAuth (web)
export async function getSession() {
  return await getServerSession(authOptions)
}

// Require auth for web routes - returns user with organization context
export async function requireAuth(): Promise<AuthResult> {
  const session = await getSession()

  if (!session?.user) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      ),
      user: null,
    }
  }

  return {
    error: null,
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      organizationId: session.user.organizationId,
      role: session.user.role,
    },
  }
}

// Validate mobile JWT token
export function validateMobileToken(request: NextRequest): AuthenticatedUser | null {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    const secret = process.env.NEXTAUTH_SECRET

    if (!secret) {
      console.error('NEXTAUTH_SECRET not set')
      return null
    }

    const decoded = jwt.verify(token, secret) as {
      sub: string
      email: string
      name?: string
      organizationId: string
      role: UserRole
    }

    return {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name,
      organizationId: decoded.organizationId,
      role: decoded.role,
    }
  } catch (error) {
    console.error('Token validation error:', error)
    return null
  }
}

// Require auth for mobile routes
export async function requireMobileAuth(request: NextRequest): Promise<AuthResult> {
  const user = validateMobileToken(request)

  if (!user) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      ),
      user: null,
    }
  }

  return { error: null, user }
}

// Universal auth helper - works for both web and mobile
export async function requireUniversalAuth(request: NextRequest): Promise<AuthResult> {
  // Try mobile auth first (Bearer token)
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return requireMobileAuth(request)
  }

  // Fall back to NextAuth session
  return requireAuth()
}

// Role-based access control
export function requireRole(
  user: AuthenticatedUser,
  allowedRoles: UserRole[]
): NextResponse | null {
  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    )
  }
  return null
}

// Get organization filter for queries
export function getOrganizationFilter(user: AuthenticatedUser) {
  return { organizationId: new mongoose.Types.ObjectId(user.organizationId) }
}

// Check if user can manage organization (owner or admin)
export function canManageOrganization(user: AuthenticatedUser): boolean {
  return user.role === 'owner' || user.role === 'admin'
}

// Check if user is owner
export function isOwner(user: AuthenticatedUser): boolean {
  return user.role === 'owner'
}
