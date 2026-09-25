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

  const { data: ent } = await supabase
    .from('entregables')
    .select('file_url, file_name, file_type, workspace_id')
    .eq('id', id)
    .single()

  if (!ent) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  // Verificar acceso al workspace
  const { data: member } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', ent.workspace_id)
    .eq('user_id', user.id)
    .single()

  if (!member) return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })

  // file_url es el storageKey
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET(),
    Key:    ent.file_url,
    ResponseContentDisposition: `inline; filename="${ent.file_name}"`,
  })

  const url = await getSignedUrl(getR2Client(), command, { expiresIn: 3600 })
  return NextResponse.redirect(url)
}
