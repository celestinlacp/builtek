import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getR2Client, R2_BUCKET, r2IsConfigured } from '@/lib/r2/client'

const TYPE_TO_MIME: Record<string, string> = {
  pdf:  'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  dwg:  'application/dwg',
  dxf:  'application/dxf',
  img:  'image/jpeg',
  png:  'image/png',
  jpg:  'image/jpeg',
  other:'application/octet-stream',
}

/**
 * GET /api/share/[token]/file?type=document|entregable&id=xxx&dl=1
 * Público — sirve archivos validando el token de proyecto compartido.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const type      = req.nextUrl.searchParams.get('type')   // 'document' | 'entregable'
  const id        = req.nextUrl.searchParams.get('id')
  const download  = req.nextUrl.searchParams.get('dl') === '1'

  if (!id || !type) {
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
  }

  if (!r2IsConfigured()) {
    return NextResponse.json({ error: 'Servicio no disponible' }, { status: 503 })
  }

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Validar token
  const { data: share } = await admin
    .from('project_shares')
    .select('project_id, expires_at')
    .eq('token', token)
    .single()

  if (!share || new Date(share.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Link inválido o expirado' }, { status: 410 })
  }

  let storageKey: string
  let fileName: string
  let fileType: string

  if (type === 'document') {
    const { data: doc } = await admin
      .from('documents')
      .select('storage_key, file_name, doc_key, file_type, project_id')
      .eq('id', id)
      .single()

    if (!doc?.storage_key) {
      return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 })
    }

    // Verificar que el doc pertenece al proyecto raíz o a alguno de sus subproyectos
    const { data: subprojects } = await admin
      .from('projects')
      .select('id')
      .eq('parent_project_id', share.project_id)

    const validIds = new Set([share.project_id, ...(subprojects ?? []).map(s => s.id)])
    if (!validIds.has(doc.project_id)) {
      return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })
    }

    storageKey = doc.storage_key
    fileName   = doc.file_name || doc.doc_key || 'documento'
    fileType   = doc.file_type || 'other'

  } else if (type === 'entregable') {
    const { data: ent } = await admin
      .from('entregables')
      .select('file_url, file_name, file_type, task_id')
      .eq('id', id)
      .single()

    if (!ent?.file_url) {
      return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 })
    }

    // Verificar que el entregable pertenece al proyecto
    const { data: task } = await admin
      .from('tasks')
      .select('project_id')
      .eq('id', ent.task_id)
      .single()

    if (!task || task.project_id !== share.project_id) {
      return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })
    }

    storageKey = ent.file_url
    fileName   = ent.file_name || 'entregable'
    fileType   = ent.file_type || 'other'

  } else {
    return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
  }

  const mimeType    = TYPE_TO_MIME[fileType] ?? 'application/octet-stream'
  const safeFileName = encodeURIComponent(fileName)
  const disposition  = download
    ? `attachment; filename="${safeFileName}"`
    : `inline; filename="${safeFileName}"`

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET(),
    Key:    storageKey,
    ResponseContentDisposition: disposition,
    ResponseContentType:        mimeType,
  })

  const url = await getSignedUrl(getR2Client(), command, { expiresIn: 3600 })
  return NextResponse.redirect(url, 302)
}
