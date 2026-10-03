import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getR2Client, R2_BUCKET, r2IsConfigured } from '@/lib/r2/client'

/**
 * GET /api/documents/share/[token]/file/[docId]
 * Endpoint público — no requiere auth. Sirve un archivo de un documento compartido.
 * Valida que el token sea válido, no expirado, y que el docId pertenezca
 * al mismo doc_key (o sea el mismo documento) que el share.
 *
 * ?dl=1  → fuerza descarga (attachment), sin parámetro → inline
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string; docId: string }> }
) {
  const { token, docId } = await params
  const forceDownload = req.nextUrl.searchParams.get('dl') === '1'

  if (!r2IsConfigured()) {
    return NextResponse.json({ error: 'Servicio no disponible' }, { status: 503 })
  }

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Validar share
  const { data: share } = await admin
    .from('document_shares')
    .select('id, document_id, doc_key, workspace_id, expires_at, is_active')
    .eq('token', token)
    .single()

  if (!share || !share.is_active) {
    return new NextResponse('Link no válido o revocado', { status: 404 })
  }

  if (new Date(share.expires_at) < new Date()) {
    return new NextResponse('Este link ha expirado', { status: 410 })
  }

  // 2. Obtener el documento solicitado
  const { data: doc } = await admin
    .from('documents')
    .select('id, storage_key, file_name, file_type, doc_key, workspace_id')
    .eq('id', docId)
    .single()

  if (!doc || !doc.storage_key) {
    return new NextResponse('Documento no encontrado', { status: 404 })
  }

  // 3. Verificar que el doc pertenece al mismo workspace y doc_key del share
  const sameWorkspace = doc.workspace_id === share.workspace_id
  const authorized =
    doc.id === share.document_id ||
    (share.doc_key && doc.doc_key === share.doc_key)

  if (!sameWorkspace || !authorized) {
    return new NextResponse('No autorizado', { status: 403 })
  }

  // 4. Generar signed URL de R2
  const disposition = forceDownload
    ? `attachment; filename="${doc.file_name ?? 'archivo'}"`
    : `inline; filename="${doc.file_name ?? 'archivo'}"`

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET(),
    Key:    doc.storage_key,
    ResponseContentDisposition: disposition,
  })

  const url = await getSignedUrl(getR2Client(), command, { expiresIn: 3600 })
  return NextResponse.redirect(url)
}
