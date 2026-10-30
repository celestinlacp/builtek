'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import {
  Upload, FileText, Loader2, AlertCircle, CheckCircle2,
  ChevronDown, ChevronRight, Zap, Bot, RotateCcw, X,
  FolderOpen, Clock, Sparkles, Tag, ChevronUp, BookOpen, Save,
  MessageCircle, Send,
} from 'lucide-react'

// ── Tipos ──────────────────────────────────────────────────────────────────────

type Project  = { id: string; name: string; builtek_id: string | null }

type DocMeta  = {
  id:         string
  doc_key:    string | null
  file_name:  string | null
  project_id: string
  doc_type:   string | null
  mic_version: string | null
  specialty:  { code: string; name: string } | null
}

type Elemento = { tipo: string; cantidad: number | null; unidad: string; descripcion?: string }
type Especialidad = { nombre: string; elementos: Elemento[] }
type Extraction = { titulo: string; especialidades: Especialidad[]; notas: string; confianza: 'alta' | 'media' | 'baja' }

type KotaQuery = {
  id?:        string
  question:   string
  answer:     string | null
  sources:    Array<{ doc_key: string; titulo: string }> | null
  loading?:   boolean
  created_at?: string
}

// ── Tipos Datos Técnicos ────────────────────────────────────────────────────

type KotaFieldValue = { valor: string | number | null; source: 'kota' | 'human' }

type KotaCamposComunes = {
  nombre_proyecto?:        KotaFieldValue
  ubicacion?:              KotaFieldValue
  tipo_estructura?:        KotaFieldValue
  etapa?:                  KotaFieldValue
  longitud_total_m?:       KotaFieldValue
  area_total_m2?:          KotaFieldValue
  altura_maxima_m?:        KotaFieldValue
  presupuesto_referencia?: KotaFieldValue
}

type KotaData = {
  campos_comunes:    KotaCamposComunes
  campos_disciplina: Record<string, Record<string, KotaFieldValue>>
  notas:             string
  ultima_actualizacion?: string
  actualizado_por?:  string
}

type SavedExtraction = {
  id:             string
  document_id:    string | null
  doc_hints:      Record<string, string>
  raw_extraction: Extraction
  status:         'raw' | 'reviewed' | 'approved'
  confidence:     string | null
  created_at:     string
}

const CONFIANZA_CONFIG = {
  alta:  { label: 'Alta',  color: 'bg-green-100 text-green-700' },
  media: { label: 'Media', color: 'bg-amber-100 text-amber-700' },
  baja:  { label: 'Baja',  color: 'bg-red-100 text-red-600'    },
}

const STATUS_CONFIG = {
  raw:      { label: 'Sin revisar', color: 'bg-slate-100 text-slate-500' },
  reviewed: { label: 'Revisada',    color: 'bg-blue-100 text-blue-600'   },
  approved: { label: 'Aprobada',    color: 'bg-green-100 text-green-700' },
}

// ── Sub-componente KotaField ────────────────────────────────────────────────

function KotaField({
  label, type, value, isKota, isSaving, isSaved, onSave,
}: {
  label:    string
  type:     string
  value:    string | number | null
  isKota:   boolean
  isSaving: boolean
  isSaved:  boolean
  onSave:   (val: string | number | null) => void
}) {
  const [localVal, setLocalVal] = useState<string>(value !== null && value !== undefined ? String(value) : '')
  const [dirty,    setDirty]    = useState(false)

  // Sync if parent resets
  useEffect(() => {
    setLocalVal(value !== null && value !== undefined ? String(value) : '')
    setDirty(false)
  }, [value])

  const handleChange = (v: string) => {
    setLocalVal(v)
    setDirty(v !== (value !== null && value !== undefined ? String(value) : ''))
  }

  const handleSave = () => {
    if (!dirty) return
    const parsed = type === 'number' ? (localVal === '' ? null : parseFloat(localVal)) : localVal || null
    onSave(parsed)
    setDirty(false)
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-slate-500 w-40 flex-shrink-0">{label}</label>
      <div className="flex-1 flex items-center gap-1.5">
        <input
          type={type}
          value={localVal}
          onChange={e => handleChange(e.target.value)}
          onBlur={handleSave}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSave() } }}
          className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-[#1A2744] focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/30 focus:border-[#00C2FF]"
        />
        {isKota && !isSaved && (
          <span className="bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded flex-shrink-0">
            Sugerido por Kota
          </span>
        )}
        {isSaved && (
          <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
        )}
        {isSaving && (
          <Loader2 className="w-3.5 h-3.5 text-[#00C2FF] animate-spin flex-shrink-0" />
        )}
      </div>
    </div>
  )
}

// ── Componente ─────────────────────────────────────────────────────────────────

export default function AiAgentPanel({
  projects,
  documents,
  workspaceId,
}: {
  projects:    Project[]
  documents:   DocMeta[]
  workspaceId: string
}) {
  // Selección
  const [projectId,   setProjectId]   = useState('')
  const [docId,       setDocId]       = useState('')
  const [manualFile,  setManualFile]  = useState<File | null>(null)
  const [useManual,   setUseManual]   = useState(false)
  const [isDragging,  setIsDragging]  = useState(false)

  // Extracción
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState<string | null>(null)
  const [extraction,    setExtraction]    = useState<Extraction | null>(null)
  const [extractionId,  setExtractionId]  = useState<string | null>(null)
  const [openSections,  setOpenSections]  = useState<Record<string, boolean>>({})

  // Historial
  const [history,        setHistory]        = useState<SavedExtraction[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [expandedHist,   setExpandedHist]   = useState<string | null>(null)

  // Corrección inline
  const [editingId,      setEditingId]      = useState<string | null>(null)
  const [editData,       setEditData]       = useState<Extraction | null>(null)
  const [corrNote,       setCorrNote]       = useState('')
  const [saving,         setSaving]         = useState(false)

  // Hints para Kota
  const [userHint,       setUserHint]       = useState('')

  // Tab activo
  const [activeTab,      setActiveTab]      = useState<'extraction' | 'datos' | 'query'>('extraction')

  // Consultas RAG
  const [queryInput,     setQueryInput]     = useState('')
  const [queries,        setQueries]        = useState<KotaQuery[]>([])
  const [queryHistory,   setQueryHistory]   = useState<KotaQuery[]>([])
  const [expandedSource, setExpandedSource] = useState<number | null>(null)
  const queryEndRef = useRef<HTMLDivElement>(null)

  // Datos Técnicos (reemplaza Brief Técnico)
  const [kotaData,       setKotaData]       = useState<KotaData>({
    campos_comunes: {}, campos_disciplina: {}, notas: '',
  })
  const [kotaDataLoading, setKotaDataLoading] = useState(false)
  const [kotaDataSaving,  setKotaDataSaving]  = useState<string | null>(null) // field key being saved
  const [kotaDataSaved,   setKotaDataSaved]   = useState<string | null>(null) // field key just saved
  const [kotaNotasSaving, setKotaNotasSaving] = useState(false)
  const [kotaNotasSaved,  setKotaNotasSaved]  = useState(false)
  const [disciplinaOpen,  setDisciplinaOpen]  = useState(true)

  const inputRef = useRef<HTMLInputElement>(null)

  // Refresh historial
  const refreshHistory = useCallback(() => {
    if (!projectId) return
    setLoadingHistory(true)
    fetch(`/api/ai-agent?projectId=${projectId}`)
      .then(r => r.json())
      .then(d => setHistory(d.extractions ?? []))
      .catch(() => {})
      .finally(() => setLoadingHistory(false))
  }, [projectId])

  // Documentos filtrados por proyecto seleccionado
  const projectDocs = useMemo(
    () => documents.filter(d => d.project_id === projectId),
    [documents, projectId]
  )

  const selectedDoc = useMemo(
    () => documents.find(d => d.id === docId) ?? null,
    [documents, docId]
  )

  const selectedProject = useMemo(
    () => projects.find(p => p.id === projectId) ?? null,
    [projects, projectId]
  )

  // Cargar historial al cambiar proyecto o tras nueva extracción
  useEffect(() => {
    if (!projectId) { setHistory([]); return }
    refreshHistory()
  }, [projectId, extraction, refreshHistory])

  // Cargar kota_data al cambiar proyecto
  useEffect(() => {
    if (!projectId) {
      setKotaData({ campos_comunes: {}, campos_disciplina: {}, notas: '' })
      return
    }
    setKotaDataLoading(true)
    fetch(`/api/ai-agent/brief?projectId=${projectId}`)
      .then(r => r.json())
      .then(d => {
        const kd: KotaData = d.kota_data ?? { campos_comunes: {}, campos_disciplina: {}, notas: '' }
        setKotaData(kd)
      })
      .catch(() => {})
      .finally(() => setKotaDataLoading(false))
  }, [projectId])

  // Cargar historial de consultas al cambiar proyecto
  useEffect(() => {
    if (!projectId) { setQueryHistory([]); setQueries([]); return }
    fetch(`/api/ai-agent/query?projectId=${projectId}`)
      .then(r => r.json())
      .then(d => setQueryHistory(d.queries ?? []))
      .catch(() => {})
  }, [projectId])

  // Scroll al último mensaje
  useEffect(() => {
    if (activeTab === 'query') queryEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [queries, activeTab])

  // Reset doc al cambiar proyecto
  useEffect(() => { setDocId(''); setManualFile(null); setUseManual(false) }, [projectId])

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleFile = (f: File) => {
    if (f.type !== 'application/pdf') { setError('Solo se aceptan archivos PDF'); return }
    setManualFile(f)
    setError(null)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [])

  const analyze = async () => {
    if (!projectId) { setError('Selecciona un proyecto'); return }
    if (!useManual && !docId) { setError('Selecciona un documento o sube un PDF'); return }
    if (useManual && !manualFile) { setError('Selecciona un archivo PDF'); return }

    setLoading(true)
    setError(null)
    setExtraction(null)
    setExtractionId(null)

    try {
      const fd = new FormData()
      fd.append('projectId', projectId)

      if (useManual && manualFile) {
        fd.append('file', manualFile)
        const manualHints: Record<string, string> = {}
        if (selectedProject)   manualHints.proyecto_name = selectedProject.name
        if (userHint.trim())   manualHints.user_hint     = userHint.trim()
        fd.append('docHints', JSON.stringify(manualHints))
      } else {
        fd.append('documentId', docId)
        const hints: Record<string, string> = {}
        if (selectedProject)       hints.proyecto_name    = selectedProject.name
        if (selectedDoc?.doc_key)  hints.doc_key          = selectedDoc.doc_key
        if (selectedDoc?.doc_type) hints.tipo_plano       = selectedDoc.doc_type
        if (selectedDoc?.mic_version) hints.version       = selectedDoc.mic_version
        if ((selectedDoc?.specialty as any)?.name) hints.especialidad = (selectedDoc?.specialty as any).name
        if (userHint.trim())       hints.user_hint        = userHint.trim()
        fd.append('docHints', JSON.stringify(hints))
      }

      const res  = await fetch('/api/ai-agent', { method: 'POST', body: fd })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Error al analizar')

      setExtraction(data.extraction)
      setExtractionId(data.extractionId ?? null)

      const initial: Record<string, boolean> = {}
      data.extraction.especialidades?.forEach((_: Especialidad, i: number) => { initial[i] = true })
      setOpenSections(initial)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  // ── Corrección / aprobación ─────────────────────────────────────────────────

  const approveExtraction = async (id: string) => {
    setSaving(true)
    await fetch('/api/ai-agent', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'approved' }),
    })
    setSaving(false)
    refreshHistory()
  }

  const startEdit = (h: SavedExtraction) => {
    setEditingId(h.id)
    setEditData(JSON.parse(JSON.stringify(h.raw_extraction)) as Extraction)
    setCorrNote('')
    setExpandedHist(null)
  }

  const cancelEdit = () => { setEditingId(null); setEditData(null); setCorrNote('') }

  const updateEl = (espIdx: number, elIdx: number, field: keyof Elemento, value: string | number | null) => {
    setEditData(prev => {
      if (!prev) return prev
      const next = JSON.parse(JSON.stringify(prev)) as Extraction
      next.especialidades[espIdx].elementos[elIdx] = { ...next.especialidades[espIdx].elementos[elIdx], [field]: value }
      return next
    })
  }

  const saveCorrection = async (id: string, status: 'reviewed' | 'approved') => {
    setSaving(true)
    await fetch('/api/ai-agent', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, corrected_extraction: editData, correction_notes: corrNote || undefined }),
    })
    setSaving(false)
    cancelEdit()
    refreshHistory()
  }

  // Guardar un campo individual de kota_data (PATCH)
  const saveKotaField = async (fieldPath: string[], value: string | number | null) => {
    if (!projectId) return
    const key = fieldPath.join('.')
    setKotaDataSaving(key)
    try {
      await fetch('/api/ai-agent/brief', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, field_path: fieldPath, value, source: 'human' }),
      })
      // Update local state: mark field as human
      setKotaData(prev => {
        const next = JSON.parse(JSON.stringify(prev)) as KotaData
        if (fieldPath[0] === 'campos_comunes' && fieldPath[1]) {
          const key2 = fieldPath[1] as keyof KotaCamposComunes
          next.campos_comunes[key2] = { valor: value, source: 'human' }
        } else if (fieldPath[0] === 'campos_disciplina' && fieldPath[1] && fieldPath[2]) {
          if (!next.campos_disciplina[fieldPath[1]]) next.campos_disciplina[fieldPath[1]] = {}
          next.campos_disciplina[fieldPath[1]][fieldPath[2]] = { valor: value, source: 'human' }
        }
        return next
      })
      setKotaDataSaved(key)
      setTimeout(() => setKotaDataSaved(null), 2000)
    } catch { /* ignore */ } finally {
      setKotaDataSaving(null)
    }
  }

  // Guardar notas técnicas completas (PUT)
  const saveKotaNotas = async (notas: string) => {
    if (!projectId) return
    setKotaNotasSaving(true)
    try {
      const updated: KotaData = { ...kotaData, notas }
      await fetch('/api/ai-agent/brief', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, kota_data: updated }),
      })
      setKotaData(updated)
      setKotaNotasSaved(true)
      setTimeout(() => setKotaNotasSaved(false), 2500)
    } catch { /* ignore */ } finally {
      setKotaNotasSaving(false)
    }
  }

  const sendQuery = async () => {
    const q = queryInput.trim()
    if (!q || !projectId) return

    const placeholder: KotaQuery = { question: q, answer: null, sources: null, loading: true }
    setQueries(prev => [...prev, placeholder])
    setQueryInput('')
    setExpandedSource(null)

    try {
      const res  = await fetch('/api/ai-agent/query', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ projectId, question: q }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al consultar')

      setQueries(prev => prev.map((item, idx) =>
        idx === prev.length - 1
          ? { question: q, answer: data.answer, sources: data.sources ?? [], loading: false }
          : item
      ))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado'
      setQueries(prev => prev.map((item, idx) =>
        idx === prev.length - 1
          ? { question: q, answer: `Error: ${msg}`, sources: [], loading: false }
          : item
      ))
    }
  }

  const reset = () => {
    setExtraction(null)
    setExtractionId(null)
    setError(null)
    setManualFile(null)
    setOpenSections({})
    if (inputRef.current) inputRef.current.value = ''
  }

  const totalElementos = extraction?.especialidades.reduce((acc, e) => acc + e.elementos.length, 0) ?? 0

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Selector de proyecto ─────────────────────────────────────────── */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Proyecto
        </label>
        <div className="relative">
          <select
            value={projectId}
            onChange={e => setProjectId(e.target.value)}
            className="w-full appearance-none border border-slate-200 rounded-xl px-4 py-2.5 pr-9 text-sm text-[#1A2744] bg-white focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/30 focus:border-[#00C2FF]"
          >
            <option value="">— Seleccionar proyecto —</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.builtek_id ? `[${p.builtek_id}] ` : ''}{p.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* ── Tab bar ──────────────────────────────────────────────────────── */}
      {projectId && (
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('extraction')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'extraction'
                ? 'bg-white text-[#1A2744] shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Extracción
          </button>
          <button
            onClick={() => setActiveTab('datos')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'datos'
                ? 'bg-white text-[#1A2744] shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Datos Técnicos
            {Object.keys(kotaData.campos_comunes).length > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#00C2FF] flex-shrink-0" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('query')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'query'
                ? 'bg-white text-[#1A2744] shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Consultar
          </button>
        </div>
      )}

      {/* ── Datos Técnicos ─────────────────────────────────────────────────── */}
      {projectId && activeTab === 'datos' && (
        <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-5">
          <div>
            <h3 className="text-sm font-bold text-[#1A2744] mb-0.5">Datos Técnicos del Proyecto</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Kota usa estos datos como contexto en cada extracción. Los campos con badge amarillo fueron sugeridos por Kota — edítalos para confirmarlos.
            </p>
          </div>

          {kotaDataLoading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Cargando datos técnicos...</span>
            </div>
          ) : (
            <>
              {/* ── Campos Comunes ── */}
              <div className="space-y-3">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Campos Comunes</p>
                {([
                  { key: 'nombre_proyecto',        label: 'Nombre del proyecto',    type: 'text'   },
                  { key: 'ubicacion',              label: 'Ubicación',              type: 'text'   },
                  { key: 'tipo_estructura',        label: 'Tipo de estructura',     type: 'text'   },
                  { key: 'etapa',                  label: 'Etapa',                  type: 'text'   },
                  { key: 'longitud_total_m',       label: 'Longitud total (m)',     type: 'number' },
                  { key: 'area_total_m2',          label: 'Área total (m²)',        type: 'number' },
                  { key: 'altura_maxima_m',        label: 'Altura máxima (m)',      type: 'number' },
                  { key: 'presupuesto_referencia', label: 'Presupuesto referencia', type: 'text'   },
                ] as { key: keyof KotaCamposComunes; label: string; type: string }[]).map(({ key, label, type }) => {
                  const field = kotaData.campos_comunes[key]
                  const fieldKey = `campos_comunes.${key}`
                  const isSaving = kotaDataSaving === fieldKey
                  const isSaved  = kotaDataSaved === fieldKey
                  const isKota   = field?.source === 'kota'
                  return (
                    <KotaField
                      key={key}
                      label={label}
                      type={type}
                      value={field?.valor ?? null}
                      isKota={isKota}
                      isSaving={isSaving}
                      isSaved={isSaved}
                      onSave={(val) => saveKotaField(['campos_comunes', key], val)}
                    />
                  )
                })}
              </div>

              {/* ── Campos por Disciplina ── */}
              {Object.keys(kotaData.campos_disciplina).length > 0 && (
                <div className="space-y-3">
                  <button
                    onClick={() => setDisciplinaOpen(o => !o)}
                    className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-full text-left"
                  >
                    {disciplinaOpen
                      ? <ChevronUp className="w-3.5 h-3.5" />
                      : <ChevronRight className="w-3.5 h-3.5" />
                    }
                    Campos por Disciplina
                  </button>
                  {disciplinaOpen && Object.entries(kotaData.campos_disciplina).map(([disc, campos]) => (
                    <div key={disc} className="pl-4 border-l-2 border-slate-100 space-y-2">
                      <p className="text-xs font-semibold text-[#1A2744]">{disc}</p>
                      {Object.entries(campos).map(([campoKey, field]) => {
                        const fieldKey = `campos_disciplina.${disc}.${campoKey}`
                        return (
                          <KotaField
                            key={campoKey}
                            label={campoKey}
                            type="text"
                            value={field.valor}
                            isKota={field.source === 'kota'}
                            isSaving={kotaDataSaving === fieldKey}
                            isSaved={kotaDataSaved === fieldKey}
                            onSave={(val) => saveKotaField(['campos_disciplina', disc, campoKey], val)}
                          />
                        )
                      })}
                    </div>
                  ))}
                </div>
              )}

              {/* ── Notas Técnicas ── */}
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Notas Técnicas</p>
                <textarea
                  value={kotaData.notas}
                  onChange={e => setKotaData(prev => ({ ...prev, notas: e.target.value }))}
                  placeholder="Observaciones generales, normas aplicables, convenciones del proyecto…"
                  rows={5}
                  className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 text-[#1A2744] placeholder-slate-300 resize-none focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/30 focus:border-[#00C2FF] leading-relaxed"
                />
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-400">
                    {kotaNotasSaved
                      ? <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-3.5 h-3.5" />Notas guardadas</span>
                      : kotaData.notas ? `${kotaData.notas.length} caracteres` : 'Sin notas'
                    }
                  </div>
                  <button
                    onClick={() => saveKotaNotas(kotaData.notas)}
                    disabled={kotaNotasSaving}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1A2744] text-white text-sm font-semibold hover:bg-[#243660] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {kotaNotasSaving
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Save className="w-3.5 h-3.5" />
                    }
                    Guardar Notas
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Consultar Kota (RAG) ─────────────────────────────────────────── */}
      {projectId && activeTab === 'query' && (
        <div className="space-y-4">

          {/* Chat session */}
          {queries.length === 0 && queryHistory.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center">
              <div className="w-12 h-12 bg-[#00C2FF]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="w-6 h-6 text-[#00C2FF]" />
              </div>
              <p className="text-sm font-semibold text-[#1A2744] mb-1">Pregúntale a Kota</p>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                Kota responde basándose en las extracciones aprobadas del proyecto.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  '¿Cuánto concreto f\'c=250 hay en total?',
                  '¿Qué elementos estructurales tiene el proyecto?',
                  '¿Cuántos m³ de excavación hay?',
                ].map(ex => (
                  <button
                    key={ex}
                    onClick={() => setQueryInput(ex)}
                    className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 hover:border-[#00C2FF]/50 hover:bg-[#00C2FF]/5 transition-colors"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
              <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
                {/* Session queries */}
                {queries.map((q, i) => (
                  <div key={i} className="p-5 space-y-3">
                    {/* Question */}
                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-[#1A2744] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        Tú
                      </div>
                      <p className="text-sm text-[#1A2744] font-medium leading-relaxed">{q.question}</p>
                    </div>

                    {/* Answer */}
                    {q.loading ? (
                      <div className="flex items-center gap-2 pl-8.5 text-slate-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-xs">Kota está consultando extracciones...</span>
                      </div>
                    ) : q.answer && (
                      <div className="pl-8">
                        <div className="flex items-start gap-2.5">
                          <div className="w-6 h-6 rounded-full bg-[#00C2FF]/20 text-[#007A9E] text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Bot className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                              {q.answer}
                            </div>
                            {/* Sources */}
                            {q.sources && q.sources.length > 0 && (
                              <button
                                onClick={() => setExpandedSource(expandedSource === i ? null : i)}
                                className="mt-2 flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
                              >
                                <FileText className="w-3 h-3" />
                                {q.sources.length} fuente{q.sources.length > 1 ? 's' : ''}
                                <ChevronDown className={`w-3 h-3 transition-transform ${expandedSource === i ? 'rotate-180' : ''}`} />
                              </button>
                            )}
                            {expandedSource === i && q.sources && (
                              <div className="mt-1.5 flex flex-wrap gap-1.5">
                                {q.sources.map((s, si) => (
                                  <span key={si} className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 text-slate-500 rounded">
                                    {s.doc_key}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Query history from DB (collapsed) */}
                {queryHistory.length > 0 && queries.length === 0 && (
                  <div className="px-5 py-3 bg-slate-50/60">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
                      Consultas anteriores
                    </p>
                    <div className="space-y-3">
                      {queryHistory.slice(0, 5).map((q, i) => (
                        <div key={q.id || i} className="space-y-1.5">
                          <p className="text-xs font-medium text-slate-600">{q.question}</p>
                          <p className="text-xs text-slate-400 line-clamp-2">{q.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div ref={queryEndRef} />
              </div>
            </div>
          )}

          {/* Input */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3 flex items-end gap-2 focus-within:border-[#00C2FF] focus-within:ring-2 focus-within:ring-[#00C2FF]/20 transition-all">
            <textarea
              value={queryInput}
              onChange={e => setQueryInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendQuery()
                }
              }}
              placeholder="Pregunta sobre los metrados del proyecto… (Enter para enviar)"
              rows={2}
              className="flex-1 resize-none text-sm text-[#1A2744] placeholder-slate-300 focus:outline-none leading-relaxed"
            />
            <button
              onClick={sendQuery}
              disabled={!queryInput.trim() || queries.some(q => q.loading)}
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-[#1A2744] text-white hover:bg-[#243660] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-slate-400 text-center">
            Kota consulta las <strong className="text-slate-500">{/* */}</strong> extracciones aprobadas del proyecto.
            Aprueba más planos para mejores respuestas.
          </p>
        </div>
      )}

      {/* ── Selector de documento / upload ───────────────────────────────── */}
      {projectId && activeTab === 'extraction' && !extraction && (
        <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4">

          {/* Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setUseManual(false)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors
                ${!useManual
                  ? 'bg-[#1A2744] text-white'
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
            >
              <FolderOpen className="w-4 h-4 inline mr-1.5" />
              Documento del proyecto
            </button>
            <button
              onClick={() => setUseManual(true)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors
                ${useManual
                  ? 'bg-[#1A2744] text-white'
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
            >
              <Upload className="w-4 h-4 inline mr-1.5" />
              Subir PDF manualmente
            </button>
          </div>

          {/* Seleccionar documento */}
          {!useManual && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Documento
              </label>
              {projectDocs.length === 0 ? (
                <p className="text-sm text-slate-400 py-2">
                  No hay documentos PDF en este proyecto.
                </p>
              ) : (
                <div className="relative">
                  <select
                    value={docId}
                    onChange={e => setDocId(e.target.value)}
                    className="w-full appearance-none border border-slate-200 rounded-xl px-4 py-2.5 pr-9 text-sm text-[#1A2744] bg-white focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/30 focus:border-[#00C2FF]"
                  >
                    <option value="">— Seleccionar documento —</option>
                    {projectDocs.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.doc_key || d.file_name || d.id}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              )}

              {/* Hints del documento seleccionado */}
              {selectedDoc && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedDoc.specialty?.name && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#00C2FF]/10 text-[#007A9E] rounded-lg text-xs font-medium">
                      <Tag className="w-3 h-3" />{selectedDoc.specialty.name}
                    </span>
                  )}
                  {selectedDoc.doc_type && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                      Tipo: {selectedDoc.doc_type}
                    </span>
                  )}
                  {selectedDoc.mic_version && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                      {selectedDoc.mic_version}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Upload manual */}
          {useManual && (
            <div
              onDrop={onDrop}
              onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => !manualFile && inputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
                ${isDragging
                  ? 'border-[#00C2FF] bg-[#00C2FF]/5'
                  : manualFile
                    ? 'border-green-300 bg-green-50 cursor-default'
                    : 'border-slate-200 hover:border-[#00C2FF]/50 hover:bg-slate-50'}`}
            >
              <input ref={inputRef} type="file" accept="application/pdf" className="hidden"
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

              {manualFile ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-[#1A2744]">{manualFile.name}</p>
                    <p className="text-xs text-slate-400">{(manualFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button onClick={e => { e.stopPropagation(); setManualFile(null) }}
                    className="ml-auto p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-600">Arrastra el PDF aquí</p>
                  <p className="text-xs text-slate-400 mt-0.5">o haz clic · Máx. 20 MB</p>
                </>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Instrucciones para Kota */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Instrucciones para Kota <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <textarea
              value={userHint}
              onChange={e => setUserHint(e.target.value)}
              placeholder="Ej: Este plano tiene 3 tipos de muro MC-01, MC-02, MC-03. Extraer cantidades por separado para cada uno."
              rows={3}
              className="w-full text-xs rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 resize-none"
            />
          </div>

          {/* Botón analizar */}
          <button
            onClick={analyze}
            disabled={loading || (!docId && !manualFile)}
            className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#1A2744] to-[#243660] text-white py-3.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#1A2744]/20"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Analizando con Kota...</>
            ) : (
              <><Zap className="w-4 h-4 text-[#00C2FF]" />Analizar con Kota</>
            )}
          </button>
        </div>
      )}

      {/* ── Loading ───────────────────────────────────────────────────────── */}
      {activeTab === 'extraction' && loading && (
        <div className="bg-white border border-slate-100 rounded-2xl p-10 text-center">
          <div className="relative w-14 h-14 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-[#00C2FF]/20" />
            <div className="absolute inset-0 rounded-full border-4 border-[#00C2FF] border-t-transparent animate-spin" />
            <Bot className="absolute inset-0 m-auto w-5 h-5 text-[#00C2FF]" />
          </div>
          <p className="text-sm font-semibold text-[#1A2744]">Kota está leyendo el plano...</p>
          <p className="text-xs text-slate-400 mt-1">Esto puede tomar 15–30 segundos</p>
        </div>
      )}

      {/* ── Resultado ─────────────────────────────────────────────────────── */}
      {activeTab === 'extraction' && extraction && (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">

          {/* Header resultado */}
          <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-100">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-[#1A2744] truncate">
                  {extraction.titulo || 'Plano analizado'}
                </h2>
                {extraction.confianza && CONFIANZA_CONFIG[extraction.confianza] && (
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${CONFIANZA_CONFIG[extraction.confianza].color}`}>
                    Confianza {CONFIANZA_CONFIG[extraction.confianza].label}
                  </span>
                )}
                {extractionId && (
                  <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">
                    <CheckCircle2 className="w-3 h-3" />Guardado
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {totalElementos} elementos · {extraction.especialidades?.length ?? 0} especialidades
              </p>
            </div>
            <button onClick={reset}
              className="flex-shrink-0 flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#1A2744] transition-colors">
              <RotateCcw className="w-3.5 h-3.5" />Nueva
            </button>
          </div>

          {/* Especialidades */}
          <div className="divide-y divide-slate-50">
            {extraction.especialidades?.map((esp, i) => (
              <div key={i}>
                <button
                  onClick={() => setOpenSections(prev => ({ ...prev, [i]: !prev[i] }))}
                  className="w-full flex items-center justify-between px-6 py-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#1A2744]">{esp.nombre}</span>
                    <span className="text-xs text-slate-400">{esp.elementos.length} elementos</span>
                  </div>
                  {openSections[i]
                    ? <ChevronUp className="w-4 h-4 text-slate-400" />
                    : <ChevronRight className="w-4 h-4 text-slate-400" />
                  }
                </button>

                {openSections[i] && (
                  <div className="px-6 pb-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-100">
                          <th className="text-left py-2 font-semibold w-[40%]">Elemento</th>
                          <th className="text-right py-2 font-semibold w-[15%]">Cantidad</th>
                          <th className="text-left py-2 pl-3 font-semibold w-[12%]">Unidad</th>
                          <th className="text-left py-2 pl-3 font-semibold">Descripción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {esp.elementos.map((el, j) => (
                          <tr key={j} className="hover:bg-slate-50/50">
                            <td className="py-2 font-medium text-[#1A2744]">{el.tipo}</td>
                            <td className="py-2 text-right tabular-nums">
                              {el.cantidad !== null && el.cantidad !== undefined
                                ? <span className="font-semibold text-[#1A2744]">{el.cantidad.toLocaleString('es-MX')}</span>
                                : <span className="text-slate-300">—</span>
                              }
                            </td>
                            <td className="py-2 pl-3 text-slate-500 text-xs">{el.unidad}</td>
                            <td className="py-2 pl-3 text-slate-400 text-xs">{el.descripcion || ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Notas */}
          {extraction.notas && (
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <p className="text-xs text-slate-500"><span className="font-semibold">Notas:</span> {extraction.notas}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Historial del proyecto ─────────────────────────────────────────── */}
      {projectId && activeTab === 'extraction' && (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-[#1A2744]">
              Extracciones del proyecto
            </h3>
            {!loadingHistory && (
              <span className="ml-auto text-xs text-slate-400">{history.length} registros</span>
            )}
          </div>

          {loadingHistory ? (
            <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Cargando historial...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-10">
              <Sparkles className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Aún no hay extracciones para este proyecto.</p>
              <p className="text-xs text-slate-300 mt-1">Selecciona un plano y presiona "Analizar con Kota".</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {history.map(h => {
                const ext      = h.raw_extraction
                const hints    = h.doc_hints
                const isOpen   = expandedHist === h.id
                const isEditing = editingId === h.id
                const totalEl  = ext?.especialidades?.reduce((a, e) => a + e.elementos.length, 0) ?? 0

                return (
                  <div key={h.id}>
                    {/* ── Fila del historial ─── */}
                    <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                      <button
                        onClick={() => !isEditing && setExpandedHist(isOpen ? null : h.id)}
                        className="flex items-center gap-3 flex-1 min-w-0 text-left"
                      >
                        <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[#1A2744] truncate">
                            {hints.doc_key || ext?.titulo || hints.file_name || 'Plano sin nombre'}
                          </p>
                          <p className="text-xs text-slate-400">
                            {new Date(h.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {' · '}{totalEl} elementos
                          </p>
                        </div>
                      </button>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {hints.especialidad && (
                          <span className="hidden sm:inline text-[11px] px-2 py-0.5 rounded-full bg-[#00C2FF]/10 text-[#007A9E] font-medium">
                            {hints.especialidad}
                          </span>
                        )}
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_CONFIG[h.status]?.color}`}>
                          {STATUS_CONFIG[h.status]?.label}
                        </span>

                        {/* Acciones por estado */}
                        {h.status !== 'approved' && !isEditing && (
                          <>
                            <button
                              onClick={() => approveExtraction(h.id)}
                              disabled={saving}
                              className="text-[11px] px-2.5 py-1 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 font-semibold transition-colors disabled:opacity-50"
                            >
                              Aprobar
                            </button>
                            <button
                              onClick={() => startEdit(h)}
                              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 font-semibold transition-colors"
                            >
                              Corregir
                            </button>
                          </>
                        )}

                        {!isEditing && (
                          isOpen
                            ? <ChevronUp className="w-3.5 h-3.5 text-slate-400 cursor-pointer" onClick={() => setExpandedHist(null)} />
                            : <ChevronRight className="w-3.5 h-3.5 text-slate-400 cursor-pointer" onClick={() => setExpandedHist(h.id)} />
                        )}
                      </div>
                    </div>

                    {/* ── Vista expandida (solo lectura) ─── */}
                    {isOpen && !isEditing && ext?.especialidades && (
                      <div className="px-5 pb-4 bg-slate-50/50">
                        {ext.especialidades.map((esp, i) => (
                          <div key={i} className="mt-3">
                            <p className="text-xs font-semibold text-slate-500 mb-1">{esp.nombre}</p>
                            <table className="w-full text-xs">
                              <tbody className="divide-y divide-slate-100">
                                {esp.elementos.map((el, j) => (
                                  <tr key={j}>
                                    <td className="py-1.5 text-slate-700 font-medium w-[45%]">{el.tipo}</td>
                                    <td className="py-1.5 text-right tabular-nums font-semibold text-[#1A2744] w-[15%]">
                                      {el.cantidad !== null && el.cantidad !== undefined ? el.cantidad.toLocaleString('es-MX') : '—'}
                                    </td>
                                    <td className="py-1.5 pl-2 text-slate-400 w-[12%]">{el.unidad}</td>
                                    <td className="py-1.5 pl-2 text-slate-400">{el.descripcion || ''}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ── Modo edición / corrección ─── */}
                    {isEditing && editData && (
                      <div className="px-5 pb-5 bg-amber-50/40 border-t border-amber-100">
                        <p className="text-xs font-semibold text-amber-700 mt-3 mb-2">
                          Corrigiendo extracción — edita cantidades, unidades o descripciones
                        </p>
                        {editData.especialidades?.map((esp, espIdx) => (
                          <div key={espIdx} className="mb-4">
                            <p className="text-xs font-semibold text-slate-500 mb-1">{esp.nombre}</p>
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-[10px] text-slate-400 border-b border-slate-200">
                                  <th className="text-left py-1 w-[38%]">Elemento</th>
                                  <th className="text-right py-1 w-[18%]">Cantidad</th>
                                  <th className="text-left py-1 pl-2 w-[14%]">Unidad</th>
                                  <th className="text-left py-1 pl-2">Descripción</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {esp.elementos.map((el, elIdx) => (
                                  <tr key={elIdx}>
                                    <td className="py-1 font-medium text-slate-700">{el.tipo}</td>
                                    <td className="py-1">
                                      <input
                                        type="number"
                                        value={el.cantidad ?? ''}
                                        onChange={e => updateEl(espIdx, elIdx, 'cantidad', e.target.value === '' ? null : parseFloat(e.target.value))}
                                        className="w-full text-right text-[#1A2744] font-semibold bg-white border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#00C2FF]"
                                      />
                                    </td>
                                    <td className="py-1 pl-2">
                                      <input
                                        value={el.unidad}
                                        onChange={e => updateEl(espIdx, elIdx, 'unidad', e.target.value)}
                                        className="w-full text-slate-600 bg-white border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#00C2FF]"
                                      />
                                    </td>
                                    <td className="py-1 pl-2">
                                      <input
                                        value={el.descripcion || ''}
                                        onChange={e => updateEl(espIdx, elIdx, 'descripcion', e.target.value)}
                                        className="w-full text-slate-500 bg-white border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#00C2FF]"
                                      />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ))}

                        <textarea
                          value={corrNote}
                          onChange={e => setCorrNote(e.target.value)}
                          placeholder="Nota de corrección (opcional): ej. 'Cantidad de pilas corregida según planilla de cálculo'"
                          rows={2}
                          className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-600 placeholder-slate-300 resize-none focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/30 mt-1"
                        />

                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={cancelEdit}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => saveCorrection(h.id, 'reviewed')}
                            disabled={saving}
                            className="flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50"
                          >
                            Guardar como Revisada
                          </button>
                          <button
                            onClick={() => saveCorrection(h.id, 'approved')}
                            disabled={saving}
                            className="flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin inline" /> : 'Guardar y Aprobar'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
