import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import OTPTokenModel from '@/models/OTPToken'
import UserModel from '@/models/User'
import { sendOTPEmail } from '@/lib/email'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const sendOTPSchema = z.object({
  email: z.string().email('Valid email is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = sendOTPSchema.parse(body)
    const normalizedEmail = email.toLowerCase()

    await connectDB()

    // Rate limiting: Check for recent OTP requests (max 3 per 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
    const recentOTPs = await OTPTokenModel.countDocuments({
      email: normalizedEmail,
      createdAt: { $gte: tenMinutesAgo },
    })

    if (recentOTPs >= 3) {
      return NextResponse.json(
        { success: false, error: 'Too many OTP requests. Please wait 10 minutes.' },
        { status: 429 }
      )
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString()
    const hashedOTP = await bcrypt.hash(otp, 10)

    // Store OTP (expires in 10 minutes)
    await OTPTokenModel.create({
      email: normalizedEmail,
      code: hashedOTP,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    })

    // Check if user exists
    const existingUser = await UserModel.findOne({ email: normalizedEmail })

    // Send OTP email
    await sendOTPEmail(normalizedEmail, otp, !!existingUser)

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      isNewUser: !existingUser,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      )
    }
    console.error('Send OTP error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send OTP' },
      { status: 500 }
    )
  }
}
