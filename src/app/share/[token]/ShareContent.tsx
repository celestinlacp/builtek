'use client'

import { useState, useEffect } from 'react'
import {
  FileText, Layers, Image as ImageIcon, FileSpreadsheet, File,
  Download, Eye, List, LayoutGrid, FolderOpen, Pen, UserRound, Filter,
  X, CheckSquare, Square, ArrowDownToLine,
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
  folder_id: string | null
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

async function triggerDownloads(token: string, docIds: string[]) {
  for (const id of docIds) {
    const a = document.createElement('a')
    a.href = `/api/share/${token}/file?type=document&id=${id}&dl=1`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    await new Promise(r => setTimeout(r, 450))
  }
}

// ── AvatarChip ─────────────────────────────────────────────────────────────────

function AvatarChip({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <div className="w-5 h-5 rounded-full bg-[#1A2744] text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0">
        {getInitials(name)}
      </div>
      <span className="text-[11px] text-slate-500 truncate">{name}</span>
    </div>
  )
}

// ── DocViewer ──────────────────────────────────────────────────────────────────

function DocViewer({ doc, token, onClose }: {
  doc: ShareDoc; token: string; onClose: () => void
}) {
  const primary     = docPrimaryName(doc)
  const viewUrl     = `/api/share/${token}/file?type=document&id=${doc.id}`
  const dlUrl       = `/api/share/${token}/file?type=document&id=${doc.id}&dl=1`
  const isImage     = ['png', 'jpg', 'img'].includes(doc.file_type ?? '')
  const isPdf       = doc.file_type === 'pdf'
  const previewable = isPdf || isImage

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0F1625]">
      {/* Top bar */}
      <div className="flex items-center gap-4 px-5 py-3 border-b border-white/10 flex-shrink-0">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">{primary}</p>
          {doc.file_name && doc.file_name !== primary && (
            <p className="text-[11px] text-white/40 truncate">{doc.file_name}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {doc.specialty_code && (
            <span className="text-[10px] font-mono text-white/40 bg-white/5 px-2 py-0.5 rounded hidden sm:block">
              {doc.specialty_code}
            </span>
          )}
          {doc.version_number != null && doc.version_number > 0 && (
            <span className="text-[10px] font-mono text-white/40 bg-white/5 px-2 py-0.5 rounded">
              v{doc.version_number}
            </span>
          )}
          <a
            href={dlUrl}
            className="flex items-center gap-1.5 text-xs font-bold text-[#1A2744] bg-[#00C2FF] hover:bg-[#00D4FF] px-3.5 py-1.5 rounded-lg transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> Descargar
          </a>
          <button
            onClick={onClose}
            title="Cerrar (Esc)"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {previewable ? (
        isImage ? (
          <div className="flex-1 overflow-auto flex items-center justify-center p-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={viewUrl} alt={primary} className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" />
          </div>
        ) : (
          <iframe src={viewUrl} className="flex-1 w-full border-0" title={primary} />
        )
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 p-8">
          <div className="w-24 h-24 bg-white/5 rounded-3xl flex items-center justify-center">
            <File className="w-12 h-12 text-white/15" />
          </div>
          <div className="space-y-1">
            <p className="text-white/80 font-semibold text-base">{primary}</p>
            <p className="text-white/30 text-sm">Este formato no puede visualizarse en el navegador.</p>
            <p className="text-white/20 text-xs">Descárgalo para abrirlo con el software correspondiente.</p>
          </div>
          <a
            href={dlUrl}
            className="flex items-center gap-2 text-sm font-bold text-[#1A2744] bg-[#00C2FF] hover:bg-[#00D4FF] px-6 py-3 rounded-xl transition-colors shadow-lg shadow-[#00C2FF]/20"
          >
            <Download className="w-4 h-4" /> Descargar archivo
          </a>
        </div>
      )}
    </div>
  )
}

// ── DocCard (grid) ─────────────────────────────────────────────────────────────

function DocCard({ doc, token, selected, onToggle, onView }: {
  doc: ShareDoc; token: string
  selected: boolean
  onToggle: (id: string) => void
  onView: (doc: ShareDoc) => void
}) {
  const { Icon, bg, color } = fileTypeIcon(doc.file_type)
  const primary = docPrimaryName(doc)
  const dStatus = DOC_STATUS[doc.status ?? '']
  const dlUrl   = `/api/share/${token}/file?type=document&id=${doc.id}&dl=1`

  return (
    <div className={`relative bg-white rounded-xl border transition-all group flex flex-col ${
      selected
        ? 'border-[#00C2FF] ring-2 ring-[#00C2FF]/25 shadow-md'
        : 'border-slate-100 hover:border-slate-200 hover:shadow-md'
    }`}>
      {/* Checkbox */}
      <button
        onClick={() => onToggle(doc.id)}
        className={`absolute top-2.5 left-2.5 z-10 transition-opacity ${
          selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      >
        {selected
          ? <CheckSquare className="w-4 h-4 text-[#00C2FF]" />
          : <Square className="w-4 h-4 text-slate-300" />
        }
      </button>

      {/* Icon + status */}
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

      {/* Name */}
      <div className="px-4 pb-2 flex-1">
        <p className="text-sm font-bold text-[#1A2744] leading-snug">{primary}</p>
        {doc.file_name && doc.file_name !== primary && (
          <p className="text-[10px] text-slate-400 mt-0.5 truncate" title={doc.file_name}>{doc.file_name}</p>
        )}
      </div>

      {/* Meta */}
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
        <button
          onClick={() => onView(doc)}
          className="flex-1 flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-[#1A2744] py-2 rounded-lg hover:bg-slate-50 border border-slate-200 transition-colors"
        >
          <Eye className="w-3 h-3" /> Ver
        </button>
        <a
          href={dlUrl}
          className="flex-1 flex items-center justify-center gap-1 text-[11px] font-semibold text-white bg-[#1A2744] hover:bg-[#243660] py-2 rounded-lg transition-colors"
        >
          <Download className="w-3 h-3" /> Descargar
        </a>
      </div>
    </div>
  )
}

// ── DocRow (list) ──────────────────────────────────────────────────────────────

function DocRow({ doc, token, selected, onToggle, onView }: {
  doc: ShareDoc; token: string
  selected: boolean
  onToggle: (id: string) => void
  onView: (doc: ShareDoc) => void
}) {
  const { Icon, color } = fileTypeIcon(doc.file_type)
  const primary = docPrimaryName(doc)
  const dStatus = DOC_STATUS[doc.status ?? '']
  const dlUrl   = `/api/share/${token}/file?type=document&id=${doc.id}&dl=1`

  return (
    <div className={`flex items-center gap-3 py-3 px-4 bg-white rounded-xl border transition-all group ${
      selected
        ? 'border-[#00C2FF] ring-2 ring-[#00C2FF]/20'
        : 'border-slate-100 hover:border-slate-200 hover:shadow-sm'
    }`}>
      {/* Checkbox */}
      <button
        onClick={() => onToggle(doc.id)}
        className={`flex-shrink-0 transition-opacity ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
      >
        {selected
          ? <CheckSquare className="w-4 h-4 text-[#00C2FF]" />
          : <Square className="w-4 h-4 text-slate-300" />
        }
      </button>

      <Icon className={`w-4 h-4 ${color} flex-shrink-0`} />

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#1A2744] truncate">{primary}</p>
        {doc.file_name && doc.file_name !== primary && (
          <p className="text-[10px] text-slate-400 truncate">{doc.file_name}</p>
        )}
      </div>

      {doc.author && (
        <div className="hidden lg:flex items-center gap-1 flex-shrink-0 max-w-[130px]">
          <Pen className="w-3 h-3 text-slate-300" />
          <span className="text-[11px] text-slate-500 truncate">{doc.author}</span>
        </div>
      )}
      {doc.uploaderName && (
        <div className="hidden md:block flex-shrink-0">
          <AvatarChip name={doc.uploaderName} />
        </div>
      )}
      {doc.version_number != null && doc.version_number > 0 && (
        <span className="hidden sm:block text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-mono flex-shrink-0">
          v{doc.version_number}
        </span>
      )}
      {doc.created_at && (
        <span className="hidden md:block text-xs text-slate-400 flex-shrink-0">{fmtDate(doc.created_at)}</span>
      )}
      {dStatus && (
        <span className={`hidden sm:block text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${dStatus.cls}`}>
          {dStatus.label}
        </span>
      )}

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={() => onView(doc)}
          className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-[#1A2744] px-2.5 py-1.5 rounded-lg hover:bg-slate-50 border border-slate-200 transition-colors"
        >
          <Eye className="w-3 h-3" /> Ver
        </button>
        <a
          href={dlUrl}
          className="flex items-center gap-1 text-[11px] font-semibold text-white bg-[#1A2744] hover:bg-[#243660] px-2.5 py-1.5 rounded-lg transition-colors"
        >
          <Download className="w-3 h-3" />
          <span className="hidden sm:block ml-0.5">Descargar</span>
        </a>
      </div>
    </div>
  )
}

// ── SpecialtySection ───────────────────────────────────────────────────────────

function SpecialtySection({ specialty, docs, folders, view, token, selected, onToggle, onView }: {
  specialty: string
  docs: ShareDoc[]
  folders: ShareFolder[]
  view: 'grid' | 'list'
  token: string
  selected: Set<string>
  onToggle: (id: string) => void
  onView: (doc: ShareDoc) => void
}) {
  // Folders that have at least one doc in this specialty group
  const relevantFolders = folders.filter(f => docs.some(d => d.folder_id === f.id))
  // Docs without a folder (or with an unknown folder)
  const rootDocs = docs.filter(d => !d.folder_id || !folders.some(f => f.id === d.folder_id))

  const Grid = ({ items }: { items: ShareDoc[] }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map(doc => <DocCard key={doc.id} doc={doc} token={token} selected={selected.has(doc.id)} onToggle={onToggle} onView={onView} />)}
    </div>
  )
  const List = ({ items }: { items: ShareDoc[] }) => (
    <div className="space-y-2">
      {items.map(doc => <DocRow key={doc.id} doc={doc} token={token} selected={selected.has(doc.id)} onToggle={onToggle} onView={onView} />)}
    </div>
  )

  return (
    <div>
      {/* Specialty header */}
      <div className="flex items-center gap-3 mb-5">
        <span className="h-px w-10 bg-slate-100 inline-block" />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">{specialty}</p>
        <span className="text-[10px] text-slate-300">({docs.length})</span>
        <span className="h-px flex-1 bg-slate-100 inline-block" />
      </div>

      {/* Folders */}
      {relevantFolders.map(folder => {
        const folderDocs = docs.filter(d => d.folder_id === folder.id)
        if (folderDocs.length === 0) return null
        return (
          <div key={folder.id} className="mb-7">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-[#00C2FF]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <FolderOpen className="w-3.5 h-3.5 text-[#00C2FF]" />
              </div>
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">{folder.name}</span>
              <span className="text-[10px] text-slate-300">({folderDocs.length})</span>
              <span className="h-px flex-1 bg-slate-100" />
            </div>
            <div className="pl-5">
              {view === 'grid' ? <Grid items={folderDocs} /> : <List items={folderDocs} />}
            </div>
          </div>
        )
      })}

      {/* Root docs (no folder) */}
      {rootDocs.length > 0 && (
        view === 'grid' ? <Grid items={rootDocs} /> : <List items={rootDocs} />
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
  const [activeTab,       setActiveTab]       = useState<string>('all')
  const [view,            setView]            = useState<'list' | 'grid'>('grid')
  const [filterSpecialty, setFilterSpecialty] = useState<string>('all')
  const [viewing,         setViewing]         = useState<ShareDoc | null>(null)
  const [selected,        setSelected]        = useState<Set<string>>(new Set())
  const [downloading,     setDownloading]     = useState(false)

  const hasSubprojects = subprojects.length > 0

  const tabs = hasSubprojects ? [
    { id: 'all',         label: 'Todos',     count: documents.length },
    { id: rootProjectId, label: 'Principal', count: documents.filter(d => d.project_id === rootProjectId).length },
    ...subprojects
      .map(s => ({ id: s.id, label: s.name, count: documents.filter(d => d.project_id === s.id).length }))
      .filter(t => t.count > 0),
  ] : []

  // Filter by tab
  const tabFiltered = !hasSubprojects || activeTab === 'all'
    ? documents
    : documents.filter(d => d.project_id === activeTab)

  // Specialty options
  const specialtyOptions: { code: string; label: string }[] = []
  const seenCodes = new Set<string>()
  for (const doc of tabFiltered) {
    const code = doc.specialty_code || '__general'
    if (!seenCodes.has(code)) {
      seenCodes.add(code)
      specialtyOptions.push({ code, label: doc.specialty_name || doc.specialty_code || 'General' })
    }
  }

  // Filter by specialty
  const visibleDocs = filterSpecialty === 'all'
    ? tabFiltered
    : tabFiltered.filter(d => (d.specialty_code || '__general') === filterSpecialty)

  // Group by specialty
  const bySpecialty: Record<string, ShareDoc[]> = {}
  for (const doc of visibleDocs) {
    const key = doc.specialty_name
      ? `[${doc.specialty_code}] ${doc.specialty_name}`
      : doc.specialty_code || 'General'
    if (!bySpecialty[key]) bySpecialty[key] = []
    bySpecialty[key].push(doc)
  }

  const isEmpty = documents.length === 0
  const allVisible = visibleDocs.length > 0
  const allSelected = selected.size === visibleDocs.length && visibleDocs.length > 0

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(visibleDocs.map(d => d.id)))
    }
  }

  async function handleDownload(ids: string[]) {
    if (ids.length === 0 || downloading) return
    setDownloading(true)
    await triggerDownloads(token, ids)
    setDownloading(false)
  }

  return (
    <>
      {/* Fullscreen document viewer */}
      {viewing && <DocViewer doc={viewing} token={token} onClose={() => setViewing(null)} />}

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-10">

        {!isEmpty && (
          <div className="flex items-center gap-2 flex-wrap justify-between">
            {/* Left: subproject tabs + specialty pills */}
            <div className="flex flex-col gap-2 w-full">
              {hasSubprojects && (
                <div className="flex items-center gap-2 flex-wrap">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => { setActiveTab(tab.id); setFilterSpecialty('all'); setSelected(new Set()) }}
                      className={`text-xs px-3.5 py-1.5 rounded-full font-semibold transition-all ${
                        activeTab === tab.id
                          ? 'bg-[#1A2744] text-white shadow-sm'
                          : 'bg-white border border-slate-200 text-slate-600 hover:border-[#1A2744]/40'
                      }`}
                    >
                      {tab.label}
                      <span className={`ml-1.5 ${activeTab === tab.id ? 'opacity-60' : 'text-slate-400'}`}>
                        ({tab.count})
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {specialtyOptions.length > 1 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Filter className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  <button
                    onClick={() => setFilterSpecialty('all')}
                    className={`text-xs px-3 py-1 rounded-full font-semibold transition-all border ${
                      filterSpecialty === 'all'
                        ? 'bg-[#00C2FF]/15 border-[#00C2FF]/40 text-[#00C2FF]'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    Todas
                  </button>
                  {specialtyOptions.map(s => (
                    <button
                      key={s.code}
                      onClick={() => setFilterSpecialty(s.code)}
                      className={`text-xs px-3 py-1 rounded-full font-semibold transition-all border ${
                        filterSpecialty === s.code
                          ? 'bg-[#00C2FF]/15 border-[#00C2FF]/40 text-[#00C2FF]'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: select, download all, view toggle */}
            <div className="flex items-center gap-2 ml-auto">
              {/* Select toggle */}
              {allVisible && (
                <button
                  onClick={toggleSelectAll}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium ${
                    allSelected
                      ? 'border-[#00C2FF] text-[#00C2FF] bg-[#00C2FF]/5'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300 bg-white'
                  }`}
                >
                  {allSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                  {selected.size > 0
                    ? `${selected.size} seleccionado${selected.size > 1 ? 's' : ''}`
                    : 'Seleccionar'
                  }
                </button>
              )}

              {/* Download all */}
              {allVisible && (
                <button
                  onClick={() => handleDownload(visibleDocs.map(d => d.id))}
                  disabled={downloading}
                  className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#1A2744] hover:bg-[#243660] px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  <ArrowDownToLine className="w-3.5 h-3.5" />
                  {downloading ? 'Descargando...' : 'Descargar todo'}
                </button>
              )}

              {/* View toggle */}
              <div className="flex bg-slate-100 rounded-lg p-0.5 gap-0.5">
                <button
                  onClick={() => setView('list')}
                  title="Vista lista"
                  className={`p-2 rounded-md transition-all ${view === 'list' ? 'bg-white shadow-sm text-[#1A2744]' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setView('grid')}
                  title="Vista tarjetas"
                  className={`p-2 rounded-md transition-all ${view === 'grid' ? 'bg-white shadow-sm text-[#1A2744]' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Document sections */}
        {visibleDocs.length > 0 ? (
          <section>
            <h2 className="text-base font-bold text-[#1A2744] mb-6 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#00C2FF]" />
              Planos y Documentos
              <span className="text-xs font-normal text-slate-400 ml-1">(versión vigente)</span>
            </h2>
            <div className="space-y-8">
              {Object.entries(bySpecialty).map(([specialty, docs]) => (
                <SpecialtySection
                  key={specialty}
                  specialty={specialty}
                  docs={docs}
                  folders={folders}
                  view={view}
                  token={token}
                  selected={selected}
                  onToggle={toggleSelect}
                  onView={setViewing}
                />
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

      {/* Floating action bar — shown when items are selected */}
      {selected.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-[#1A2744] text-white px-5 py-3 rounded-2xl shadow-2xl shadow-black/30 border border-white/10">
          <span className="text-sm font-semibold whitespace-nowrap">
            {selected.size} archivo{selected.size > 1 ? 's' : ''} seleccionado{selected.size > 1 ? 's' : ''}
          </span>
          <div className="w-px h-4 bg-white/20" />
          <button
            onClick={() => handleDownload([...selected])}
            disabled={downloading}
            className="flex items-center gap-1.5 text-xs font-bold text-[#1A2744] bg-[#00C2FF] hover:bg-[#00D4FF] px-3.5 py-1.5 rounded-lg transition-colors disabled:opacity-60 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            {downloading ? 'Descargando...' : `Descargar (${selected.size})`}
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-white/40 hover:text-white transition-colors"
            title="Cancelar selección"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  )
}
