import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
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

  const { data: project } = await supabase
    .from('projects')
    .select('cover_image_url')
    .eq('id', id)
    .single()

  if (!project?.cover_image_url) {
    return NextResponse.json({ error: 'Sin portada' }, { status: 404 })
  }

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET(),
    Key: project.cover_image_url,
    ResponseContentDisposition: 'inline',
  })

  const url = await getSignedUrl(getR2Client(), command, { expiresIn: 3600 })
  return NextResponse.redirect(url)
}

/** DELETE /api/projects/[id]/cover — borra la portada actual de R2 */
export async function DELETE(
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

  // Solo owner/admin puede borrar
  const { data: member } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!member || !['owner', 'admin'].includes(member.role)) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  const { data: project } = await supabase
    .from('projects')
    .select('cover_image_url')
    .eq('id', id)
    .single()

  if (!project?.cover_image_url) {
    return NextResponse.json({ ok: true }) // nada que borrar
  }

  await getR2Client().send(new DeleteObjectCommand({
    Bucket: R2_BUCKET(),
    Key: project.cover_image_url,
  }))

  return NextResponse.json({ ok: true })
}
