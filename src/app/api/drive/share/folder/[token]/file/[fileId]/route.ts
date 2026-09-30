import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getR2Client, R2_BUCKET, r2IsConfigured } from '@/lib/r2/client'

/**
 * GET /api/drive/share/folder/[token]/file/[fileId]
 * Endpoint público — valida el token de carpeta compartida y sirve el archivo.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string; fileId: string }> }
) {
  const { token, fileId } = await params

  if (!r2IsConfigured()) {
    return NextResponse.json({ error: 'Servicio no disponible' }, { status: 503 })
  }

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Validar el share de carpeta
  const { data: share } = await admin
    .from('drive_shares')
    .select('id, folder_id, is_active, expires_at')
    .eq('token', token)
    .not('folder_id', 'is', null)
    .single()

  if (!share || !share.is_active) {
    return new NextResponse('Link no válido o revocado', { status: 404 })
  }

  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return new NextResponse('Este link ha expirado', { status: 410 })
  }

  // Verificar que el archivo pertenece a la carpeta compartida
  const { data: file } = await admin
    .from('drive_files')
    .select('storage_key, file_name, file_type')
    .eq('id', fileId)
    .eq('folder_id', share.folder_id)
    .single()

  if (!file) {
    return new NextResponse('Archivo no encontrado en esta carpeta', { status: 404 })
  }

  // Actualizar timestamp de último acceso
  await admin.from('drive_shares').update({
    last_accessed: new Date().toISOString(),
  }).eq('id', share.id)

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET(),
    Key:    file.storage_key,
    ResponseContentDisposition: `inline; filename="${file.file_name}"`,
  })

  const url = await getSignedUrl(getR2Client(), command, { expiresIn: 3600 })
  return NextResponse.redirect(url)
}
