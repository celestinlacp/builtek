import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getR2Client, R2_BUCKET, r2IsConfigured } from '@/lib/r2/client'

/**
 * GET /api/cron/cleanup-temporales
 * Elimina archivos temporales de tareas completadas hace más de 10 días.
 * Protegido con CRON_SECRET en header Authorization.
 * Schedule Railway: 0 9 * * *  (9am diario, junto al cron de tareas)
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Buscar tareas completadas hace más de 10 días
  const cutoff = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()

  const { data: tasks, error: tasksErr } = await admin
    .from('tasks')
    .select('id')
    .eq('status', 'done')
    .lt('completed_at', cutoff)
    .not('completed_at', 'is', null)

  if (tasksErr) return NextResponse.json({ error: tasksErr.message }, { status: 500 })
  if (!tasks?.length) return NextResponse.json({ deleted: 0, message: 'Sin archivos que limpiar' })

  const taskIds = tasks.map(t => t.id)

  // Buscar archivos temporales vinculados a esas tareas (en carpetas is_system)
  const { data: linked, error: linkedErr } = await admin
    .from('task_documents')
    .select('drive_file_id, drive_files(id, storage_key, folder_id, drive_folders(is_system))')
    .in('task_id', taskIds)

  if (linkedErr) return NextResponse.json({ error: linkedErr.message }, { status: 500 })

  const toDelete = (linked ?? []).filter((row: any) => {
    const folder = row.drive_files?.drive_folders
    return folder?.is_system === true
  })

  if (!toDelete.length) return NextResponse.json({ deleted: 0, message: 'Sin temporales que limpiar' })

  let deleted = 0
  const errors: string[] = []

  for (const row of toDelete) {
    const file = row.drive_files as any
    if (!file?.id) continue

    // 1. Borrar de R2
    if (r2IsConfigured() && file.storage_key) {
      try {
        await getR2Client().send(new DeleteObjectCommand({ Bucket: R2_BUCKET(), Key: file.storage_key }))
      } catch (e) {
        errors.push(`R2 ${file.storage_key}: ${e}`)
      }
    }

    // 2. Borrar de BD (cascade elimina task_documents)
    const { error: delErr } = await admin.from('drive_files').delete().eq('id', file.id)
    if (delErr) {
      errors.push(`BD ${file.id}: ${delErr.message}`)
    } else {
      deleted++
    }
  }

  console.log(`[cron/cleanup-temporales] Eliminados: ${deleted}, Errores: ${errors.length}`)
  return NextResponse.json({ deleted, errors: errors.length ? errors : undefined })
}
