import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getR2Client, R2_BUCKET, r2IsConfigured } from '@/lib/r2/client'

/**
 * GET /api/share/[token]/cover
 * Público — devuelve la portada del proyecto asociado al token.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  if (!r2IsConfigured()) {
    return new NextResponse(null, { status: 404 })
  }

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: share } = await admin
    .from('project_shares')
    .select('project_id, expires_at')
    .eq('token', token)
    .single()

  if (!share || new Date(share.expires_at) < new Date()) {
    return new NextResponse(null, { status: 404 })
  }

  const { data: project } = await admin
    .from('projects')
    .select('cover_image_url')
    .eq('id', share.project_id)
    .single()

  if (!project?.cover_image_url) {
    return new NextResponse(null, { status: 404 })
  }

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET(),
    Key:    project.cover_image_url,
    ResponseContentDisposition: 'inline',
  })

  const url = await getSignedUrl(getR2Client(), command, { expiresIn: 3600 })
  return NextResponse.redirect(url, 302)
}
