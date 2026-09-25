'use client'

import { useState } from 'react'
import { Download, Eye, Filter, ThumbsUp, ThumbsDown, Archive, Trash2, X } from 'lucide-react'
import { approveEntregable, rejectEntregable, archiveEntregable, deleteEntregable } from '../tasks/actions'

type Entregable = {
  id: string
  file_name: string
  file_type: string | null
  file_size: number | null
  status: 'pending' | 'approved' | 'rejected'
  is_archived: boolean
  review_note: string | null
  created_at: string
  uploader_name: string | null
  reviewer_name: string | null
  task_name: string | null
  task_id: string | null
  project_id: string | null
  project_name: string | null
}

const ACTIVE_COLUMNS = [
  { key: 'pending',  label: 'En revisión', color: 'bg-amber-50  border-amber-200', badge: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-400'  },
  { key: 'approved', label: 'Aprobado',    color: 'bg-green-50  border-green-200', badge: 'bg-green-100 text-green-700',  dot: 'bg-green-500'  },
  { key: 'rejected', label: 'Rechazado',   color: 'bg-red-50    border-red-200',   badge: 'bg-red-100   text-red-600',    dot: 'bg-red-400'    },
] as const

const FILE_ICON: Record<string, string> = {
  pdf: '📄', dwg: '📐', dxf: '📐', xlsx: '📊', docx: '📝', img: '🖼️', zip: '🗜️', other: '📁'
}

function formatSize(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function EntregableCard({
  ent, isAdmin, onAction
}: {
  ent: Entregable
  isAdmin: boolean
  onAction: () => void
}) {
  const [rejectOpen,  setRejectOpen]  = useState(false)
  const [rejectNote,  setRejectNote]  = useState('')
  const [loading,     setLoading]     = useState(false)

  async function approve() {
    if (!ent.task_id) return
    setLoading(true)
    await approveEntregable(ent.id, ent.task_id)
    setLoading(false)
    onAction()
  }

  async function reject() {
    if (!ent.task_id) return
    setLoading(true)
    await rejectEntregable(ent.id, ent.task_id, rejectNote)
    setLoading(false)
    setRejectOpen(false)
    onAction()
  }

  async function archive() {
    if (!confirm(`¿Archivar "${ent.file_name}"?`)) return
    setLoading(true)
    await archiveEntregable(ent.id)
    setLoading(false)
    onAction()
  }

  async function remove() {
    if (!confirm(`¿Eliminar "${ent.file_name}" permanentemente?`)) return
    setLoading(true)
    await deleteEntregable(ent.id)
    setLoading(false)
    onAction()
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-3.5 shadow-sm">
      {/* File info */}
      <div className="flex items-start gap-2.5 mb-2">
        <span className="text-xl flex-shrink-0">{FILE_ICON[ent.file_type ?? 'other'] ?? '📁'}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-700 truncate">{ent.file_name}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {formatSize(ent.file_size)}{ent.file_size ? ' · ' : ''}{ent.file_type?.toUpperCase()}
          </p>
        </div>
        {isAdmin && (
          <button onClick={remove} disabled={loading} title="Eliminar"
            className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors flex-shrink-0">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Task + Project */}
      {ent.task_name && (
        <div className="mb-2">
          <p className="text-[10px] text-slate-500 font-medium truncate">{ent.task_name}</p>
          {ent.project_name && <p className="text-[10px] text-slate-400 truncate">{ent.project_name}</p>}
        </div>
      )}

      {/* Meta */}
      <div className="flex items-center gap-2 text-[10px] text-slate-400">
        <span>{ent.uploader_name ?? 'Usuario'}</span>
        <span>·</span>
        <span>{new Date(ent.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</span>
      </div>

      {/* Nota de rechazo */}
      {ent.status === 'rejected' && ent.review_note && (
        <p className="text-[10px] text-red-500 bg-red-50 rounded px-2 py-1 mt-2 italic">
          {ent.review_note}
        </p>
      )}

      {/* Reviewer */}
      {ent.reviewer_name && !rejectOpen && (
        <p className="text-[10px] text-slate-400 mt-1">
          {ent.status === 'approved' ? '✅' : '❌'} por {ent.reviewer_name}
        </p>
      )}

      {/* Rechazo inline */}
      {rejectOpen && (
        <div className="mt-2 space-y-1.5">
          <textarea
            value={rejectNote}
            onChange={e => setRejectNote(e.target.value)}
            placeholder="Motivo del rechazo (opcional)"
            rows={2}
            className="w-full text-[10px] px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-300 resize-none"
          />
          <div className="flex gap-1.5">
            <button onClick={reject} disabled={loading}
              className="flex-1 text-[10px] font-bold py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-60">
              {loading ? '...' : 'Confirmar rechazo'}
            </button>
            <button onClick={() => setRejectOpen(false)}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-100">
              <X className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        </div>
      )}

      {/* View / Download */}
      <div className="flex gap-2 mt-3">
        <a href={`/api/entregables/view/${ent.id}`} target="_blank" rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 py-1.5 rounded-lg transition-colors">
          <Eye className="w-3 h-3" /> Ver
        </a>
        <a href={`/api/entregables/view/${ent.id}`} download
          className="flex-1 flex items-center justify-center gap-1 text-[10px] font-semibold text-[#1A2744] bg-slate-100 hover:bg-slate-200 py-1.5 rounded-lg transition-colors">
          <Download className="w-3 h-3" /> Descargar
        </a>
      </div>

      {/* Admin actions */}
      {isAdmin && !rejectOpen && (
        <div className="flex gap-2 mt-2">
          {ent.status === 'pending' && (
            <>
              <button onClick={approve} disabled={loading}
                className="flex-1 flex items-center justify-center gap-1 text-[10px] font-bold py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-60 transition-colors">
                <ThumbsUp className="w-3 h-3" /> Aprobar
              </button>
              <button onClick={() => setRejectOpen(true)} disabled={loading}
                className="flex-1 flex items-center justify-center gap-1 text-[10px] font-bold py-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-60 transition-colors">
                <ThumbsDown className="w-3 h-3" /> Rechazar
              </button>
            </>
          )}
          {ent.status === 'approved' && (
            <button onClick={archive} disabled={loading}
              className="w-full flex items-center justify-center gap-1 text-[10px] font-bold py-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:opacity-60 transition-colors">
              <Archive className="w-3 h-3" /> Archivar
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function DeliverablesPanel({
  entregables, projects, currentUserRole
}: {
  entregables: Entregable[]
  projects: { id: string; name: string }[]
  currentUserRole: string
}) {
  const [tab,           setTab]           = useState<'active' | 'archived'>('active')
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [, forceUpdate] = useState(0)
  const isAdmin = ['owner', 'admin'].includes(currentUserRole)

  const filtered = entregables.filter(e => {
    const matchProject = projectFilter === 'all' || e.project_id === projectFilter
    const matchArchive = tab === 'archived' ? e.is_archived : !e.is_archived
    return matchProject && matchArchive
  })

  const byStatus = (status: string) => filtered.filter(e => e.status === status)

  const archivedCount = entregables.filter(e => e.is_archived).length

  return (
    <div>
      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 bg-slate-100 rounded-lg p-1 w-fit">
        <button onClick={() => setTab('active')}
          className={`text-xs px-4 py-1.5 rounded-md font-semibold transition-all ${
            tab === 'active' ? 'bg-white text-[#1A2744] shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}>
          Activos
          <span className="ml-1.5 opacity-70">
            {entregables.filter(e => !e.is_archived).length}
          </span>
        </button>
        <button onClick={() => setTab('archived')}
          className={`text-xs px-4 py-1.5 rounded-md font-semibold transition-all ${
            tab === 'archived' ? 'bg-white text-[#1A2744] shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}>
          Archivados
          {archivedCount > 0 && <span className="ml-1.5 opacity-70">{archivedCount}</span>}
        </button>
      </div>

      {/* Filtro por proyecto */}
      {projects.length > 0 && (
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <Filter className="w-4 h-4 text-slate-400" />
          <button onClick={() => setProjectFilter('all')}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
              projectFilter === 'all'
                ? 'bg-[#1A2744] text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
            }`}>
            Todos
          </button>
          {projects.map(p => (
            <button key={p.id} onClick={() => setProjectFilter(p.id)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                projectFilter === p.id
                  ? 'bg-[#1A2744] text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
              }`}>
              {p.name}
            </button>
          ))}
        </div>
      )}

      {/* Vista activos — Kanban */}
      {tab === 'active' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {ACTIVE_COLUMNS.map(col => {
            const items = byStatus(col.key)
            return (
              <div key={col.key} className={`rounded-xl border p-4 ${col.color}`}>
                <div className="flex items-center gap-2 mb-4">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                  <span className="text-sm font-bold text-[#1A2744]">{col.label}</span>
                  <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${col.badge}`}>
                    {items.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {items.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">Sin entregables</p>
                  ) : items.map(ent => (
                    <EntregableCard
                      key={ent.id}
                      ent={ent}
                      isAdmin={isAdmin}
                      onAction={() => forceUpdate(n => n + 1)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Vista archivados — Lista */}
      {tab === 'archived' && (
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <Archive className="w-8 h-8 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No hay entregables archivados</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wide">
                <span className="w-6" />
                <span className="flex-1">Archivo</span>
                <span className="hidden sm:block w-40">Tarea</span>
                <span className="hidden md:block w-32">Proyecto</span>
                <span className="w-24">Aprobado por</span>
                <span className="w-20 text-right">Acciones</span>
              </div>
              {filtered.map(ent => (
                <div key={ent.id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50 group">
                  <span className="text-lg w-6 flex-shrink-0">{FILE_ICON[ent.file_type ?? 'other'] ?? '📁'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{ent.file_name}</p>
                    <p className="text-xs text-slate-400">{formatSize(ent.file_size)} · {ent.file_type?.toUpperCase()}</p>
                  </div>
                  <span className="hidden sm:block text-xs text-slate-500 w-40 truncate">{ent.task_name ?? '—'}</span>
                  <span className="hidden md:block text-xs text-slate-400 w-32 truncate">{ent.project_name ?? '—'}</span>
                  <span className="text-xs text-slate-400 w-24 truncate">{ent.reviewer_name ?? '—'}</span>
                  <div className="flex items-center gap-1 w-20 justify-end">
                    <a href={`/api/entregables/view/${ent.id}`} target="_blank" rel="noopener noreferrer"
                      title="Ver" className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600">
                      <Eye className="w-3.5 h-3.5" />
                    </a>
                    <a href={`/api/entregables/view/${ent.id}`} download
                      title="Descargar" className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600">
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    {isAdmin && (
                      <button onClick={async () => {
                        if (!confirm(`¿Eliminar "${ent.file_name}"?`)) return
                        await deleteEntregable(ent.id)
                        forceUpdate(n => n + 1)
                      }} title="Eliminar"
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
