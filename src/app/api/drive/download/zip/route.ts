import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getR2Client, R2_BUCKET, r2IsConfigured } from '@/lib/r2/client'
import JSZip from 'jszip'

/**
 * POST /api/drive/download/zip
 * Body: { fileIds: string[] }
 * Descarga múltiples archivos como ZIP. Requiere sesión autenticada.
 */
export async function POST(req: NextRequest) {
  if (!r2IsConfigured()) {
    return NextResponse.json({ error: 'R2 no configurado' }, { status: 503 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const fileIds: string[] = body?.fileIds ?? []
  if (!fileIds.length) return NextResponse.json({ error: 'Sin archivos' }, { status: 400 })

  const { data: files } = await supabase
    .from('drive_files')
    .select('id, storage_key, file_name, name, workspace_id')
    .in('id', fileIds)

  if (!files?.length) return NextResponse.json({ error: 'Archivos no encontrados' }, { status: 404 })

  // Verificar que el usuario tiene acceso al workspace del primer archivo
  const workspaceId = files[0].workspace_id
  const { data: member } = await supabase
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()

  if (!member) return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })

  const zip = new JSZip()
  const r2  = getR2Client()

  // Manejar nombres duplicados
  const nameCount: Record<string, number> = {}

  await Promise.all(
    files.map(async (file) => {
      try {
        const cmd = new GetObjectCommand({ Bucket: R2_BUCKET(), Key: file.storage_key })
        const obj = await r2.send(cmd)
        if (!obj.Body) return
        const bytes = await (obj.Body as any).transformToByteArray()
        const baseName = file.name || file.file_name
        nameCount[baseName] = (nameCount[baseName] ?? 0) + 1
        const entryName = nameCount[baseName] > 1
          ? baseName.replace(/(\.[^.]+)$/, `_${nameCount[baseName]}$1`)
          : baseName
        zip.file(entryName, bytes)
      } catch {
        // Omitir archivos que no se puedan descargar
      }
    })
  )

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })

  return new NextResponse(zipBuffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="seleccion-${files.length}-archivos.zip"`,
      'Content-Length': String(zipBuffer.length),
    },
  })
}
