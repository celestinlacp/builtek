'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import {
  Upload, FileText, Loader2, AlertCircle, CheckCircle2,
  ChevronDown, ChevronRight, Zap, Bot, RotateCcw, X,
  FolderOpen, Clock, Sparkles, Tag, ChevronUp, BookOpen, Save,
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

  // Tab activo
  const [activeTab,      setActiveTab]      = useState<'extraction' | 'brief'>('extraction')

  // Brief técnico
  const [brief,          setBrief]          = useState('')
  const [briefOrig,      setBriefOrig]      = useState('')
  const [briefSaving,    setBriefSaving]    = useState(false)
  const [briefSaved,     setBriefSaved]     = useState(false)

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

  // Cargar brief al cambiar proyecto
  useEffect(() => {
    if (!projectId) { setBrief(''); setBriefOrig(''); return }
    fetch(`/api/ai-agent/brief?projectId=${projectId}`)
      .then(r => r.json())
      .then(d => { setBrief(d.brief ?? ''); setBriefOrig(d.brief ?? '') })
      .catch(() => {})
  }, [projectId])

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
        if (selectedProject) {
          fd.append('docHints', JSON.stringify({ proyecto_name: selectedProject.name }))
        }
      } else {
        fd.append('documentId', docId)
        const hints: Record<string, string> = {}
        if (selectedProject)       hints.proyecto_name    = selectedProject.name
        if (selectedDoc?.doc_key)  hints.doc_key          = selectedDoc.doc_key
        if (selectedDoc?.doc_type) hints.tipo_plano       = selectedDoc.doc_type
        if (selectedDoc?.mic_version) hints.version       = selectedDoc.mic_version
        if ((selectedDoc?.specialty as any)?.name) hints.especialidad = (selectedDoc?.specialty as any).name
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

  const saveBrief = async () => {
    if (!projectId) return
    setBriefSaving(true)
    await fetch('/api/ai-agent/brief', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, brief }),
    })
    setBriefOrig(brief)
    setBriefSaved(true)
    setBriefSaving(false)
    setTimeout(() => setBriefSaved(false), 2500)
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
            onClick={() => setActiveTab('brief')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'brief'
                ? 'bg-white text-[#1A2744] shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Brief Técnico
            {briefOrig && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#00C2FF] flex-shrink-0" />
            )}
          </button>
        </div>
      )}

      {/* ── Brief Técnico ─────────────────────────────────────────────────── */}
      {projectId && activeTab === 'brief' && (
        <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#1A2744] mb-0.5">Brief Técnico del Proyecto</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Cota leerá este contexto antes de cada extracción. Describe lo que necesita saber para ser más preciso.
            </p>
          </div>

          {/* Guía */}
          <div className="bg-slate-50 rounded-xl px-4 py-3 space-y-1">
            <p className="text-[11px] font-semibold text-slate-500 mb-1.5">Incluye información como:</p>
            {[
              'Tipo de proyecto y estructura principal (puente, edificio, viaducto…)',
              "Materiales predominantes: concreto f'c, acero fy, calidad de materiales",
              'Normas de diseño aplicables (AASHTO, ACI, NMX, SCT…)',
              'Elementos especiales: pilas, trabes, vigas cajón, losas, pilotes',
              'Unidades de medida preferidas y convenciones del proyecto',
            ].map((tip, i) => (
              <p key={i} className="text-[11px] text-slate-400 flex gap-1.5">
                <span className="text-[#00C2FF] flex-shrink-0">·</span>{tip}
              </p>
            ))}
          </div>

          <textarea
            value={brief}
            onChange={e => { setBrief(e.target.value); setBriefSaved(false) }}
            placeholder={`Ejemplo:\n\nPuente peatonal de concreto reforzado de 47.2 m de longitud. Estructura tipo viga T en subestructura y superestructura monolítica. Materiales: concreto f'c = 250 kg/cm² en pilas y trabes, f'c = 200 kg/cm² en muros. Acero grado 60 (fy = 4200 kg/cm²). Normas: SCT 2016, AASHTO LRFD. Proyecto Frente 12, carretera federal México-Cuernavaca.`}
            rows={10}
            className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 text-[#1A2744] placeholder-slate-300 resize-none focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/30 focus:border-[#00C2FF] leading-relaxed"
          />

          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-400">
              {briefSaved
                ? <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-3.5 h-3.5" />Brief guardado</span>
                : briefOrig
                  ? brief !== briefOrig ? 'Cambios sin guardar' : `Brief activo · ${briefOrig.length} caracteres`
                  : 'Sin brief — Cota trabaja sin contexto del proyecto'
              }
            </div>
            <button
              onClick={saveBrief}
              disabled={briefSaving || brief === briefOrig}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1A2744] text-white text-sm font-semibold hover:bg-[#243660] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {briefSaving
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Save className="w-3.5 h-3.5" />
              }
              Guardar Brief
            </button>
          </div>
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

          {/* Botón analizar */}
          <button
            onClick={analyze}
            disabled={loading || (!docId && !manualFile)}
            className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#1A2744] to-[#243660] text-white py-3.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#1A2744]/20"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Analizando con Cota...</>
            ) : (
              <><Zap className="w-4 h-4 text-[#00C2FF]" />Analizar con Cota</>
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
          <p className="text-sm font-semibold text-[#1A2744]">Cota está leyendo el plano...</p>
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
              <p className="text-xs text-slate-300 mt-1">Selecciona un plano y presiona "Analizar con Cota".</p>
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
