import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export function middleware(request: NextRequest) {
  // Only allow access without authentication for auth-related pages
  const publicPaths = [
    '/login',
    '/auth/login',
    '/auth/signup',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/verify-email',
    '/auth/callback',
    '/api/auth',
    '/api/health',  // Health check endpoint for deployment validation
  ]
  
  const pathname = request.nextUrl.pathname
  
  // Check if it's a public auth-related path
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
  
  if (isPublicPath) {
    return NextResponse.next()
  }
  
  // All other paths require authentication via Supabase
  return updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}