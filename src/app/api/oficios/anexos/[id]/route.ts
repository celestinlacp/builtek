import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getR2Client, R2_BUCKET, r2IsConfigured } from '@/lib/r2/client'

/**
 * GET /api/oficios/anexos/[id]
 * Genera URL pre-firmada para visualizar/descargar un archivo anexo de oficio.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const forceDownload = req.nextUrl.searchParams.get('download') === '1'

  if (!r2IsConfigured()) {
    return NextResponse.json({ error: 'R2 no configurado' }, { status: 503 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: anexo } = await supabase
    .from('oficio_anexos')
    .select('storage_key, file_name, workspace_id')
    .eq('id', id)
    .single()

  if (!anexo?.storage_key) {
    return NextResponse.json({ error: 'Anexo no encontrado o sin archivo' }, { status: 404 })
  }

  const disposition = forceDownload
    ? `attachment; filename="${anexo.file_name || 'anexo'}"`
    : `inline; filename="${anexo.file_name || 'anexo'}"`

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET(),
    Key:    anexo.storage_key,
    ResponseContentDisposition: disposition,
  })

  const url = await getSignedUrl(getR2Client(), command, { expiresIn: 3600 })
  return NextResponse.redirect(url)
}
