'use client'

import { useState } from 'react'
import { Download, Eye, FileText, Filter } from 'lucide-react'

type Entregable = {
  id: string
  file_name: string
  file_type: string | null
  file_size: number | null
  status: 'pending' | 'approved' | 'rejected'
  review_note: string | null
  created_at: string
  uploader_name: string | null
  reviewer_name: string | null
  task_name: string | null
  project_id: string | null
  project_name: string | null
}

const COLUMNS = [
  { key: 'pending',  label: 'En revisión', color: 'bg-amber-50  border-amber-200', badge: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-400'  },
  { key: 'approved', label: 'Aprobado',    color: 'bg-green-50  border-green-200', badge: 'bg-green-100 text-green-700',  dot: 'bg-green-500'  },
  { key: 'rejected', label: 'Rechazado',   color: 'bg-red-50    border-red-200',   badge: 'bg-red-100   text-red-600',    dot: 'bg-red-400'    },
] as const

const FILE_ICON: Record<string, string> = {
  pdf: '📄', dwg: '📐', dxf: '📐', xlsx: '📊', docx: '📝', img: '🖼️', zip: '🗜️', other: '📁'
}

function formatSize(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function DeliverablesPanel({
  entregables, projects, currentUserRole
}: {
  entregables: Entregable[]
  projects: { id: string; name: string }[]
  currentUserRole: string
}) {
  const [projectFilter, setProjectFilter] = useState<string>('all')

  const filtered = projectFilter === 'all'
    ? entregables
    : entregables.filter(e => e.project_id === projectFilter)

  const byStatus = (status: string) => filtered.filter(e => e.status === status)

  return (
    <div>
      {/* Filtro por proyecto */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <Filter className="w-4 h-4 text-slate-400" />
        <button
          onClick={() => setProjectFilter('all')}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
            projectFilter === 'all'
              ? 'bg-[#1A2744] text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
          }`}
        >
          Todos
        </button>
        {projects.map(p => (
          <button
            key={p.id}
            onClick={() => setProjectFilter(p.id)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
              projectFilter === p.id
                ? 'bg-[#1A2744] text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {COLUMNS.map(col => {
          const items = byStatus(col.key)
          return (
            <div key={col.key} className={`rounded-xl border p-4 ${col.color}`}>
              {/* Column header */}
              <div className="flex items-center gap-2 mb-4">
                <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                <span className="text-sm font-bold text-[#1A2744]">{col.label}</span>
                <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${col.badge}`}>
                  {items.length}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-3">
                {items.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">Sin entregables</p>
                ) : items.map(ent => (
                  <div key={ent.id} className="bg-white rounded-xl border border-slate-100 p-3.5 shadow-sm">
                    {/* File info */}
                    <div className="flex items-start gap-2.5 mb-2">
                      <span className="text-xl flex-shrink-0">{FILE_ICON[ent.file_type ?? 'other']}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-700 truncate">{ent.file_name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {formatSize(ent.file_size)}
                          {ent.file_size ? ' · ' : ''}
                          {ent.file_type?.toUpperCase()}
                        </p>
                      </div>
                    </div>

                    {/* Task + Project */}
                    {ent.task_name && (
                      <div className="mb-2">
                        <p className="text-[10px] text-slate-500 font-medium truncate">{ent.task_name}</p>
                        {ent.project_name && (
                          <p className="text-[10px] text-slate-400 truncate">{ent.project_name}</p>
                        )}
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
                      <p className="text-[10px] text-red-500 bg-red-50 rounded px-2 py-1 mt-2">
                        {ent.review_note}
                      </p>
                    )}

                    {/* Reviewer */}
                    {ent.reviewer_name && (
                      <p className="text-[10px] text-slate-400 mt-1">
                        {ent.status === 'approved' ? '✅' : '❌'} por {ent.reviewer_name}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      <a
                        href={`/api/entregables/view/${ent.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 py-1.5 rounded-lg transition-colors"
                      >
                        <Eye className="w-3 h-3" /> Ver
                      </a>
                      <a
                        href={`/api/entregables/view/${ent.id}`}
                        download
                        className="flex-1 flex items-center justify-center gap-1 text-[10px] font-semibold text-[#1A2744] bg-slate-100 hover:bg-slate-200 py-1.5 rounded-lg transition-colors"
                      >
                        <Download className="w-3 h-3" /> Descargar
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
