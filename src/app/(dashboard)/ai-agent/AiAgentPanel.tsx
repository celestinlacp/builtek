'use client'

import { useState, useRef, useCallback } from 'react'
import {
  Upload, FileText, Loader2, AlertCircle, CheckCircle2,
  ChevronDown, ChevronRight, Zap, Bot, RotateCcw, X,
} from 'lucide-react'

type Elemento = {
  tipo: string
  cantidad: number | null
  unidad: string
  descripcion?: string
}

type Especialidad = {
  nombre: string
  elementos: Elemento[]
}

type Extraction = {
  titulo: string
  especialidades: Especialidad[]
  notas: string
  confianza: 'alta' | 'media' | 'baja'
}

const CONFIANZA_CONFIG = {
  alta:  { label: 'Alta', color: 'bg-green-100 text-green-700' },
  media: { label: 'Media', color: 'bg-amber-100 text-amber-700' },
  baja:  { label: 'Baja', color: 'bg-red-100 text-red-600' },
}

export default function AiAgentPanel() {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [extraction, setExtraction] = useState<Extraction | null>(null)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (f: File) => {
    if (f.type !== 'application/pdf') {
      setError('Solo se aceptan archivos PDF')
      return
    }
    setFile(f)
    setExtraction(null)
    setError(null)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [])

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const onDragLeave = () => setIsDragging(false)

  const analyze = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    setExtraction(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/ai-agent', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Error al analizar')

      setExtraction(data.extraction)

      // Abrir todas las especialidades por defecto
      const initial: Record<string, boolean> = {}
      data.extraction.especialidades?.forEach((e: Especialidad, i: number) => {
        initial[i] = true
      })
      setOpenSections(initial)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setFile(null)
    setExtraction(null)
    setError(null)
    setOpenSections({})
    if (inputRef.current) inputRef.current.value = ''
  }

  const toggleSection = (i: number) =>
    setOpenSections(prev => ({ ...prev, [i]: !prev[i] }))

  const totalElementos = extraction?.especialidades.reduce(
    (acc, e) => acc + e.elementos.length, 0
  ) ?? 0

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Upload zone */}
      {!extraction && (
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => !file && inputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer
            ${isDragging
              ? 'border-[#00C2FF] bg-[#00C2FF]/5'
              : file
                ? 'border-green-300 bg-green-50 cursor-default'
                : 'border-slate-200 hover:border-[#00C2FF]/50 hover:bg-slate-50'
            }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
          />

          {file ? (
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-[#1A2744]">{file.name}</p>
                <p className="text-sm text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB · PDF listo para analizar</p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); reset() }}
                className="ml-auto p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="w-14 h-14 bg-gradient-to-br from-[#00C2FF]/20 to-[#1A2744]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Upload className="w-7 h-7 text-[#00C2FF]" />
              </div>
              <p className="font-semibold text-[#1A2744] mb-1">Arrastra tu plano PDF aquí</p>
              <p className="text-sm text-slate-400">o haz clic para seleccionar · Máx. 20 MB</p>
            </>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">Error</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Analyze button */}
      {file && !extraction && (
        <button
          onClick={analyze}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-[#1A2744] to-[#243660] text-white py-4 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-[#1A2744]/20"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analizando con Claude AI...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 text-[#00C2FF]" />
              Extraer metrados con Claude AI
            </>
          )}
        </button>
      )}

      {/* Loading state */}
      {loading && (
        <div className="bg-white border border-slate-100 rounded-2xl p-10 text-center">
          <div className="relative w-16 h-16 mx-auto mb-5">
            <div className="absolute inset-0 rounded-full border-4 border-[#00C2FF]/20" />
            <div className="absolute inset-0 rounded-full border-4 border-[#00C2FF] border-t-transparent animate-spin" />
            <Bot className="absolute inset-0 m-auto w-7 h-7 text-[#1A2744]" />
          </div>
          <p className="font-semibold text-[#1A2744] mb-1">Claude está leyendo el plano…</p>
          <p className="text-sm text-slate-400">Extrayendo metrados estructurales, geométricos e hidráulicos</p>
        </div>
      )}

      {/* Results */}
      {extraction && !loading && (
        <div className="space-y-4">

          {/* Header de resultados */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="font-bold text-[#1A2744]">Extracción completada</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${CONFIANZA_CONFIG[extraction.confianza]?.color}`}>
                    Confianza {CONFIANZA_CONFIG[extraction.confianza]?.label}
                  </span>
                </div>
                <p className="text-slate-600 font-medium">{extraction.titulo || file?.name}</p>
                {extraction.notas && (
                  <p className="text-sm text-slate-400 mt-1">{extraction.notas}</p>
                )}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <p className="text-2xl font-bold text-[#1A2744]">{totalElementos}</p>
                  <p className="text-xs text-slate-400">elementos extraídos</p>
                </div>
                <button
                  onClick={reset}
                  className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-slate-500"
                  title="Analizar otro plano"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Especialidades */}
          {extraction.especialidades?.length > 0 ? (
            extraction.especialidades.map((esp, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                <button
                  onClick={() => toggleSection(i)}
                  className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {openSections[i]
                      ? <ChevronDown className="w-4 h-4 text-slate-400" />
                      : <ChevronRight className="w-4 h-4 text-slate-400" />
                    }
                    <span className="font-semibold text-[#1A2744]">{esp.nombre}</span>
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                      {esp.elementos.length} elementos
                    </span>
                  </div>
                </button>

                {openSections[i] && esp.elementos.length > 0 && (
                  <div className="px-5 pb-5">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-100">
                            <th className="text-left py-2 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Elemento / Concepto</th>
                            <th className="text-right py-2 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wide w-28">Cantidad</th>
                            <th className="text-left py-2 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wide w-20">Unidad</th>
                            <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Descripción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {esp.elementos.map((el, j) => (
                            <tr key={j} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                              <td className="py-2.5 pr-4 font-medium text-[#1A2744]">{el.tipo}</td>
                              <td className="py-2.5 pr-4 text-right font-mono text-slate-700">
                                {el.cantidad !== null && el.cantidad !== undefined
                                  ? el.cantidad.toLocaleString('es-MX')
                                  : <span className="text-slate-300">—</span>
                                }
                              </td>
                              <td className="py-2.5 pr-4 text-slate-500">{el.unidad || '—'}</td>
                              <td className="py-2.5 text-slate-400 text-xs">{el.descripcion || ''}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white border border-slate-100 rounded-2xl p-10 text-center">
              <p className="text-slate-400 text-sm">No se encontraron metrados en el documento.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
