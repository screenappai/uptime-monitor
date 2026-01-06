import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export interface MobileUser {
  id: string
  name: string
  email: string
}

export async function getSession() {
  return await getServerSession(authOptions)
}

export async function requireAuth() {
  const session = await getSession()

  if (!session) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      ),
      session: null,
    }
  }

  return { error: null, session }
}

export function validateMobileToken(request: NextRequest): MobileUser | null {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    const secret = process.env.NEXTAUTH_SECRET

    if (!secret) {
      console.error('NEXTAUTH_SECRET environment variable is not set')
      return null
    }

    const decoded = jwt.verify(token, secret) as MobileUser
    return {
      id: decoded.id,
      name: decoded.name,
      email: decoded.email,
    }
  } catch (error) {
    console.error('Mobile token validation error:', error)
    return null
  }
}

export async function requireMobileAuth(request: NextRequest) {
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
