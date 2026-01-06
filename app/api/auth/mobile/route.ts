import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      )
    }

    const adminUsername = process.env.ADMIN_USERNAME || 'admin'
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminPassword) {
      console.error('ADMIN_PASSWORD environment variable is not set')
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      )
    }

    if (username !== adminUsername) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check if password is hashed (starts with $2a$ or $2b$)
    const isHashed = adminPassword.startsWith('$2a$') || adminPassword.startsWith('$2b$')

    let isValid = false
    if (isHashed) {
      isValid = await bcrypt.compare(password, adminPassword)
    } else {
      // Plain text comparison (not recommended for production)
      isValid = password === adminPassword
    }

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Generate JWT token
    const secret = process.env.NEXTAUTH_SECRET
    if (!secret) {
      console.error('NEXTAUTH_SECRET environment variable is not set')
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const expiresIn = 24 * 60 * 60 // 24 hours in seconds
    const expiresAt = Math.floor(Date.now() / 1000) + expiresIn

    const token = jwt.sign(
      {
        id: '1',
        name: adminUsername,
        email: `${adminUsername}@localhost`,
        iat: Math.floor(Date.now() / 1000),
        exp: expiresAt,
      },
      secret
    )

    return NextResponse.json({
      success: true,
      data: {
        token,
        expiresAt: expiresAt * 1000, // Convert to milliseconds for client
        user: {
          id: '1',
          name: adminUsername,
          email: `${adminUsername}@localhost`,
        },
      },
    })
  } catch (error) {
    console.error('Mobile auth error:', error)
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    )
  }
}
