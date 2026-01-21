import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import UserModel from '@/models/User'
import OTPTokenModel from '@/models/OTPToken'
import OrganizationModel from '@/models/Organization'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// POST /api/auth/mobile - Verify OTP and return JWT for mobile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, code } = body

    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: 'Email and OTP code are required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase()

    await connectDB()

    // Find and verify OTP
    const otpToken = await OTPTokenModel.findOne({
      email: normalizedEmail,
      used: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 })

    if (!otpToken) {
      return NextResponse.json(
        { success: false, error: 'OTP expired or not found' },
        { status: 400 }
      )
    }

    // Check attempts
    if (otpToken.attempts >= 5) {
      await OTPTokenModel.findByIdAndUpdate(otpToken._id, { used: true })
      return NextResponse.json(
        { success: false, error: 'Too many invalid attempts. Request a new OTP.' },
        { status: 400 }
      )
    }

    const isValid = await bcrypt.compare(code, otpToken.code)
    if (!isValid) {
      await OTPTokenModel.findByIdAndUpdate(otpToken._id, {
        $inc: { attempts: 1 },
      })
      return NextResponse.json(
        { success: false, error: 'Invalid OTP code' },
        { status: 401 }
      )
    }

    // Mark OTP as used
    await OTPTokenModel.findByIdAndUpdate(otpToken._id, { used: true })

    // Find user
    const user = await UserModel.findOne({ email: normalizedEmail })
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found. Please sign up first.' },
        { status: 404 }
      )
    }

    // Update last login
    await UserModel.findByIdAndUpdate(user._id, {
      lastLoginAt: new Date(),
    })

    const organization = await OrganizationModel.findById(user.organizationId)

    // Generate JWT token
    const secret = process.env.NEXTAUTH_SECRET
    if (!secret) {
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const expiresIn = 30 * 24 * 60 * 60 // 30 days for mobile
    const expiresAt = Math.floor(Date.now() / 1000) + expiresIn

    const token = jwt.sign(
      {
        sub: user._id.toString(),
        email: user.email,
        name: user.name,
        organizationId: user.organizationId.toString(),
        role: user.role,
        iat: Math.floor(Date.now() / 1000),
        exp: expiresAt,
      },
      secret
    )

    return NextResponse.json({
      success: true,
      data: {
        token,
        expiresAt: expiresAt * 1000,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        },
        organization: {
          id: organization?._id.toString(),
          name: organization?.name,
          slug: organization?.slug,
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
