import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getR2Client, R2_BUCKET, r2IsConfigured } from '@/lib/r2/client'

/**
 * GET /api/documents/view/[id]
 * Genera una URL pre-firmada para visualizar el archivo inline en el browser.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!r2IsConfigured()) {
    return NextResponse.json({ error: 'R2 no configurado en el servidor' }, { status: 503 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: doc } = await supabase
    .from('documents')
    .select('storage_key, file_name, file_type')
    .eq('id', id)
    .single()

  if (!doc?.storage_key) {
    return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
  }

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET(),
    Key:    doc.storage_key,
    ResponseContentDisposition: `inline; filename="${doc.file_name || 'documento'}"`,
  })

  const url = await getSignedUrl(getR2Client(), command, { expiresIn: 3600 })
  return NextResponse.redirect(url)
}
