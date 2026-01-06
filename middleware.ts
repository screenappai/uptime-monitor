import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    return NextResponse.next()
  },
  {
    pages: {
      signIn: '/login',
    },
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname

        // Public status page API - allow GET requests without auth
        if (path.startsWith('/api/status-pages/') && req.method === 'GET') {
          // Check if it's a slug-based public access (not management endpoints)
          const parts = path.split('/')
          // Allow /api/status-pages/[slug] for public viewing
          if (parts.length === 4 && !['create', 'update', 'delete'].includes(parts[3])) {
            return true
          }
        }

        // Check for mobile JWT token in Authorization header
        const authHeader = req.headers.get('authorization')
        if (authHeader && authHeader.startsWith('Bearer ')) {
          // Allow request - actual token validation happens in the API route
          return true
        }

        // All other protected routes require authentication
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/monitors/:path*',
    '/api/status-pages/:path*',
    '/api/devices/:path*',
  ],
}
