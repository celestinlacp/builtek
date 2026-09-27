import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getR2Client, R2_BUCKET, r2IsConfigured } from '@/lib/r2/client'

/**
 * GET /api/specs/file/[id]        → visualizar inline
 * GET /api/specs/file/[id]?dl=1   → forzar descarga
 */

// Mapeo de tipo corto → MIME completo para ResponseContentType en R2
const TYPE_TO_MIME: Record<string, string> = {
  pdf:  'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  dwg:  'application/dwg',
  dxf:  'application/dxf',
  img:  'image/jpeg',
  other:'application/octet-stream',
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!r2IsConfigured()) {
    return NextResponse.json({ error: 'R2 no configurado' }, { status: 503 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: spec } = await supabase
    .from('design_specs')
    .select('storage_key, file_name, file_type, workspace_id')
    .eq('id', id)
    .single()

  if (!spec?.storage_key) {
    return NextResponse.json({ error: 'Especificación no encontrada' }, { status: 404 })
  }

  const download    = req.nextUrl.searchParams.get('dl') === '1'
  const fileName    = encodeURIComponent(spec.file_name || 'especificacion')
  const disposition = download
    ? `attachment; filename="${fileName}"`
    : `inline; filename="${fileName}"`
  const mimeType    = TYPE_TO_MIME[spec.file_type ?? ''] ?? 'application/octet-stream'

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET(),
    Key:    spec.storage_key,
    ResponseContentDisposition: disposition,
    ResponseContentType:        mimeType,
  })

  const url = await getSignedUrl(getR2Client(), command, { expiresIn: 3600 })
  // Redirect directo → el browser abre el PDF inline sin pasos intermedios
  return NextResponse.redirect(url, 302)
}
