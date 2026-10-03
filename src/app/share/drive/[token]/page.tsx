import { createClient as createAdmin } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { Download, Eye, Clock, FileText, ArrowUpDown } from 'lucide-react'
import { FileTypeIcon } from '@/components/ui/FileTypeIcon'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

function relativeDate(d: string): string {
  const diff   = Date.now() - new Date(d).getTime()
  const mins   = Math.floor(diff / 60000)
  const hours  = Math.floor(diff / 3600000)
  const days   = Math.floor(diff / 86400000)
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
    openGraph: { title, description, siteName: 'Builtek', images: [{ url: '/api/og', width: 256, height: 256 }] },
    twitter: { card: 'summary', title, description, images: ['/api/og'] },
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

  const { data: ws } = await admin
    .from('workspaces')
    .select('name')
    .eq('id', share.workspace_id)
    .single()

  const expired = share.expires_at ? new Date(share.expires_at) < new Date() : false
  const expiresFormatted = share.expires_at
    ? new Date(share.expires_at).toLocaleString('es-MX', {
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : null

  const fileUrl = `/api/drive/share/${token}`
  const isPdf   = file?.file_type?.toLowerCase() === 'pdf'
  const title   = (share.label || file?.name || file?.file_name || 'Archivo').toUpperCase()

  // ── Link expirado ─────────────────────────────────────────────────────────────
  if (expired) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 text-center max-w-sm w-full">
          <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Clock className="w-7 h-7 text-amber-500" />
          </div>
          <h1 className="text-lg font-bold text-[#1A2744] mb-2">Este link expiró</h1>
          <p className="text-sm text-slate-400">
            El link venció el <strong className="text-slate-600">{expiresFormatted}</strong>.
          </p>
          <p className="text-xs text-slate-400 mt-3">Solicita un nuevo link al responsable del proyecto.</p>
          <p className="text-[11px] text-slate-300 mt-6 font-medium">Builtek · Gestión de proyectos AEC</p>
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Navbar */}
      <header className="bg-[#1A2744] text-white sticky top-0 z-30 shadow-lg">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#00C2FF] rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-[#1A2744]" />
            </div>
            <span className="font-bold text-sm tracking-tight">Builtek</span>
            <span className="hidden sm:block text-white/30 text-xs">·</span>
            <span className="hidden sm:block text-white/60 text-xs">Archivo compartido</span>
          </div>
          {share.expires_at && (
            <div className="flex items-center gap-1.5 text-xs text-white/50 flex-shrink-0">
              <Clock className="w-3 h-3" />
              <span className="hidden sm:block">Expira</span>
              <span className="font-semibold text-white/80">
                {new Date(share.expires_at).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">

        {/* Hero card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

          {/* Dark gradient header */}
          <div className="bg-gradient-to-r from-[#1A2744] to-[#243660] px-6 py-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-mono font-bold bg-white/10 text-white px-1.5 py-0.5 rounded border border-white/15">
                {file?.file_type?.toUpperCase() ?? 'FILE'}
              </span>
            </div>
            <h1 className="text-xl font-black text-white leading-snug">{title}</h1>
            {ws?.name && (
              <p className="text-sm text-white/60 mt-1">{ws.name}</p>
            )}
          </div>

          {/* File section */}
          <div className="px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Archivo</span>
              <span className="flex-1 h-px bg-slate-100" />
            </div>

            {/* Table */}
            <div className="rounded-xl border border-slate-100 overflow-hidden mb-4">
              <div className="grid grid-cols-[1fr_80px] sm:grid-cols-[1fr_150px_100px] px-4 py-2 bg-slate-50 border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  Nombre <ArrowUpDown className="w-2.5 h-2.5 ml-0.5" />
                </div>
                <div className="hidden sm:block">Modificado</div>
                <div>Tamaño</div>
              </div>
              <div className="grid grid-cols-[1fr_80px] sm:grid-cols-[1fr_150px_100px] items-center px-4 py-3 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3 min-w-0 pr-4">
                  <FileTypeIcon fileType={file?.file_type ?? 'other'} size={36} />
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-[#00C2FF] hover:underline truncate"
                  >
                    {file?.name || file?.file_name}
                  </a>
                </div>
                <div className="hidden sm:block text-sm text-slate-500">
                  {file?.created_at ? relativeDate(file.created_at) : '—'}
                </div>
                <div className="text-sm text-slate-500">
                  {formatSize(file?.file_size ?? 0)}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {isPdf && (
                <a href={fileUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:text-[#1A2744] hover:border-slate-300 transition-colors">
                  <Eye className="w-3.5 h-3.5" />
                  Ver PDF
                </a>
              )}
              <a href={fileUrl} download
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1A2744] text-xs font-semibold text-white hover:bg-[#243660] transition-colors">
                <Download className="w-3.5 h-3.5" />
                Descargar
              </a>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white mt-10">
        <div className="max-w-3xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <span><strong className="text-slate-600 font-semibold">Builtek</strong> · Gestión de proyectos AEC</span>
          {expiresFormatted && (
            <span>Solo lectura · Link expira el {expiresFormatted}</span>
          )}
        </div>
      </footer>
    </div>
  )
}
