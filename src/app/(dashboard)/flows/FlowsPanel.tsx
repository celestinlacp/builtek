'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, GitBranch, Trash2, ArrowUp, ArrowDown,
  Check, X, ChevronDown, Pencil, Diamond,
  FolderOpen, Circle
} from 'lucide-react'
import {
  createFlow, updateFlow, deleteFlow,
  addFlowStep, updateFlowStep, deleteFlowStep, swapFlowSteps,
} from './actions'

// ── Types ─────────────────────────────────────────────────────────────────────

type FlowStep = {
  id: string; flow_id: string; name: string
  fecha_documento: string | null; estado: string
  especialidad: string | null; position: number
  is_decision: boolean; note: string | null
}
type Flow = {
  id: string; name: string; description: string | null
  project_id: string | null; updated_at: string
  projects: { name: string } | null
}
type Project  = { id: string; name: string; parent_project_id: string | null }
type Specialty = { code: string; name: string }

// ── Estado config ─────────────────────────────────────────────────────────────

const ESTADO: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  pending:     { label: 'Pendiente',   bg: 'bg-slate-100',  text: 'text-slate-600',  dot: 'bg-slate-400' },
  in_progress: { label: 'En proceso',  bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500'  },
  review:      { label: 'En revisión', bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-500' },
  approved:    { label: 'Aprobado',    bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500' },
  rejected:    { label: 'Rechazado',   bg: 'bg-red-100',    text: 'text-red-600',    dot: 'bg-red-500'   },
}

// ── EstadoBadge ───────────────────────────────────────────────────────────────

function EstadoBadge({ estado, onChange }: { estado: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const cfg = ESTADO[estado] ?? ESTADO.pending
  return (
    <div className="relative">
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v) }}
        className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${cfg.bg} ${cfg.text}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        {cfg.label}
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 bg-white rounded-xl shadow-lg border border-slate-100 py-1 min-w-[140px]">
            {Object.entries(ESTADO).map(([key, c]) => (
              <button
                key={key}
                onClick={() => { onChange(key); setOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50 text-slate-700"
              >
                <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                {c.label}
                {key === estado && <Check className="w-3 h-3 ml-auto text-[#00C2FF]" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── StepCard ──────────────────────────────────────────────────────────────────

function StepCard({
  step, idx, total, specialties,
  onUpdate, onDelete, onMove,
}: {
  step: FlowStep; idx: number; total: number; specialties: Specialty[]
  onUpdate: (id: string, data: Partial<FlowStep>) => void
  onDelete: (id: string) => void
  onMove: (step: FlowStep, dir: 'up' | 'down') => void
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName]               = useState(step.name)
  const [fecha, setFecha]             = useState(step.fecha_documento ?? '')
  const [especialidad, setEspecialidad] = useState(step.especialidad ?? '')
  const [note, setNote]               = useState(step.note ?? '')
  const [isDecision, setIsDecision]   = useState(step.is_decision)
  const [saving, setSaving]           = useState(false)

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    await onUpdate(step.id, {
      name: name.trim(),
      fecha_documento: fecha || null,
      especialidad: especialidad || null,
      note: note || null,
      is_decision: isDecision,
    })
    setSaving(false)
    setEditing(false)
  }

  function handleCancel() {
    setName(step.name)
    setFecha(step.fecha_documento ?? '')
    setEspecialidad(step.especialidad ?? '')
    setNote(step.note ?? '')
    setIsDecision(step.is_decision)
    setEditing(false)
  }

  const cfg = ESTADO[step.estado] ?? ESTADO.pending
  const specName = specialties.find(s => s.code === step.especialidad)?.name ?? step.especialidad

  return (
    <div className="flex items-stretch gap-3 group">
      {/* Timeline indicator */}
      <div className="flex flex-col items-center flex-shrink-0 w-10">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 flex-shrink-0 z-10
          ${step.estado === 'approved' ? 'border-green-500 bg-green-50 text-green-600' :
            step.estado === 'rejected' ? 'border-red-400 bg-red-50 text-red-500' :
            step.is_decision           ? 'border-[#1A2744] bg-[#1A2744] text-white' :
            'border-slate-200 bg-white text-slate-500'}`}
        >
          {step.is_decision
            ? <Diamond className="w-4 h-4" />
            : step.estado === 'approved' ? <Check className="w-4 h-4" />
            : step.estado === 'rejected' ? <X className="w-4 h-4" />
            : <span className="text-xs font-bold">{idx + 1}</span>
          }
        </div>
        {idx < total - 1 && (
          <div className="w-px flex-1 bg-slate-200 my-1 min-h-4" />
        )}
      </div>

      {/* Card */}
      <div className={`flex-1 mb-4 rounded-xl border transition-all ${
        step.is_decision ? 'border-[#1A2744]/20 bg-[#1A2744]/[0.03]' :
        step.estado === 'approved' ? 'border-green-200 bg-green-50/30' :
        step.estado === 'rejected' ? 'border-red-200 bg-red-50/30' :
        'border-slate-100 bg-white'
      }`}>
        {editing ? (
          /* Edit mode */
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isDecision}
                  onChange={e => setIsDecision(e.target.checked)}
                  className="rounded border-slate-300 text-[#1A2744]"
                />
                <Diamond className="w-3 h-3" /> Paso de decisión
              </label>
            </div>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nombre del paso"
              className="w-full text-sm font-semibold border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#00C2FF]"
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">Fecha doc.</label>
                <input
                  type="date"
                  value={fecha}
                  onChange={e => setFecha(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#00C2FF]"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">Especialidad</label>
                <select
                  value={especialidad}
                  onChange={e => setEspecialidad(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#00C2FF]"
                >
                  <option value="">Sin especialidad</option>
                  {specialties.map(s => (
                    <option key={s.code} value={s.code}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">
                {isDecision ? 'Condiciones (Si / No)' : 'Nota'}
              </label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder={isDecision ? 'Si: continúa → siguiente paso\nNo: regresa a correcciones' : 'Nota opcional...'}
                rows={isDecision ? 3 : 2}
                className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-[#00C2FF]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={handleCancel} className="text-xs text-slate-400 hover:text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !name.trim()}
                className="text-xs font-semibold bg-[#1A2744] text-white px-3 py-1.5 rounded-lg hover:bg-[#243660] disabled:opacity-50 transition-colors"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        ) : (
          /* View mode */
          <div className="px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {step.is_decision && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#1A2744] bg-[#1A2744]/10 px-1.5 py-0.5 rounded-full">
                      <Diamond className="w-2.5 h-2.5" /> Decisión
                    </span>
                  )}
                  <p className="text-sm font-semibold text-[#1A2744] leading-snug">{step.name}</p>
                </div>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <EstadoBadge
                    estado={step.estado}
                    onChange={v => onUpdate(step.id, { estado: v })}
                  />
                  {step.fecha_documento && (
                    <span className="text-[11px] text-slate-400">
                      {new Date(step.fecha_documento + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                  {specName && (
                    <span className="text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{specName}</span>
                  )}
                </div>
                {step.note && (
                  <p className="text-xs text-slate-400 mt-1.5 whitespace-pre-line leading-relaxed">{step.note}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button
                  onClick={() => onMove(step, 'up')}
                  disabled={idx === 0}
                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 text-slate-400 disabled:opacity-20 transition-colors"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onMove(step, 'down')}
                  disabled={idx === total - 1}
                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 text-slate-400 disabled:opacity-20 transition-colors"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setEditing(true)}
                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 text-slate-400 hover:text-[#1A2744] transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDelete(step.id)}
                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── AddStepForm ───────────────────────────────────────────────────────────────

function AddStepForm({
  flowId, nextPosition, specialties,
  onDone, onCancel,
}: {
  flowId: string; nextPosition: number; specialties: Specialty[]
  onDone: () => void; onCancel: () => void
}) {
  const [name, setName]               = useState('')
  const [fecha, setFecha]             = useState('')
  const [especialidad, setEspecialidad] = useState('')
  const [note, setNote]               = useState('')
  const [isDecision, setIsDecision]   = useState(false)
  const [saving, setSaving]           = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    await addFlowStep({
      flow_id: flowId,
      name: name.trim(),
      fecha_documento: fecha || null,
      especialidad: especialidad || null,
      note: note || null,
      position: nextPosition,
      is_decision: isDecision,
    })
    setSaving(false)
    onDone()
  }

  return (
    <form onSubmit={handleSubmit} className="ml-13 border border-[#00C2FF]/40 rounded-xl p-4 bg-[#00C2FF]/5 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <p className="text-xs font-bold text-[#1A2744]">Nuevo paso</p>
        <label className="ml-auto flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isDecision}
            onChange={e => setIsDecision(e.target.checked)}
            className="rounded border-slate-300 text-[#1A2744]"
          />
          <Diamond className="w-3 h-3" /> Decisión
        </label>
      </div>
      <input
        autoFocus
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Nombre del paso *"
        required
        className="w-full text-sm font-semibold border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#00C2FF]"
      />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">Fecha doc.</label>
          <input
            type="date"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
            className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#00C2FF]"
          />
        </div>
        <div>
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">Especialidad</label>
          <select
            value={especialidad}
            onChange={e => setEspecialidad(e.target.value)}
            className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#00C2FF]"
          >
            <option value="">Sin especialidad</option>
            {specialties.map(s => (
              <option key={s.code} value={s.code}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>
      {isDecision && (
        <div>
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">Condiciones (Si / No)</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder={"Si: continúa → siguiente paso\nNo: regresa a correcciones"}
            rows={3}
            className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-[#00C2FF]"
          />
        </div>
      )}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="text-xs text-slate-400 hover:text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="text-xs font-semibold bg-[#1A2744] text-white px-3 py-1.5 rounded-lg hover:bg-[#243660] disabled:opacity-50 transition-colors"
        >
          {saving ? 'Agregando...' : 'Agregar paso'}
        </button>
      </div>
    </form>
  )
}

// ── NewFlowModal ──────────────────────────────────────────────────────────────

function NewFlowModal({
  projects,
  onClose,
  onCreated,
}: {
  projects: Project[]
  onClose: () => void
  onCreated: (id: string) => void
}) {
  const [name, setName]         = useState('')
  const [description, setDesc]  = useState('')
  const [projectId, setProject] = useState('')
  const [saving, setSaving]     = useState(false)

  const rootProjects = projects.filter(p => !p.parent_project_id)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    const res = await createFlow({ name, description: description || null, project_id: projectId || null })
    setSaving(false)
    if (res?.error) { alert(res.error); return }
    onCreated(res.id!)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h2 className="text-base font-bold text-[#1A2744] mb-4">Nuevo Flow</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">Nombre *</label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej. Aprobación plano estructural"
              required
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00C2FF]"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">Proyecto</label>
            <select
              value={projectId}
              onChange={e => setProject(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00C2FF]"
            >
              <option value="">Sin proyecto</option>
              {rootProjects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">Descripción</label>
            <textarea
              value={description}
              onChange={e => setDesc(e.target.value)}
              placeholder="Descripción opcional..."
              rows={2}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#00C2FF]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="text-sm text-slate-400 hover:text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="text-sm font-semibold bg-[#1A2744] text-white px-4 py-2 rounded-lg hover:bg-[#243660] disabled:opacity-50 transition-colors"
            >
              {saving ? 'Creando...' : 'Crear flow'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── FlowsPanel (main) ─────────────────────────────────────────────────────────

export default function FlowsPanel({
  flows: initialFlows,
  steps: initialSteps,
  projects,
  specialties,
  workspaceId,
}: {
  flows: Flow[]
  steps: FlowStep[]
  projects: Project[]
  specialties: Specialty[]
  workspaceId: string
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const [flows, setFlows]           = useState(initialFlows)
  const [steps, setSteps]           = useState(initialSteps)
  const [selectedId, setSelectedId] = useState<string | null>(initialFlows[0]?.id ?? null)
  const [projectFilter, setProjFilter] = useState('all')
  const [showNewFlow, setShowNewFlow]  = useState(false)
  const [showAddStep, setShowAddStep]  = useState(false)

  function refresh() { startTransition(() => router.refresh()) }

  const filteredFlows = projectFilter === 'all'
    ? flows
    : flows.filter(f => f.project_id === projectFilter)

  const selectedFlow = flows.find(f => f.id === selectedId) ?? null
  const flowSteps    = steps
    .filter(s => s.flow_id === selectedId)
    .sort((a, b) => a.position - b.position)

  const rootProjects = projects.filter(p => !p.parent_project_id)

  // Progress
  const approvedCount = flowSteps.filter(s => s.estado === 'approved').length
  const progressPct   = flowSteps.length > 0 ? Math.round((approvedCount / flowSteps.length) * 100) : 0

  async function handleDeleteFlow(id: string) {
    if (!confirm('¿Eliminar este flow y todos sus pasos?')) return
    await deleteFlow(id)
    if (selectedId === id) setSelectedId(flows.find(f => f.id !== id)?.id ?? null)
    refresh()
  }

  async function handleUpdateStep(stepId: string, data: Partial<FlowStep>) {
    await updateFlowStep(stepId, data as any)
    refresh()
  }

  async function handleDeleteStep(stepId: string) {
    if (!confirm('¿Eliminar este paso?')) return
    await deleteFlowStep(stepId)
    refresh()
  }

  async function handleMoveStep(step: FlowStep, dir: 'up' | 'down') {
    const sorted = [...flowSteps]
    const idx    = sorted.findIndex(s => s.id === step.id)
    const other  = sorted[dir === 'up' ? idx - 1 : idx + 1]
    if (!other) return
    await swapFlowSteps(
      { id: step.id, position: step.position },
      { id: other.id, position: other.position }
    )
    refresh()
  }

  const nextPosition = flowSteps.length > 0
    ? Math.max(...flowSteps.map(s => s.position)) + 1
    : 0

  return (
    <div className="flex h-[calc(100vh-64px)] -mx-6 -my-6">

      {/* ── LEFT SIDEBAR ── */}
      <div className="w-72 flex-shrink-0 border-r border-slate-100 bg-slate-50/50 flex flex-col">
        {/* Header */}
        <div className="px-4 py-4 border-b border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-sm font-bold text-[#1A2744] flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-[#00C2FF]" />
              Flows
            </h1>
            <button
              onClick={() => setShowNewFlow(true)}
              className="flex items-center gap-1 text-xs font-semibold text-white bg-[#1A2744] hover:bg-[#243660] px-2.5 py-1 rounded-lg transition-colors"
            >
              <Plus className="w-3 h-3" />
              Nuevo
            </button>
          </div>
          <select
            value={projectFilter}
            onChange={e => setProjFilter(e.target.value)}
            className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-[#00C2FF] text-slate-700"
          >
            <option value="all">Todos los proyectos</option>
            {rootProjects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Flow list */}
        <div className="flex-1 overflow-y-auto py-2 px-2">
          {filteredFlows.length === 0 ? (
            <div className="text-center py-12">
              <GitBranch className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-xs text-slate-400">Sin flows</p>
              <button onClick={() => setShowNewFlow(true)} className="text-xs text-[#00C2FF] font-semibold mt-1 hover:underline">
                Crear flow →
              </button>
            </div>
          ) : (
            filteredFlows.map(flow => {
              const sCount    = steps.filter(s => s.flow_id === flow.id).length
              const doneCount = steps.filter(s => s.flow_id === flow.id && s.estado === 'approved').length
              const active    = flow.id === selectedId
              return (
                <button
                  key={flow.id}
                  onClick={() => { setSelectedId(flow.id); setShowAddStep(false) }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl mb-1 transition-all group relative ${
                    active ? 'bg-[#1A2744] shadow-sm' : 'hover:bg-white hover:shadow-sm'
                  }`}
                >
                  <p className={`text-sm font-semibold leading-snug truncate pr-6 ${active ? 'text-white' : 'text-[#1A2744]'}`}>
                    {flow.name}
                  </p>
                  {flow.projects?.name && (
                    <p className={`text-[11px] truncate mt-0.5 ${active ? 'text-white/60' : 'text-slate-400'}`}>
                      {flow.projects.name}
                    </p>
                  )}
                  <div className={`flex items-center gap-2 mt-1 text-[10px] ${active ? 'text-white/50' : 'text-slate-400'}`}>
                    <span>{sCount} paso{sCount !== 1 ? 's' : ''}</span>
                    {sCount > 0 && <span>· {doneCount}/{sCount} aprobados</span>}
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); handleDeleteFlow(flow.id) }}
                    className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity ${active ? 'text-white/30 hover:text-red-300' : 'text-slate-300 hover:text-red-400'}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* ── RIGHT: FLOW DETAIL ── */}
      <div className="flex-1 overflow-y-auto bg-white">
        {!selectedFlow ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <GitBranch className="w-16 h-16 text-slate-100 mb-4" />
            <h2 className="text-lg font-bold text-slate-300">Selecciona un flow</h2>
            <p className="text-sm text-slate-400 mt-1">o crea uno nuevo</p>
            <button
              onClick={() => setShowNewFlow(true)}
              className="mt-4 flex items-center gap-2 bg-[#1A2744] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#243660] transition-colors"
            >
              <Plus className="w-4 h-4" /> Nuevo Flow
            </button>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto px-6 py-8">
            {/* Flow header */}
            <div className="mb-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#1A2744]">{selectedFlow.name}</h2>
                  {selectedFlow.projects?.name && (
                    <p className="text-sm text-slate-400 mt-0.5 flex items-center gap-1.5">
                      <FolderOpen className="w-3.5 h-3.5" />
                      {selectedFlow.projects.name}
                    </p>
                  )}
                  {selectedFlow.description && (
                    <p className="text-sm text-slate-500 mt-1">{selectedFlow.description}</p>
                  )}
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-2xl font-bold text-[#1A2744]">{progressPct}%</p>
                  <p className="text-xs text-slate-400">{approvedCount}/{flowSteps.length} aprobados</p>
                </div>
              </div>
              {/* Progress bar */}
              {flowSteps.length > 0 && (
                <div className="mt-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#1A2744] to-[#00C2FF] rounded-full transition-all duration-700"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              )}
            </div>

            {/* Steps timeline */}
            {flowSteps.length === 0 && !showAddStep ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
                <Circle className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400 font-medium">Sin pasos aún</p>
                <p className="text-xs text-slate-300 mt-1">Agrega el primer paso a este flow</p>
                <button
                  onClick={() => setShowAddStep(true)}
                  className="mt-4 flex items-center gap-2 bg-[#1A2744] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#243660] transition-colors mx-auto"
                >
                  <Plus className="w-4 h-4" /> Agregar paso
                </button>
              </div>
            ) : (
              <div>
                {flowSteps.map((step, idx) => (
                  <StepCard
                    key={step.id}
                    step={step}
                    idx={idx}
                    total={flowSteps.length}
                    specialties={specialties}
                    onUpdate={handleUpdateStep}
                    onDelete={handleDeleteStep}
                    onMove={handleMoveStep}
                  />
                ))}

                {/* Add step */}
                {showAddStep ? (
                  <div className="ml-13">
                    <AddStepForm
                      flowId={selectedFlow.id}
                      nextPosition={nextPosition}
                      specialties={specialties}
                      onDone={() => { setShowAddStep(false); refresh() }}
                      onCancel={() => setShowAddStep(false)}
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddStep(true)}
                    className="ml-13 flex items-center gap-2 text-sm text-[#00C2FF] font-semibold hover:text-[#1A2744] transition-colors py-2 mt-2"
                  >
                    <div className="w-10 h-10 rounded-full border-2 border-dashed border-[#00C2FF]/40 flex items-center justify-center flex-shrink-0">
                      <Plus className="w-4 h-4" />
                    </div>
                    Agregar paso
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Flow Modal */}
      {showNewFlow && (
        <NewFlowModal
          projects={projects}
          onClose={() => setShowNewFlow(false)}
          onCreated={() => { setShowNewFlow(false); refresh() }}
        />
      )}
    </div>
  )
}
