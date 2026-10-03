import { createClient as createAdmin } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { Download, Eye, ArrowUpDown, Share2 } from 'lucide-react'
import { FileTypeIcon } from '@/components/ui/FileTypeIcon'
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
  const diff = Date.now() - new Date(d).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  const months = Math.floor(days / 30)
  const years  = Math.floor(days / 365)
  if (mins < 1)    return 'justo ahora'
  if (mins < 60)   return `hace ${mins} min`
  if (hours < 24)  return `hace ${hours} hora${hours !== 1 ? 's' : ''}`
  if (days < 30)   return `hace ${days} día${days !== 1 ? 's' : ''}`
  if (months < 12) return `hace ${months} mes${months !== 1 ? 'es' : ''}`
  return `hace ${years} año${years !== 1 ? 's' : ''}`
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
    .select('label, drive_files(name)')
    .eq('token', token)
    .single()
  const name = share?.label || (share?.drive_files as any)?.name
  const title = name ? `${name} — Builtek` : 'Archivo compartido — Builtek'
  const description = 'Accede y descarga el archivo compartido desde Builtek.'
  return {
    title,
    description,
    openGraph: { title, description, siteName: 'Builtek', images: [{ url: '/api/og', width: 1200, height: 1200 }] },
    twitter:   { card: 'summary', title, description, images: ['/api/og'] },
  }
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function DriveSharePage(
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: share } = await admin
    .from('drive_shares')
    .select('id, is_active, expires_at, label, workspace_id, drive_files(name, file_name, file_type, file_size, created_at)')
    .eq('token', token)
    .single()

  if (!share || !share.is_active) return notFound()

  const file = share.drive_files as unknown as {
    name: string; file_name: string; file_type: string; file_size: number; created_at: string
  }

  // Workspace name
  const { data: ws } = await admin
    .from('workspaces')
    .select('name')
    .eq('id', share.workspace_id)
    .single()

  const expired = share.expires_at && new Date(share.expires_at) < new Date()
  const fileUrl  = `/api/drive/share/${token}`
  const isPdf    = file?.file_type?.toLowerCase() === 'pdf'
  const title    = (share.label || file?.name || file?.file_name || 'Archivo').toUpperCase()

  return (
    <div className="min-h-screen bg-white">

      {/* Topbar — minimal */}
      <header className="border-b border-slate-100 bg-white">
        <div className="max-w-4xl mx-auto px-6 h-12 flex items-center justify-between">
          <span className="text-sm font-bold text-slate-800 tracking-tight">Builtek</span>
          <span className="text-xs text-slate-400">Vista compartida</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        {expired ? (

          /* ── Link expirado ─────────────────────────────────────────────────── */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center mb-4">
              <Share2 className="w-6 h-6 text-amber-400" />
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

          /* ── Contenido ─────────────────────────────────────────────────────── */
          <>
            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 mb-8">
              {isPdf && (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Ver archivo
                </a>
              )}
              <a
                href={fileUrl}
                download
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Descargar
              </a>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1 break-words">
              {title}
            </h1>
            {ws?.name && (
              <p className="text-sm text-slate-400 mb-8">
                de <span className="text-slate-600 font-medium">{ws.name}</span>
              </p>
            )}

            {/* File table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">

              {/* Table header */}
              <div className="grid grid-cols-[1fr_80px] sm:grid-cols-[1fr_160px_120px] px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  Nombre <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
                <div className="hidden sm:block">Modificado</div>
                <div>Tamaño</div>
              </div>

              {/* File row */}
              <div className="grid grid-cols-[1fr_80px] sm:grid-cols-[1fr_160px_120px] items-center px-4 py-3 hover:bg-slate-50 transition-colors">
                {/* Name */}
                <div className="flex items-center gap-3 min-w-0 pr-4">
                  <FileTypeIcon fileType={file?.file_type ?? 'other'} size={40} />
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline truncate"
                    title={file?.name || file?.file_name}
                  >
                    {file?.name || file?.file_name}
                  </a>
                </div>

                {/* Modified — desktop only */}
                <div className="hidden sm:block text-sm text-slate-500">
                  {file?.created_at ? relativeDate(file.created_at) : '—'}
                </div>

                {/* Size */}
                <div className="text-sm text-slate-500">
                  {formatSize(file?.file_size ?? 0)}
                </div>
              </div>

            </div>

            {/* Expiry notice */}
            {share.expires_at && (
              <p className="text-xs text-slate-400 mt-4">
                Link válido hasta el{' '}
                {new Date(share.expires_at).toLocaleString('es-MX', {
                  day: 'numeric', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </p>
            )}
          </>

        )}
      </main>
    </div>
  )
}
