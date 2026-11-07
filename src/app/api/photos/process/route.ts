import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getR2Client, R2_BUCKET, r2IsConfigured } from '@/lib/r2/client'

function getAdminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function streamToBuffer(stream: ReadableStream): Promise<Buffer> {
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
  }
  return Buffer.concat(chunks)
}

async function processPhotoBackground(params: {
  workspaceId: string
  projectId: string | null
  photoId: string
  name: string | null
  capturedAt: string
  storageKeyCold: string
  fileSize: number
  width: number | null
  height: number | null
  exifData: unknown
}) {
  const {
    workspaceId, projectId, photoId, name, capturedAt,
    storageKeyCold, fileSize, width, height, exifData,
  } = params

  const admin = getAdminClient()
  const storageKeyHot = `photos/hot/${workspaceId}/${photoId}.webp`

  let finalStorageKeyHot = storageKeyHot
  let tierStorage: 'hot' | 'cold' = 'hot'

  try {
    if (!r2IsConfigured()) throw new Error('R2 no configurado')

    const r2 = getR2Client()

    // Download original from R2
    const getCmd = new GetObjectCommand({
      Bucket: R2_BUCKET(),
      Key: storageKeyCold,
    })
    const getResult = await r2.send(getCmd)
    if (!getResult.Body) throw new Error('No se pudo descargar el original')

    const originalBuffer = await streamToBuffer(getResult.Body as ReadableStream)

    // Generate WebP thumbnail 400px with Sharp
    const sharp = (await import('sharp')).default
    const thumbnailBuffer = await sharp(originalBuffer)
      .resize(400, undefined, { withoutEnlargement: true, fit: 'inside' })
      .webp({ quality: 85 })
      .toBuffer()

    // Upload thumbnail to hot prefix
    const putCmd = new PutObjectCommand({
      Bucket: R2_BUCKET(),
      Key: storageKeyHot,
      Body: thumbnailBuffer,
      ContentType: 'image/webp',
    })
    await r2.send(putCmd)
  } catch (err) {
    console.error('[photos/process] Sharp/R2 error, using cold fallback:', err)
    // Fallback: use cold key as hot
    finalStorageKeyHot = storageKeyCold
    tierStorage = 'cold'
  }

  // Insert into DB via admin client (bypasses RLS for background job)
  const { error } = await admin.from('photos').insert({
    id:               photoId,
    workspace_id:     workspaceId,
    project_id:       projectId ?? null,
    name:             name ?? null,
    captured_at:      capturedAt,
    storage_key_hot:  finalStorageKeyHot,
    storage_key_cold: storageKeyCold,
    file_size:        fileSize ?? null,
    width:            width ?? null,
    height:           height ?? null,
    tier_storage:     tierStorage,
    exif_data:        exifData ?? null,
  })

  if (error) {
    console.error('[photos/process] DB insert error:', error)
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const {
    workspaceId,
    projectId,
    photoId,
    name,
    capturedAt,
    storageKeyCold,
    fileSize,
    width,
    height,
    exifData,
  } = body

  if (!workspaceId || !photoId || !capturedAt || !storageKeyCold) {
    return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 })
  }

  // Verificar membresía al workspace
  const { data: member } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()

  if (!member) return NextResponse.json({ error: 'Sin acceso al workspace' }, { status: 403 })

  // Fire and forget — respond 202 immediately
  processPhotoBackground({
    workspaceId,
    projectId: projectId ?? null,
    photoId,
    name: name ?? null,
    capturedAt,
    storageKeyCold,
    fileSize: fileSize ?? 0,
    width: width ?? null,
    height: height ?? null,
    exifData: exifData ?? null,
  }).catch(console.error)

  return NextResponse.json({ accepted: true }, { status: 202 })
}
