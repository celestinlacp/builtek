'use client'

import { useState } from 'react'
import {
  FileText, Layers, Image as ImageIcon, FileSpreadsheet, File,
  Download, Eye, List, LayoutGrid, Package, FolderOpen,
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
  status: string | null
  version_number: number | null
  project_id: string
  uploaded_by: string | null
  created_at: string | null
  uploaderName: string | null
}

export type ShareEntregable = {
  id: string
  file_name: string | null
  file_type: string | null
  status: string | null
  created_at: string
  task_id: string
}

export type ShareSubproject = { id: string; name: string }

// ── Helpers ────────────────────────────────────────────────────────────────────

function getInitials(name: string | null) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function docDisplayName(doc: ShareDoc) {
  return doc.doc_key || doc.display_name || doc.name || doc.file_name || 'Sin nombre'
}

function fileTypeIcon(ft: string | null) {
  switch (ft) {
    case 'pdf':  return { Icon: FileText,       bg: 'bg-red-50',    color: 'text-red-500'    }
    case 'dwg':
    case 'dxf':  return { Icon: Layers,          bg: 'bg-blue-50',   color: 'text-blue-500'   }
    case 'img':
    case 'png':
    case 'jpg':  return { Icon: ImageIcon,       bg: 'bg-purple-50', color: 'text-purple-500' }
    case 'xlsx':
    case 'csv':  return { Icon: FileSpreadsheet, bg: 'bg-green-50',  color: 'text-green-500'  }
    default:     return { Icon: File,            bg: 'bg-slate-50',  color: 'text-slate-400'  }
  }
}

const DOC_STATUS: Record<string, { label: string; cls: string }> = {
  draft:    { label: 'Borrador',    cls: 'bg-slate-100 text-slate-600' },
  review:   { label: 'En revisión', cls: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Aprobado',    cls: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rechazado',   cls: 'bg-red-100 text-red-600'    },
}

const ENT_STATUS: Record<string, { label: string; cls: string }> = {
  pending:  { label: 'Pendiente',   cls: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Aprobado',    cls: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rechazado',   cls: 'bg-red-100 text-red-600'    },
}

function fmtDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtDateShort(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

// ── Doc Card (grid view) ───────────────────────────────────────────────────────

function DocCard({ doc, token }: { doc: ShareDoc; token: string }) {
  const { Icon, bg, color } = fileTypeIcon(doc.file_type)
  const dispName = docDisplayName(doc)
  const dStatus  = DOC_STATUS[doc.status ?? '']
  const viewUrl  = `/api/share/${token}/file?type=document&id=${doc.id}`
  const dlUrl    = `/api/share/${token}/file?type=document&id=${doc.id}&dl=1`
  const date     = fmtDate(doc.created_at)

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 flex flex-col gap-3 hover:shadow-md hover:border-slate-200 transition-all group">
      {/* Icon + status */}
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        {dStatus && (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${dStatus.cls}`}>
            {dStatus.label}
          </span>
        )}
      </div>

      {/* Name + version */}
      <div className="flex-1">
        <p className="text-sm font-bold text-[#1A2744] leading-snug line-clamp-2">{dispName}</p>
        {doc.version_number != null && doc.version_number > 0 && (
          <span className="inline-block text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded mt-1">
            v{doc.version_number}
          </span>
        )}
      </div>

      {/* Author + date */}
      <div className="flex items-center gap-2 text-[11px] text-slate-400 border-t border-slate-50 pt-2 min-h-[24px]">
        {doc.uploaderName ? (
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <div className="w-5 h-5 rounded-full bg-[#1A2744] text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0">
              {getInitials(doc.uploaderName)}
            </div>
            <span className="truncate">{doc.uploaderName}</span>
          </div>
        ) : <span className="flex-1" />}
        {date && <span className="flex-shrink-0 text-slate-300">{date}</span>}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
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
  const dispName = docDisplayName(doc)
  const dStatus  = DOC_STATUS[doc.status ?? '']
  const viewUrl  = `/api/share/${token}/file?type=document&id=${doc.id}`
  const dlUrl    = `/api/share/${token}/file?type=document&id=${doc.id}&dl=1`
  const date     = fmtDateShort(doc.created_at)

  return (
    <div className="flex items-center gap-3 py-3 px-4 bg-white rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all">
      <Icon className={`w-4 h-4 ${color} flex-shrink-0`} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#1A2744] truncate">{dispName}</p>
        {doc.version_number != null && doc.version_number > 0 && (
          <span className="text-[10px] text-slate-400">v{doc.version_number}</span>
        )}
      </div>

      {/* Author */}
      {doc.uploaderName && (
        <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
          <div className="w-5 h-5 rounded-full bg-[#1A2744] text-white text-[9px] font-bold flex items-center justify-center">
            {getInitials(doc.uploaderName)}
          </div>
          <span className="text-xs text-slate-500 max-w-[110px] truncate hidden md:block">{doc.uploaderName}</span>
        </div>
      )}

      {/* Date */}
      {date && <span className="hidden md:block text-xs text-slate-400 flex-shrink-0">{date}</span>}

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

function SpecialtySection({ specialty, docs, view, token }: {
  specialty: string
  docs: ShareDoc[]
  view: 'grid' | 'list'
  token: string
}) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <span className="inline-block h-px w-10 bg-slate-100" />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{specialty}</p>
        <span className="text-[10px] text-slate-300">({docs.length})</span>
        <span className="inline-block h-px flex-1 bg-slate-100" />
      </div>
      {view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {docs.map(doc => <DocCard key={doc.id} doc={doc} token={token} />)}
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map(doc => <DocRow key={doc.id} doc={doc} token={token} />)}
        </div>
      )}
    </div>
  )
}

// ── Entregable Card ────────────────────────────────────────────────────────────

function EntCard({ ent, taskName, token }: { ent: ShareEntregable; taskName?: string; token: string }) {
  const { Icon, bg, color } = fileTypeIcon(ent.file_type)
  const eStatus = ENT_STATUS[ent.status ?? '']
  const dlUrl   = `/api/share/${token}/file?type=entregable&id=${ent.id}&dl=1`
  const viewUrl = `/api/share/${token}/file?type=entregable&id=${ent.id}`
  const date    = fmtDate(ent.created_at)

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 flex flex-col gap-3 hover:shadow-md hover:border-slate-200 transition-all group">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        {eStatus && (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${eStatus.cls}`}>
            {eStatus.label}
          </span>
        )}
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-[#1A2744] leading-snug line-clamp-2">{ent.file_name || 'Entregable'}</p>
        {taskName && <p className="text-[10px] text-slate-400 mt-0.5 truncate">Tarea: {taskName}</p>}
      </div>
      {date && (
        <p className="text-[11px] text-slate-300 border-t border-slate-50 pt-2">{date}</p>
      )}
      <div className="flex items-center gap-2">
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

function EntRow({ ent, taskName, token }: { ent: ShareEntregable; taskName?: string; token: string }) {
  const { Icon, color } = fileTypeIcon(ent.file_type)
  const eStatus = ENT_STATUS[ent.status ?? '']
  const dlUrl   = `/api/share/${token}/file?type=entregable&id=${ent.id}&dl=1`
  const viewUrl = `/api/share/${token}/file?type=entregable&id=${ent.id}`
  const date    = fmtDateShort(ent.created_at)

  return (
    <div className="flex items-center gap-3 py-3 px-4 bg-white rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all">
      <Icon className={`w-4 h-4 ${color} flex-shrink-0`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#1A2744] truncate">{ent.file_name || 'Entregable'}</p>
        {taskName && <p className="text-[10px] text-slate-400 truncate">Tarea: {taskName}</p>}
      </div>
      {date && <span className="hidden md:block text-xs text-slate-400 flex-shrink-0">{date}</span>}
      {eStatus && (
        <span className={`hidden sm:block text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${eStatus.cls}`}>
          {eStatus.label}
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

// ── Main ───────────────────────────────────────────────────────────────────────

export default function ShareContent({
  rootProjectId,
  subprojects,
  documents,
  entregables,
  taskNameById,
  token,
}: {
  rootProjectId: string
  subprojects: ShareSubproject[]
  documents: ShareDoc[]
  entregables: ShareEntregable[]
  taskNameById: Record<string, string>
  token: string
}) {
  const [activeTab, setActiveTab] = useState<string>('all')
  const [view, setView] = useState<'list' | 'grid'>('grid')

  // Build tabs — only if there are subprojects
  const hasSubprojects = subprojects.length > 0

  const tabs = hasSubprojects ? [
    { id: 'all', label: 'Todos', count: documents.length },
    { id: rootProjectId, label: 'Principal', count: documents.filter(d => d.project_id === rootProjectId).length },
    ...subprojects
      .map(s => ({ id: s.id, label: s.name, count: documents.filter(d => d.project_id === s.id).length }))
      .filter(t => t.count > 0),
  ] : []

  const visibleDocs = !hasSubprojects || activeTab === 'all'
    ? documents
    : documents.filter(d => d.project_id === activeTab)

  // Group visible docs by specialty
  const bySpecialty: Record<string, ShareDoc[]> = {}
  for (const doc of visibleDocs) {
    const key = doc.specialty_code || 'General'
    if (!bySpecialty[key]) bySpecialty[key] = []
    bySpecialty[key].push(doc)
  }

  const isEmpty = documents.length === 0 && entregables.length === 0

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 space-y-10">

      {/* Toolbar: tabs + view toggle */}
      {!isEmpty && (
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Subproject tabs */}
          {hasSubprojects && (
            <div className="flex items-center gap-2 flex-wrap">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
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
            </div>
          )}

          {/* View toggle */}
          {documents.length > 0 && (
            <div className={`flex bg-slate-100 rounded-lg p-0.5 gap-0.5 ${!hasSubprojects ? 'ml-auto' : ''}`}>
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
              <SpecialtySection key={specialty} specialty={specialty} docs={docs} view={view} token={token} />
            ))}
          </div>
        </section>
      ) : hasSubprojects && documents.length > 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
          <p className="text-slate-400 text-sm">No hay documentos para este subproyecto</p>
          <button onClick={() => setActiveTab('all')} className="text-xs text-[#00C2FF] font-semibold mt-2 hover:underline">
            Ver todos →
          </button>
        </div>
      ) : isEmpty ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-slate-400 font-medium">Sin archivos disponibles</p>
          <p className="text-xs text-slate-300 mt-1">Este proyecto aún no tiene documentos cargados.</p>
        </div>
      ) : null}

      {/* Entregables */}
      {entregables.length > 0 && (
        <section>
          <h2 className="text-base font-bold text-[#1A2744] mb-5 flex items-center gap-2">
            <Package className="w-4 h-4 text-[#00C2FF]" />
            Entregables
          </h2>
          {view === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {entregables.map(ent => (
                <EntCard key={ent.id} ent={ent} taskName={taskNameById[ent.task_id]} token={token} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {entregables.map(ent => (
                <EntRow key={ent.id} ent={ent} taskName={taskNameById[ent.task_id]} token={token} />
              ))}
            </div>
          )}
        </section>
      )}

    </main>
  )
}
