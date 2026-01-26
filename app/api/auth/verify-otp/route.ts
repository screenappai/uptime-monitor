import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import OTPTokenModel from '@/models/OTPToken'
import UserModel from '@/models/User'
import OrganizationModel from '@/models/Organization'
import InvitationModel from '@/models/Invitation'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { generateUniqueSlug } from '@/lib/utils'

const verifyOTPSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  name: z.string().min(1).optional(),
  organizationName: z.string().min(1).optional(),
  inviteToken: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, code, name, organizationName, inviteToken } = verifyOTPSchema.parse(body)
    const normalizedEmail = email.toLowerCase()

    await connectDB()

    // Find the most recent unused OTP for this email
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

    // Check attempts (max 5)
    if (otpToken.attempts >= 5) {
      await OTPTokenModel.findByIdAndUpdate(otpToken._id, { used: true })
      return NextResponse.json(
        { success: false, error: 'Too many invalid attempts. Request a new OTP.' },
        { status: 400 }
      )
    }

    // Verify OTP
    const isValid = await bcrypt.compare(code, otpToken.code)

    if (!isValid) {
      await OTPTokenModel.findByIdAndUpdate(otpToken._id, {
        $inc: { attempts: 1 },
      })
      return NextResponse.json(
        { success: false, error: 'Invalid OTP code' },
        { status: 400 }
      )
    }

    // Mark OTP as used
    await OTPTokenModel.findByIdAndUpdate(otpToken._id, { used: true })

    // Find or create user
    let user = await UserModel.findOne({ email: normalizedEmail })

    if (!user) {
      // New user registration
      if (!name) {
        return NextResponse.json(
          { success: false, error: 'Name is required for registration', requiresProfile: true },
          { status: 400 }
        )
      }

      let organizationId: string
      let role: 'owner' | 'admin' | 'member' = 'owner'

      // Check for invitation
      if (inviteToken) {
        const invitation = await InvitationModel.findOne({
          token: inviteToken,
          email: normalizedEmail,
          expiresAt: { $gt: new Date() },
          acceptedAt: null,
        })

        if (invitation) {
          organizationId = invitation.organizationId.toString()
          role = invitation.role
          await InvitationModel.findByIdAndUpdate(invitation._id, {
            acceptedAt: new Date(),
          })
        } else {
          return NextResponse.json(
            { success: false, error: 'Invalid or expired invitation' },
            { status: 400 }
          )
        }
      } else {
        // Check for any pending invitation for this email
        const pendingInvitation = await InvitationModel.findOne({
          email: normalizedEmail,
          expiresAt: { $gt: new Date() },
          acceptedAt: null,
        })

        if (pendingInvitation) {
          // Auto-accept the pending invitation
          organizationId = pendingInvitation.organizationId.toString()
          role = pendingInvitation.role
          await InvitationModel.findByIdAndUpdate(pendingInvitation._id, {
            acceptedAt: new Date(),
          })
        } else {
          // Check multi-tenant setting
          const isMultiTenant = process.env.MULTI_TENANT === 'true'
          const orgCount = await OrganizationModel.countDocuments()

          if (!isMultiTenant && orgCount > 0) {
            // Single-tenant mode: Organization already exists, user needs invitation
            return NextResponse.json(
              {
                success: false,
                error: 'You are not invited. Please contact your administrator for an invitation.'
              },
              { status: 403 }
            )
          }

          // Create new organization (first user or multi-tenant mode)
          if (!organizationName) {
            return NextResponse.json(
              { success: false, error: 'Organization name required', requiresOrganization: true },
              { status: 400 }
            )
          }

          const slug = await generateUniqueSlug(organizationName, async (s) => {
            const existing = await OrganizationModel.findOne({ slug: s })
            return !!existing
          })

          const isFirstOrganization = orgCount === 0

          const organization = await OrganizationModel.create({
            name: organizationName,
            slug,
            settings: {
              maxMonitors: isFirstOrganization || !isMultiTenant ? 100 : 5,
              maxContactLists: isFirstOrganization || !isMultiTenant ? 20 : 3,
              maxMembers: isFirstOrganization || !isMultiTenant ? 50 : 1,
              checkInterval: isFirstOrganization || !isMultiTenant ? 30 : 60,
            },
          })
          organizationId = organization._id.toString()
        }
      }

      // Create user
      user = await UserModel.create({
        email: normalizedEmail,
        name,
        emailVerified: true,
        organizationId,
        role,
      })
    } else {
      // Existing user - update last login
      await UserModel.findByIdAndUpdate(user._id, {
        lastLoginAt: new Date(),
        emailVerified: true,
      })
    }

    // Get organization
    const organization = await OrganizationModel.findById(user.organizationId)

    // Generate JWT token
    const secret = process.env.NEXTAUTH_SECRET
    if (!secret) {
      throw new Error('NEXTAUTH_SECRET not configured')
    }

    const expiresIn = 30 * 24 * 60 * 60 // 30 days
    const expiresAt = Math.floor(Date.now() / 1000) + expiresIn

    const token = jwt.sign(
      {
        sub: user._id.toString(),
        email: user.email,
        name: user.name,
        organizationId: user.organizationId.toString(),
        organizationSlug: organization?.slug,
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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      )
    }
    console.error('Verify OTP error:', error)
    return NextResponse.json(
      { success: false, error: 'Verification failed' },
      { status: 500 }
    )
  }
}
