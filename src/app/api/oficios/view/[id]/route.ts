import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getR2Client, R2_BUCKET, r2IsConfigured } from '@/lib/r2/client'

/**
 * GET /api/oficios/view/[id]
 * Genera una URL pre-firmada para visualizar el archivo del oficio inline en el browser.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const forceDownload = req.nextUrl.searchParams.get('download') === '1'

  if (!r2IsConfigured()) {
    return NextResponse.json({ error: 'R2 no configurado en el servidor' }, { status: 503 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: oficio } = await supabase
    .from('oficios')
    .select('storage_key, file_name, file_type, workspace_id')
    .eq('id', id)
    .single()

  if (!oficio?.storage_key) {
    return NextResponse.json({ error: 'Oficio no encontrado o sin archivo' }, { status: 404 })
  }

  const disposition = forceDownload
    ? `attachment; filename="${oficio.file_name || 'oficio'}"`
    : `inline; filename="${oficio.file_name || 'oficio'}"`

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET(),
    Key:    oficio.storage_key,
    ResponseContentDisposition: disposition,
  })

  const url = await getSignedUrl(getR2Client(), command, { expiresIn: 3600 })
  return NextResponse.redirect(url)
}
