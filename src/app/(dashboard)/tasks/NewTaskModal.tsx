'use client'

import { useState, useRef, useEffect } from 'react'
import { X, ChevronDown, Search } from 'lucide-react'
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
  const [assigneeOpen, setAssigneeOpen] = useState(false)
  const [assigneeSearch, setAssigneeSearch] = useState('')
  const assigneeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (assigneeRef.current && !assigneeRef.current.contains(e.target as Node)) {
        setAssigneeOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

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

          {members.length > 0 && (() => {
            const sorted = [...members].sort((a, b) =>
              (a.full_name ?? '').localeCompare(b.full_name ?? '', 'es')
            )
            const filtered = sorted.filter(m =>
              (m.full_name ?? '').toLowerCase().includes(assigneeSearch.toLowerCase())
            )
            return (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                  Asignar a
                  <span className="text-slate-400 font-normal normal-case tracking-normal">máx. 2</span>
                </label>
                <div className="relative" ref={assigneeRef}>
                  {/* Trigger */}
                  <button type="button" onClick={() => setAssigneeOpen(v => !v)}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50 focus:border-[#00C2FF]">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      {selectedAssignees.length === 0 ? (
                        <span className="text-slate-400">Sin asignar</span>
                      ) : selectedAssignees.map(uid => {
                        const m = members.find(x => x.user_id === uid)
                        const initials = m?.full_name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) ?? '?'
                        return (
                          <span key={uid} className="flex items-center gap-1 bg-[#1A2744] text-white text-xs px-2 py-0.5 rounded-md">
                            <span className="font-bold">{initials}</span>
                            <span className="max-w-[90px] truncate">{m?.full_name?.split(' ')[0]}</span>
                            <span onClick={e => { e.stopPropagation(); toggleAssignee(uid) }}
                              className="ml-0.5 opacity-60 hover:opacity-100 cursor-pointer leading-none">×</span>
                          </span>
                        )
                      })}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-150 ${assigneeOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown */}
                  {assigneeOpen && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg">
                      <div className="p-2 border-b border-slate-100">
                        <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-50 rounded-md">
                          <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <input autoFocus type="text" placeholder="Buscar..." value={assigneeSearch}
                            onChange={e => setAssigneeSearch(e.target.value)}
                            className="flex-1 text-sm bg-transparent outline-none text-slate-700 placeholder:text-slate-400" />
                        </div>
                      </div>
                      <ul className="max-h-44 overflow-y-auto py-1">
                        {filtered.length === 0
                          ? <li className="px-3 py-2 text-sm text-slate-400 text-center">Sin resultados</li>
                          : filtered.map(m => {
                            const sel = selectedAssignees.includes(m.user_id)
                            const disabled = !sel && selectedAssignees.length >= 2
                            const initials = m.full_name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) ?? '?'
                            return (
                              <li key={m.user_id}>
                                <button type="button" disabled={disabled} onClick={() => toggleAssignee(m.user_id)}
                                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${
                                    sel ? 'bg-[#1A2744]/5' : 'hover:bg-slate-50'
                                  } disabled:opacity-40 disabled:cursor-not-allowed`}>
                                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${sel ? 'bg-[#1A2744] text-white' : 'bg-slate-100 text-slate-600'}`}>
                                    {initials}
                                  </span>
                                  <span className={`flex-1 ${sel ? 'font-medium text-[#1A2744]' : 'text-slate-700'}`}>
                                    {m.full_name ?? m.user_id.slice(0, 8)}
                                  </span>
                                  {sel && <span className="text-[#00C2FF] text-xs font-bold">✓</span>}
                                </button>
                              </li>
                            )
                          })
                        }
                      </ul>
                    </div>
                  )}
                </div>
                {selectedAssignees.map(uid => (
                  <input key={uid} type="hidden" name="assignee_ids" value={uid} />
                ))}
              </div>
            )
          })()}

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
