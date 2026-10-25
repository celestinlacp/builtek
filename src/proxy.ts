import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const SUPER_ADMIN_EMAIL = (
  process.env.SUPER_ADMIN_EMAIL ??
  process.env.MASTER_ADMIN_EMAIL ??
  ''
).trim().toLowerCase()

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
    const sigBytes = Uint8Array.from(atob(signature), c => c.charCodeAt(0))
    return await crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(payload))
  } catch {
    return false
  }
}

export default async function proxy(request: NextRequest) {
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

  // Refresca la sesión — IMPORTANTE: no remover esto
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // /signup es alias de /register — redirigir preservando query params
  if (pathname === '/signup') {
    const url = request.nextUrl.clone()
    url.pathname = '/register'
    return NextResponse.redirect(url)
  }

  // ── Protect /super-admin* ─────────────────────────────────────────────────
  if (pathname.startsWith('/super-admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (user.email?.trim().toLowerCase() !== SUPER_ADMIN_EMAIL) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // ── Impersonation cookie verification ─────────────────────────────────────
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
            if (payload.expiresAt && Date.now() > payload.expiresAt) {
              supabaseResponse.cookies.delete('__builtek_impersonation')
            }
          } else {
            supabaseResponse.cookies.delete('__builtek_impersonation')
          }
        }
      } catch {
        supabaseResponse.cookies.delete('__builtek_impersonation')
      }
    }
  }

  // Rutas protegidas — redirigir a login si no hay sesión
  const isProtected =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/tasks') ||
    pathname.startsWith('/calendar') ||
    pathname.startsWith('/documents') ||
    pathname.startsWith('/ai-agent') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/deliverables')

  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Rutas públicas — permitir siempre
  if (
    pathname.startsWith('/invite/') ||
    pathname.startsWith('/invitacion/') ||
    pathname.startsWith('/api/auth/')
  ) {
    return supabaseResponse
  }

  // Si ya está autenticado y va a login/register, redirigir al dashboard
  const isServerAction = request.method === 'POST' && request.headers.has('next-action')
  if (!isServerAction && user && (pathname === '/login' || pathname === '/register' || pathname === '/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
