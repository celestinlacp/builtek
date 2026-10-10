'use client'

import { useState } from 'react'
import {
  FileText, Layers, Image as ImageIcon, FileSpreadsheet, File,
  Download, Eye, List, LayoutGrid, FolderOpen, Pen, UserRound, Filter, Folder,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

export type ShareDoc = {
  id: string
  name: string | null
  file_name: string | null
  display_name: string | null
  doc_key: string | null
  file_type: string | null
  specialty_code: string | null
  specialty_name: string | null
  author: string | null
  status: string | null
  version_number: number | null
  project_id: string
  uploaded_by: string | null
  created_at: string | null
  uploaderName: string | null
}

export type ShareSubproject = { id: string; name: string }
export type ShareFolder     = { id: string; specialty_code: string; name: string }

// ── Helpers ────────────────────────────────────────────────────────────────────

function getInitials(name: string | null) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function docPrimaryName(doc: ShareDoc) {
  return doc.doc_key || doc.display_name || doc.name || doc.file_name || 'Sin nombre'
}

function fileTypeIcon(ft: string | null) {
  switch (ft) {
    case 'pdf':  return { Icon: FileText,       bg: 'bg-red-50',    color: 'text-red-400'    }
    case 'dwg':
    case 'dxf':  return { Icon: Layers,          bg: 'bg-blue-50',   color: 'text-blue-400'   }
    case 'img':
    case 'png':
    case 'jpg':  return { Icon: ImageIcon,       bg: 'bg-purple-50', color: 'text-purple-400' }
    case 'xlsx':
    case 'xls':
    case 'csv':  return { Icon: FileSpreadsheet, bg: 'bg-green-50',  color: 'text-green-500'  }
    default:     return { Icon: File,            bg: 'bg-slate-50',  color: 'text-slate-400'  }
  }
}

const DOC_STATUS: Record<string, { label: string; cls: string }> = {
  draft:    { label: 'Borrador',    cls: 'bg-slate-100 text-slate-500' },
  review:   { label: 'En revisión', cls: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Aprobado',    cls: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rechazado',   cls: 'bg-red-100 text-red-600'    },
}

function fmtDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Avatar chip ────────────────────────────────────────────────────────────────

function AvatarChip({ name, label }: { name: string; label?: string }) {
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <div className="w-5 h-5 rounded-full bg-[#1A2744] text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0">
        {getInitials(name)}
      </div>
      <span className="text-[11px] text-slate-500 truncate">
        {label && <span className="text-slate-300 mr-0.5">{label}</span>}{name}
      </span>
    </div>
  )
}

// ── Doc Card (grid view) ───────────────────────────────────────────────────────

function DocCard({ doc, token }: { doc: ShareDoc; token: string }) {
  const { Icon, bg, color } = fileTypeIcon(doc.file_type)
  const primary  = docPrimaryName(doc)
  const dStatus  = DOC_STATUS[doc.status ?? '']
  const viewUrl  = `/api/share/${token}/file?type=document&id=${doc.id}`
  const dlUrl    = `/api/share/${token}/file?type=document&id=${doc.id}&dl=1`

  return (
    <div className="bg-white rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all group flex flex-col">
      {/* Top: icon + status */}
      <div className="flex items-start justify-between p-4 pb-3">
        <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div className="flex items-center gap-1.5">
          {doc.version_number != null && doc.version_number > 0 && (
            <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-mono">
              v{doc.version_number}
            </span>
          )}
          {dStatus && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${dStatus.cls}`}>
              {dStatus.label}
            </span>
          )}
        </div>
      </div>

      {/* Doc name */}
      <div className="px-4 pb-2 flex-1">
        <p className="text-sm font-bold text-[#1A2744] leading-snug">{primary}</p>
        {doc.file_name && doc.file_name !== primary && (
          <p className="text-[10px] text-slate-400 mt-0.5 truncate" title={doc.file_name}>{doc.file_name}</p>
        )}
      </div>

      {/* Author + uploader */}
      <div className="px-4 pb-3 space-y-1.5 border-t border-slate-50 pt-2">
        {doc.author && (
          <div className="flex items-center gap-1.5 min-w-0">
            <Pen className="w-3 h-3 text-slate-300 flex-shrink-0" />
            <span className="text-[11px] text-slate-500 truncate">{doc.author}</span>
          </div>
        )}
        {doc.uploaderName && (
          <div className="flex items-center gap-1.5 min-w-0">
            <UserRound className="w-3 h-3 text-slate-300 flex-shrink-0" />
            <span className="text-[11px] text-slate-400 truncate">{doc.uploaderName}</span>
          </div>
        )}
        {doc.created_at && (
          <p className="text-[10px] text-slate-300">{fmtDate(doc.created_at)}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 p-3 pt-0">
        <a href={viewUrl} target="_blank" rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-[#1A2744] py-2 rounded-lg hover:bg-slate-50 border border-slate-200 transition-colors">
          <Eye className="w-3 h-3" /> Ver
        </a>
        <a href={dlUrl}
          className="flex-1 flex items-center justify-center gap-1 text-[11px] font-semibold text-white bg-[#1A2744] hover:bg-[#243660] py-2 rounded-lg transition-colors">
          <Download className="w-3 h-3" /> Descargar
        </a>
      </div>
    </div>
  )
}

// ── Doc Row (list view) ────────────────────────────────────────────────────────

function DocRow({ doc, token }: { doc: ShareDoc; token: string }) {
  const { Icon, color } = fileTypeIcon(doc.file_type)
  const primary  = docPrimaryName(doc)
  const dStatus  = DOC_STATUS[doc.status ?? '']
  const viewUrl  = `/api/share/${token}/file?type=document&id=${doc.id}`
  const dlUrl    = `/api/share/${token}/file?type=document&id=${doc.id}&dl=1`

  return (
    <div className="flex items-center gap-3 py-3 px-4 bg-white rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all group">
      <Icon className={`w-4 h-4 ${color} flex-shrink-0`} />

      {/* Name + file_name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#1A2744] truncate">{primary}</p>
        {doc.file_name && doc.file_name !== primary && (
          <p className="text-[10px] text-slate-400 truncate">{doc.file_name}</p>
        )}
      </div>

      {/* Author */}
      {doc.author && (
        <div className="hidden lg:flex items-center gap-1 flex-shrink-0 max-w-[130px]">
          <Pen className="w-3 h-3 text-slate-300" />
          <span className="text-[11px] text-slate-500 truncate">{doc.author}</span>
        </div>
      )}

      {/* Uploader */}
      {doc.uploaderName && (
        <div className="hidden md:block flex-shrink-0">
          <AvatarChip name={doc.uploaderName} />
        </div>
      )}

      {/* Version */}
      {doc.version_number != null && doc.version_number > 0 && (
        <span className="hidden sm:block text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-mono flex-shrink-0">
          v{doc.version_number}
        </span>
      )}

      {/* Date */}
      {doc.created_at && (
        <span className="hidden md:block text-xs text-slate-400 flex-shrink-0">{fmtDate(doc.created_at)}</span>
      )}

      {/* Status */}
      {dStatus && (
        <span className={`hidden sm:block text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${dStatus.cls}`}>
          {dStatus.label}
        </span>
      )}

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <a href={viewUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-[#1A2744] px-2.5 py-1.5 rounded-lg hover:bg-slate-50 border border-slate-200 transition-colors">
          <Eye className="w-3 h-3" /> Ver
        </a>
        <a href={dlUrl}
          className="flex items-center gap-1 text-[11px] font-semibold text-white bg-[#1A2744] hover:bg-[#243660] px-2.5 py-1.5 rounded-lg transition-colors">
          <Download className="w-3 h-3" />
          <span className="hidden sm:block ml-0.5">Descargar</span>
        </a>
      </div>
    </div>
  )
}

// ── Specialty Section ──────────────────────────────────────────────────────────

function SpecialtySection({ specialty, docs, folders, view, token }: {
  specialty: string
  docs: ShareDoc[]
  folders: ShareFolder[]
  view: 'grid' | 'list'
  token: string
}) {
  const rootDocs = folders.length > 0
    ? docs.filter(d => !(d as any).folder_id || !folders.find(f => f.id === (d as any).folder_id))
    : docs

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <span className="inline-block h-px w-10 bg-slate-100" />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{specialty}</p>
        <span className="text-[10px] text-slate-300">({docs.length})</span>
        <span className="inline-block h-px flex-1 bg-slate-100" />
      </div>

      {/* Carpetas con sus docs */}
      {folders.map(folder => {
        const folderDocs = docs.filter(d => (d as any).folder_id === folder.id)
        if (folderDocs.length === 0) return null
        return (
          <div key={folder.id} className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <FolderOpen className="w-3.5 h-3.5 text-[#00C2FF]" />
              <span className="text-xs font-semibold text-slate-600">{folder.name}</span>
              <span className="text-[10px] text-slate-300">({folderDocs.length})</span>
            </div>
            {view === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pl-5">
                {folderDocs.map(doc => <DocCard key={doc.id} doc={doc} token={token} />)}
              </div>
            ) : (
              <div className="space-y-2 pl-5">
                {folderDocs.map(doc => <DocRow key={doc.id} doc={doc} token={token} />)}
              </div>
            )}
          </div>
        )
      })}

      {/* Docs sin carpeta */}
      {rootDocs.length > 0 && (
        view === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {rootDocs.map(doc => <DocCard key={doc.id} doc={doc} token={token} />)}
          </div>
        ) : (
          <div className="space-y-2">
            {rootDocs.map(doc => <DocRow key={doc.id} doc={doc} token={token} />)}
          </div>
        )
      )}
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function ShareContent({
  rootProjectId,
  subprojects,
  documents,
  folders,
  token,
}: {
  rootProjectId: string
  subprojects: ShareSubproject[]
  documents: ShareDoc[]
  folders: ShareFolder[]
  token: string
}) {
  const [activeTab,        setActiveTab]        = useState<string>('all')
  const [view,             setView]             = useState<'list' | 'grid'>('grid')
  const [filterSpecialty,  setFilterSpecialty]  = useState<string>('all')

  const hasSubprojects = subprojects.length > 0

  const tabs = hasSubprojects ? [
    { id: 'all',        label: 'Todos',     count: documents.length },
    { id: rootProjectId, label: 'Principal', count: documents.filter(d => d.project_id === rootProjectId).length },
    ...subprojects
      .map(s => ({ id: s.id, label: s.name, count: documents.filter(d => d.project_id === s.id).length }))
      .filter(t => t.count > 0),
  ] : []

  // Filter by subproject tab
  const tabFiltered = !hasSubprojects || activeTab === 'all'
    ? documents
    : documents.filter(d => d.project_id === activeTab)

  // Build specialty options from visible docs
  const specialtyOptions: { code: string; label: string }[] = []
  const seenCodes = new Set<string>()
  for (const doc of tabFiltered) {
    const code = doc.specialty_code || '__general'
    if (!seenCodes.has(code)) {
      seenCodes.add(code)
      specialtyOptions.push({
        code,
        label: doc.specialty_name || doc.specialty_code || 'General',
      })
    }
  }

  // Filter by specialty
  const visibleDocs = filterSpecialty === 'all'
    ? tabFiltered
    : tabFiltered.filter(d => (d.specialty_code || '__general') === filterSpecialty)

  // Group by specialty for display
  const bySpecialty: Record<string, ShareDoc[]> = {}
  for (const doc of visibleDocs) {
    const key = doc.specialty_name
      ? `[${doc.specialty_code}] ${doc.specialty_name}`
      : doc.specialty_code || 'General'
    if (!bySpecialty[key]) bySpecialty[key] = []
    bySpecialty[key].push(doc)
  }

  const isEmpty = documents.length === 0

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 space-y-10">

      {!isEmpty && (
        <div className="flex items-center gap-3 flex-wrap justify-between">
          {/* Left: subproject tabs + specialty filter */}
          <div className="flex items-center gap-2 flex-wrap">
            {hasSubprojects && tabs.map(tab => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setFilterSpecialty('all') }}
                className={`text-xs px-3.5 py-1.5 rounded-full font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#1A2744] text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-[#1A2744]/40'
                }`}>
                {tab.label}
                <span className={`ml-1.5 ${activeTab === tab.id ? 'opacity-60' : 'text-slate-400'}`}>
                  ({tab.count})
                </span>
              </button>
            ))}

            {/* Specialty filter */}
            {specialtyOptions.length > 1 && (
              <div className="flex items-center gap-1.5">
                <Filter className="w-3 h-3 text-slate-400" />
                <select
                  value={filterSpecialty}
                  onChange={e => setFilterSpecialty(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40 focus:border-[#00C2FF]"
                >
                  <option value="all">Todas las disciplinas</option>
                  {specialtyOptions.map(s => (
                    <option key={s.code} value={s.code}>{s.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Right: view toggle */}
          {documents.length > 0 && (
            <div className="flex bg-slate-100 rounded-lg p-0.5 gap-0.5 ml-auto">
              <button onClick={() => setView('list')} title="Vista lista"
                className={`p-2 rounded-md transition-all ${
                  view === 'list' ? 'bg-white shadow-sm text-[#1A2744]' : 'text-slate-400 hover:text-slate-600'
                }`}>
                <List className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setView('grid')} title="Vista iconos"
                className={`p-2 rounded-md transition-all ${
                  view === 'grid' ? 'bg-white shadow-sm text-[#1A2744]' : 'text-slate-400 hover:text-slate-600'
                }`}>
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Documents */}
      {visibleDocs.length > 0 ? (
        <section>
          <h2 className="text-base font-bold text-[#1A2744] mb-5 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#00C2FF]" />
            Planos y Documentos
            <span className="text-xs font-normal text-slate-400 ml-1">(versión vigente)</span>
          </h2>
          <div className="space-y-7">
            {Object.entries(bySpecialty).map(([specialty, docs]) => (
              <SpecialtySection key={specialty} specialty={specialty} docs={docs} folders={folders.filter(f => docs.some(d => (d as any).folder_id ? folders.find(fo => fo.id === (d as any).folder_id)?.specialty_code === f.specialty_code : false))} view={view} token={token} />
            ))}
          </div>
        </section>
      ) : isEmpty ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-slate-400 font-medium">Sin archivos disponibles</p>
          <p className="text-xs text-slate-300 mt-1">Este proyecto aún no tiene documentos cargados.</p>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
          <p className="text-slate-400 text-sm">No hay documentos con ese filtro.</p>
          <button onClick={() => setFilterSpecialty('all')} className="text-xs text-[#00C2FF] font-semibold mt-2 hover:underline">
            Ver todos →
          </button>
        </div>
      )}

    </main>
  )
}
