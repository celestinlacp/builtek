import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { detectFileType, getPresignedUploadUrl } from '@/lib/r2/upload'
import { r2IsConfigured } from '@/lib/r2/client'
import { randomUUID } from 'crypto'

/**
 * POST /api/oficios/presign
 *
 * Solicita una URL pre-firmada para subir un archivo de oficio directamente a R2.
 *
 * Body: { workspaceId, tipo, fileName, contentType, fileSize }
 * Response: { uploadUrl, storageKey, fileId, fileType }
 */
export async function POST(req: NextRequest) {
  if (!r2IsConfigured()) {
    return NextResponse.json({ error: 'R2 no configurado en el servidor' }, { status: 503 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const { workspaceId, tipo, fileName, contentType, fileSize } = body

  if (!workspaceId || !tipo || !fileName || !contentType || !fileSize) {
    return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 })
  }

  const { data: member } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()

  if (!member) return NextResponse.json({ error: 'Sin acceso al workspace' }, { status: 403 })

  const fileId    = randomUUID()
  const extension = fileName.split('.').pop()?.toLowerCase() ?? 'bin'
  const storageKey = `${workspaceId}/oficios/${tipo}/${fileId}.${extension}`
  const fileType   = detectFileType(contentType)

  const uploadUrl = await getPresignedUploadUrl({ storageKey, contentType, fileSizeBytes: fileSize })

  return NextResponse.json({ uploadUrl, storageKey, fileId, fileType })
}
