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

  // RLS ensures user can only see photos from their workspace
  const { data: photo } = await supabase
    .from('photos')
    .select('storage_key_hot, name')
    .eq('id', id)
    .single()

  if (!photo?.storage_key_hot) {
    return NextResponse.json({ error: 'Foto no encontrada' }, { status: 404 })
  }

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET(),
    Key: photo.storage_key_hot,
    ResponseContentDisposition: `inline; filename="${photo.name ?? id}"`,
  })

  const url = await getSignedUrl(getR2Client(), command, { expiresIn: 3600 })
  return NextResponse.redirect(url)
}
