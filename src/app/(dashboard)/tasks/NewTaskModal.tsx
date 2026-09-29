'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { createTask } from './actions'
import { Project } from '@/types'

type Member = { user_id: string; full_name: string | null }

export default function NewTaskModal({
  projects, specialties, members, onClose
}: {
  projects: Project[]
  specialties: string[]
  members: Member[]
  onClose: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([])

  function toggleAssignee(uid: string) {
    setSelectedAssignees(prev =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : prev.length < 2 ? [...prev, uid] : prev
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await createTask(new FormData(e.currentTarget))
    if (result?.error) { setError(result.error); setLoading(false) }
    else onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-[#1A2744]">Nueva tarea</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Nombre *</label>
            <input name="name" required placeholder="Ej: Revisión de planos geométricos Tramo A"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50 focus:border-[#00C2FF]" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Proyecto *</label>
              <select name="project_id" required
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50 focus:border-[#00C2FF]">
                <option value="">Seleccionar...</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Especialidad</label>
              <select name="specialty"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50 focus:border-[#00C2FF]">
                <option value="">Sin especialidad</option>
                {specialties.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Prioridad</label>
              <select name="priority" defaultValue="medium"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50 focus:border-[#00C2FF]">
                <option value="low">🟢 Baja</option>
                <option value="medium">🟡 Media</option>
                <option value="high">🟠 Alta</option>
                <option value="urgent">🔴 Urgente</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Fecha límite</label>
              <input name="due_date" type="date"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50 focus:border-[#00C2FF]" />
            </div>
          </div>

          {members.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                Asignar a
                <span className="text-slate-400 font-normal normal-case tracking-normal">máx. 2</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {members.map(m => {
                  const sel = selectedAssignees.includes(m.user_id)
                  const initials = m.full_name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
                  return (
                    <button key={m.user_id} type="button" onClick={() => toggleAssignee(m.user_id)}
                      disabled={!sel && selectedAssignees.length >= 2}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                        sel
                          ? 'bg-[#1A2744] text-white border-[#1A2744]'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      } disabled:opacity-40 disabled:cursor-not-allowed`}>
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${sel ? 'bg-white/20 text-white' : 'bg-[#1A2744] text-white'}`}>
                        {initials}
                      </span>
                      {m.full_name || m.user_id.slice(0, 8)}
                    </button>
                  )
                })}
              </div>
              {selectedAssignees.map(uid => (
                <input key={uid} type="hidden" name="assignee_ids" value={uid} />
              ))}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Descripción</label>
            <textarea name="description" rows={3} placeholder="Detalles adicionales de la tarea..."
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50 focus:border-[#00C2FF] resize-none" />
          </div>

          {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">{error}</div>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-[#1A2744] text-white text-sm font-bold hover:bg-[#243660] disabled:opacity-60">
              {loading ? 'Creando...' : 'Crear tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
