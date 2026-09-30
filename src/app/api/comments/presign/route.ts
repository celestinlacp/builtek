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

  const { workspaceId, taskId, fileName, contentType, fileSize } = await req.json()
  if (!workspaceId || !taskId || !fileName || !fileSize) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
  }

  const { data: member } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()

  if (!member) return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })

  const ext        = fileName.split('.').pop()?.toLowerCase() ?? 'jpg'
  const ct         = contentType || 'image/jpeg'
  const storageKey = `${workspaceId}/comments/${taskId}/${randomUUID()}.${ext}`
  const uploadUrl  = await getPresignedUploadUrl({ storageKey, contentType: ct, fileSizeBytes: fileSize })

  return NextResponse.json({ uploadUrl, storageKey })
}
