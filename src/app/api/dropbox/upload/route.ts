import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) return NextResponse.json({ error: 'Sin workspace' }, { status: 400 })

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: workspace } = await admin
    .from('workspaces')
    .select('dropbox_token')
    .eq('id', membership.workspace_id)
    .single()

  if (!workspace?.dropbox_token) {
    return NextResponse.json({ error: 'Dropbox no conectado' }, { status: 400 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File
  const projectName = formData.get('project_name') as string || 'General'
  const specialty = formData.get('specialty') as string || 'General'

  if (!file) return NextResponse.json({ error: 'Sin archivo' }, { status: 400 })

  const dropboxPath = `/Builtek/${projectName}/${specialty}/${file.name}`
  const fileBuffer = await file.arrayBuffer()

  // Subir a Dropbox
  const uploadRes = await fetch('https://content.dropboxapi.com/2/files/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${workspace.dropbox_token}`,
      'Content-Type': 'application/octet-stream',
      'Dropbox-API-Arg': JSON.stringify({
        path: dropboxPath,
        mode: 'add',
        autorename: true,
        mute: false,
      }),
    },
    body: fileBuffer,
  })

  if (!uploadRes.ok) {
    const err = await uploadRes.text()
    return NextResponse.json({ error: 'Error al subir a Dropbox', detail: err }, { status: 500 })
  }

  const uploaded = await uploadRes.json()

  // Crear link compartible
  const linkRes = await fetch('https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${workspace.dropbox_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ path: uploaded.path_display }),
  })

  const linkData = await linkRes.json()
  const shareUrl = linkData.url?.replace('?dl=0', '?raw=1') || linkData.url

  return NextResponse.json({
    path: uploaded.path_display,
    url: shareUrl,
    name: uploaded.name,
    size: uploaded.size,
  })
}
