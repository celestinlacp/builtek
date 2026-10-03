import { createClient as createAdmin } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { Calendar, FileText, Download, Eye, GitBranch, Clock } from 'lucide-react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

type Version = {
  id: string
  file_name: string | null
  version_number: number | null
  is_current: boolean
  emission_date: string | null
  created_at: string
  file_type: string | null
  file_size: number | null
  uploader_name: string | null
}

function fmtDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtSize(bytes: number | null) {
  if (!bytes) return null
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
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
    .from('document_shares')
    .select('expires_at, documents(name, display_name, file_type, specialty:specialties(name), project:projects(name))')
    .eq('token', token)
    .single()

  const doc = (share as any)?.documents
  const docName   = doc?.display_name || doc?.name || 'Documento'
  const project   = doc?.project?.name ? ` · ${doc.project.name}` : ''
  const specialty = doc?.specialty?.name ? ` [${doc.specialty.name}]` : ''
  const fileType  = doc?.file_type?.toUpperCase() ?? 'DOC'
  const description = `${fileType}${specialty}${project} — Accede y descarga este documento técnico en Builtek.`

  return {
    title: `${docName} — Builtek`,
    description,
    openGraph: {
      title:       docName,
      description,
      siteName:    'Builtek',
      type:        'website',
      images: [{ url: '/api/og', width: 256, height: 256 }],
    },
    twitter: {
      card:        'summary',
      title:       docName,
      description,
      images:      ['/api/og'],
    },
  }
}

export default async function DocSharePage(
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Validar token
  const { data: share } = await admin
    .from('document_shares')
    .select('id, document_id, doc_key, workspace_id, expires_at, is_active, access_count, documents(id, name, display_name, doc_key, file_type, author, notes, specialty:specialties(code, name), project:projects(name))')
    .eq('token', token)
    .single()

  if (!share || !share.is_active) return notFound()

  // Registrar acceso
  await admin.from('document_shares').update({
    access_count:  (share.access_count ?? 0) + 1,
    last_accessed: new Date().toISOString(),
  } as any).eq('id', share.id)

  const expired = new Date(share.expires_at) < new Date()
  const expiresFormatted = new Date(share.expires_at).toLocaleString('es-MX', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

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

  const docMeta = (share as any).documents as {
    id: string; name: string; display_name: string | null; doc_key: string | null
    file_type: string | null; author: string | null; notes: string | null
    specialty: { code: string; name: string } | null
    project: { name: string } | null
  }

  // 2. Obtener todas las versiones (vigente primero)
  let versions: Version[] = []
  if (share.doc_key) {
    const { data: rawVers } = await admin
      .from('documents')
      .select('id, file_name, version_number, is_current, emission_date, created_at, file_type, file_size, uploaded_by')
      .eq('workspace_id', share.workspace_id)
      .eq('doc_key', share.doc_key)
      .order('version_number', { ascending: false })

    const uploaderIds = [...new Set((rawVers ?? []).map((v: any) => v.uploaded_by).filter(Boolean))]
    const nameById: Record<string, string> = {}
    if (uploaderIds.length) {
      const { data: profiles } = await admin.from('profiles').select('id, full_name').in('id', uploaderIds)
      for (const u of (profiles ?? [])) if (u.id && u.full_name) nameById[u.id] = u.full_name
    }

    versions = (rawVers ?? []).map((v: any) => ({
      ...v,
      uploader_name: nameById[v.uploaded_by] ?? null,
    }))
  } else {
    // Solo hay una versión
    const { data: single } = await admin
      .from('documents')
      .select('id, file_name, version_number, is_current, emission_date, created_at, file_type, file_size, uploaded_by')
      .eq('id', share.document_id)
      .single()
    if (single) {
      const { data: u } = await admin.from('profiles').select('full_name').eq('id', (single as any).uploaded_by).single()
      versions = [{ ...(single as any), uploader_name: u?.full_name ?? null }]
    }
  }

  const vigente = versions.find(v => v.is_current) ?? versions[0]
  const historial = versions.filter(v => v.id !== vigente?.id)
  const docName = docMeta.display_name || docMeta.name

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
            <span className="hidden sm:block text-white/60 text-xs">Documento compartido</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/50 flex-shrink-0">
            <Clock className="w-3 h-3" />
            <span className="hidden sm:block">Expira</span>
            <span className="font-semibold text-white/80">
              {new Date(share.expires_at).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Hero card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-[#1A2744] to-[#243660] px-6 py-5">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold bg-white/10 text-white px-1.5 py-0.5 rounded border border-white/15">
                {docMeta.file_type?.toUpperCase() ?? 'DOC'}
              </span>
              {docMeta.doc_key && (
                <span className="text-[10px] font-mono text-white/60">{docMeta.doc_key}</span>
              )}
              {docMeta.specialty && (
                <span className="text-[10px] font-semibold bg-[#00C2FF]/20 text-[#00C2FF] px-1.5 py-0.5 rounded border border-[#00C2FF]/20">
                  [{docMeta.specialty.code}] {docMeta.specialty.name}
                </span>
              )}
            </div>
            <h1 className="text-xl font-black text-white leading-snug">{docName}</h1>
            {docMeta.project && (
              <p className="text-sm text-white/60 mt-1">{docMeta.project.name}</p>
            )}
          </div>

          {docMeta.notes && (
            <div className="mx-5 my-4 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-amber-700 mb-0.5">Nota</p>
              <p className="text-xs text-amber-800 leading-relaxed">{docMeta.notes}</p>
            </div>
          )}

          {/* Versión vigente */}
          {vigente && (
            <div className="px-5 py-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Versión vigente</span>
                <span className="flex-1 h-px bg-slate-100" />
                <span className="text-[10px] font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Vigente</span>
              </div>
              <VersionCard version={vigente} token={token} highlight />
            </div>
          )}
        </div>

        {/* Historial */}
        {historial.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50">
              <div className="flex items-center gap-2">
                <GitBranch className="w-3.5 h-3.5 text-slate-400" />
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Historial de versiones</p>
                <span className="text-[10px] text-slate-400">({historial.length})</span>
              </div>
            </div>
            <div className="px-5 py-4 space-y-3">
              {historial.map(v => (
                <VersionCard key={v.id} version={v} token={token} />
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white mt-10">
        <div className="max-w-3xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <span><strong className="text-slate-600 font-semibold">Builtek</strong> · Gestión de proyectos AEC</span>
          <span>Solo lectura · Link expira el {expiresFormatted}</span>
        </div>
      </footer>
    </div>
  )
}

// ── VersionCard component ──────────────────────────────────────────────────────

function VersionCard({ version, token, highlight = false }: {
  version: Version
  token: string
  highlight?: boolean
}) {
  const vLabel = version.version_number !== null
    ? `v${String(version.version_number).padStart(4, '0')}`
    : 'v0001'
  const viewUrl = `/api/documents/share/${token}/file/${version.id}`
  const dlUrl   = `/api/documents/share/${token}/file/${version.id}?dl=1`
  const isPdf   = version.file_type === 'pdf'

  return (
    <div className={`rounded-xl border p-4 ${highlight ? 'bg-[#00C2FF]/5 border-[#00C2FF]/20' : 'bg-slate-50 border-slate-100'}`}>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
        <span className={`text-xs font-bold font-mono ${highlight ? 'text-[#00C2FF]' : 'text-slate-400'}`}>{vLabel}</span>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
          {version.uploader_name && <span>{version.uploader_name}</span>}
          {version.emission_date && (
            <>
              {version.uploader_name && <span>·</span>}
              <span>{fmtDate(version.emission_date)}</span>
            </>
          )}
          {version.file_size && (
            <>
              <span>·</span>
              <span>{fmtSize(version.file_size)}</span>
            </>
          )}
        </div>
      </div>
      {version.file_name && (
        <p className="text-[11px] text-slate-500 mb-3 truncate">{version.file_name}</p>
      )}
      <div className="flex items-center gap-2">
        {isPdf && (
          <a href={viewUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:text-[#1A2744] hover:border-slate-300 transition-colors">
            <Eye className="w-3.5 h-3.5" />
            Ver PDF
          </a>
        )}
        <a href={dlUrl}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1A2744] text-xs font-semibold text-white hover:bg-[#243660] transition-colors">
          <Download className="w-3.5 h-3.5" />
          Descargar
        </a>
      </div>
    </div>
  )
}
