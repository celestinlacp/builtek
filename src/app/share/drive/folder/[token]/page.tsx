import { createClient as createAdmin } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { Calendar } from 'lucide-react'
import type { Metadata } from 'next'
import { FolderShareContent } from './FolderShareContent'

export const dynamic = 'force-dynamic'

// ── Metadata ───────────────────────────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: Promise<{ token: string }> }
): Promise<Metadata> {
  const { token } = await params
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: share } = await admin
    .from('drive_shares')
    .select('label, drive_folders(name)')
    .eq('token', token)
    .single()
  const name  = share?.label || (share?.drive_folders as any)?.name
  const title = name ?? 'Carpeta compartida'
  const description = 'Accede y descarga los archivos de esta carpeta compartida desde Builtek.'
  return {
    title: `${title} — Builtek`,
    description,
    openGraph: { title, description, siteName: 'Builtek', images: [{ url: '/api/og', width: 256, height: 256 }] },
    twitter:   { card: 'summary', title, description, images: ['/api/og'] },
  }
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function FolderSharePage(
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: share } = await admin
    .from('drive_shares')
    .select('id, is_active, expires_at, label, workspace_id, folder_id, drive_folders(name)')
    .eq('token', token)
    .not('folder_id', 'is', null)
    .single()

  if (!share || !share.is_active) return notFound()

  const folderName = share.label || (share.drive_folders as any)?.name || 'Carpeta compartida'
  const expired    = share.expires_at && new Date(share.expires_at) < new Date()

  // Workspace name
  const { data: ws } = await admin
    .from('workspaces')
    .select('name')
    .eq('id', share.workspace_id)
    .single()

  // Collect all subfolder IDs recursively (BFS)
  type FolderInfo = { id: string; name: string; parent_folder_id: string | null }
  const folderMap: Record<string, FolderInfo> = {
    [share.folder_id]: { id: share.folder_id, name: folderName, parent_folder_id: null },
  }
  const queue: string[] = [share.folder_id]
  while (queue.length > 0) {
    const parentId = queue.shift()!
    const { data: children } = await admin
      .from('drive_folders')
      .select('id, name, parent_folder_id')
      .eq('parent_folder_id', parentId)
      .eq('workspace_id', share.workspace_id)
    for (const child of (children ?? [])) {
      folderMap[child.id] = child
      queue.push(child.id)
    }
  }

  // Build relative path from shared root for a given folder_id
  const buildPath = (folderId: string | null): string | undefined => {
    if (!folderId || folderId === share.folder_id) return undefined
    const parts: string[] = []
    let current: string | null = folderId
    while (current && current !== share.folder_id) {
      const f: FolderInfo | undefined = folderMap[current]
      if (!f) break
      parts.unshift(f.name)
      current = f.parent_folder_id
    }
    return parts.length > 0 ? parts.join(' / ') : undefined
  }

  // Files in folder + all subfolders
  const allFolderIds = Object.keys(folderMap)
  const { data: rawFiles } = await admin
    .from('drive_files')
    .select('id, name, file_name, file_type, file_size, created_at, uploaded_by, folder_id')
    .in('folder_id', allFolderIds)
    .order('name')

  const files = rawFiles ?? []

  // Resolve uploader names
  const uploaderIds = [...new Set(files.map(f => f.uploaded_by).filter(Boolean))]
  const uploaderMap: Record<string, string> = {}
  if (uploaderIds.length > 0) {
    const { data: users } = await admin
      .from('users')
      .select('id, full_name')
      .in('id', uploaderIds)
    for (const u of (users ?? [])) {
      if (u.id && u.full_name) uploaderMap[u.id] = u.full_name
    }
  }

  const enrichedFiles = files.map(f => ({
    id:             f.id,
    name:           f.name,
    file_name:      f.file_name,
    file_type:      f.file_type,
    file_size:      f.file_size,
    created_at:     f.created_at,
    uploader:       f.uploaded_by ? uploaderMap[f.uploaded_by] : undefined,
    subfolder_name: buildPath(f.folder_id),
  }))

  const expiresFormatted = share.expires_at
    ? new Date(share.expires_at).toLocaleString('es-MX', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : null

  return (
    <div className="min-h-screen bg-white">

      {/* ── Topbar ─────────────────────────────────────────────────────────── */}
      <header className="border-b border-slate-100 bg-white">
        <div className="max-w-4xl mx-auto px-6 h-12 flex items-center justify-between">
          {/* BT logo mark */}
          <div className="flex items-center gap-2">
            <div
              className="flex items-center justify-center w-7 h-7 rounded-[6px]"
              style={{ background: '#1A2744' }}
            >
              <span className="text-[13px] font-black leading-none" style={{ letterSpacing: '-0.5px' }}>
                <span style={{ color: '#00C2FF' }}>B</span>
                <span style={{ color: '#ffffff' }}>T</span>
              </span>
            </div>
            <span className="text-sm font-bold text-slate-800 tracking-tight">Builtek</span>
          </div>
          <span className="text-xs text-slate-400">Vista compartida</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        {expired ? (
          /* ── Expired ─────────────────────────────────────────────────────── */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-amber-400" />
            </div>
            <h1 className="text-lg font-bold text-slate-800 mb-1">Este link ha expirado</h1>
            <p className="text-sm text-slate-400 max-w-xs">
              Venció el{' '}
              {new Date(share.expires_at!).toLocaleString('es-MX', {
                day: 'numeric', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}.{' '}
              Solicita un nuevo link al responsable del proyecto.
            </p>
            <p className="text-xs text-slate-300 mt-8 font-medium">Builtek · Gestión de proyectos AEC</p>
          </div>

        ) : (
          /* ── Content ─────────────────────────────────────────────────────── */
          <FolderShareContent
            files={enrichedFiles}
            token={token}
            folderName={folderName}
            wsName={ws?.name}
            expiresFormatted={expiresFormatted}
          />
        )}

      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-100 mt-16">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-1.5">
          <div
            className="flex items-center justify-center w-5 h-5 rounded-[4px]"
            style={{ background: '#1A2744' }}
          >
            <span className="text-[9px] font-black leading-none" style={{ letterSpacing: '-0.3px' }}>
              <span style={{ color: '#00C2FF' }}>B</span>
              <span style={{ color: '#ffffff' }}>T</span>
            </span>
          </div>
          <span className="text-xs text-slate-400">
            <span className="font-semibold text-slate-500">Builtek</span> · Gestión de proyectos AEC
          </span>
        </div>
      </footer>

    </div>
  )
}
