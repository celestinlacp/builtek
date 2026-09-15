import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  if (!code) return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin?error=dropbox`)

  // Intercambiar code por access token
  const tokenRes = await fetch('https://api.dropboxapi.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      client_id: process.env.DROPBOX_APP_KEY!,
      client_secret: process.env.DROPBOX_APP_SECRET!,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/dropbox/callback`,
    }),
  })

  const token = await tokenRes.json()
  if (!token.access_token) return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin?error=dropbox_token`)

  // Obtener workspace del usuario
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login`)

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/onboarding`)

  // Guardar token en workspace
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  await admin.from('workspaces').update({
    dropbox_token: token.access_token,
    dropbox_account: token.account_id,
  }).eq('id', membership.workspace_id)

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin?dropbox=connected`)
}
