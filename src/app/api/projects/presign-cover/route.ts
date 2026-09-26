import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPresignedUploadUrl } from '@/lib/r2/upload'
import { r2IsConfigured } from '@/lib/r2/client'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  if (!r2IsConfigured()) {
    return NextResponse.json({ error: 'R2 no configurado' }, { status: 503 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { projectId, workspaceId, contentType, extension } = await req.json()
  if (!projectId || !workspaceId || !contentType || !extension) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
  }

  const { data: member } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()

  if (!member || !['owner', 'admin'].includes(member.role)) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  const fileId = randomUUID()
  const storageKey = `${workspaceId}/covers/${projectId}/${fileId}.${extension}`
  const uploadUrl = await getPresignedUploadUrl({ storageKey, contentType, fileSizeBytes: 0 })

  return NextResponse.json({ uploadUrl, storageKey })
}
