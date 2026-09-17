import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getR2Client, R2_BUCKET, r2IsConfigured } from '@/lib/r2/client'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!r2IsConfigured()) {
    return NextResponse.json({ error: 'R2 no configurado' }, { status: 503 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: file } = await supabase
    .from('drive_files')
    .select('storage_key, file_name')
    .eq('id', id)
    .single()

  if (!file?.storage_key) {
    return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 })
  }

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET(),
    Key:    file.storage_key,
    ResponseContentDisposition: `inline; filename="${file.file_name}"`,
  })

  const url = await getSignedUrl(getR2Client(), command, { expiresIn: 3600 })
  return NextResponse.redirect(url)
}
