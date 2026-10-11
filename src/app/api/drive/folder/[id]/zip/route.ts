import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getR2Client, R2_BUCKET, r2IsConfigured } from '@/lib/r2/client'
import JSZip from 'jszip'

/**
 * GET /api/drive/folder/[id]/zip
 * Descarga todos los archivos de una carpeta (y subcarpetas) como ZIP.
 * Requiere sesión autenticada con acceso al workspace.
 */
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

  const { data: folder } = await supabase
    .from('drive_folders')
    .select('id, name, workspace_id')
    .eq('id', id)
    .single()

  if (!folder) return NextResponse.json({ error: 'Carpeta no encontrada' }, { status: 404 })

  const { data: member } = await supabase
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', folder.workspace_id)
    .eq('user_id', user.id)
    .single()

  if (!member) return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })

  type FolderInfo = { id: string; name: string; parent_folder_id: string | null }
  const folderMap: Record<string, FolderInfo> = {
    [folder.id]: { id: folder.id, name: folder.name, parent_folder_id: null },
  }
  const queue: string[] = [folder.id]
  while (queue.length > 0) {
    const parentId = queue.shift()!
    const { data: children } = await supabase
      .from('drive_folders')
      .select('id, name, parent_folder_id')
      .eq('parent_folder_id', parentId)
    for (const child of (children ?? [])) {
      folderMap[child.id] = child
      queue.push(child.id)
    }
  }

  const buildPath = (folderId: string): string => {
    const parts: string[] = []
    let current: string | null = folderId
    while (current && current !== folder.id) {
      const f: FolderInfo | undefined = folderMap[current]
      if (!f) break
      parts.unshift(f.name)
      current = f.parent_folder_id
    }
    return parts.join('/')
  }

  const allFolderIds = Object.keys(folderMap)
  const { data: files } = await supabase
    .from('drive_files')
    .select('storage_key, file_name, name, folder_id')
    .in('folder_id', allFolderIds)
    .order('name')

  if (!files || files.length === 0) {
    return new NextResponse('No hay archivos en esta carpeta', { status: 404 })
  }

  const zip = new JSZip()
  const r2  = getR2Client()

  await Promise.all(
    files.map(async (file) => {
      try {
        const cmd = new GetObjectCommand({ Bucket: R2_BUCKET(), Key: file.storage_key })
        const obj = await r2.send(cmd)
        if (!obj.Body) return
        const bytes = await (obj.Body as any).transformToByteArray()
        const dir   = file.folder_id ? buildPath(file.folder_id) : ''
        const entry = dir ? `${dir}/${file.name || file.file_name}` : (file.name || file.file_name)
        zip.file(entry, bytes)
      } catch {
        // Omitir archivos que no se puedan descargar
      }
    })
  )

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
  const safeName  = folder.name.replace(/[^a-zA-Z0-9\-_. ]/g, '_').trim()

  return new NextResponse(zipBuffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${safeName}.zip"`,
      'Content-Length': String(zipBuffer.length),
    },
  })
}
