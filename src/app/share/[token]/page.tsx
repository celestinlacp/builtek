import { createClient as createAdmin } from '@supabase/supabase-js'
import { Download, FileX } from 'lucide-react'

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: share } = await admin
    .from('drive_shares')
    .select('id, label, is_active, expires_at, drive_files(name, file_name, file_type, file_size)')
    .eq('token', token)
    .single()

  const expired = share?.expires_at && new Date(share.expires_at) < new Date()

  if (!share || !share.is_active || expired) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 text-center max-w-sm w-full">
          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileX className="w-7 h-7 text-red-400" />
          </div>
          <h1 className="text-lg font-bold text-slate-800 mb-2">Link no disponible</h1>
          <p className="text-sm text-slate-400">
            {expired ? 'Este link ha expirado.' : 'Este link fue revocado o no existe.'}
          </p>
        </div>
      </div>
    )
  }

  const file = share.drive_files as unknown as { name: string; file_name: string; file_type: string; file_size: number }

  const FILE_ICONS: Record<string, string> = {
    pdf: '📄', dwg: '📐', dxf: '📐', xlsx: '📊', docx: '📝', img: '🖼️', other: '📁'
  }

  function formatSize(bytes: number) {
    if (!bytes) return '—'
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const isPdf = file.file_type === 'pdf'

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-[#1A2744] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black text-white tracking-tight">Builtek</span>
          <span className="text-white/30 text-sm">·</span>
          <span className="text-white/60 text-sm">Archivo compartido</span>
        </div>
        <a
          href={`/api/drive/share/${token}?dl=1`}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00C2FF] text-[#1A2744] text-sm font-bold hover:bg-[#00C2FF]/90 transition-colors"
        >
          <Download className="w-4 h-4" />
          Descargar
        </a>
      </header>

      {isPdf ? (
        /* Visor PDF fullscreen */
        <div className="flex-1 flex flex-col">
          <div className="bg-white border-b border-slate-100 px-6 py-3 flex items-center gap-3">
            <span className="text-xl">{FILE_ICONS[file.file_type]}</span>
            <div>
              <p className="text-sm font-semibold text-slate-700">{share.label || file.name}</p>
              <p className="text-xs text-slate-400">{file.file_type?.toUpperCase()} · {formatSize(file.file_size)}</p>
            </div>
          </div>
          <iframe
            src={`/api/drive/share/${token}`}
            className="flex-1 w-full border-0"
            title={file.name}
          />
        </div>
      ) : (
        /* Tarjeta de descarga para otros tipos */
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 text-center max-w-sm w-full">
            <span className="text-5xl block mb-4">{FILE_ICONS[file.file_type] || '📁'}</span>
            <h1 className="text-lg font-bold text-slate-800 mb-1">{share.label || file.name}</h1>
            <p className="text-sm text-slate-400 mb-6">{file.file_type?.toUpperCase()} · {formatSize(file.file_size)}</p>
            <a
              href={`/api/drive/share/${token}`}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#1A2744] text-white font-bold hover:bg-[#243660] transition-colors"
            >
              <Download className="w-4 h-4" />
              Descargar archivo
            </a>
          </div>
        </div>
      )}

      <footer className="text-center py-4 text-xs text-slate-300">
        Compartido con Builtek Drive · builtek.app
      </footer>
    </div>
  )
}
