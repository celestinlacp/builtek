'use client'

import { useEffect, useState } from 'react'
import { Sparkles, Loader2, ChevronDown, ChevronRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { getProjectExtractions, getProjectKotaSummary, type ProjectExtraction, type AggregatedElement } from './actions'

const STATUS_CONFIG = {
  raw:      { label: 'Sin revisar', color: 'bg-slate-100 text-slate-500' },
  reviewed: { label: 'Revisada',    color: 'bg-blue-100 text-blue-600'   },
  approved: { label: 'Aprobada',    color: 'bg-green-100 text-green-700' },
}

// Colores por especialidad
const ESP_COLORS = [
  '#00C2FF', '#1A2744', '#10B981', '#F59E0B', '#8B5CF6',
  '#EF4444', '#06B6D4', '#84CC16', '#F97316', '#EC4899',
]

function espColor(name: string, idx: number) {
  return ESP_COLORS[idx % ESP_COLORS.length]
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
  const [extractions,  setExtractions]  = useState<ProjectExtraction[]>([])
  const [elements,     setElements]     = useState<AggregatedElement[]>([])
  const [loading,      setLoading]      = useState(true)
  const [showHistory,  setShowHistory]  = useState(false)

  useEffect(() => {
    Promise.all([
      getProjectExtractions(projectId, workspaceId),
      getProjectKotaSummary(projectId, workspaceId),
    ]).then(([extRes, sumRes]) => {
      if (!extRes.error)  setExtractions(extRes.data  ?? [])
      if (!sumRes.error)  setElements(sumRes.data     ?? [])
      setLoading(false)
    })
  }, [projectId, workspaceId])

  const approvedCount = extractions.filter(e => e.status === 'approved').length
  const resumen       = kotaData?.resumen_ejecutivo as string | undefined

  // Top 15 elementos para la gráfica (solo los que tienen cantidad > 0)
  const chartData = elements
    .filter(e => e.total > 0)
    .slice(0, 15)
    .map(e => ({
      name:        e.tipo.length > 35 ? e.tipo.slice(0, 35) + '…' : e.tipo,
      fullName:    e.tipo,
      cantidad:    Math.round(e.total * 100) / 100,
      unidad:      e.unidad,
      especialidad: e.especialidad,
    }))

  // Especialidades únicas para la tabla agrupada
  const especialidades = [...new Set(elements.map(e => e.especialidad))]

  return (
    <div className="max-w-4xl mx-auto py-6 px-2 space-y-6">

      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-[#00C2FF]" />
        <h3 className="text-sm font-bold text-[#1A2744]">Dashboard Kota</h3>
        <span className="text-xs text-slate-400">Cuantificación acumulada del proyecto</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-slate-100 rounded-xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-[#1A2744]">{totalDocs}</p>
          <p className="text-xs text-slate-400 mt-0.5">Documentos</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-[#00C2FF]">{loading ? '—' : extractions.length}</p>
          <p className="text-xs text-slate-400 mt-0.5">Planos analizados</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-green-600">{loading ? '—' : approvedCount}</p>
          <p className="text-xs text-slate-400 mt-0.5">Aprobadas</p>
        </div>
      </div>

      {/* Resumen ejecutivo */}
      {(resumen || loading) && (
        <div className="bg-gradient-to-br from-[#1A2744]/5 to-[#00C2FF]/5 border border-[#00C2FF]/20 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#00C2FF]" />
            <span className="text-xs font-bold text-[#1A2744] uppercase tracking-wide">Resumen ejecutivo</span>
            {kotaData?.resumen_generado_en && (
              <span className="text-[11px] text-slate-400 ml-auto">
                Actualizado {new Date(kotaData.resumen_generado_en).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
              </span>
            )}
          </div>
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Cargando…
            </div>
          ) : resumen ? (
            <p className="text-sm text-slate-700 leading-relaxed">{resumen}</p>
          ) : (
            <p className="text-xs text-slate-400 italic">Se generará automáticamente al analizar el primer plano con Kota.</p>
          )}
        </div>
      )}

      {/* Gráfica de cantidades */}
      {!loading && chartData.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Cantidades acumuladas — top {chartData.length} elementos
            </span>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={chartData.length * 32 + 20}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 0, right: 60, left: 4, bottom: 0 }}
              >
                <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={200}
                  tick={{ fontSize: 10, fill: '#475569' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0].payload
                    return (
                      <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-lg text-xs">
                        <p className="font-semibold text-slate-800 mb-1">{d.fullName}</p>
                        <p className="text-[#1A2744]">{d.cantidad.toLocaleString('es-MX')} <span className="text-slate-400">{d.unidad}</span></p>
                        <p className="text-slate-400 mt-0.5">{d.especialidad}</p>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="cantidad" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={espColor(entry.especialidad, especialidades.indexOf(entry.especialidad))}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tabla de cantidades por especialidad */}
      {!loading && elements.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Cantidades por especialidad
            </span>
          </div>
          {especialidades.map((esp, espIdx) => {
            const items = elements.filter(e => e.especialidad === esp && e.total > 0)
            if (!items.length) return null
            return (
              <div key={esp}>
                <div
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wide"
                  style={{ color: espColor(esp, espIdx), background: `${espColor(esp, espIdx)}10` }}
                >
                  {esp}
                </div>
                <table className="w-full text-xs">
                  <tbody className="divide-y divide-slate-50">
                    {items.map((el, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-2 text-slate-700">{el.tipo}</td>
                        <td className="px-4 py-2 text-right font-mono font-semibold text-[#1A2744]">
                          {el.total.toLocaleString('es-MX', { maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-2 text-slate-400 w-16">{el.unidad}</td>
                        <td className="px-4 py-2 text-slate-300 text-right w-20">{el.count} plano{el.count !== 1 ? 's' : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })}
        </div>
      )}

      {/* Historial colapsable */}
      <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
        <button
          onClick={() => setShowHistory(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
        >
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            Historial de extracciones {!loading && extractions.length > 0 && `(${extractions.length})`}
          </span>
          {showHistory
            ? <ChevronDown  className="w-3.5 h-3.5 text-slate-400" />
            : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          }
        </button>

        {showHistory && (
          loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 text-[#00C2FF] animate-spin" />
            </div>
          ) : extractions.length === 0 ? (
            <div className="text-center py-10">
              <Sparkles className="w-8 h-8 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400">Sin extracciones aún.</p>
              <p className="text-xs text-slate-300 mt-1">Abre un PDF y usa el tab "Kota" para analizar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border-t border-slate-100">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs text-slate-400 uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-semibold">Documento</th>
                    <th className="text-left px-4 py-2.5 font-semibold">ID Builtek</th>
                    <th className="text-left px-4 py-2.5 font-semibold whitespace-nowrap">Fecha</th>
                    <th className="text-left px-4 py-2.5 font-semibold">Estado</th>
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
                        {ext.descripcion && (
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                            {ext.descripcion}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {ext.doc_key ? (
                          <span className="font-mono text-[11px] bg-[#00C2FF]/10 text-[#0099CC] px-1.5 py-0.5 rounded whitespace-nowrap">
                            {ext.doc_key}
                          </span>
                        ) : <span className="text-xs text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(ext.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_CONFIG[ext.status]?.color ?? 'bg-slate-100 text-slate-500'}`}>
                          {STATUS_CONFIG[ext.status]?.label ?? ext.status}
                        </span>
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
          )
        )}
      </div>
    </div>
  )
}
