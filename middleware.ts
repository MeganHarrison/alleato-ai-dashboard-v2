import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export function middleware(request: NextRequest) {
  // Allow access to specific paths without authentication for testing
  const publicPaths = [
    '/api/health',  // Health check endpoint for deployment validation
    '/rag-dashboard',
    '/asrs/fm-global-tables',
    '/fm-global-agent',
    '/fm-global-docs',
    '/fm-global-advanced',  // Advanced FM Global RAG system for testing
    '/meetings-test',
    '/meeting-intelligence',
    '/pm-chat-test',
    '/pm-chat-working',
    '/pm-rag',
    '/api/pm-chat',
    '/api/pm-chat-direct',
    '/api/pm-rag-local',
    '/api/fm-global-real-rag',  // API bridge to Python RAG
    '/documents',
    '/chat',
    '/chat-asrs',
    '/chat-asrs2', 
    '/chat-asrs-demo',
    '/fm-global-form',
    '/meetings'
  ]
  
  const pathname = request.nextUrl.pathname
  
  // Check if it's a public path
  if (publicPaths.includes(pathname) || pathname.startsWith('/api/pm-rag')) {
    return NextResponse.next()
  }
  
  // Handle authentication with Supabase
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