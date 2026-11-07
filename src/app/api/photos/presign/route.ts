import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPresignedUploadUrl } from '@/lib/r2/upload'
import { r2IsConfigured } from '@/lib/r2/client'

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif',
  'image/webp',
]

export async function POST(req: NextRequest) {
  if (!r2IsConfigured()) {
    return NextResponse.json({ error: 'R2 no configurado en el servidor' }, { status: 503 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { workspaceId, fileName, contentType, fileSize, photoId } = await req.json()

  if (!workspaceId || !fileName || !contentType || !fileSize || !photoId) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
  }

  if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
    return NextResponse.json(
      { error: `Tipo de archivo no permitido: ${contentType}. Solo se aceptan imágenes.` },
      { status: 400 }
    )
  }

  // Verificar membresía
  const { data: member } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()

  if (!member) return NextResponse.json({ error: 'Sin acceso al workspace' }, { status: 403 })

  const extension = fileName.split('.').pop()?.toLowerCase() ?? 'jpg'
  const storageKeyCold = `photos/cold/${workspaceId}/${photoId}.${extension}`

  const uploadUrl = await getPresignedUploadUrl({
    storageKey: storageKeyCold,
    contentType,
    fileSizeBytes: fileSize,
  })

  return NextResponse.json({ uploadUrl, storageKeyCold, photoId })
}
