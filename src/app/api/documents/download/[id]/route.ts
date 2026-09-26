import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getR2Client, R2_BUCKET, r2IsConfigured } from '@/lib/r2/client'

/**
 * GET /api/documents/download/[id]
 * Genera una URL pre-firmada de descarga desde R2 (válida 1 hora).
 * El usuario es redirigido directamente al archivo.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const inline = req.nextUrl.searchParams.get('inline') === '1'

  if (!r2IsConfigured()) {
    return NextResponse.json({ error: 'R2 no configurado en el servidor' }, { status: 503 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: doc } = await supabase
    .from('documents')
    .select('storage_key, file_name')
    .eq('id', id)
    .single()

  if (!doc?.storage_key) {
    return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
  }

  const disposition = inline
    ? `inline; filename="${doc.file_name || 'documento'}"`
    : `attachment; filename="${doc.file_name || 'documento'}"`

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET(),
    Key:    doc.storage_key,
    ResponseContentDisposition: disposition,
  })

  const url = await getSignedUrl(getR2Client(), command, { expiresIn: 3600 })
  return NextResponse.redirect(url)
}
