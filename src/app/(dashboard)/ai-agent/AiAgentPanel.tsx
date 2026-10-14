'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import {
  Upload, FileText, Loader2, AlertCircle, CheckCircle2,
  ChevronDown, ChevronRight, Zap, Bot, RotateCcw, X,
  FolderOpen, Clock, Sparkles, Tag, ChevronUp,
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

  const inputRef = useRef<HTMLInputElement>(null)

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

  // Cargar historial al cambiar proyecto
  useEffect(() => {
    if (!projectId) { setHistory([]); return }
    setLoadingHistory(true)
    fetch(`/api/ai-agent?projectId=${projectId}`)
      .then(r => r.json())
      .then(d => setHistory(d.extractions ?? []))
      .catch(() => setHistory([]))
      .finally(() => setLoadingHistory(false))
  }, [projectId, extraction]) // re-fetch cuando llega nueva extracción

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

      {/* ── Selector de documento / upload ───────────────────────────────── */}
      {projectId && !extraction && (
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
      {loading && (
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
      {extraction && (
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
      {projectId && (
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
                const ext    = h.raw_extraction
                const hints  = h.doc_hints
                const isOpen = expandedHist === h.id
                const totalEl = ext?.especialidades?.reduce((a, e) => a + e.elementos.length, 0) ?? 0

                return (
                  <div key={h.id}>
                    <button
                      onClick={() => setExpandedHist(isOpen ? null : h.id)}
                      className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors text-left"
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
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {hints.especialidad && (
                          <span className="hidden sm:inline text-[11px] px-2 py-0.5 rounded-full bg-[#00C2FF]/10 text-[#007A9E] font-medium">
                            {hints.especialidad}
                          </span>
                        )}
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_CONFIG[h.status]?.color}`}>
                          {STATUS_CONFIG[h.status]?.label}
                        </span>
                        {isOpen
                          ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                          : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        }
                      </div>
                    </button>

                    {isOpen && ext?.especialidades && (
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
