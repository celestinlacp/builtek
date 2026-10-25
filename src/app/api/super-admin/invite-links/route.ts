import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const SUPER_ADMIN_EMAIL = (
  process.env.SUPER_ADMIN_EMAIL ??
  process.env.MASTER_ADMIN_EMAIL ??
  ''
).trim().toLowerCase()

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://builtek.mx').replace(/\/$/, '')

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  if (user.email?.trim().toLowerCase() !== SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const { recipient_name, recipient_company, trial_days = 30 } = await request.json()

  if (!recipient_name) return NextResponse.json({ error: 'recipient_name requerido' }, { status: 400 })
  if (trial_days < 14 || trial_days > 90) {
    return NextResponse.json({ error: 'trial_days debe estar entre 14 y 90' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: invite, error } = await admin
    .from('invite_links')
    .insert({
      recipient_name,
      recipient_company: recipient_company || null,
      trial_days,
      created_by: user.id,
    })
    .select('id, token, recipient_name, recipient_company, trial_days, status, open_count, opened_at, used_at, expires_at, created_at')
    .single()

  if (error || !invite) {
    return NextResponse.json({ error: error?.message || 'Error al crear invite' }, { status: 500 })
  }

  const url = `${APP_URL}/invitacion/${invite.token}`

  return NextResponse.json({ success: true, url, invite })
}
