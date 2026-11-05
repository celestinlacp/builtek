'use client'

import { useEffect, useState } from 'react'
import { Sparkles, Loader2, ChevronDown, ChevronRight, Milestone, MapPin, Layers, Ruler, Square } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import {
  getProjectExtractions,
  getProjectKotaSummary,
  getExtractionElements,
  type ProjectExtraction,
  type AggregatedElement,
  type ExtractionElement,
} from './actions'
import type { Project } from '@/types'

const STATUS_CONFIG = {
  raw:      { label: 'Sin revisar', color: 'bg-slate-100 text-slate-500' },
  reviewed: { label: 'Revisada',    color: 'bg-blue-100 text-blue-600'   },
  approved: { label: 'Aprobada',    color: 'bg-green-100 text-green-700' },
}

const ESP_COLORS = [
  '#00C2FF', '#1A2744', '#10B981', '#F59E0B', '#8B5CF6',
  '#EF4444', '#06B6D4', '#84CC16', '#F97316', '#EC4899',
]

function fmtKm(m: number) {
  return `${Math.floor(m / 1000)}+${String(m % 1000).padStart(3, '0')}`
}

// Classify element by tipo_medicion (new extractions) or unit (legacy fallback)
function categorize(unidad: string, tipoMedicion?: string | null): 'acero' | 'concreto' | 'longitud' | 'area' | 'otros' {
  if (tipoMedicion) {
    if (tipoMedicion === 'peso')    return 'acero'
    if (tipoMedicion === 'volumen') return 'concreto'
    if (tipoMedicion === 'lineal')  return 'longitud'
    if (tipoMedicion === 'area')    return 'area'
    if (tipoMedicion === 'conteo' || tipoMedicion === 'otro') return 'otros'
  }
  // Unit-based fallback for extractions without tipo_medicion
  const u = unidad.toLowerCase().trim().replace(/\.$/, '')
  if (['kg', 't', 'ton', 'tonelada', 'toneladas', 'tonne', 'tn'].includes(u) || u.startsWith('kg/') || u.startsWith('ton/')) return 'acero'
  if (['m³', 'm3', 'm³/m', 'm3/m'].includes(u)) return 'concreto'
  if (['m', 'ml', 'km', 'lm', 'mts', 'metros', 'ln m', 'lnm', 'm.l'].includes(u)) return 'longitud'
  if (['m²', 'm2', 'ha', 'm²/m', 'm2/m'].includes(u)) return 'area'
  return 'otros'
}

// Unified element shape for display
type DisplayElement = {
  tipo: string
  unidad: string
  cantidad: number
  especialidad: string
  tipo_medicion?: string | null
  count?: number
}

function toChartData(data: DisplayElement[]) {
  return data.slice(0, 12).map(e => ({
    name:         e.tipo.length > 30 ? e.tipo.slice(0, 30) + '…' : e.tipo,
    fullName:     e.tipo,
    cantidad:     Math.round(e.cantidad * 100) / 100,
    unidad:       e.unidad,
    especialidad: e.especialidad,
  }))
}

function MaterialChart({
  title,
  data,
  color,
  icon,
}: {
  title: string
  data: DisplayElement[]
  color: string
  icon: React.ReactNode
}) {
  if (!data.length) return null
  const chartData = toChartData(data)
  return (
    <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
        {icon}
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{title}</span>
        <span className="ml-auto text-[11px] text-slate-300">{data.length} elem.</span>
      </div>
      <div className="p-4">
        <ResponsiveContainer width="100%" height={Math.max(chartData.length * 34 + 16, 60)}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 72, left: 4, bottom: 0 }}>
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
                  <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-lg text-xs max-w-xs">
                    <p className="font-semibold text-slate-800 mb-1 leading-snug">{d.fullName}</p>
                    <p className="text-[#1A2744] font-mono">
                      {d.cantidad.toLocaleString('es-MX', { maximumFractionDigits: 2 })}
                      <span className="text-slate-400 font-sans ml-1">{d.unidad}</span>
                    </p>
                    <p className="text-slate-400 mt-0.5">{d.especialidad}</p>
                  </div>
                )
              }}
            />
            <Bar
              dataKey="cantidad"
              fill={color}
              radius={[0, 4, 4, 0]}
              label={{
                position: 'right',
                fontSize: 10,
                fill: '#94a3b8',
                formatter: (v: unknown) =>
                  typeof v === 'number'
                    ? v.toLocaleString('es-MX', { maximumFractionDigits: 1 })
                    : String(v ?? ''),
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function MetricCard({
  title,
  icon,
  items,
}: {
  title: string
  icon: React.ReactNode
  items: DisplayElement[]
}) {
  if (!items.length) return null
  const total = items.reduce((s, e) => s + e.cantidad, 0)
  const unit  = items[0]?.unidad ?? ''
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-1.5 mb-3">
        {icon}
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">{title}</span>
        <span className="ml-auto text-xs font-mono font-bold text-[#1A2744]">
          {total.toLocaleString('es-MX', { maximumFractionDigits: 1 })} {unit}
        </span>
      </div>
      <div className="space-y-1">
        {items.map((e, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 truncate flex-1">{e.tipo}</span>
            <span className="font-mono text-[#1A2744] shrink-0">
              {e.cantidad.toLocaleString('es-MX', { maximumFractionDigits: 1 })}
            </span>
            <span className="text-slate-400 w-8 text-right shrink-0">{e.unidad}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function KotaDashboard({
  project,
  workspaceId,
  totalDocs,
  onOpenDocument,
}: {
  project: Project & { kota_data?: Record<string, any> | null }
  workspaceId: string
  totalDocs: number
  onOpenDocument: (docId: string) => void
}) {
  const [extractions,        setExtractions]        = useState<ProjectExtraction[]>([])
  const [projectElements,    setProjectElements]    = useState<AggregatedElement[]>([])
  const [extractionElements, setExtractionElements] = useState<ExtractionElement[]>([])
  const [selectedId,         setSelectedId]         = useState<string>('')   // '' = project view
  const [loading,            setLoading]            = useState(true)
  const [loadingExt,         setLoadingExt]         = useState(false)
  const [showHistory,        setShowHistory]        = useState(false)

  const kotaData     = project.kota_data ?? null
  const resumen      = kotaData?.resumen_ejecutivo as string | undefined
  const chainageText = (project.chainage_start != null && project.chainage_end != null)
    ? `${fmtKm(project.chainage_start)} — ${fmtKm(project.chainage_end)}`
    : null

  // Load project-level data on mount
  useEffect(() => {
    Promise.all([
      getProjectExtractions(project.id, workspaceId),
      getProjectKotaSummary(project.id, workspaceId),
    ]).then(([extRes, sumRes]) => {
      if (!extRes.error) setExtractions(extRes.data ?? [])
      if (!sumRes.error) setProjectElements(sumRes.data ?? [])
      setLoading(false)
    })
  }, [project.id, workspaceId])

  // Load single extraction when selected
  useEffect(() => {
    if (!selectedId) { setExtractionElements([]); return }
    setLoadingExt(true)
    getExtractionElements(selectedId).then(res => {
      if (!res.error) setExtractionElements(res.data ?? [])
      setLoadingExt(false)
    })
  }, [selectedId])

  // Active elements depending on view mode
  const displayElements: DisplayElement[] = selectedId
    ? extractionElements
    : projectElements.map(e => ({ tipo: e.tipo, unidad: e.unidad, cantidad: e.total, especialidad: e.especialidad, tipo_medicion: e.tipo_medicion, count: e.count }))

  const isLoadingDisplay = loading || (!!selectedId && loadingExt)

  // Categorize
  const aceroElems    = displayElements.filter(e => categorize(e.unidad, e.tipo_medicion) === 'acero')
  const concretoElems = displayElements.filter(e => categorize(e.unidad, e.tipo_medicion) === 'concreto')
  const longitudElems = displayElements.filter(e => categorize(e.unidad, e.tipo_medicion) === 'longitud')
  const areaElems     = displayElements.filter(e => categorize(e.unidad, e.tipo_medicion) === 'area')
  const otrosElems    = displayElements.filter(e => categorize(e.unidad, e.tipo_medicion) === 'otros')

  const especialidades = [...new Set(displayElements.map(e => e.especialidad))]
  const approvedCount  = extractions.filter(e => e.status === 'approved').length

  const selectedLabel = selectedId
    ? (extractions.find(e => e.id === selectedId)?.titulo
        || extractions.find(e => e.id === selectedId)?.doc_key
        || extractions.find(e => e.id === selectedId)?.document_name
        || 'Plano seleccionado')
    : null

  return (
    <div className="py-6 space-y-4">

      {/* ── Selector de vista ── */}
      {!loading && extractions.length > 0 && (
        <div className="flex items-center gap-3 bg-white border border-slate-100 rounded-xl px-5 py-3 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide shrink-0">Vista:</span>
          <select
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            className="flex-1 text-sm text-slate-700 bg-transparent border-none outline-none cursor-pointer min-w-0"
          >
            <option value="">Proyecto — todos los planos ({extractions.length})</option>
            {extractions.map(ext => (
              <option key={ext.id} value={ext.id}>
                {ext.titulo || ext.doc_key || ext.document_name}
              </option>
            ))}
          </select>
          {selectedId && (
            <button
              onClick={() => setSelectedId('')}
              className="text-[11px] text-[#00C2FF] font-semibold hover:text-[#1A2744] shrink-0 transition-colors"
            >
              Ver proyecto
            </button>
          )}
        </div>
      )}

      {/* ── Layout 2 columnas ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 items-start">

        {/* ── Columna izquierda: Ficha ── */}
        <div className="lg:sticky lg:top-4 space-y-4">

          {/* Card ficha */}
          <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-br from-[#1A2744] to-[#243660] px-5 py-4">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-[#00C2FF]" />
                <span className="text-xs font-bold text-[#00C2FF] uppercase tracking-wide">
                  Kota{selectedLabel ? ' — Plano' : ''}
                </span>
              </div>
              <h3 className="font-bold text-white text-sm leading-snug">
                {selectedLabel ?? project.name}
              </h3>
              {!selectedLabel && project.project_type && (
                <span className="text-xs text-white/60 mt-0.5 block">{project.project_type}</span>
              )}
              {selectedLabel && (
                <span className="text-xs text-white/50 mt-0.5 block">{project.name}</span>
              )}
            </div>

            {/* Metadata (solo en vista proyecto) */}
            {!selectedLabel && (
              <div className="px-5 py-4 space-y-2.5">
                {project.frente && (
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Milestone className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                    <span>{project.frente}</span>
                  </div>
                )}
                {chainageText && (
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                    <span>Km {chainageText}</span>
                  </div>
                )}
                {especialidades.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Layers className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                    <span>{especialidades.length} especialidad{especialidades.length !== 1 ? 'es' : ''}</span>
                  </div>
                )}
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100">
              <div className="py-3 text-center">
                <p className="text-lg font-bold text-[#1A2744]">{totalDocs}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Docs</p>
              </div>
              <div className="py-3 text-center">
                <p className="text-lg font-bold text-[#00C2FF]">{loading ? '—' : extractions.length}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Planos</p>
              </div>
              <div className="py-3 text-center">
                <p className="text-lg font-bold text-green-600">{loading ? '—' : approvedCount}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">APR</p>
              </div>
            </div>
          </div>

          {/* Resumen ejecutivo (solo vista proyecto) */}
          {!selectedId && (
            <div className="bg-gradient-to-br from-[#1A2744]/5 to-[#00C2FF]/5 border border-[#00C2FF]/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#00C2FF]" />
                  <span className="text-[11px] font-bold text-[#1A2744] uppercase tracking-wide">Resumen ejecutivo</span>
                </div>
                {kotaData?.resumen_generado_en && (
                  <span className="text-[10px] text-slate-400">
                    {new Date(kotaData.resumen_generado_en).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                  </span>
                )}
              </div>
              {loading ? (
                <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Cargando…
                </div>
              ) : resumen ? (
                <p className="text-xs text-slate-700 leading-relaxed">{resumen}</p>
              ) : (
                <p className="text-xs text-slate-400 italic leading-relaxed">
                  Se genera automáticamente al analizar el primer plano con Kota.
                </p>
              )}
            </div>
          )}

          {/* Descripción del plano (solo vista plano) */}
          {selectedId && (() => {
            const ext = extractions.find(e => e.id === selectedId)
            return ext?.descripcion ? (
              <div className="bg-gradient-to-br from-[#1A2744]/5 to-[#00C2FF]/5 border border-[#00C2FF]/20 rounded-xl p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#00C2FF]" />
                  <span className="text-[11px] font-bold text-[#1A2744] uppercase tracking-wide">Descripción del plano</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{ext.descripcion}</p>
              </div>
            ) : null
          })()}

          {/* Especialidades legend */}
          {!isLoadingDisplay && especialidades.length > 0 && (
            <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-3">Especialidades</p>
              <div className="space-y-1.5">
                {especialidades.map((esp, i) => (
                  <div key={esp} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: ESP_COLORS[i % ESP_COLORS.length] }} />
                    <span className="text-xs text-slate-600 truncate">{esp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Longitud card */}
          {!isLoadingDisplay && (
            <MetricCard
              title="Longitud"
              icon={<Ruler className="w-3.5 h-3.5 text-[#10B981]" />}
              items={longitudElems}
            />
          )}

          {/* Área card */}
          {!isLoadingDisplay && (
            <MetricCard
              title="Área"
              icon={<Square className="w-3.5 h-3.5 text-[#F59E0B]" />}
              items={areaElems}
            />
          )}
        </div>

        {/* ── Columna derecha: Gráficas ── */}
        <div className="space-y-5">

          {isLoadingDisplay ? (
            <div className="bg-white border border-slate-100 rounded-xl flex justify-center py-20 shadow-sm">
              <Loader2 className="w-6 h-6 text-[#00C2FF] animate-spin" />
            </div>
          ) : displayElements.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-xl text-center py-16 shadow-sm">
              <Sparkles className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400 font-medium">Sin datos de cuantificación aún</p>
              <p className="text-xs text-slate-300 mt-1">Abre un PDF y usa el tab "Kota" para analizar.</p>
            </div>
          ) : (
            <>
              {/* Acero */}
              <MaterialChart
                title="Acero"
                data={aceroElems}
                color="#EF4444"
                icon={<span className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" />}
              />

              {/* Concreto */}
              <MaterialChart
                title="Concreto"
                data={concretoElems}
                color="#1A2744"
                icon={<span className="w-2.5 h-2.5 rounded-full bg-[#1A2744] flex-shrink-0" />}
              />

              {/* Otros (tabla ligera, no gráfica) */}
              {otrosElems.length > 0 && (
                <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                  <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300 flex-shrink-0" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Otros</span>
                    <span className="ml-auto text-[11px] text-slate-300">{otrosElems.length} elem.</span>
                  </div>
                  <table className="w-full text-xs">
                    <tbody className="divide-y divide-slate-50">
                      {otrosElems.map((el, i) => (
                        <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-5 py-2.5 text-slate-600">{el.tipo}</td>
                          <td className="px-4 py-2.5 text-right font-mono font-semibold text-[#1A2744] whitespace-nowrap">
                            {el.cantidad.toLocaleString('es-MX', { maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-2.5 text-slate-400 w-16">{el.unidad}</td>
                          <td className="px-4 py-2.5 text-slate-300 text-[11px]">{el.especialidad}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Si no hay ni acero ni concreto ni otros: mostrar mensaje */}
              {aceroElems.length === 0 && concretoElems.length === 0 && otrosElems.length === 0
                && (longitudElems.length > 0 || areaElems.length > 0) && (
                <div className="bg-white border border-slate-100 rounded-xl text-center py-10 shadow-sm">
                  <p className="text-xs text-slate-400">Solo hay datos de longitud y área — ver cards en la columna izquierda.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Historial colapsable ── */}
      <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
        <button
          onClick={() => setShowHistory(v => !v)}
          className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors"
        >
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            Historial de extracciones{!loading && extractions.length > 0 ? ` — ${extractions.length} plano${extractions.length !== 1 ? 's' : ''}` : ''}
          </span>
          {showHistory
            ? <ChevronDown  className="w-3.5 h-3.5 text-slate-400" />
            : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          }
        </button>

        {showHistory && (
          loading ? (
            <div className="flex justify-center py-8 border-t border-slate-100">
              <Loader2 className="w-5 h-5 text-[#00C2FF] animate-spin" />
            </div>
          ) : extractions.length === 0 ? (
            <div className="text-center py-10 border-t border-slate-100">
              <p className="text-sm text-slate-400">Sin extracciones aún.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border-t border-slate-100">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs text-slate-400 uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-5 py-2.5 font-semibold">Documento / Descripción</th>
                    <th className="text-left px-4 py-2.5 font-semibold">ID Builtek</th>
                    <th className="text-left px-4 py-2.5 font-semibold whitespace-nowrap">Fecha</th>
                    <th className="text-left px-4 py-2.5 font-semibold">Estado</th>
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {extractions.map(ext => (
                    <tr
                      key={ext.id}
                      className={`hover:bg-slate-50 transition-colors cursor-pointer ${selectedId === ext.id ? 'bg-[#00C2FF]/5' : ''}`}
                      onClick={() => setSelectedId(selectedId === ext.id ? '' : ext.id)}
                    >
                      <td className="px-5 py-3 max-w-sm">
                        <p className="font-semibold text-[#1A2744] text-xs leading-tight">
                          {ext.titulo || ext.document_name || '—'}
                        </p>
                        {ext.descripcion && (
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                            {ext.descripcion}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {ext.doc_key
                          ? <span className="font-mono text-[11px] bg-[#00C2FF]/10 text-[#0099CC] px-1.5 py-0.5 rounded whitespace-nowrap">{ext.doc_key}</span>
                          : <span className="text-xs text-slate-300">—</span>
                        }
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
                            onClick={ev => { ev.stopPropagation(); onOpenDocument(ext.document_id!) }}
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
