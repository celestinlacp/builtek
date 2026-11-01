'use client'

import { useEffect, useState } from 'react'
import { Sparkles, Loader2, ChevronDown, ChevronRight } from 'lucide-react'
import { getProjectExtractions, type ProjectExtraction } from './actions'

const STATUS_CONFIG = {
  raw:      { label: 'Sin revisar', color: 'bg-slate-100 text-slate-500' },
  reviewed: { label: 'Revisada',    color: 'bg-blue-100 text-blue-600'   },
  approved: { label: 'Aprobada',    color: 'bg-green-100 text-green-700' },
}

export default function KotaDashboard({
  projectId,
  workspaceId,
  kotaData,
  totalDocs,
  onOpenDocument,
}: {
  projectId: string
  workspaceId: string
  kotaData: Record<string, any> | null
  totalDocs: number
  onOpenDocument: (docId: string) => void
}) {
  const [extractions,   setExtractions]   = useState<ProjectExtraction[]>([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState<string | null>(null)
  const [showKotaData,  setShowKotaData]  = useState(false)

  useEffect(() => {
    getProjectExtractions(projectId, workspaceId).then(res => {
      if (res.error) setError(res.error)
      else setExtractions(res.data ?? [])
      setLoading(false)
    })
  }, [projectId, workspaceId])

  const approvedCount = extractions.filter(e => e.status === 'approved').length
  const hasKotaData   = kotaData && Object.values(kotaData).some(v =>
    v && (typeof v === 'string' ? v.trim().length > 0 : Object.keys(v).length > 0)
  )

  return (
    <div className="max-w-4xl mx-auto py-6 px-2 space-y-6">

      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-[#00C2FF]" />
        <h3 className="text-sm font-bold text-[#1A2744]">Dashboard Kota</h3>
        <span className="text-xs text-slate-400">Extracciones de cuantificación de este proyecto</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-slate-100 rounded-xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-[#1A2744]">{totalDocs}</p>
          <p className="text-xs text-slate-400 mt-0.5">Documentos</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-[#00C2FF]">{loading ? '—' : extractions.length}</p>
          <p className="text-xs text-slate-400 mt-0.5">Extracciones Kota</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-green-600">{loading ? '—' : approvedCount}</p>
          <p className="text-xs text-slate-400 mt-0.5">Aprobadas</p>
        </div>
      </div>

      {/* Historial de extracciones */}
      <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            Historial de extracciones
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 text-[#00C2FF] animate-spin" />
          </div>
        ) : error ? (
          <div className="p-4 text-xs text-red-500">{error}</div>
        ) : extractions.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="w-8 h-8 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400 font-medium">Sin extracciones Kota aún</p>
            <p className="text-xs text-slate-300 mt-1">
              Abre un documento PDF y usa el tab "Kota" para analizar.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-400 uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold">Documento</th>
                  <th className="text-left px-4 py-2.5 font-semibold">ID Builtek</th>
                  <th className="text-left px-4 py-2.5 font-semibold whitespace-nowrap">Fecha</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Estado</th>
                  <th className="text-right px-4 py-2.5 font-semibold">Esp.</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {extractions.map(ext => (
                  <tr key={ext.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 max-w-xs">
                      <p className="font-medium text-[#1A2744] text-xs leading-tight truncate">
                        {ext.titulo || ext.document_name || '—'}
                      </p>
                      {ext.titulo && ext.document_name && (
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">{ext.document_name}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {ext.doc_key ? (
                        <span className="font-mono text-[11px] bg-[#00C2FF]/10 text-[#0099CC] px-1.5 py-0.5 rounded whitespace-nowrap">
                          {ext.doc_key}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(ext.created_at).toLocaleDateString('es-MX', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        STATUS_CONFIG[ext.status]?.color ?? 'bg-slate-100 text-slate-500'
                      }`}>
                        {STATUS_CONFIG[ext.status]?.label ?? ext.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-500">
                      {ext.especialidades_count > 0 ? ext.especialidades_count : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {ext.document_id && (
                        <button
                          onClick={() => onOpenDocument(ext.document_id!)}
                          className="text-xs text-[#00C2FF] font-semibold hover:text-[#1A2744] transition-colors"
                        >
                          Ver
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Datos Técnicos (kota_data) */}
      {hasKotaData && (
        <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
          <button
            onClick={() => setShowKotaData(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors"
          >
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Datos Técnicos del Proyecto
            </span>
            {showKotaData
              ? <ChevronDown  className="w-3.5 h-3.5 text-slate-400" />
              : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            }
          </button>
          {showKotaData && (
            <div className="p-4">
              <pre className="text-xs text-slate-600 bg-slate-50 rounded-lg p-4 overflow-auto max-h-96 leading-relaxed">
                {JSON.stringify(kotaData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
