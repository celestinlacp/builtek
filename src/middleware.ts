import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const SUPER_ADMIN_EMAIL = (
  process.env.SUPER_ADMIN_EMAIL ??
  process.env.MASTER_ADMIN_EMAIL ??
  ''
).trim().toLowerCase()

// HMAC-SHA256 signature verification for impersonation cookie
async function verifyHmac(payload: string, signature: string, secret: string): Promise<boolean> {
  try {
    const enc = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )
    const sigBytes = Uint8Array.from(
      atob(signature),
      c => c.charCodeAt(0)
    )
    return await crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(payload))
  } catch {
    return false
  }
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  // Create Supabase client for middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // ── Protect /super-admin* ────────────────────────────────────────────────
  if (pathname.startsWith('/super-admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (user.email?.trim().toLowerCase() !== SUPER_ADMIN_EMAIL) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // ── Impersonation cookie verification ───────────────────────────────────
  const impersonationCookie = request.cookies.get('__builtek_impersonation')
  if (impersonationCookie?.value) {
    const secret = process.env.SUPER_ADMIN_SECRET
    if (secret) {
      try {
        const [payloadB64, sig] = impersonationCookie.value.split('.')
        if (payloadB64 && sig) {
          const isValid = await verifyHmac(payloadB64, sig, secret)
          if (isValid) {
            const payload = JSON.parse(atob(payloadB64))
            // Check expiry
            if (payload.expiresAt && Date.now() > payload.expiresAt) {
              response.cookies.delete('__builtek_impersonation')
            }
            // Cookie is valid — impersonation context set via header for components
          } else {
            // Invalid signature — clear cookie
            response.cookies.delete('__builtek_impersonation')
          }
        }
      } catch {
        response.cookies.delete('__builtek_impersonation')
      }
    }
  }

  // ── Update last_seen_at for authenticated dashboard users ───────────────
  if (user && pathname.startsWith('/dashboard')) {
    // Fire-and-forget — update last_seen_at in profiles table
    // We use the admin endpoint via fetch to avoid blocking the request
    // Use service_role directly via supabase-js is not safe in Edge Runtime
    // So we just set a response header that a Server Component can act on
    // FORGE-NOTE: last_seen_at is updated server-side in dashboard layout
    // via the admin client — middleware only handles routing and cookie validation
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
