import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getR2Client, R2_BUCKET, r2IsConfigured } from '@/lib/r2/client'
import JSZip from 'jszip'

/**
 * GET /api/drive/share/folder/[token]/zip
 * Descarga todos los archivos de la carpeta compartida como ZIP.
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

  const { data: share } = await admin
    .from('drive_shares')
    .select('id, folder_id, is_active, expires_at, label, drive_folders(name)')
    .eq('token', token)
    .not('folder_id', 'is', null)
    .single()

  if (!share || !share.is_active) {
    return new NextResponse('Link no válido', { status: 404 })
  }

  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return new NextResponse('Link expirado', { status: 410 })
  }

  const { data: files } = await admin
    .from('drive_files')
    .select('storage_key, file_name, name')
    .eq('folder_id', share.folder_id)
    .order('name')

  if (!files || files.length === 0) {
    return new NextResponse('No hay archivos en esta carpeta', { status: 404 })
  }

  const zip = new JSZip()
  const r2 = getR2Client()

  await Promise.all(
    files.map(async (file) => {
      try {
        const cmd = new GetObjectCommand({ Bucket: R2_BUCKET(), Key: file.storage_key })
        const obj = await r2.send(cmd)
        if (!obj.Body) return
        const bytes = await (obj.Body as any).transformToByteArray()
        zip.file(file.name || file.file_name, bytes)
      } catch {
        // Skip files that can't be fetched — don't fail the whole ZIP
      }
    })
  )

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })

  const folderName = share.label || (share.drive_folders as any)?.name || 'carpeta'
  const safeName = folderName.replace(/[^a-zA-Z0-9\-_. ]/g, '_').trim()

  return new NextResponse(zipBuffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${safeName}.zip"`,
      'Content-Length': String(zipBuffer.length),
    },
  })
}
