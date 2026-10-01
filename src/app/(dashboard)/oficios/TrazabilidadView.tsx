'use client'

import { useState, useMemo } from 'react'
import {
  GitBranch, Clock, CheckCircle, ExternalLink,
  ChevronDown, ArrowUpFromLine, ArrowDownToLine, Link2,
} from 'lucide-react'
import { updateOficioStatus } from './actions'

// ── Types ───────────────────────────────────────────────────────────────────────

type Oficio = {
  id: string
  tipo: 'entrada' | 'salida'
  no_oficio: string | null
  asunto: string
  fecha_documento: string | null
  fecha_recepcion: string | null
  proyecto_id: string | null
  especialidad: string | null
  estado: string
  responde_a_id: string | null
  link_entrega?: string | null
  remitente: string | null
  destinatario: string | null
}

type Project = { id: string; name: string }

// ── Helpers ──────────────────────────────────────────────────────────────────────

function nodeDate(o: Oficio): string | null {
  return o.fecha_documento || o.fecha_recepcion || null
}

function daysBetween(a: string | null, b: string | null): number | null {
  if (!a || !b) return null
  const diff = new Date(b).getTime() - new Date(a).getTime()
  return Math.round(diff / (1000 * 60 * 60 * 24))
}

function daysSince(date: string | null): number | null {
  if (!date) return null
  return Math.round((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function buildChains(oficios: Oficio[]): Oficio[][] {
  const responses = new Map<string, Oficio>()
  for (const o of oficios) {
    if (o.responde_a_id) responses.set(o.responde_a_id, o)
  }
  const roots = oficios.filter(o => !o.responde_a_id)
  return roots.map(root => {
    const chain: Oficio[] = [root]
    let cur = root
    while (responses.has(cur.id)) {
      const next = responses.get(cur.id)!
      chain.push(next)
      cur = next
    }
    return chain
  })
}

// ── Node ────────────────────────────────────────────────────────────────────────

function TraceNode({
  oficio,
  label,
  isLast,
}: {
  oficio: Oficio
  label: string
  isLast: boolean
}) {
  const [authorizing, setAuthorizing] = useState(false)
  const isSalida    = oficio.tipo === 'salida'
  const isAuthorized = oficio.estado === 'archivado' || oficio.estado === 'autorizado'
  const pending     = isLast && isSalida && !isAuthorized
  const days        = pending ? daysSince(nodeDate(oficio)) : null

  async function handleAuthorize() {
    setAuthorizing(true)
    await updateOficioStatus(oficio.id, 'archivado')
    // revalidation via server action; optimistic UI via state
    setAuthorizing(false)
  }

  return (
    <div className={`rounded-xl border-2 p-4 transition-all ${
      isAuthorized
        ? 'border-green-200 bg-green-50/50 opacity-70'
        : isSalida
          ? 'border-[#1A2744] bg-[#1A2744]/[0.03]'
          : 'border-[#00C2FF]/50 bg-[#00C2FF]/[0.03]'
    }`}>

      {/* Header row */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          {isSalida
            ? <ArrowUpFromLine className="w-3.5 h-3.5 text-[#1A2744]" />
            : <ArrowDownToLine className="w-3.5 h-3.5 text-[#00C2FF]" />
          }
          <span className={`text-[10px] font-bold uppercase tracking-widest ${
            isSalida ? 'text-[#1A2744]' : 'text-[#00C2FF]'
          }`}>
            {label}
          </span>
        </div>
        {oficio.no_oficio && (
          <span className="text-[10px] font-mono font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
            OF-{oficio.no_oficio}
          </span>
        )}
      </div>

      {/* Asunto */}
      <p className="text-sm font-semibold text-[#1A2744] leading-snug line-clamp-2 mb-1.5">
        {oficio.asunto}
      </p>

      {/* Remitente / Destinatario */}
      <p className="text-[11px] text-slate-400 mb-1.5">
        {isSalida ? oficio.destinatario : oficio.remitente}
      </p>

      {/* Date */}
      <p className="text-[11px] text-slate-400 font-medium">{fmtDate(nodeDate(oficio))}</p>

      {/* Link entrega */}
      {oficio.link_entrega && (
        <a
          href={oficio.link_entrega}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-[#00C2FF] hover:underline"
        >
          <Link2 className="w-3 h-3" />
          Ver entrega
          <ExternalLink className="w-2.5 h-2.5 opacity-60" />
        </a>
      )}

      {/* Authorized badge */}
      {isAuthorized && (
        <div className="mt-3 flex items-center gap-1.5 text-green-600 text-xs font-semibold">
          <CheckCircle className="w-3.5 h-3.5" />
          Autorizado
        </div>
      )}

      {/* Pending: day counter + authorize button */}
      {pending && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          {days !== null && (
            <div className={`flex items-center gap-1.5 mb-2.5 ${days > 15 ? 'text-red-500' : days > 7 ? 'text-amber-600' : 'text-slate-400'}`}>
              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="text-xs font-bold">{days} día{days !== 1 ? 's' : ''} sin respuesta</span>
            </div>
          )}
          <button
            onClick={handleAuthorize}
            disabled={authorizing}
            className="w-full flex items-center justify-center gap-1.5 text-[11px] font-bold text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            {authorizing ? 'Guardando...' : 'Autorizar ciclo'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Connector ───────────────────────────────────────────────────────────────────

function Connector({ days }: { days: number | null }) {
  return (
    <div className="flex flex-col items-center my-1 select-none">
      <div className="w-px h-4 bg-slate-200" />
      {days !== null ? (
        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
          days > 15
            ? 'bg-red-50 text-red-500 border-red-200'
            : days > 7
              ? 'bg-amber-50 text-amber-600 border-amber-200'
              : 'bg-slate-50 text-slate-400 border-slate-200'
        }`}>
          {days}d
        </span>
      ) : (
        <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
      )}
      <div className="w-px h-3 bg-slate-200" />
      <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-300" />
    </div>
  )
}

// ── Chain ───────────────────────────────────────────────────────────────────────

function TraceChain({ chain }: { chain: Oficio[] }) {
  let envioCount = 0, respuestaCount = 0
  return (
    <div className="min-w-[200px] flex-1">
      {chain.map((oficio, i) => {
        let label: string
        if (oficio.tipo === 'salida') { envioCount++; label = `Envío ${envioCount}` }
        else { respuestaCount++; label = `Respuesta ${respuestaCount}` }
        return (
          <div key={oficio.id}>
            <TraceNode oficio={oficio} label={label} isLast={i === chain.length - 1} />
            {i < chain.length - 1 && (
              <Connector days={daysBetween(nodeDate(oficio), nodeDate(chain[i + 1]))} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Specialty Group ─────────────────────────────────────────────────────────────

function SpecialtyGroup({ specialty, oficios }: { specialty: string; oficios: Oficio[] }) {
  const chains = useMemo(() => buildChains(oficios), [oficios])

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
        <div className="w-2 h-2 rounded-full bg-[#00C2FF]" />
        <h3 className="text-xs font-bold text-[#1A2744] uppercase tracking-widest">{specialty}</h3>
        <span className="text-[10px] text-slate-400 ml-auto">
          {oficios.length} oficio{oficios.length !== 1 ? 's' : ''}
          {' · '}
          {chains.length} ciclo{chains.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Chains — side by side columns */}
      <div className="p-5 flex flex-wrap gap-6">
        {chains.map((chain, ci) => (
          <TraceChain key={ci} chain={chain} />
        ))}
      </div>
    </div>
  )
}

// ── Main ────────────────────────────────────────────────────────────────────────

export default function TrazabilidadView({
  oficios,
  projects,
}: {
  oficios: Oficio[]
  projects: Project[]
}) {
  const [selectedProject, setSelectedProject] = useState<string>('')

  const projectOficios = useMemo(() => {
    if (!selectedProject) return []
    return oficios.filter(o => o.proyecto_id === selectedProject)
  }, [oficios, selectedProject])

  const bySpecialty = useMemo(() => {
    const map: Record<string, Oficio[]> = {}
    for (const o of projectOficios) {
      const key = o.especialidad || 'General'
      if (!map[key]) map[key] = []
      map[key].push(o)
    }
    return map
  }, [projectOficios])

  const specialties = Object.keys(bySpecialty).sort()

  return (
    <div className="space-y-6">

      {/* Project selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#1A2744]">
          <GitBranch className="w-4 h-4 text-slate-400" />
          Proyecto:
        </div>
        <div className="relative">
          <select
            value={selectedProject}
            onChange={e => setSelectedProject(e.target.value)}
            className="appearance-none text-sm border border-slate-200 rounded-xl pl-3 pr-8 py-2 bg-white text-[#1A2744] font-medium focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40 focus:border-[#00C2FF] min-w-[220px]"
          >
            <option value="">Selecciona un proyecto…</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>

        {selectedProject && (
          <span className="text-xs text-slate-400">
            {projectOficios.length} oficio{projectOficios.length !== 1 ? 's' : ''}
            {specialties.length > 0 && ` · ${specialties.length} especialidad${specialties.length !== 1 ? 'es' : ''}`}
          </span>
        )}
      </div>

      {/* Empty states */}
      {!selectedProject && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <GitBranch className="w-7 h-7 text-slate-300" />
          </div>
          <p className="text-sm font-semibold text-[#1A2744] mb-1">Selecciona un proyecto</p>
          <p className="text-xs text-slate-400">Verás el flujo de revisión por especialidad.</p>
        </div>
      )}

      {selectedProject && specialties.length === 0 && (
        <div className="text-center py-16 text-slate-400 text-sm">
          Este proyecto no tiene oficios registrados.
        </div>
      )}

      {/* Specialty chains */}
      {specialties.map(specialty => (
        <SpecialtyGroup
          key={specialty}
          specialty={specialty}
          oficios={bySpecialty[specialty]}
        />
      ))}

    </div>
  )
}
