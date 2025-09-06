import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims

  // Temporarily bypass auth for testing
  const isTestingPath = request.nextUrl.pathname === '/' ||
                        request.nextUrl.pathname.startsWith('/dashboard') ||
                        request.nextUrl.pathname.startsWith('/pm-assistant') || 
                        request.nextUrl.pathname.startsWith('/pm-rag') ||
                        request.nextUrl.pathname.startsWith('/test-employees') ||
                        request.nextUrl.pathname.startsWith('/api/chat') ||
                        request.nextUrl.pathname.startsWith('/api/d1') ||
                        request.nextUrl.pathname.startsWith('/api/vector') ||
                        request.nextUrl.pathname.startsWith('/api/fm-global-rag') ||
                        request.nextUrl.pathname.startsWith('/api/fm-global-real-rag') ||
                        request.nextUrl.pathname.startsWith('/api/fm-rag') ||
                        request.nextUrl.pathname.startsWith('/api/fm-optimize') ||
                        request.nextUrl.pathname.startsWith('/api/pm-assistant-gpt5') ||
                        request.nextUrl.pathname.startsWith('/api/rag') ||
                        request.nextUrl.pathname.startsWith('/api/pm-rag') ||
                        request.nextUrl.pathname.startsWith('/test-vector-search') ||
                        request.nextUrl.pathname.startsWith('/meetings-d1') ||
                        request.nextUrl.pathname.startsWith('/documents-db') ||
                        request.nextUrl.pathname.startsWith('/meeting-intelligence') ||
                        request.nextUrl.pathname.startsWith('/meeting-insights') ||
                        request.nextUrl.pathname.startsWith('/diagnostic') ||
                        request.nextUrl.pathname.startsWith('/projects-dashboard') ||
                        request.nextUrl.pathname.startsWith('/projects') ||
                        request.nextUrl.pathname.startsWith('/create-test-data') ||
                        request.nextUrl.pathname.startsWith('/clients') ||
                        request.nextUrl.pathname.startsWith('/team-chat') ||
                        request.nextUrl.pathname.startsWith('/fm-chat') ||
                        request.nextUrl.pathname.startsWith('/fm-8-34') ||
                        request.nextUrl.pathname.startsWith('/asrs-form') ||
                        request.nextUrl.pathname.startsWith('/asrs-design') ||
                        request.nextUrl.pathname.startsWith('/sitemap');
  
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    !request.nextUrl.pathname.startsWith('/(pages)/auth') &&
    !isTestingPath
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
