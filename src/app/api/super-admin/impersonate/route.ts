import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const SUPER_ADMIN_EMAIL = (
  process.env.SUPER_ADMIN_EMAIL ??
  process.env.MASTER_ADMIN_EMAIL ??
  ''
).trim().toLowerCase()

async function signHmac(payload: string, secret: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(payload))
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  if (user.email?.trim().toLowerCase() !== SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const secret = process.env.SUPER_ADMIN_SECRET
  if (!secret) return NextResponse.json({ error: 'SUPER_ADMIN_SECRET no configurado' }, { status: 500 })

  const { workspaceId } = await request.json()
  if (!workspaceId) return NextResponse.json({ error: 'workspaceId requerido' }, { status: 400 })

  const admin = createAdminClient()
  const { data: ws } = await admin
    .from('workspaces')
    .select('id, owner_id, name')
    .eq('id', workspaceId)
    .single()

  if (!ws) return NextResponse.json({ error: 'Workspace no encontrado' }, { status: 404 })

  const payload = {
    workspaceId: ws.id,
    ownerId: ws.owner_id,
    originalUserId: user.id,
    workspaceName: ws.name,
    expiresAt: Date.now() + 2 * 60 * 60 * 1000, // 2 hours
  }

  const payloadB64 = btoa(JSON.stringify(payload))
  const sig = await signHmac(payloadB64, secret)
  const cookieValue = `${payloadB64}.${sig}`

  const response = NextResponse.json({ success: true })
  response.cookies.set('__builtek_impersonation', cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 2 * 60 * 60, // 2 hours
    path: '/',
  })

  return response
}
