import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3'
import { getR2Client, R2_BUCKET, r2IsConfigured } from '@/lib/r2/client'

/**
 * GET  /api/admin/r2-cleanup?secret=XXX&dry=1  → solo reporta huérfanos sin borrar
 * POST /api/admin/r2-cleanup?secret=XXX         → elimina los huérfanos
 */

function getAdmin() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getActiveKeys(): Promise<Set<string>> {
  const admin = getAdmin()
  const keys = new Set<string>()

  // Documentos activos/archived (no deleted)
  const { data: docs } = await admin
    .from('documents')
    .select('storage_key')
    .not('storage_key', 'is', null)
    .neq('doc_status', 'deleted')
  docs?.forEach(d => d.storage_key && keys.add(d.storage_key))

  // Drive files
  const { data: drive } = await admin
    .from('drive_files')
    .select('storage_key')
    .not('storage_key', 'is', null)
  drive?.forEach(d => d.storage_key && keys.add(d.storage_key))

  // Covers de proyectos
  const { data: projects } = await admin
    .from('projects')
    .select('cover_image_url')
    .not('cover_image_url', 'is', null)
  projects?.forEach(p => p.cover_image_url && keys.add(p.cover_image_url))

  return keys
}

async function listAllR2Objects(): Promise<{ key: string; size: number }[]> {
  const r2 = getR2Client()
  const bucket = R2_BUCKET()
  const objects: { key: string; size: number }[] = []
  let continuationToken: string | undefined

  do {
    const res = await r2.send(new ListObjectsV2Command({
      Bucket:            bucket,
      ContinuationToken: continuationToken,
    }))
    res.Contents?.forEach(obj => {
      if (obj.Key) objects.push({ key: obj.Key, size: obj.Size ?? 0 })
    })
    continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined
  } while (continuationToken)

  return objects
}

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get('secret') !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  if (!r2IsConfigured()) {
    return NextResponse.json({ error: 'R2 no configurado' }, { status: 503 })
  }

  const activeKeys = await getActiveKeys()
  const allObjects = await listAllR2Objects()

  const orphans = allObjects.filter(o => !activeKeys.has(o.key))
  const totalOrphanMB = (orphans.reduce((s, o) => s + o.size, 0) / 1024 / 1024).toFixed(2)
  const totalActiveMB = (allObjects.filter(o => activeKeys.has(o.key)).reduce((s, o) => s + o.size, 0) / 1024 / 1024).toFixed(2)

  return NextResponse.json({
    total_objects:    allObjects.length,
    active_objects:   activeKeys.size,
    orphan_objects:   orphans.length,
    orphan_mb:        totalOrphanMB,
    active_mb:        totalActiveMB,
    orphans:          orphans.map(o => ({ key: o.key, mb: (o.size / 1024 / 1024).toFixed(2) })),
  })
}

export async function POST(req: NextRequest) {
  if (req.nextUrl.searchParams.get('secret') !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  if (!r2IsConfigured()) {
    return NextResponse.json({ error: 'R2 no configurado' }, { status: 503 })
  }

  const activeKeys = await getActiveKeys()
  const allObjects = await listAllR2Objects()
  const orphans    = allObjects.filter(o => !activeKeys.has(o.key))

  if (!orphans.length) {
    return NextResponse.json({ deleted: 0, message: 'Sin huérfanos — R2 limpio' })
  }

  // R2 acepta hasta 1000 objetos por delete batch
  const batches: { key: string }[][] = []
  for (let i = 0; i < orphans.length; i += 1000) {
    batches.push(orphans.slice(i, i + 1000).map(o => ({ key: o.key })))
  }

  let deleted = 0
  for (const batch of batches) {
    await getR2Client().send(new DeleteObjectsCommand({
      Bucket: R2_BUCKET(),
      Delete: { Objects: batch.map(o => ({ Key: o.key })) },
    }))
    deleted += batch.length
  }

  const freedMB = (orphans.reduce((s, o) => s + o.size, 0) / 1024 / 1024).toFixed(2)

  return NextResponse.json({
    deleted,
    freed_mb: freedMB,
    message:  `${deleted} archivos huérfanos eliminados de R2 (${freedMB} MB liberados)`,
  })
}
