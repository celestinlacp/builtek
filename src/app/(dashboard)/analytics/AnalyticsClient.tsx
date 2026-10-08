'use client'

import { useState, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { TrendingUp, FileText, LayoutGrid, Layers, Filter, X as XIcon } from 'lucide-react'

/* ─── Types ──────────────────────────────────────────────────── */
export type ProjectDocData = {
  id:          string
  name:        string
  frente:      string | null
  projectType: string | null
  coverUrl:    string | null
  specCounts:  Record<string, number>
  total:       number
}

export type AnalyticsData = {
  workspaceName:    string
  summary:          { projects: number; docs: number; planos: number; oficios: number }
  projectsByStatus: { name: string; value: number; color: string }[]
  projectsByType:   { name: string; value: number }[]
  projectsByFrente: { name: string; value: number }[]
  projectDocs:      ProjectDocData[]
  docsBySpecialty:  { name: string; planos: number; oficios: number; otros: number }[]
  specActivity:     { code: string; name: string; lastUpload: string | null }[]
  specialties:      { code: string; name: string }[]
  frentes:          string[]
}

/* ─── Palette ─────────────────────────────────────────────────── */
const CYAN   = '#1FB0EC'
const NAVY   = '#1A2744'
const AMBER  = '#F59E0B'
const SLATE  = '#CBD5E1'
const GREEN  = '#16A34A'
const PURPLE = '#8B5CF6'

const FRENTE_COLORS: Record<string, string> = {}
const FRENTE_PALETTE = [CYAN, '#0D9488', PURPLE, '#EC4899', '#EA580C', AMBER, GREEN, '#64748B']

function frenteColor(frente: string | null): string {
  if (!frente) return SLATE
  if (!FRENTE_COLORS[frente]) {
    const idx = Object.keys(FRENTE_COLORS).length % FRENTE_PALETTE.length
    FRENTE_COLORS[frente] = FRENTE_PALETTE[idx]
  }
  return FRENTE_COLORS[frente]
}

/* ─── Small helpers ───────────────────────────────────────────── */
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-5 ${className}`}>
      {children}
    </div>
  )
}

function SectionTitle({ children, accent }: { children: React.ReactNode; accent?: string }) {
  return (
    <h2 className="text-[11px] font-bold uppercase tracking-widest mb-4"
      style={{ color: accent ?? '#94A3B8' }}>
      {children}
    </h2>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1A2744] text-white text-xs rounded-xl px-3 py-2.5 shadow-2xl border border-white/10">
      {label && <p className="font-semibold mb-1.5 text-white/60 text-[11px]">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: p.fill || p.color }} />
          <span style={{ color: '#fff' }}>{p.name}: <span className="font-bold">{p.value}</span></span>
        </p>
      ))}
    </div>
  )
}

/* ─── Main component ──────────────────────────────────────────── */
export default function AnalyticsClient({ data }: { data: AnalyticsData }) {
  const {
    workspaceName, summary, projectsByStatus,
    projectsByType, projectsByFrente,
    projectDocs, docsBySpecialty, specActivity,
    specialties, frentes,
  } = data

  const [activeFrente,    setActiveFrente]    = useState<string>('')
  const [activeSpecialty, setActiveSpecialty] = useState<string>('')
  const [selectedProject, setSelectedProject] = useState<ProjectDocData | null>(null)

  const now = Date.now()
  const hasFilters = activeFrente || activeSpecialty

  // Filtered project docs list
  const filteredProjectDocs = projectDocs
    .filter(p => !activeFrente || p.frente === activeFrente)
    .map(p => ({
      ...p,
      displayTotal: activeSpecialty
        ? (p.specCounts[activeSpecialty] ?? 0)
        : p.total,
    }))
    .filter(p => p.displayTotal > 0)
    .sort((a, b) => b.displayTotal - a.displayTotal)
    .slice(0, 15)
    .reverse()

  // Filtered specialty chart
  const filteredSpecialty = activeFrente
    ? (() => {
        // Recompute per-specialty from filtered frente
        const specMap: Record<string, { name: string; planos: number; oficios: number; otros: number }> = {}
        projectDocs
          .filter(p => p.frente === activeFrente)
          .forEach(p => {
            Object.entries(p.specCounts).forEach(([code, count]) => {
              const spec = specialties.find(s => s.code === code)
              const name = spec?.name ?? code
              if (!specMap[code]) specMap[code] = { name, planos: 0, oficios: 0, otros: 0 }
              specMap[code].otros += count  // simplified: attribute all to "otros" at this level
            })
          })
        return Object.values(specMap).sort((a, b) => (b.planos+b.oficios+b.otros) - (a.planos+a.oficios+a.otros))
      })()
    : docsBySpecialty

  const clearFilters = useCallback(() => {
    setActiveFrente('')
    setActiveSpecialty('')
    setSelectedProject(null)
  }, [])

  /* ── HERO HEADER ─────────────────────────────────────────────── */
  const kpis = [
    { label: 'Proyectos', value: summary.projects, icon: LayoutGrid,  color: CYAN   },
    { label: 'Documentos', value: summary.docs,    icon: FileText,    color: PURPLE },
    { label: 'Planos',    value: summary.planos,   icon: Layers,      color: AMBER  },
    { label: 'Oficios',   value: summary.oficios,  icon: TrendingUp,  color: GREEN  },
  ]

  /* ── DONUT center number ─────────────────────────────────────── */
  const totalProjects = projectsByStatus.reduce((s, d) => s + d.value, 0)

  return (
    <div className="space-y-6 pb-10">

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden" style={{ background: NAVY }}>
        {/* Blueprint grid */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `linear-gradient(rgba(0,194,255,.07) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,194,255,.07) 1px, transparent 1px)`,
          backgroundSize: '36px 36px',
        }} />
        {/* Glow accent */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(31,176,236,.15) 0%, transparent 70%)' }} />

        <div className="relative z-10 p-7">
          <div className="mb-7">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(0,194,255,.6)' }}>
              {workspaceName}
            </p>
            <h1 className="text-3xl font-black text-white tracking-tight">Analytics</h1>
            <p className="text-white/30 text-sm mt-0.5">Visión general del proyecto</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {kpis.map(({ label, value, icon: Icon, color }) => (
              <div key={label}
                className="rounded-xl p-4 border"
                style={{ background: 'rgba(255,255,255,.06)', borderColor: 'rgba(255,255,255,.08)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-3.5 h-3.5" style={{ color }} />
                  <span className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,.45)' }}>{label}</span>
                </div>
                <p className="text-3xl font-black text-white leading-none">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FILTER BAR ───────────────────────────────────────────── */}
      {(frentes.length > 0 || specialties.length > 0) && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">Filtrar:</span>
          </div>

          {frentes.length > 0 && (
            <select
              value={activeFrente}
              onChange={e => setActiveFrente(e.target.value)}
              className="text-xs rounded-lg border border-slate-200 px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40 font-medium"
            >
              <option value="">Todos los frentes</option>
              {frentes.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          )}

          {specialties.length > 0 && (
            <select
              value={activeSpecialty}
              onChange={e => setActiveSpecialty(e.target.value)}
              className="text-xs rounded-lg border border-slate-200 px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40 font-medium"
            >
              <option value="">Todas las especialidades</option>
              {specialties.map(s => <option key={s.code} value={s.code}>[{s.code}] {s.name}</option>)}
            </select>
          )}

          {hasFilters && (
            <button onClick={clearFilters}
              className="flex items-center gap-1 text-xs font-semibold text-red-400 hover:text-red-500 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
              <XIcon className="w-3 h-3" />
              Limpiar
            </button>
          )}
        </div>
      )}

      {/* ── ROW 1: Status + Type + Frente ───────────────────────── */}
      <div className={`grid gap-5 ${
        projectsByType.length > 0 && projectsByFrente.length > 0
          ? 'grid-cols-1 lg:grid-cols-3'
          : projectsByType.length > 0 || projectsByFrente.length > 0
          ? 'grid-cols-1 lg:grid-cols-2'
          : 'grid-cols-1 lg:grid-cols-1 max-w-xs'
      }`}>

        {/* Donut */}
        <Card>
          <SectionTitle>Proyectos por estado</SectionTitle>
          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0">
              <ResponsiveContainer width={130} height={130}>
                <PieChart>
                  <Pie data={projectsByStatus} cx="50%" cy="50%"
                    innerRadius={38} outerRadius={58}
                    dataKey="value" strokeWidth={2} stroke="#F8FAFC" paddingAngle={2}>
                    {projectsByStatus.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black" style={{ color: NAVY }}>{totalProjects}</span>
                <span className="text-[9px] text-slate-400 font-medium">total</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {projectsByStatus.map(s => (
                <div key={s.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: s.color }} />
                  <span className="text-xs text-slate-500 flex-1">{s.name}</span>
                  <span className="text-xs font-black" style={{ color: NAVY }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Projects by type */}
        {projectsByType.length > 0 && (
          <Card>
            <SectionTitle accent={PURPLE}>Proyectos por tipo</SectionTitle>
            <ResponsiveContainer width="100%" height={Math.max(100, projectsByType.length * 32)}>
              <BarChart data={[...projectsByType].reverse()} layout="vertical"
                margin={{ left: 4, right: 24, top: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={110}
                  tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }}
                  axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F1F5F9' }} />
                <Bar dataKey="value" name="Proyectos" fill={PURPLE} radius={[0, 4, 4, 0]} barSize={14}>
                  {projectsByType.map((_, i) => (
                    <Cell key={i} fill={`hsl(${262 + i * 18}, 75%, ${62 - i * 4}%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Projects by frente */}
        {projectsByFrente.length > 0 && (
          <Card>
            <SectionTitle accent={CYAN}>Proyectos por frente</SectionTitle>
            <ResponsiveContainer width="100%" height={Math.max(100, projectsByFrente.length * 32)}>
              <BarChart data={[...projectsByFrente].reverse()} layout="vertical"
                margin={{ left: 4, right: 24, top: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={110}
                  tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }}
                  axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F1F5F9' }} />
                <Bar dataKey="value" name="Proyectos" radius={[0, 4, 4, 0]} barSize={14}>
                  {projectsByFrente.map((entry, i) => (
                    <Cell key={i} fill={frenteColor(entry.name)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* ── ROW 2: Cover widget + Docs by project ───────────────── */}
      {filteredProjectDocs.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Cover widget */}
          <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm flex flex-col"
            style={{ minHeight: 260, background: selectedProject?.coverUrl ? 'transparent' : NAVY }}>
            {selectedProject?.coverUrl ? (
              <div className="relative flex-1"
                style={{ backgroundImage: `url(${selectedProject.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(26,39,68,.92) 40%, transparent)' }} />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  {selectedProject.frente && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 inline-block"
                      style={{ background: frenteColor(selectedProject.frente), color: '#fff' }}>
                      {selectedProject.frente}
                    </span>
                  )}
                  <p className="text-white font-bold text-sm leading-tight line-clamp-2">{selectedProject.name}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-white/70 text-xs">{selectedProject.total} docs</span>
                    {selectedProject.projectType && (
                      <span className="text-white/50 text-xs">{selectedProject.projectType}</span>
                    )}
                  </div>
                </div>
              </div>
            ) : selectedProject ? (
              <div className="relative flex-1 flex flex-col items-center justify-center p-6"
                style={{ background: NAVY }}>
                <div className="absolute inset-0 pointer-events-none" style={{
                  backgroundImage: `linear-gradient(rgba(0,194,255,.06) 1px, transparent 1px),
                                    linear-gradient(90deg, rgba(0,194,255,.06) 1px, transparent 1px)`,
                  backgroundSize: '28px 28px',
                }} />
                <div className="relative z-10 text-center">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white mb-3 mx-auto"
                    style={{ background: frenteColor(selectedProject.frente) }}>
                    {selectedProject.name.charAt(0)}
                  </div>
                  {selectedProject.frente && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 inline-block"
                      style={{ background: frenteColor(selectedProject.frente), color: '#fff' }}>
                      {selectedProject.frente}
                    </span>
                  )}
                  <p className="text-white font-bold text-sm leading-tight mt-1">{selectedProject.name}</p>
                  <p className="text-white/40 text-xs mt-1">{selectedProject.total} documentos</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 relative"
                style={{ background: NAVY }}>
                <div className="absolute inset-0 pointer-events-none" style={{
                  backgroundImage: `linear-gradient(rgba(0,194,255,.06) 1px, transparent 1px),
                                    linear-gradient(90deg, rgba(0,194,255,.06) 1px, transparent 1px)`,
                  backgroundSize: '28px 28px',
                }} />
                <div className="relative z-10 text-center">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-3"
                    style={{ background: 'rgba(255,255,255,.08)' }}>
                    <LayoutGrid className="w-6 h-6 text-white/30" />
                  </div>
                  <p className="text-white/30 text-xs font-medium">
                    Haz clic en un<br />proyecto para ver foto
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Docs by project */}
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle accent={CYAN}>
                Documentos por proyecto
                {activeSpecialty && ` — ${specialties.find(s => s.code === activeSpecialty)?.name ?? activeSpecialty}`}
              </SectionTitle>
              {activeFrente && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: frenteColor(activeFrente) + '22', color: frenteColor(activeFrente) }}>
                  {activeFrente}
                </span>
              )}
            </div>
            <ResponsiveContainer width="100%" height={Math.max(200, filteredProjectDocs.length * 28)}>
              <BarChart data={filteredProjectDocs} layout="vertical"
                margin={{ left: 4, right: 32, top: 0, bottom: 0 }}
                onClick={(e: any) => {
                  if (e?.activePayload?.[0]) {
                    const name = e.activePayload[0].payload?.name
                    const found = projectDocs.find(p => p.name === name)
                    setSelectedProject(found ?? null)
                  }
                }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={170}
                  tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }}
                  axisLine={false} tickLine={false}
                  tickFormatter={v => v.length > 28 ? v.slice(0, 28) + '…' : v} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8FAFC' }} />
                <Bar dataKey="displayTotal" name="Documentos" radius={[0, 4, 4, 0]} barSize={14}
                  style={{ cursor: 'pointer' }}>
                  {filteredProjectDocs.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={selectedProject?.id === entry.id
                        ? frenteColor(entry.frente)
                        : entry.frente
                        ? frenteColor(entry.frente) + 'CC'
                        : CYAN + 'CC'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {filteredProjectDocs.length === 0 && (
              <p className="text-center text-slate-400 text-sm py-10">Sin datos para los filtros seleccionados</p>
            )}
          </Card>
        </div>
      )}

      {/* ── ROW 3: Docs by specialty ─────────────────────────────── */}
      {filteredSpecialty.length > 0 && (
        <Card>
          <SectionTitle accent={AMBER}>Documentos por especialidad y tipo</SectionTitle>
          <div className="flex items-center gap-5 mb-5">
            {[
              { label: 'Planos',  color: CYAN  },
              { label: 'Oficios', color: AMBER },
              { label: 'Otros',   color: SLATE },
            ].map(l => (
              <span key={l.label} className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: l.color }} />
                {l.label}
              </span>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={Math.max(220, filteredSpecialty.length * 36)}>
            <BarChart data={filteredSpecialty} layout="vertical"
              margin={{ left: 4, right: 24, top: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={160}
                tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }}
                axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8FAFC' }} />
              <Bar dataKey="planos"  name="Planos"  stackId="a" fill={CYAN}  radius={[0,0,0,0]} barSize={18} />
              <Bar dataKey="oficios" name="Oficios" stackId="a" fill={AMBER} radius={[0,0,0,0]} barSize={18} />
              <Bar dataKey="otros"   name="Otros"   stackId="a" fill={SLATE} radius={[0,4,4,0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* ── ROW 4: Activity semaphore ────────────────────────────── */}
      {specActivity.length > 0 && (
        <Card>
          <SectionTitle>Actividad por especialidad</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
            {specActivity.map(spec => {
              const daysSince = spec.lastUpload
                ? Math.floor((now - new Date(spec.lastUpload).getTime()) / 86400000)
                : null
              const isAlert = daysSince === null || daysSince >= 7
              const isWarn  = !isAlert && daysSince !== null && daysSince >= 3
              const dot     = isAlert ? 'bg-red-400' : isWarn ? 'bg-amber-400' : 'bg-green-400'
              const label   = daysSince === null ? 'Sin actividad'
                : daysSince === 0 ? 'Hoy'
                : daysSince === 1 ? 'Ayer'
                : `${daysSince}d`
              return (
                <div key={spec.code}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                  <span className="text-sm font-medium flex-1 truncate" style={{ color: NAVY }}>{spec.name}</span>
                  <span className={`text-xs font-bold flex-shrink-0 ${isAlert ? 'text-red-400' : isWarn ? 'text-amber-500' : 'text-slate-400'}`}>
                    {label}
                  </span>
                </div>
              )
            })}
          </div>
        </Card>
      )}

    </div>
  )
}
