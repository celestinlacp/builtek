import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getR2Client, R2_BUCKET, r2IsConfigured } from '@/lib/r2/client'

/**
 * GET /api/drive/share/[token]
 * Endpoint público — no requiere auth. Valida el token y sirve el archivo inline.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  if (!r2IsConfigured()) {
    return NextResponse.json({ error: 'Servicio no disponible' }, { status: 503 })
  }

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Buscar share por token
  const { data: share } = await admin
    .from('drive_shares')
    .select('id, file_id, is_active, expires_at, access_count, drive_files(storage_key, file_name, file_type)')
    .eq('token', token)
    .single()

  if (!share || !share.is_active) {
    return new NextResponse('Link no válido o revocado', { status: 404 })
  }

  // Verificar expiración
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return new NextResponse('Este link ha expirado', { status: 410 })
  }

  // Actualizar contador de accesos
  await admin.from('drive_shares').update({
    access_count:  share.access_count + 1,
    last_accessed: new Date().toISOString(),
  }).eq('id', share.id)

  const file = share.drive_files as unknown as { storage_key: string; file_name: string; file_type: string }

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET(),
    Key:    file.storage_key,
    ResponseContentDisposition: `inline; filename="${file.file_name}"`,
  })

  const url = await getSignedUrl(getR2Client(), command, { expiresIn: 3600 })
  return NextResponse.redirect(url)
}
