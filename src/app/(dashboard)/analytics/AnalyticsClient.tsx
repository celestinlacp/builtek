'use client'

import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LabelList,
} from 'recharts'
import { TrendingUp, FileText, LayoutGrid, Layers, Filter, X as XIcon } from 'lucide-react'

/* ─── Types ──────────────────────────────────────────────────── */
export type RawProject = {
  id:                string
  name:              string
  status:            string | null
  frente:            string | null
  project_type:      string | null
  parent_project_id: string | null
  is_inah:           boolean | null
  cauces_federales:  boolean | null
}

export type ProjectDocData = {
  id:            string
  name:          string
  frente:        string | null
  projectType:   string | null
  coverUrl:      string | null
  specBreakdown: Record<string, { planos: number; oficios: number; otros: number }>
  total:         number
}

export type AnalyticsData = {
  workspaceName: string
  summary:       { projects: number; docs: number; planos: number; oficios: number }
  rawProjects:   RawProject[]
  projectDocs:   ProjectDocData[]
  specActivity:  { code: string; name: string; lastUpload: string | null }[]
  specialties:   { code: string; name: string }[]
  frentes:       string[]
}

/* ─── Constants ───────────────────────────────────────────────── */
const STATUS_LABELS: Record<string, string> = {
  active: 'Activos', paused: 'En pausa', completed: 'Terminados', archived: 'Archivados',
}
const STATUS_COLORS: Record<string, string> = {
  active: '#1FB0EC', paused: '#F59E0B', completed: '#16A34A', archived: '#94A3B8',
}
const NAVY   = '#1A2744'
const CYAN   = '#1FB0EC'
const AMBER  = '#F59E0B'
const GREEN  = '#16A34A'
const SLATE  = '#CBD5E1'
const PURPLE = '#8B5CF6'

const FRENTE_PALETTE = [CYAN, '#0D9488', PURPLE, '#EC4899', '#EA580C', AMBER, GREEN, '#64748B']
const frenteColorCache: Record<string, string> = {}
function frenteColor(f: string | null): string {
  if (!f) return SLATE
  if (!frenteColorCache[f]) {
    frenteColorCache[f] = FRENTE_PALETTE[Object.keys(frenteColorCache).length % FRENTE_PALETTE.length]
  }
  return frenteColorCache[f]
}

/* ─── UI helpers ──────────────────────────────────────────────── */
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-5 ${className}`}>
      {children}
    </div>
  )
}
function SectionTitle({ children, color = '#94A3B8' }: { children: React.ReactNode; color?: string }) {
  return (
    <h2 className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color }}>
      {children}
    </h2>
  )
}
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1A2744] text-white text-xs rounded-xl px-3 py-2.5 shadow-2xl border border-white/10">
      {label && <p className="font-semibold mb-1 text-white/60 text-[11px]">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: p.fill || p.color }} />
          <span>{p.name}: <span className="font-bold">{p.value}</span></span>
        </p>
      ))}
    </div>
  )
}

/* ─── Compact Donut ───────────────────────────────────────────── */
function CompactDonut({
  title, data, color,
}: {
  title: string
  data: { name: string; value: number; color: string }[]
  color?: string
}) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return null
  return (
    <Card className="flex flex-col items-center">
      <SectionTitle color={color}>{title}</SectionTitle>
      <div className="relative">
        <ResponsiveContainer width={110} height={110}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%"
              innerRadius={30} outerRadius={48}
              dataKey="value" strokeWidth={2} stroke="#F8FAFC" paddingAngle={2}>
              {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-black" style={{ color: NAVY }}>{total}</span>
        </div>
      </div>
      <div className="mt-3 w-full flex flex-col gap-1.5">
        {data.map(s => (
          <div key={s.name} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: s.color }} />
            <span className="text-[11px] text-slate-500 flex-1 truncate">{s.name}</span>
            <span className="text-[11px] font-black flex-shrink-0" style={{ color: NAVY }}>{s.value}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

/* ─── Main component ──────────────────────────────────────────── */
export default function AnalyticsClient({ data }: { data: AnalyticsData }) {
  const { workspaceName, summary, rawProjects, projectDocs, specActivity, specialties, frentes } = data

  const [activeFrente,    setActiveFrente]    = useState('')
  const [activeSpecialty, setActiveSpecialty] = useState('')
  const [selectedProject, setSelectedProject] = useState<ProjectDocData | null>(null)

  const now = Date.now()

  /* ── Frente-filtered projects ────────────────────────────────── */
  const fProjects = useMemo(() =>
    activeFrente ? rawProjects.filter(p => p.frente === activeFrente) : rawProjects,
    [rawProjects, activeFrente])

  const fProjectIds = useMemo(() => new Set(fProjects.map(p => p.id)), [fProjects])

  const fProjectDocs = useMemo(() =>
    activeFrente ? projectDocs.filter(p => fProjectIds.has(p.id)) : projectDocs,
    [projectDocs, fProjectIds, activeFrente])

  /* ── Donut 1: Status ─────────────────────────────────────────── */
  const projectsByStatus = useMemo(() => {
    const cnt: Record<string, number> = {}
    fProjects.forEach(p => { const s = p.status ?? 'active'; cnt[s] = (cnt[s] ?? 0) + 1 })
    return Object.entries(cnt)
      .map(([s, v]) => ({ name: STATUS_LABELS[s] ?? s, value: v, color: STATUS_COLORS[s] ?? '#94A3B8' }))
      .sort((a, b) => b.value - a.value)
  }, [fProjects])

  /* ── Donut 2: Frente ─────────────────────────────────────────── */
  const projectsByFrenteDonut = useMemo(() => {
    const cnt: Record<string, number> = {}
    rawProjects.forEach(p => { if (p.frente) cnt[p.frente] = (cnt[p.frente] ?? 0) + 1 })
    return Object.entries(cnt)
      .map(([name, value]) => ({ name, value, color: frenteColor(name) }))
      .sort((a, b) => b.value - a.value)
  }, [rawProjects])

  /* ── Donut 3: Categoría especial ─────────────────────────────── */
  const specialCategory = useMemo(() => {
    const inah   = fProjects.filter(p => p.is_inah).length
    const cauces = fProjects.filter(p => p.cauces_federales && !p.is_inah).length
    const normal = fProjects.filter(p => !p.is_inah && !p.cauces_federales).length
    return [
      ...(inah   > 0 ? [{ name: 'INAH',        value: inah,   color: '#EC4899' }] : []),
      ...(cauces > 0 ? [{ name: 'Cauces Fed.',  value: cauces, color: '#0D9488' }] : []),
      ...(normal > 0 ? [{ name: 'Normal',       value: normal, color: CYAN      }] : []),
    ]
  }, [fProjects])

  /* ── Donut 4: Jerarquía (proyectos vs subproyectos) ──────────── */
  const hierarchy = useMemo(() => {
    const roots = fProjects.filter(p => !p.parent_project_id).length
    const subs  = fProjects.filter(p =>  p.parent_project_id).length
    return [
      ...(roots > 0 ? [{ name: 'Proyectos',    value: roots, color: NAVY   }] : []),
      ...(subs  > 0 ? [{ name: 'Subproyectos', value: subs,  color: CYAN   }] : []),
    ]
  }, [fProjects])

  /* ── Bar: Projects by type (filtered by frente) ──────────────── */
  const projectsByType = useMemo(() => {
    const cnt: Record<string, number> = {}
    fProjects.forEach(p => { if (p.project_type) cnt[p.project_type] = (cnt[p.project_type] ?? 0) + 1 })
    return Object.entries(cnt)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [fProjects])

  /* ── Bar: Projects by frente ─────────────────────────────────── */
  const projectsByFrente = useMemo(() => {
    const cnt: Record<string, number> = {}
    rawProjects.forEach(p => { if (p.frente) cnt[p.frente] = (cnt[p.frente] ?? 0) + 1 })
    return Object.entries(cnt)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [rawProjects])

  /* ── Docs by project (main bar, filtered both ways) ──────────── */
  const filteredProjectDocs = useMemo(() => {
    return fProjectDocs
      .map(p => {
        let displayTotal = p.total
        if (activeSpecialty) {
          const bd = p.specBreakdown[activeSpecialty]
          displayTotal = bd ? bd.planos + bd.oficios + bd.otros : 0
        }
        return { ...p, displayTotal }
      })
      .filter(p => p.displayTotal > 0)
      .sort((a, b) => b.displayTotal - a.displayTotal)
      .slice(0, 15)
      .reverse()
  }, [fProjectDocs, activeSpecialty])

  /* ── Docs by specialty (reactive to both filters) ────────────── */
  const docsBySpecialty = useMemo(() => {
    const specMap: Record<string, { name: string; planos: number; oficios: number; otros: number }> = {}
    fProjectDocs.forEach(p => {
      const entries = activeSpecialty
        ? Object.entries(p.specBreakdown).filter(([code]) => code === activeSpecialty)
        : Object.entries(p.specBreakdown)
      entries.forEach(([code, bd]) => {
        const name = specialties.find(s => s.code === code)?.name ?? code
        if (!specMap[code]) specMap[code] = { name, planos: 0, oficios: 0, otros: 0 }
        specMap[code].planos  += bd.planos
        specMap[code].oficios += bd.oficios
        specMap[code].otros   += bd.otros
      })
    })
    return Object.values(specMap)
      .map(s => ({ ...s, total: s.planos + s.oficios + s.otros }))
      .sort((a, b) => b.total - a.total)
      .map(({ total: _t, ...rest }) => rest)
  }, [fProjectDocs, activeSpecialty, specialties])

  /* ── Docs by project type (new chart) ────────────────────────── */
  const docsByProjectType = useMemo(() => {
    const typeMap: Record<string, number> = {}
    fProjectDocs.forEach(p => {
      if (!p.projectType) return
      let count = p.total
      if (activeSpecialty) {
        const bd = p.specBreakdown[activeSpecialty]
        count = bd ? bd.planos + bd.oficios + bd.otros : 0
      }
      if (count > 0) typeMap[p.projectType] = (typeMap[p.projectType] ?? 0) + count
    })
    return Object.entries(typeMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [fProjectDocs, activeSpecialty])

  /* ── Default project: one with most docs ────────────────────── */
  const displayProject = selectedProject ?? projectDocs[0] ?? null

  const hasFilters = activeFrente || activeSpecialty

  /* ── KPIs ────────────────────────────────────────────────────── */
  const kpis = [
    { label: 'Proyectos',   value: summary.projects, icon: LayoutGrid, color: CYAN   },
    { label: 'Documentos',  value: summary.docs,     icon: FileText,   color: PURPLE },
    { label: 'Planos',      value: summary.planos,   icon: Layers,     color: AMBER  },
    { label: 'Oficios',     value: summary.oficios,  icon: TrendingUp, color: GREEN  },
  ]

  return (
    <div className="space-y-6 pb-10">

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden" style={{ background: NAVY }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `linear-gradient(rgba(0,194,255,.07) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,194,255,.07) 1px, transparent 1px)`,
          backgroundSize: '36px 36px',
        }} />
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
              <div key={label} className="rounded-xl p-4 border"
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
            <select value={activeFrente} onChange={e => setActiveFrente(e.target.value)}
              className="text-xs rounded-lg border border-slate-200 px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40 font-medium">
              <option value="">Todos los frentes</option>
              {frentes.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          )}
          {specialties.length > 0 && (
            <select value={activeSpecialty} onChange={e => setActiveSpecialty(e.target.value)}
              className="text-xs rounded-lg border border-slate-200 px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40 font-medium">
              <option value="">Todas las especialidades</option>
              {specialties.map(s => <option key={s.code} value={s.code}>[{s.code}] {s.name}</option>)}
            </select>
          )}
          {hasFilters && (
            <button onClick={() => { setActiveFrente(''); setActiveSpecialty(''); setSelectedProject(null) }}
              className="flex items-center gap-1 text-xs font-semibold text-red-400 hover:text-red-500 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
              <XIcon className="w-3 h-3" />
              Limpiar
            </button>
          )}
          {activeFrente && (
            <span className="text-xs font-bold px-2 py-1 rounded-full"
              style={{ background: frenteColor(activeFrente) + '22', color: frenteColor(activeFrente) }}>
              {activeFrente}
            </span>
          )}
        </div>
      )}

      {/* ── ROW 1: 4 donuts (left) + bars (right) ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Left: 4 compact donuts in 2x2 */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <CompactDonut title="Por estado"   data={projectsByStatus}      color="#94A3B8" />
          <CompactDonut title="Por frente"   data={projectsByFrenteDonut} color={CYAN} />
          {specialCategory.length > 0 && (
            <CompactDonut title="Categoría"  data={specialCategory}       color="#EC4899" />
          )}
          {hierarchy.length > 0 && (
            <CompactDonut title="Jerarquía"  data={hierarchy}             color={PURPLE} />
          )}
        </div>

        {/* Right: bar charts */}
        <div className="lg:col-span-3 space-y-5">

          {projectsByType.length > 0 && (
            <Card>
              <SectionTitle color={PURPLE}>
                Proyectos por tipo{activeFrente ? ` — ${activeFrente}` : ''}
              </SectionTitle>
              <ResponsiveContainer width="100%" height={Math.max(120, projectsByType.length * 30)}>
                <BarChart data={[...projectsByType].reverse()} layout="vertical"
                  margin={{ left: 4, right: 44, top: 0, bottom: 0 }}>
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={130}
                    tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }}
                    axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F1F5F9' }} />
                  <Bar dataKey="value" name="Proyectos" radius={[0, 4, 4, 0]} barSize={14}>
                    {[...projectsByType].reverse().map((_, i) => (
                      <Cell key={i} fill={`hsl(${262 + i * 14}, 70%, ${62 - i * 2}%)`} />
                    ))}
                    <LabelList dataKey="value" position="right"
                      style={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {projectsByFrente.length > 0 && (
            <Card>
              <SectionTitle color={CYAN}>Proyectos por frente</SectionTitle>
              <ResponsiveContainer width="100%" height={Math.max(100, projectsByFrente.length * 30)}>
                <BarChart data={[...projectsByFrente].reverse()} layout="vertical"
                  margin={{ left: 4, right: 44, top: 0, bottom: 0 }}>
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={90}
                    tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }}
                    axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F1F5F9' }} />
                  <Bar dataKey="value" name="Proyectos" radius={[0, 4, 4, 0]} barSize={14}>
                    {[...projectsByFrente].reverse().map((entry, i) => (
                      <Cell key={i} fill={frenteColor(entry.name)} />
                    ))}
                    <LabelList dataKey="value" position="right"
                      style={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>
      </div>

      {/* ── ROW 2: Cover widget + Docs by project ────────────────── */}
      {filteredProjectDocs.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Cover widget — defaults to top project */}
          <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm"
            style={{ minHeight: 240 }}>
            {displayProject?.coverUrl ? (
              <div className="relative h-full min-h-[240px]"
                style={{ backgroundImage: `url(${displayProject.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(26,39,68,.92) 40%, transparent)' }} />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  {displayProject.frente && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 inline-block"
                      style={{ background: frenteColor(displayProject.frente), color: '#fff' }}>
                      {displayProject.frente}
                    </span>
                  )}
                  <p className="text-white font-bold text-sm leading-tight line-clamp-2">{displayProject.name}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-white/70 text-xs">{displayProject.total} docs</span>
                    {displayProject.projectType && <span className="text-white/50 text-xs">{displayProject.projectType}</span>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 h-full min-h-[240px] relative"
                style={{ background: NAVY }}>
                <div className="absolute inset-0 pointer-events-none" style={{
                  backgroundImage: `linear-gradient(rgba(0,194,255,.06) 1px, transparent 1px),
                                    linear-gradient(90deg, rgba(0,194,255,.06) 1px, transparent 1px)`,
                  backgroundSize: '28px 28px',
                }} />
                {displayProject && (
                  <div className="relative z-10 text-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white mb-3 mx-auto"
                      style={{ background: frenteColor(displayProject.frente) }}>
                      {displayProject.name.charAt(0)}
                    </div>
                    {displayProject.frente && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 inline-block"
                        style={{ background: frenteColor(displayProject.frente), color: '#fff' }}>
                        {displayProject.frente}
                      </span>
                    )}
                    <p className="text-white font-bold text-sm mt-1">{displayProject.name}</p>
                    <p className="text-white/40 text-xs mt-1">{displayProject.total} documentos</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Docs by project */}
          <Card className="lg:col-span-2">
            <SectionTitle color={CYAN}>
              Documentos por proyecto
              {activeSpecialty && ` — ${specialties.find(s => s.code === activeSpecialty)?.name ?? activeSpecialty}`}
            </SectionTitle>
            <ResponsiveContainer width="100%" height={Math.max(200, filteredProjectDocs.length * 28)}>
              <BarChart data={filteredProjectDocs} layout="vertical"
                margin={{ left: 4, right: 44, top: 0, bottom: 0 }}
                onClick={(e: any) => {
                  if (e?.activePayload?.[0]) {
                    const name = e.activePayload[0].payload?.name
                    const found = projectDocs.find(p => p.name === name)
                    if (found) setSelectedProject(found)
                  }
                }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={170}
                  tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }}
                  axisLine={false} tickLine={false}
                  tickFormatter={v => v.length > 28 ? v.slice(0, 28) + '…' : v} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8FAFC' }} />
                <Bar dataKey="displayTotal" name="Documentos" radius={[0, 4, 4, 0]} barSize={14} style={{ cursor: 'pointer' }}>
                  {filteredProjectDocs.map((entry, i) => (
                    <Cell key={i}
                      fill={displayProject?.id === entry.id
                        ? frenteColor(entry.frente)
                        : (entry.frente ? frenteColor(entry.frente) + 'BB' : CYAN + 'BB')} />
                  ))}
                  <LabelList dataKey="displayTotal" position="right"
                    style={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* ── ROW 3: Docs by specialty ─────────────────────────────── */}
      {docsBySpecialty.length > 0 && (
        <Card>
          <SectionTitle color={AMBER}>Documentos por especialidad y tipo</SectionTitle>
          <div className="flex items-center gap-5 mb-4">
            {[{ label: 'Planos', color: CYAN }, { label: 'Oficios', color: AMBER }, { label: 'Otros', color: SLATE }]
              .map(l => (
                <span key={l.label} className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: l.color }} />
                  {l.label}
                </span>
              ))}
          </div>
          <ResponsiveContainer width="100%" height={Math.max(220, docsBySpecialty.length * 36)}>
            <BarChart data={docsBySpecialty} layout="vertical"
              margin={{ left: 4, right: 44, top: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={160}
                tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }}
                axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8FAFC' }} />
              <Bar dataKey="planos"  name="Planos"  stackId="a" fill={CYAN}  radius={[0,0,0,0]} barSize={18} />
              <Bar dataKey="oficios" name="Oficios" stackId="a" fill={AMBER} radius={[0,0,0,0]} barSize={18} />
              <Bar dataKey="otros"   name="Otros"   stackId="a" fill={SLATE} radius={[0,4,4,0]} barSize={18}>
                <LabelList
                  valueAccessor={(entry: any) => (entry.planos ?? 0) + (entry.oficios ?? 0) + (entry.otros ?? 0)}
                  position="right"
                  style={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* ── ROW 4: Docs by project type (new) ────────────────────── */}
      {docsByProjectType.length > 0 && (
        <Card>
          <SectionTitle color={GREEN}>
            Documentos por tipo de proyecto
            {activeSpecialty && ` — ${specialties.find(s => s.code === activeSpecialty)?.name ?? activeSpecialty}`}
          </SectionTitle>
          <ResponsiveContainer width="100%" height={Math.max(120, docsByProjectType.length * 32)}>
            <BarChart data={[...docsByProjectType].reverse()} layout="vertical"
              margin={{ left: 4, right: 44, top: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={130}
                tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }}
                axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F1F5F9' }} />
              <Bar dataKey="value" name="Documentos" radius={[0, 4, 4, 0]} barSize={16}>
                {[...docsByProjectType].reverse().map((_, i) => (
                  <Cell key={i} fill={`hsl(${142 + i * 20}, 60%, ${45 - i * 2}%)`} />
                ))}
                <LabelList dataKey="value" position="right"
                  style={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* ── ROW 5: Activity semaphore ─────────────────────────────── */}
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
                : daysSince === 0 ? 'Hoy' : daysSince === 1 ? 'Ayer' : `${daysSince}d`
              return (
                <div key={spec.code} className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-50">
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
