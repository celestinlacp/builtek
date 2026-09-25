import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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

  // Rutas de invitación — permitir siempre (auth callback las maneja)
  if (pathname.startsWith('/invite/') || pathname.startsWith('/api/auth/')) {
    return supabaseResponse
  }

  // Si ya está autenticado y va a login/register, redirigir al dashboard
  // Excluir Server Actions (POST con header Next-Action) para no bloquear acciones del servidor
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
