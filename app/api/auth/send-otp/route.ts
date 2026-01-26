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

    // For new users, check for pending invitations
    let pendingInvitation = null
    if (!existingUser) {
      const InvitationModel = (await import('@/models/Invitation')).default
      const OrganizationModel = (await import('@/models/Organization')).default

      pendingInvitation = await InvitationModel.findOne({
        email: normalizedEmail,
        expiresAt: { $gt: new Date() },
        acceptedAt: null,
      })

      // In single-tenant mode, block users without invitations
      if (!pendingInvitation) {
        const isMultiTenant = process.env.MULTI_TENANT === 'true'

        if (!isMultiTenant) {
          const orgCount = await OrganizationModel.countDocuments()

          if (orgCount > 0) {
            return NextResponse.json(
              {
                success: false,
                error: 'You are not invited. Please contact your administrator for an invitation.'
              },
              { status: 403 }
            )
          }
        }
      }

      // Get organization name for the invitation
      if (pendingInvitation) {
        const org = await OrganizationModel.findById(pendingInvitation.organizationId)
        if (org) {
          pendingInvitation = { ...pendingInvitation.toObject(), organizationName: org.name }
        }
      }
    }

    // Send OTP email
    await sendOTPEmail(normalizedEmail, otp, !!existingUser)

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      isNewUser: !existingUser,
      ...(pendingInvitation && {
        pendingInvitation: {
          organizationName: pendingInvitation.organizationName,
          role: pendingInvitation.role,
        },
      }),
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
