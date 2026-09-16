import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildStorageKey, detectFileType, getPresignedUploadUrl } from '@/lib/r2/upload'
import { r2IsConfigured } from '@/lib/r2/client'
import { randomUUID } from 'crypto'

/**
 * POST /api/documents/presign
 *
 * Solicita una URL pre-firmada para subir un archivo directamente a R2.
 * El browser sube el archivo a R2 con esa URL; este endpoint solo genera la firma.
 *
 * Body: {
 *   workspaceId:   string
 *   projectId:     string
 *   specialtyCode: string   (ej: "EST", "ARQ")
 *   fileName:      string   (nombre original del archivo)
 *   contentType:   string   (MIME type)
 *   fileSize:      number   (bytes)
 * }
 *
 * Response: {
 *   uploadUrl:  string   (URL pre-firmada, expira en 5 min)
 *   storageKey: string   (key en R2, guardar en documents.storage_key)
 *   fileId:     string   (UUID del archivo)
 *   fileType:   string   (pdf | dwg | docx | xlsx | img | other)
 * }
 */
export async function POST(req: NextRequest) {
  if (!r2IsConfigured()) {
    return NextResponse.json({ error: 'R2 no configurado en el servidor' }, { status: 503 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await req.json()
  const { workspaceId, projectId, specialtyCode, fileName, contentType, fileSize } = body

  if (!workspaceId || !projectId || !specialtyCode || !fileName || !contentType || !fileSize) {
    return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 })
  }

  // Verificar que el usuario pertenece al workspace
  const { data: member } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()

  if (!member) {
    return NextResponse.json({ error: 'Sin acceso al workspace' }, { status: 403 })
  }

  // Verificar que el proyecto pertenece al workspace
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('workspace_id', workspaceId)
    .eq('status', 'active')
    .single()

  if (!project) {
    return NextResponse.json({ error: 'Proyecto no encontrado o inactivo' }, { status: 404 })
  }

  const fileId    = randomUUID()
  const extension = fileName.split('.').pop()?.toLowerCase() ?? 'bin'
  const storageKey = buildStorageKey({ workspaceId, projectId, specialtyCode, fileId, extension })
  const fileType   = detectFileType(contentType)

  const uploadUrl = await getPresignedUploadUrl({ storageKey, contentType, fileSizeBytes: fileSize })

  return NextResponse.json({ uploadUrl, storageKey, fileId, fileType })
}
