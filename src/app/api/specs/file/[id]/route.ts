import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getR2Client, R2_BUCKET, r2IsConfigured } from '@/lib/r2/client'

/**
 * GET /api/specs/file/[id]        → visualizar inline
 * GET /api/specs/file/[id]?dl=1   → forzar descarga
 */
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

  const download = req.nextUrl.searchParams.get('dl') === '1'
  const disposition = download
    ? `attachment; filename="${spec.file_name || 'especificacion'}"`
    : `inline; filename="${spec.file_name || 'especificacion'}"`

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET(),
    Key:    spec.storage_key,
    ResponseContentDisposition: disposition,
    ...(spec.file_type ? { ResponseContentType: spec.file_type } : {}),
  })

  const url = await getSignedUrl(getR2Client(), command, { expiresIn: 3600 })
  return NextResponse.redirect(url)
}
