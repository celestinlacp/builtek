import { createClient as createAdmin } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { FileText, FileImage, FileArchive, File, Calendar, Download, Eye } from 'lucide-react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

function formatDate(d: string) {
  return new Date(d).toLocaleString('es-MX', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function FileIcon({ fileType }: { fileType: string }) {
  const t = fileType?.toLowerCase() ?? ''
  if (t === 'pdf') return <FileText className="w-10 h-10 text-red-400" />
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(t)) return <FileImage className="w-10 h-10 text-blue-400" />
  if (['zip', 'rar', '7z'].includes(t)) return <FileArchive className="w-10 h-10 text-yellow-400" />
  return <File className="w-10 h-10 text-slate-400" />
}

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
    .select('drive_files(name)')
    .eq('token', token)
    .single()
  const name = (share?.drive_files as any)?.name
  return {
    title: name ? `${name} — Builtek` : 'Archivo compartido — Builtek',
    description: 'Accede y descarga el archivo compartido.',
  }
}

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
    .select('id, is_active, expires_at, label, access_count, drive_files(name, file_name, file_type)')
    .eq('token', token)
    .single()

  if (!share || !share.is_active) return notFound()

  const file = share.drive_files as unknown as { name: string; file_name: string; file_type: string }
  const expired = share.expires_at && new Date(share.expires_at) < new Date()
  const expiresFormatted = share.expires_at ? formatDate(share.expires_at) : null
  const fileUrl = `/api/drive/share/${token}`
  const isPdf = file?.file_type?.toLowerCase() === 'pdf'

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Navbar */}
      <header className="bg-[#1A2744] text-white sticky top-0 z-30 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#00C2FF] rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-[#1A2744]" />
            </div>
            <span className="font-bold text-sm tracking-tight">Builtek</span>
            <span className="hidden sm:block text-white/30 text-xs">·</span>
            <span className="hidden sm:block text-white/60 text-xs">Archivo compartido</span>
          </div>
          {expiresFormatted && (
            <div className="flex items-center gap-2 text-xs text-white/50 flex-shrink-0">
              <Calendar className="w-3 h-3" />
              <span className="hidden sm:block">Expira</span>
              <span className="font-semibold text-white/80">{expiresFormatted}</span>
            </div>
          )}
        </div>
      </header>

      {/* Card */}
      <main className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

          {/* File header */}
          <div className="bg-gradient-to-br from-[#1A2744] via-[#243660] to-[#00C2FF]/40 px-8 py-10 flex flex-col items-center text-center gap-4">
            <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
              <FileIcon fileType={file?.file_type ?? ''} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-snug">
                {share.label || file?.name || file?.file_name}
              </h1>
              {file?.file_type && (
                <span className="inline-block mt-2 text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-white/15 text-white border border-white/20 uppercase">
                  {file.file_type}
                </span>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="px-8 py-8">
            {expired ? (
              <div className="text-center py-4">
                <p className="text-amber-600 font-semibold text-sm mb-1">Este link ha expirado</p>
                <p className="text-xs text-slate-400">Venció el {expiresFormatted}. Solicita un nuevo link al responsable.</p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                {isPdf && (
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-[#1A2744] hover:bg-[#243660] text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Ver archivo
                  </a>
                )}
                <a
                  href={fileUrl}
                  download
                  className="flex-1 flex items-center justify-center gap-2 bg-[#00C2FF] hover:bg-[#00aee6] text-[#1A2744] text-sm font-semibold px-5 py-3 rounded-xl transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Descargar
                </a>
              </div>
            )}

            {expiresFormatted && !expired && (
              <p className="text-center text-xs text-slate-400 mt-5">
                Link válido hasta el {expiresFormatted}
              </p>
            )}
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-300 mt-8">
          <strong className="text-slate-400">Builtek</strong> · Gestión de proyectos AEC
        </p>
      </main>
    </div>
  )
}
