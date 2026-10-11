'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Save, BookOpen, Loader2 } from 'lucide-react'
import { saveProjectBrief } from './actions'

export type BriefSection = { id: string; title: string; content: string; order: number }

export default function ProjectBriefTab({
  projectId,
  workspaceId,
  initialSections,
  canEdit,
}: {
  projectId: string
  workspaceId: string
  initialSections: BriefSection[]
  canEdit: boolean
}) {
  const router = useRouter()
  const [sections, setSections] = useState<BriefSection[]>(initialSections)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving]   = useState(false)

  function addSection() {
    setSections(prev => [...prev, {
      id: crypto.randomUUID(),
      title: '',
      content: '',
      order: prev.length,
    }])
  }

  function removeSection(id: string) {
    setSections(prev => prev.filter(s => s.id !== id).map((s, i) => ({ ...s, order: i })))
  }

  function update(id: string, field: 'title' | 'content', value: string) {
    setSections(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s))
  }

  function move(id: string, dir: 'up' | 'down') {
    setSections(prev => {
      const arr = [...prev]
      const idx  = arr.findIndex(s => s.id === id)
      const swap = dir === 'up' ? idx - 1 : idx + 1
      if (swap < 0 || swap >= arr.length) return arr
      ;[arr[idx], arr[swap]] = [arr[swap], arr[idx]]
      return arr.map((s, i) => ({ ...s, order: i }))
    })
  }

  async function handleSave() {
    setSaving(true)
    try {
      await saveProjectBrief(projectId, workspaceId, sections)
      setEditing(false)
      router.refresh()
    } catch (err) {
      alert('Error al guardar: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setSections(initialSections)
    setEditing(false)
  }

  const sorted = [...sections].sort((a, b) => a.order - b.order)

  // ── View mode ─────────────────────────────────────────────────────────────

  if (!editing) {
    return (
      <div className="max-w-3xl mx-auto py-6 px-2">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#00C2FF]" />
            <h3 className="text-sm font-bold text-[#1A2744]">Brief técnico del proyecto</h3>
            <span className="text-xs text-slate-400">Información descriptiva clave para el agente AI</span>
          </div>
          {canEdit && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              Editar brief
            </button>
          )}
        </div>

        {sorted.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl">
            <BookOpen className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400 font-medium">Sin brief técnico aún</p>
            <p className="text-xs text-slate-300 mt-1 mb-4">
              Agrega información descriptiva del proyecto: desarrollo, estructura, tránsito, materiales, etc.
            </p>
            {canEdit && (
              <button
                onClick={() => { setEditing(true); addSection() }}
                className="inline-flex items-center gap-2 bg-[#1A2744] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#243660] transition-colors"
              >
                <Plus className="w-4 h-4" /> Agregar primera sección
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {sorted.map(section => (
              <div key={section.id} className="rounded-xl border border-slate-100 bg-white overflow-hidden shadow-sm">
                {section.title && (
                  <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/70">
                    <h4 className="text-sm font-bold text-[#1A2744]">{section.title}</h4>
                  </div>
                )}
                <div className="px-5 py-4">
                  {section.content
                    ? <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{section.content}</p>
                    : <p className="text-xs text-slate-300 italic">Sin contenido</p>
                  }
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── Edit mode ─────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto py-6 px-2">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#00C2FF]" />
          <h3 className="text-sm font-bold text-[#1A2744]">Editando brief técnico</h3>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleCancel} className="text-xs text-slate-400 hover:text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 text-xs font-semibold bg-[#1A2744] text-white px-3 py-1.5 rounded-lg hover:bg-[#243660] disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? 'Guardando...' : 'Guardar brief'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {sorted.map((section, idx) => (
          <div key={section.id} className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5">
            {/* Section header: title + controls */}
            <div className="flex items-center gap-2">
              <input
                value={section.title}
                onChange={e => update(section.id, 'title', e.target.value)}
                placeholder="Título de la sección  (ej. I. Desarrollo General)"
                className="flex-1 text-sm font-semibold border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#00C2FF] text-[#1A2744] placeholder:font-normal placeholder:text-slate-300"
              />
              <button onClick={() => move(section.id, 'up')} disabled={idx === 0}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 text-slate-400 disabled:opacity-20 transition-colors">
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => move(section.id, 'down')} disabled={idx === sorted.length - 1}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 text-slate-400 disabled:opacity-20 transition-colors">
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => removeSection(section.id)}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            {/* Content textarea */}
            <textarea
              value={section.content}
              onChange={e => update(section.id, 'content', e.target.value)}
              placeholder={`Contenido de la sección...\nEj:\nRampa de entrada: 155 ml\nEstructura PSF: 360 ml\nDesarrollo total: 640 ml`}
              rows={6}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 resize-y focus:outline-none focus:ring-1 focus:ring-[#00C2FF] text-slate-700 leading-relaxed font-mono"
            />
          </div>
        ))}
      </div>

      <button
        onClick={addSection}
        className="mt-4 w-full flex items-center justify-center gap-2 text-sm text-[#00C2FF] font-semibold hover:text-[#1A2744] transition-colors py-3 border-2 border-dashed border-[#00C2FF]/30 rounded-xl hover:border-[#1A2744]/20"
      >
        <Plus className="w-4 h-4" /> Agregar sección
      </button>
    </div>
  )
}
