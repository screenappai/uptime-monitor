import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { connectDB } from '@/lib/db'
import UserModel from '@/models/User'
import OTPTokenModel from '@/models/OTPToken'
import OrganizationModel from '@/models/Organization'
import InvitationModel from '@/models/Invitation'
import bcrypt from 'bcryptjs'
import { generateUniqueSlug } from '@/lib/utils'

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string
      organizationId: string
      organizationSlug: string
      role: 'owner' | 'admin' | 'member'
    }
  }

  interface User {
    id: string
    email: string
    name?: string
    organizationId: string
    organizationSlug: string
    role: 'owner' | 'admin' | 'member'
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    email: string
    name?: string
    organizationId: string
    organizationSlug: string
    role: 'owner' | 'admin' | 'member'
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'otp',
      name: 'Email OTP',
      credentials: {
        email: { label: 'Email', type: 'email' },
        code: { label: 'OTP Code', type: 'text' },
        name: { label: 'Name', type: 'text' },
        organizationName: { label: 'Organization Name', type: 'text' },
        inviteToken: { label: 'Invite Token', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.code) {
          return null
        }

        await connectDB()

        const normalizedEmail = credentials.email.toLowerCase()

        // Verify OTP
        const otpToken = await OTPTokenModel.findOne({
          email: normalizedEmail,
          used: false,
          expiresAt: { $gt: new Date() },
        }).sort({ createdAt: -1 })

        if (!otpToken) return null

        // Check attempts (max 5)
        if (otpToken.attempts >= 5) {
          await OTPTokenModel.findByIdAndUpdate(otpToken._id, { used: true })
          return null
        }

        const isValid = await bcrypt.compare(credentials.code, otpToken.code)
        if (!isValid) {
          await OTPTokenModel.findByIdAndUpdate(otpToken._id, {
            $inc: { attempts: 1 },
          })
          return null
        }

        // Mark OTP as used
        await OTPTokenModel.findByIdAndUpdate(otpToken._id, { used: true })

        // Find or create user
        let user = await UserModel.findOne({ email: normalizedEmail })

        if (!user) {
          // New user registration
          const userName = credentials.name?.trim()
          if (!userName) {
            // Need name for new user - return null to indicate registration needed
            return null
          }

          let organizationId: string
          let role: 'owner' | 'admin' | 'member' = 'owner'

          // Check for invitation
          if (credentials.inviteToken) {
            const invitation = await InvitationModel.findOne({
              token: credentials.inviteToken,
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
              // Invalid invitation
              return null
            }
          } else {
            // Create new organization
            const orgName = credentials.organizationName?.trim()
            if (!orgName) {
              // Need organization name for new user without invite
              return null
            }

            const slug = await generateUniqueSlug(orgName, async (s) => {
              const existing = await OrganizationModel.findOne({ slug: s })
              return !!existing
            })

            const organization = await OrganizationModel.create({
              name: orgName,
              slug,
            })
            organizationId = organization._id.toString()
          }

          // Create user
          user = await UserModel.create({
            email: normalizedEmail,
            name: userName,
            emailVerified: true,
            organizationId,
            role,
            lastLoginAt: new Date(),
          })
        } else {
          // Existing user - update last login
          await UserModel.findByIdAndUpdate(user._id, {
            lastLoginAt: new Date(),
          })
        }

        const organization = await OrganizationModel.findById(user.organizationId)

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          organizationId: user.organizationId.toString(),
          organizationSlug: organization?.slug || '',
          role: user.role,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.organizationId = user.organizationId
        token.organizationSlug = user.organizationSlug
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      session.user = {
        id: token.id,
        email: token.email,
        name: token.name,
        organizationId: token.organizationId,
        organizationSlug: token.organizationSlug,
        role: token.role,
      }
      return session
    },
  },
}
