import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

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
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user && request.nextUrl.pathname.startsWith('/app')) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    const redirectResponse = NextResponse.redirect(loginUrl)
    supabaseResponse.cookies.getAll().forEach(cookie => redirectResponse.cookies.set(cookie))
    return redirectResponse
  }

  if (user && ['/login', '/signup'].includes(request.nextUrl.pathname)) {
    const dashUrl = request.nextUrl.clone()
    dashUrl.pathname = '/app/dashboard'
    const redirectResponse = NextResponse.redirect(dashUrl)
    supabaseResponse.cookies.getAll().forEach(cookie => redirectResponse.cookies.set(cookie))
    return redirectResponse
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
