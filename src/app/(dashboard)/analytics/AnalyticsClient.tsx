'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import Link from 'next/link'

export type AnalyticsData = {
  projectsByStatus: { name: string; value: number; color: string }[]
  docsByProject:    { name: string; total: number }[]
  docsBySpecialty:  { name: string; planos: number; oficios: number; otros: number }[]
  specActivity:     { code: string; name: string; lastUpload: string | null }[]
}

const CYAN  = '#1FB0EC'
const NAVY  = '#1A2744'
const AMBER = '#F59E0B'
const SLATE = '#CBD5E1'
const GREEN = '#16A34A'

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-bold text-[#1A2744] uppercase tracking-wide mb-4">{children}</h2>
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 p-6 ${className}`}>
      {children}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1A2744] text-white text-xs rounded-lg px-3 py-2 shadow-lg">
      {label && <p className="font-semibold mb-1 text-white/70">{label}</p>}
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.fill || p.color }}>
          {p.name}: <span className="font-bold text-white">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

export default function AnalyticsClient({ data }: { data: AnalyticsData }) {
  const { projectsByStatus, docsByProject, docsBySpecialty, specActivity } = data
  const totalProjects = projectsByStatus.reduce((s, d) => s + d.value, 0)
  const now = Date.now()

  return (
    <div className="space-y-6">

      {/* Row 1: Donut proyectos + Actividad especialidades */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Donut — Proyectos por estado */}
        <Card>
          <SectionTitle>Proyectos por estado</SectionTitle>
          <div className="flex items-center gap-6">
            <div className="relative flex-shrink-0">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={projectsByStatus} cx="50%" cy="50%"
                    innerRadius={42} outerRadius={62}
                    dataKey="value" strokeWidth={2} stroke="#F8FAFC">
                    {projectsByStatus.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-[#1A2744]">{totalProjects}</span>
                <span className="text-[10px] text-slate-400 font-medium">total</span>
              </div>
            </div>
            <div className="flex flex-col gap-2.5">
              {projectsByStatus.map(s => (
                <div key={s.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: s.color }} />
                  <span className="text-xs text-slate-600 flex-1">{s.name}</span>
                  <span className="text-xs font-bold text-[#1A2744]">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Actividad por especialidad */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <SectionTitle>Actividad por especialidad</SectionTitle>
            <Link href="/documents" className="text-xs text-[#00C2FF] font-semibold hover:underline mb-4">
              Subir doc →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {specActivity.map(spec => {
              const daysSince = spec.lastUpload
                ? Math.floor((now - new Date(spec.lastUpload).getTime()) / 86400000)
                : null
              const isAlert = daysSince === null || daysSince >= 7
              const isWarn  = daysSince !== null && daysSince >= 3 && daysSince < 7
              const dot     = isAlert ? 'bg-red-400' : isWarn ? 'bg-amber-400' : 'bg-green-400'
              const label   = daysSince === null ? 'Sin actividad'
                : daysSince === 0 ? 'Hoy'
                : daysSince === 1 ? 'Ayer'
                : `${daysSince}d`
              return (
                <div key={spec.code} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                  <span className="text-sm text-[#1A2744] font-medium flex-1 truncate">{spec.name}</span>
                  <span className={`text-xs font-semibold flex-shrink-0 ${isAlert ? 'text-red-400' : isWarn ? 'text-amber-500' : 'text-slate-400'}`}>{label}</span>
                  {isAlert && (
                    <Link href={`/documents?specialty=${spec.code}`}
                      className="text-[10px] font-bold text-[#00C2FF] hover:underline flex-shrink-0">
                      Subir →
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Row 2: Docs por proyecto (barras horizontales) */}
      {docsByProject.length > 0 && (
        <Card>
          <SectionTitle>Documentos por proyecto — top {docsByProject.length}</SectionTitle>
          <ResponsiveContainer width="100%" height={Math.max(220, docsByProject.length * 28)}>
            <BarChart data={docsByProject} layout="vertical" margin={{ left: 8, right: 24, top: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={180}
                tick={{ fontSize: 11, fill: '#1A2744', fontWeight: 500 }}
                axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F1F5F9' }} />
              <Bar dataKey="total" name="Documentos" fill={CYAN} radius={[0, 4, 4, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Row 3: Docs por especialidad + tipo (barras apiladas) */}
      {docsBySpecialty.length > 0 && (
        <Card>
          <SectionTitle>Documentos por especialidad y tipo</SectionTitle>
          <div className="flex items-center gap-5 mb-5">
            {[
              { label: 'Planos',    color: CYAN  },
              { label: 'Oficios',   color: AMBER },
              { label: 'Otros',     color: SLATE },
            ].map(l => (
              <span key={l.label} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: l.color }} />
                {l.label}
              </span>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={Math.max(220, docsBySpecialty.length * 36)}>
            <BarChart data={docsBySpecialty} layout="vertical" margin={{ left: 8, right: 24, top: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={160}
                tick={{ fontSize: 11, fill: '#1A2744', fontWeight: 500 }}
                axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F1F5F9' }} />
              <Bar dataKey="planos"  name="Planos"  stackId="a" fill={CYAN}  radius={[0, 0, 0, 0]} barSize={18} />
              <Bar dataKey="oficios" name="Oficios" stackId="a" fill={AMBER} radius={[0, 0, 0, 0]} barSize={18} />
              <Bar dataKey="otros"   name="Otros"   stackId="a" fill={SLATE} radius={[0, 4, 4, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

    </div>
  )
}
