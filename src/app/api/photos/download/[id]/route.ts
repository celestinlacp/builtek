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

  // RLS ensures user can only access photos from their workspace
  const { data: photo } = await supabase
    .from('photos')
    .select('storage_key_cold, name')
    .eq('id', id)
    .single()

  if (!photo?.storage_key_cold) {
    return NextResponse.json({ error: 'Foto no encontrada' }, { status: 404 })
  }

  const fileName = photo.name ?? `foto-${id}`

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET(),
    Key: photo.storage_key_cold,
    ResponseContentDisposition: `attachment; filename="${fileName}"`,
  })

  const url = await getSignedUrl(getR2Client(), command, { expiresIn: 300 })
  return NextResponse.json({ url, name: fileName })
}
