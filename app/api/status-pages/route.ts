import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import StatusPageModel from '@/models/StatusPage'
import { requireUniversalAuth, getOrganizationFilter, requireRole } from '@/lib/auth-helpers'
import { z } from 'zod'

const createStatusPageSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  title: z.string().min(1),
  description: z.string().optional(),
  monitors: z.array(z.string()),
  branding: z.object({
    logo: z.string().optional(),
    primaryColor: z.string().optional(),
  }).optional(),
})

// GET /api/status-pages - List status pages for current organization
export async function GET(request: NextRequest) {
  try {
    const { error, user } = await requireUniversalAuth(request)
    if (error) return error

    await connectDB()

    const statusPages = await StatusPageModel.find(getOrganizationFilter(user!))
      .sort({ createdAt: -1 })

    return NextResponse.json({
      success: true,
      data: statusPages,
    })
  } catch (error) {
    console.error('Error fetching status pages:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch status pages' },
      { status: 500 }
    )
  }
}

// POST /api/status-pages - Create a new status page in current organization
export async function POST(request: NextRequest) {
  try {
    const { error, user } = await requireUniversalAuth(request)
    if (error) return error

    // Only owners and admins can create status pages
    const roleError = requireRole(user!, ['owner', 'admin'])
    if (roleError) return roleError

    const body = await request.json()
    const validatedData = createStatusPageSchema.parse(body)

    await connectDB()

    // Check if slug already exists within the organization
    const existing = await StatusPageModel.findOne({
      slug: validatedData.slug,
      ...getOrganizationFilter(user!),
    })
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A status page with this slug already exists' },
        { status: 400 }
      )
    }

    const statusPage = await StatusPageModel.create({
      ...validatedData,
      organizationId: user!.organizationId,
    })

    return NextResponse.json({
      success: true,
      data: statusPage,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating status page:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create status page' },
      { status: 500 }
    )
  }
}
