import { createClient as createAdmin } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { FolderOpen, Calendar, FileText, FileImage, FileArchive, File, Download, Eye, ArrowUpDown } from 'lucide-react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function relativeDate(d: string): string {
  const diff   = Date.now() - new Date(d).getTime()
  const mins   = Math.floor(diff / 60000)
  const hours  = Math.floor(diff / 3600000)
  const days   = Math.floor(diff / 86400000)
  const months = Math.floor(days / 30)
  const years  = Math.floor(days / 365)
  if (mins  < 1)  return 'justo ahora'
  if (mins  < 60) return `hace ${mins} min`
  if (hours < 24) return `hace ${hours} hora${hours !== 1 ? 's' : ''}`
  if (days  < 30) return `hace ${days} día${days !== 1 ? 's' : ''}`
  if (months < 12)return `hace ${months} mes${months !== 1 ? 'es' : ''}`
  return `hace ${years} año${years !== 1 ? 's' : ''}`
}

function FileIconCell({ fileType }: { fileType: string }) {
  const t = fileType?.toLowerCase() ?? ''
  if (t === 'pdf')
    return <div className="w-8 h-10 bg-red-50 border border-red-100 rounded flex items-center justify-center flex-shrink-0"><FileText className="w-4 h-4 text-red-400" /></div>
  if (['jpg','jpeg','png','gif','webp','svg','img'].includes(t))
    return <div className="w-8 h-10 bg-blue-50 border border-blue-100 rounded flex items-center justify-center flex-shrink-0"><FileImage className="w-4 h-4 text-blue-400" /></div>
  if (['zip','rar','7z'].includes(t))
    return <div className="w-8 h-10 bg-yellow-50 border border-yellow-100 rounded flex items-center justify-center flex-shrink-0"><FileArchive className="w-4 h-4 text-yellow-400" /></div>
  return <div className="w-8 h-10 bg-slate-50 border border-slate-200 rounded flex items-center justify-center flex-shrink-0"><File className="w-4 h-4 text-slate-400" /></div>
}

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
  const name = share?.label || (share?.drive_folders as any)?.name
  const title = name ?? 'Carpeta compartida'
  return {
    title: `${title} — Builtek`,
    description: 'Accede y descarga los archivos de esta carpeta compartida.',
    openGraph: {
      title,
      description: 'Accede y descarga los archivos de esta carpeta compartida desde Builtek.',
      siteName: 'Builtek',
    },
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

  // Validar share
  const { data: share } = await admin
    .from('drive_shares')
    .select('id, is_active, expires_at, label, workspace_id, folder_id, drive_folders(name)')
    .eq('token', token)
    .not('folder_id', 'is', null)
    .single()

  if (!share || !share.is_active) return notFound()

  const folderName = share.label || (share.drive_folders as any)?.name || 'Carpeta compartida'
  const expired    = share.expires_at && new Date(share.expires_at) < new Date()
  const expiresFormatted = share.expires_at
    ? new Date(share.expires_at).toLocaleString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null

  // Workspace name
  const { data: ws } = await admin
    .from('workspaces')
    .select('name')
    .eq('id', share.workspace_id)
    .single()

  // Archivos de la carpeta
  const { data: rawFiles } = await admin
    .from('drive_files')
    .select('id, name, file_name, file_type, file_size, created_at, uploaded_by')
    .eq('folder_id', share.folder_id)
    .order('name')

  const files = rawFiles ?? []

  // Nombres de quienes subieron
  const uploaderIds = [...new Set(files.map(f => f.uploaded_by).filter(Boolean))]
  const uploaderMap: Record<string, string> = {}
  if (uploaderIds.length > 0) {
    const { data: users } = await admin.from('users').select('id, full_name').in('id', uploaderIds)
    for (const u of (users ?? [])) {
      if (u.id && u.full_name) uploaderMap[u.id] = u.full_name
    }
  }

  const totalSize = files.reduce((sum, f) => sum + (f.file_size ?? 0), 0)

  return (
    <div className="min-h-screen bg-white">

      {/* Topbar */}
      <header className="border-b border-slate-100 bg-white">
        <div className="max-w-4xl mx-auto px-6 h-12 flex items-center justify-between">
          <span className="text-sm font-bold text-slate-800 tracking-tight">Builtek</span>
          <span className="text-xs text-slate-400">Vista compartida</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">

        {expired ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-amber-400" />
            </div>
            <h1 className="text-lg font-bold text-slate-800 mb-1">Este link ha expirado</h1>
            <p className="text-sm text-slate-400 max-w-xs">
              Venció el {new Date(share.expires_at!).toLocaleString('es-MX', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}.
              Solicita un nuevo link al responsable del proyecto.
            </p>
            <p className="text-xs text-slate-300 mt-8 font-medium">Builtek · Gestión de proyectos AEC</p>
          </div>
        ) : (
          <>
            {/* Title */}
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1 break-words">
              {folderName.toUpperCase()}
            </h1>
            {ws?.name && (
              <p className="text-sm text-slate-400 mb-8">
                de <span className="text-slate-600 font-medium">{ws.name}</span>
              </p>
            )}

            {/* File table */}
            {files.length === 0 ? (
              <div className="border border-slate-200 rounded-xl p-12 text-center">
                <FolderOpen className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400">Esta carpeta no tiene archivos.</p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden">

                {/* Header */}
                <div className="grid grid-cols-[1fr_140px_100px_96px] px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    Nombre <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                  <div>Subido por</div>
                  <div>Modificado</div>
                  <div className="text-right">Tamaño</div>
                </div>

                {/* Rows */}
                {files.map(file => {
                  const isPdf    = file.file_type?.toLowerCase() === 'pdf'
                  const fileUrl  = `/api/drive/share/folder/${token}/file/${file.id}`
                  return (
                    <div key={file.id} className="grid grid-cols-[1fr_140px_100px_96px] items-center px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors group">

                      {/* Name */}
                      <div className="flex items-center gap-3 min-w-0 pr-4">
                        <FileIconCell fileType={file.file_type ?? ''} />
                        <div className="min-w-0">
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline truncate block"
                            title={file.name}
                          >
                            {file.name}
                          </a>
                          <span className="text-[11px] text-slate-400 uppercase">{file.file_type}</span>
                        </div>
                      </div>

                      {/* Uploader */}
                      <div className="text-xs text-slate-500 truncate pr-2">
                        {uploaderMap[file.uploaded_by] ?? '—'}
                      </div>

                      {/* Date */}
                      <div className="text-xs text-slate-500">
                        {file.created_at ? relativeDate(file.created_at) : '—'}
                      </div>

                      {/* Size + actions */}
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-xs text-slate-500 mr-1">{formatSize(file.file_size ?? 0)}</span>
                        {isPdf && (
                          <a href={fileUrl} target="_blank" rel="noopener noreferrer"
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" title="Ver">
                            <Eye className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <a href={fileUrl} download
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" title="Descargar">
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  )
                })}

                {/* Footer totals */}
                <div className="grid grid-cols-[1fr_140px_100px_96px] px-4 py-2 bg-slate-50 border-t border-slate-200">
                  <span className="text-xs text-slate-500 font-medium">{files.length} archivo{files.length !== 1 ? 's' : ''}</span>
                  <span />
                  <span />
                  <span className="text-xs text-slate-500 font-medium text-right">{formatSize(totalSize)}</span>
                </div>
              </div>
            )}

            {expiresFormatted && (
              <p className="text-xs text-slate-400 mt-4">
                Link válido hasta el {expiresFormatted}
              </p>
            )}
          </>
        )}
      </main>
    </div>
  )
}
