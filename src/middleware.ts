import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow public access to chatbot embed routes
        if (req.nextUrl.pathname.startsWith('/chatbot')) {
          return true
        }

        // Protect dashboard and agent routes
        if (req.nextUrl.pathname.startsWith('/dashboard') ||
          req.nextUrl.pathname.startsWith('/agents') ||
          req.nextUrl.pathname.startsWith('/profile') ||
          req.nextUrl.pathname.startsWith('/settings') ||
          req.nextUrl.pathname.startsWith('/api-keys') ||
          req.nextUrl.pathname.startsWith('/billing') ||
          req.nextUrl.pathname.startsWith('/analytics') ||
          req.nextUrl.pathname.startsWith('/activity') ||
          req.nextUrl.pathname.startsWith('/integrations') ||
          req.nextUrl.pathname.startsWith('/team')) {
          return !!token
        }
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/agents/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/api-keys/:path*',
    '/billing/:path*',
    '/analytics/:path*',
    '/activity/:path*',
    '/integrations/:path*',
    '/team/:path*',
  ],
}
