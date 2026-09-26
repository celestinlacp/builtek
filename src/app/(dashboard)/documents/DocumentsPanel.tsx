'use client'

import React, { useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Project } from '@/types'
import { saveDocument, updateDocumentStatus, requestDeleteDocument, approveDeleteRequest, rejectDeleteRequest, deleteDocument, submitForReview, approveDocument, rejectDocument, replaceDocument, updateProjectCover, createSubproject, updateProjectClassification } from './actions'
import {
  Upload, Download, Trash2, ChevronDown, ChevronRight, ArrowLeft, Package,
  FolderOpen, CheckCircle2, Clock, XCircle, Eye, AlertTriangle, ShieldCheck, ShieldX, X, Loader2, History, GitBranch, SlidersHorizontal, Info, RefreshCw, Camera, Plus, Layers, Pencil, Milestone,
} from 'lucide-react'
import { parseDocKey } from './utils'
import DocumentSlideOver from './DocumentSlideOver'

type Specialty = { id: string; name: string; code: string; category: string }

const STATUS_CONFIG = {
  draft:    { label: 'Borrador',    color: 'bg-slate-100 text-slate-500',  icon: Clock },
  review:   { label: 'En revisión', color: 'bg-amber-100 text-amber-700',  icon: Eye },
  approved: { label: 'Aprobado',    color: 'bg-green-100 text-green-700',  icon: CheckCircle2 },
  rejected: { label: 'Rechazado',   color: 'bg-red-100 text-red-600',      icon: XCircle },
}

const FILE_ICONS: Record<string, string> = {
  pdf: '📄', dwg: '📐', dxf: '📐', xlsx: '📊', xls: '📊',
  docx: '📝', doc: '📝', img: '🖼️', other: '📁',
}

type DeleteRequest = {
  id: string
  document_id: string
  reason: string | null
  requested_by: string
  created_at: string
  document?: { id: string; name: string; file_name: string | null; display_name: string | null } | null
}

type Doc = {
  id: string
  name: string
  file_name: string | null
  display_name: string | null
  project_id: string | null
  storage_key: string | null
  file_type: string | null
  file_size: number | null
  status: string
  doc_status: string
  version: number
  version_number: number | null
  doc_key: string | null
  specialty_id: string | null
  is_current: boolean
  emission_date: string | null
  author: string | null
  notes: string | null
  created_at: string
  approved_by: string | null
  approved_at: string | null
  review_requested_by: string | null
  review_requested_at: string | null
  rejection_note: string | null
  project?: { name: string } | null
  specialty?: { name: string; code: string; category: string } | null
}

function formatSize(bytes: number | null) {
  if (!bytes) return '—'
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Convierte metros totales → formato 208+800
function formatChainage(meters: number): string {
  const km = Math.floor(meters / 1000)
  const m  = meters % 1000
  return `${km}+${String(m).padStart(3, '0')}`
}

// Convierte km + metros → entero total (ej: 208, 800 → 208800)
function parseChainage(km: string, m: string): number | null {
  const kmN = parseInt(km)
  if (isNaN(kmN) || km.trim() === '') return null
  const mN = Math.min(parseInt(m) || 0, 999)
  return kmN * 1000 + mN
}

// ── Workflow AEC: ELAB → REV → APR ───────────────────────────────────────────

const WORKFLOW_CONFIG = {
  draft:    { label: 'ELAB', color: 'bg-slate-100 text-slate-600',   title: 'Elaboración' },
  review:   { label: 'REV',  color: 'bg-amber-100 text-amber-700',   title: 'En Revisión' },
  approved: { label: 'APR',  color: 'bg-green-100 text-green-700',   title: 'Aprobado'    },
  rejected: { label: 'OBS',  color: 'bg-red-100   text-red-600',     title: 'Observado'   },
}

function WorkflowBadge({ doc, userRole }: { doc: Doc; userRole: string }) {
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)
  const cfg     = WORKFLOW_CONFIG[doc.status as keyof typeof WORKFLOW_CONFIG] ?? WORKFLOW_CONFIG.draft
  const isAdmin = ['owner', 'admin', 'manager'].includes(userRole)

  // Transiciones disponibles según rol y estado
  const transitions: { label: string; action: () => Promise<void>; color: string }[] = []

  if (doc.status === 'draft') {
    transitions.push({
      label: 'Enviar a REV →',
      color: 'text-amber-700 hover:bg-amber-50',
      action: async () => { await submitForReview(doc.id) },
    })
  }
  if (doc.status === 'review' && isAdmin) {
    transitions.push({
      label: '✓ Aprobar (APR)',
      color: 'text-green-700 hover:bg-green-50',
      action: async () => { await approveDocument(doc.id) },
    })
    transitions.push({
      label: '✗ Observar (OBS)',
      color: 'text-red-600 hover:bg-red-50',
      action: async () => {
        const note = window.prompt('Motivo de la observación (opcional):') ?? ''
        await rejectDocument(doc.id, note)
      },
    })
  }
  if (doc.status === 'rejected') {
    transitions.push({
      label: '↺ Reactivar (ELAB)',
      color: 'text-slate-600 hover:bg-slate-50',
      action: async () => { await updateDocumentStatus(doc.id, 'draft') },
    })
  }
  if (doc.status === 'approved' && ['owner', 'admin'].includes(userRole)) {
    transitions.push({
      label: '↺ Revertir a ELAB',
      color: 'text-slate-500 hover:bg-slate-50',
      action: async () => { await updateDocumentStatus(doc.id, 'draft') },
    })
  }

  async function run(action: () => Promise<void>) {
    setLoading(true); setOpen(false)
    await action()
    setLoading(false)
  }

  return (
    <div className="relative">
      <button onClick={() => transitions.length > 0 && setOpen(v => !v)} disabled={loading}
        title={cfg.title}
        className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 ${cfg.color} ${transitions.length > 0 ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'}`}>
        {loading ? '...' : cfg.label}
        {transitions.length > 0 && <ChevronDown className="w-3 h-3" />}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-7 left-0 z-20 bg-white rounded-lg shadow-lg border border-slate-100 py-1 w-44">
            {transitions.map(t => (
              <button key={t.label} onClick={() => run(t.action)}
                className={`w-full text-left px-3 py-2 text-xs font-medium ${t.color}`}>
                {t.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function UploadModal({
  projects, specialties, workspaceId, defaultProjectId, existingDocs, onClose
}: {
  projects: Project[]
  specialties: Specialty[]
  workspaceId: string
  defaultProjectId?: string
  existingDocs: Doc[]
  onClose: () => void
}) {
  const [projectId,      setProjectId]      = useState(defaultProjectId || '')
  const [specialtyId,    setSpecialtyId]    = useState('')
  const [displayName,    setDisplayName]    = useState('')
  const [emissionDate,   setEmissionDate]   = useState('')
  const [author,         setAuthor]         = useState('')
  const [notes,          setNotes]          = useState('')
  const [file,           setFile]           = useState<File | null>(null)
  const [uploading,      setUploading]      = useState(false)
  const [error,          setError]          = useState<string | null>(null)
  const [step,           setStep]           = useState('')
  const [uploadPct,      setUploadPct]      = useState(0)
  const [versionWarning, setVersionWarning] = useState<{ prevVersion: number; newVersion: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(f: File | null) {
    setFile(f)
    setVersionWarning(null)
    if (!f) return
    const parsed = parseDocKey(f.name)
    if (parsed) {
      const existing = existingDocs.find(d => d.doc_key === parsed.doc_key && d.is_current)
      if (existing && existing.version_number !== null && existing.version_number !== parsed.version_number) {
        setVersionWarning({ prevVersion: existing.version_number, newVersion: parsed.version_number })
      }
    }
  }

  const selectedSpecialty = specialties.find(s => s.id === specialtyId)

  const byCategory = specialties.reduce<Record<string, Specialty[]>>((acc, s) => {
    if (!acc[s.category]) acc[s.category] = []
    acc[s.category].push(s)
    return acc
  }, {})

  const categoryLabels: Record<string, string> = {
    tecnico: 'Técnicas', administrativo: 'Administrativas', seguridad: 'Seguridad', otro: 'Otro'
  }

  async function handleUpload() {
    if (!file || !projectId) { setError('Selecciona proyecto y archivo'); return }
    if (!author.trim()) { setError('El campo Autor es requerido'); return }
    setUploading(true); setError(null); setUploadPct(0)

    setStep('Preparando subida...')
    const presignRes = await fetch('/api/documents/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceId, projectId,
        specialtyCode: selectedSpecialty?.code || 'GEN',
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
        fileSize: file.size,
      }),
    })
    const presignData = await presignRes.json()
    if (!presignRes.ok) {
      setError(presignData.error || 'Error al preparar subida')
      setUploading(false); setStep(''); return
    }

    setStep('Subiendo archivo...')
    const uploadOk = await new Promise<boolean>((resolve) => {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', presignData.uploadUrl)
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setUploadPct(Math.round((e.loaded / e.total) * 100))
      }
      xhr.onload  = () => resolve(xhr.status >= 200 && xhr.status < 300)
      xhr.onerror = () => resolve(false)
      xhr.send(file)
    })

    if (!uploadOk) {
      setError('Error al subir el archivo a R2')
      setUploading(false); setStep(''); return
    }

    setStep('Guardando metadatos...')
    setUploadPct(100)
    const result = await saveDocument({
      project_id:    projectId,
      workspace_id:  workspaceId,
      specialty_id:  specialtyId || null,
      file_name:     file.name,
      display_name:  displayName.trim() || null,
      emission_date: emissionDate || null,
      author:        author.trim(),
      notes:         notes.trim() || null,
      storage_key:   presignData.storageKey,
      file_type:     presignData.fileType,
      file_size:     file.size,
    })

    if (result?.error) { setError(result.error); setUploading(false); setStep(''); return }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="text-base font-bold text-[#1A2744]">Subir documento</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Proyecto <span className="text-red-400">*</span>
            </label>
            <select value={projectId} onChange={e => setProjectId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50">
              <option value="">Seleccionar proyecto...</option>
              {projects.filter(p => !p.parent_project_id).map(p => {
                const subs = projects.filter(s => s.parent_project_id === p.id)
                return (
                  <React.Fragment key={p.id}>
                    <option value={p.id}>{p.name}</option>
                    {subs.map(s => (
                      <option key={s.id} value={s.id}>{'  ↳ '}{s.name}</option>
                    ))}
                  </React.Fragment>
                )
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Disciplina / Especialidad
            </label>
            <select value={specialtyId} onChange={e => setSpecialtyId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50">
              <option value="">Sin disciplina</option>
              {Object.entries(byCategory).map(([cat, items]) => (
                <optgroup key={cat} label={categoryLabels[cat] || cat}>
                  {items.map(s => (
                    <option key={s.id} value={s.id}>[{s.code}] {s.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Archivo <span className="text-red-400">*</span>
            </label>
            <input ref={inputRef} type="file" className="hidden"
              accept=".pdf,.dwg,.dxf,.xlsx,.xls,.docx,.doc,.png,.jpg,.jpeg,.zip"
              onChange={e => handleFileChange(e.target.files?.[0] || null)} />
            <button onClick={() => inputRef.current?.click()}
              className={`w-full border-2 border-dashed rounded-lg py-6 text-center transition-colors ${
                file ? 'border-[#00C2FF] bg-[#00C2FF]/5' : 'border-slate-200 hover:border-slate-300'
              }`}>
              <Upload className={`w-6 h-6 mx-auto mb-2 ${file ? 'text-[#00C2FF]' : 'text-slate-300'}`} />
              <p className="text-sm font-medium text-slate-600">
                {file ? file.name : 'Clic para seleccionar archivo'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {file ? formatSize(file.size) : 'PDF, DWG, DXF, Excel, Word, imágenes'}
              </p>
            </button>
          </div>

          {versionWarning && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-3">
              <GitBranch className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Nueva versión detectada</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  La versión <span className="font-mono font-bold">{String(versionWarning.prevVersion).padStart(4, '0')}</span> ya existe.
                  Este archivo se guardará como versión <span className="font-mono font-bold">{String(versionWarning.newVersion).padStart(4, '0')}</span> y la anterior quedará archivada automáticamente.
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Autor <span className="text-red-400">*</span>
            </label>
            <input type="text" value={author} onChange={e => setAuthor(e.target.value)}
              placeholder="Nombre del autor del documento"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Fecha de versión <span className="text-red-400">*</span>
            </label>
            <input type="date" value={emissionDate} onChange={e => setEmissionDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50" />
            <p className="text-xs text-slate-400 mt-1">Fecha de emisión o versión del documento original</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Nombre descriptivo <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
              placeholder={file?.name || 'Ej: Plano de cimentación Frente 3'}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Nota <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="Observaciones, contexto o instrucciones sobre este documento..."
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50 resize-none" />
          </div>

          {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">{error}</div>}

          {uploading && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-700 font-medium">{step}</span>
                <span className="text-blue-500 font-bold tabular-nums">{uploadPct}%</span>
              </div>
              <div className="w-full bg-blue-100 rounded-full h-2 overflow-hidden">
                <div className="bg-[#00C2FF] h-2 rounded-full transition-all duration-200" style={{ width: `${uploadPct}%` }} />
              </div>
              <p className="text-xs text-blue-500">
                {uploadPct < 100 ? 'No cierres esta ventana mientras se sube el archivo.' : 'Finalizando...'}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Cancelar
            </button>
            <button onClick={handleUpload} disabled={uploading || !file || !projectId || !author.trim() || !emissionDate}
              className="flex-1 py-2.5 rounded-lg bg-[#1A2744] text-white text-sm font-bold hover:bg-[#243660] disabled:opacity-60">
              {uploading ? 'Subiendo...' : 'Subir a R2'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ReplaceDocModal({
  doc, workspaceId, onClose,
}: {
  doc: Doc
  workspaceId: string
  onClose: () => void
}) {
  const [file,         setFile]         = useState<File | null>(null)
  const [author,       setAuthor]       = useState(doc.author || '')
  const [emissionDate, setEmissionDate] = useState('')
  const [displayName,  setDisplayName]  = useState(doc.display_name || '')
  const [notes,        setNotes]        = useState('')
  const [uploading,    setUploading]    = useState(false)
  const [step,         setStep]         = useState('')
  const [uploadPct,    setUploadPct]    = useState(0)
  const [error,        setError]        = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const docName = doc.display_name || doc.file_name || doc.name

  async function handleReplace() {
    if (!file) { setError('Selecciona un archivo'); return }
    if (!author.trim()) { setError('El campo Autor es requerido'); return }
    if (!emissionDate) { setError('Selecciona la fecha de versión'); return }
    setUploading(true); setError(null); setUploadPct(0)

    setStep('Preparando subida...')
    const presignRes = await fetch('/api/documents/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceId,
        projectId: doc.project_id,
        specialtyCode: doc.specialty?.code || 'GEN',
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
        fileSize: file.size,
      }),
    })
    const presignData = await presignRes.json()
    if (!presignRes.ok) {
      setError(presignData.error || 'Error al preparar subida')
      setUploading(false); setStep(''); return
    }

    setStep('Subiendo archivo...')
    const uploadOk = await new Promise<boolean>((resolve) => {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', presignData.uploadUrl)
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setUploadPct(Math.round((e.loaded / e.total) * 100))
      }
      xhr.onload  = () => resolve(xhr.status >= 200 && xhr.status < 300)
      xhr.onerror = () => resolve(false)
      xhr.send(file)
    })

    if (!uploadOk) {
      setError('Error al subir el archivo a R2')
      setUploading(false); setStep(''); return
    }

    setStep('Registrando reemplazo...')
    setUploadPct(100)
    const result = await replaceDocument({
      old_doc_id:    doc.id,
      workspace_id:  workspaceId,
      project_id:    doc.project_id!,
      specialty_id:  doc.specialty_id ?? null,
      file_name:     file.name,
      display_name:  displayName.trim() || null,
      emission_date: emissionDate,
      author:        author.trim(),
      notes:         notes.trim() || null,
      storage_key:   presignData.storageKey,
      file_type:     presignData.fileType,
      file_size:     file.size,
    })

    if (result?.error) { setError(result.error); setUploading(false); setStep(''); return }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-bold text-[#1A2744] flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-[#00C2FF]" />
              Reemplazar documento
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[300px]">{docName}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-800">
            La versión actual quedará archivada y podrá consultarse en el historial de versiones.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Nuevo archivo <span className="text-red-400">*</span>
            </label>
            <input ref={inputRef} type="file" className="hidden"
              accept=".pdf,.dwg,.dxf,.xlsx,.xls,.docx,.doc,.png,.jpg,.jpeg,.zip"
              onChange={e => setFile(e.target.files?.[0] || null)} />
            <button onClick={() => inputRef.current?.click()}
              className={`w-full border-2 border-dashed rounded-lg py-5 text-center transition-colors ${
                file ? 'border-[#00C2FF] bg-[#00C2FF]/5' : 'border-slate-200 hover:border-slate-300'
              }`}>
              <Upload className={`w-5 h-5 mx-auto mb-1.5 ${file ? 'text-[#00C2FF]' : 'text-slate-300'}`} />
              <p className="text-sm font-medium text-slate-600">
                {file ? file.name : 'Clic para seleccionar archivo'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {file ? formatSize(file.size) : 'PDF, DWG, DXF, Excel, Word, imágenes'}
              </p>
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Autor <span className="text-red-400">*</span>
            </label>
            <input type="text" value={author} onChange={e => setAuthor(e.target.value)}
              placeholder="Nombre del autor"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Fecha de versión <span className="text-red-400">*</span>
            </label>
            <input type="date" value={emissionDate} onChange={e => setEmissionDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Nombre descriptivo <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
              placeholder={file?.name || docName}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Nota <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="Cambios o motivo del reemplazo..."
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50 resize-none" />
          </div>

          {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">{error}</div>}

          {uploading && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-700 font-medium">{step}</span>
                <span className="text-blue-500 font-bold tabular-nums">{uploadPct}%</span>
              </div>
              <div className="w-full bg-blue-100 rounded-full h-2 overflow-hidden">
                <div className="bg-[#00C2FF] h-2 rounded-full transition-all duration-200" style={{ width: `${uploadPct}%` }} />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Cancelar
            </button>
            <button onClick={handleReplace} disabled={uploading || !file || !author.trim() || !emissionDate}
              className="flex-1 py-2.5 rounded-lg bg-[#1A2744] text-white text-sm font-bold hover:bg-[#243660] disabled:opacity-60 flex items-center justify-center gap-2">
              <RefreshCw className="w-3.5 h-3.5" />
              {uploading ? 'Subiendo...' : 'Reemplazar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function PdfViewerModal({ docId, docName, onClose }: { docId: string; docName: string; onClose: () => void }) {
  const [loading, setLoading] = useState(true)

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90">
      <div className="flex items-center justify-between px-4 py-3 bg-[#1A2744] flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-lg">📄</span>
          <span className="text-white text-sm font-semibold truncate">{docName}</span>
          <span className="text-xs text-slate-400 uppercase font-medium flex-shrink-0">PDF</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <a href={`/api/documents/download/${docId}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs font-medium hover:bg-white/20 transition-colors">
            <Download className="w-3.5 h-3.5" />
            Descargar
          </a>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-[#00C2FF] animate-spin" />
              <p className="text-slate-400 text-sm">Cargando documento...</p>
            </div>
          </div>
        )}
        <iframe src={`/api/documents/view/${docId}`} className="w-full h-full border-0"
          onLoad={() => setLoading(false)} title={docName} />
      </div>
    </div>
  )
}

function DeleteRequestsPanel({ requests }: { requests: DeleteRequest[] }) {
  const [loading, setLoading]       = useState<string | null>(null)
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({})
  const [rejectOpen, setRejectOpen]  = useState<string | null>(null)

  async function handleApprove(req: DeleteRequest) {
    if (!confirm(`¿Aprobar eliminación de "${req.document?.display_name || req.document?.file_name || req.document?.name}"? Esta acción no se puede deshacer.`)) return
    setLoading(req.id)
    await approveDeleteRequest(req.id, req.document_id)
    setLoading(null)
  }

  async function handleReject(req: DeleteRequest) {
    setLoading(req.id)
    await rejectDeleteRequest(req.id, req.document_id, rejectNotes[req.id] || '')
    setLoading(null)
    setRejectOpen(null)
  }

  if (requests.length === 0) return null

  return (
    <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-amber-200">
        <AlertTriangle className="w-4 h-4 text-amber-600" />
        <span className="text-sm font-bold text-amber-800">
          Solicitudes de borrado pendientes ({requests.length})
        </span>
      </div>
      <div className="divide-y divide-amber-100">
        {requests.map(req => {
          const docName = req.document?.display_name || req.document?.file_name || req.document?.name || req.document_id
          const isLoading = loading === req.id
          const showRejectInput = rejectOpen === req.id
          return (
            <div key={req.id} className="px-4 py-3 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-700 truncate">{docName}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {new Date(req.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                  {req.reason && <> · <span className="italic">"{req.reason}"</span></>}
                </p>
                {showRejectInput && (
                  <div className="mt-2 flex gap-2">
                    <input type="text" placeholder="Motivo del rechazo (opcional)"
                      value={rejectNotes[req.id] || ''}
                      onChange={e => setRejectNotes(prev => ({ ...prev, [req.id]: e.target.value }))}
                      className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-300" />
                    <button onClick={() => handleReject(req)} disabled={isLoading}
                      className="text-xs px-3 py-1.5 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 disabled:opacity-60">
                      {isLoading ? '...' : 'Confirmar'}
                    </button>
                    <button onClick={() => setRejectOpen(null)}
                      className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100">
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
              {!showRejectInput && (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => handleApprove(req)} disabled={isLoading} title="Aprobar eliminación"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-xs font-semibold hover:bg-red-200 disabled:opacity-60">
                    <ShieldX className="w-3.5 h-3.5" />
                    Aprobar borrado
                  </button>
                  <button onClick={() => setRejectOpen(req.id)} disabled={isLoading} title="Rechazar solicitud"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-100 text-green-700 text-xs font-semibold hover:bg-green-200 disabled:opacity-60">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Rechazar
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Popover de trazabilidad ────────────────────────────────────────────────────

function DocInfoPopover({ doc }: { doc: Doc }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)}
        title="Ver información del documento"
        className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
          open ? 'bg-[#00C2FF]/10 text-[#00C2FF]' : 'hover:bg-slate-100 text-slate-400 hover:text-[#00C2FF]'
        }`}>
        <Info className="w-3.5 h-3.5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-30 bg-white border border-slate-200 rounded-xl shadow-xl p-4 w-72 space-y-2.5 text-xs">
            <p className="font-bold text-[#1A2744] text-sm mb-1">Trazabilidad del documento</p>

            <div className="space-y-2 divide-y divide-slate-100">
              <div className="space-y-1.5 pb-2">
                <Row label="Autor" value={doc.author || '—'} />
                <Row label="Versión" value={`v${doc.version}`} />
                <Row label="Fecha de versión"
                  value={doc.emission_date
                    ? new Date(doc.emission_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
                    : '—'} />
                <Row label="Subido el"
                  value={new Date(doc.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })} />
              </div>

              <div className="space-y-1.5 pt-2 pb-2">
                <Row label="Tipo" value={doc.file_type?.toUpperCase() || '—'} />
                <Row label="Tamaño" value={formatSize(doc.file_size)} />
                <Row label="Disciplina"
                  value={doc.specialty ? `[${doc.specialty.code}] ${doc.specialty.name}` : '—'} />
              </div>

              {doc.notes && (
                <div className="pt-2">
                  <p className="text-slate-400 mb-1">Nota</p>
                  <p className="text-slate-600 italic leading-relaxed">{doc.notes}</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-slate-400 flex-shrink-0">{label}</span>
      <span className="font-medium text-slate-700 text-right">{value}</span>
    </div>
  )
}

// ── Vista raíz: selector de proyectos ─────────────────────────────────────────

// ── Quick Edit Project Modal ──────────────────────────────────────────────────

function QuickEditProjectModal({ project, onClose }: {
  project: Project
  onClose: () => void
}) {
  const [name,         setName]         = useState(project.name)
  const [frente,       setFrente]       = useState(project.frente || '')
  const [projectType,  setProjectType]  = useState(project.project_type || '')
  const [startKm,      setStartKm]      = useState(project.chainage_start != null ? String(Math.floor(project.chainage_start / 1000)) : '')
  const [startM,       setStartM]       = useState(project.chainage_start != null ? String(project.chainage_start % 1000) : '')
  const [endKm,        setEndKm]        = useState(project.chainage_end   != null ? String(Math.floor(project.chainage_end   / 1000)) : '')
  const [endM,         setEndM]         = useState(project.chainage_end   != null ? String(project.chainage_end   % 1000) : '')
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState<string | null>(null)

  async function handleSave() {
    if (!name.trim()) { setError('El nombre es requerido'); return }
    const chStart = parseChainage(startKm, startM)
    const chEnd   = parseChainage(endKm,   endM)
    if (chStart !== null && chEnd !== null && chEnd < chStart) {
      setError('El cadenamiento final debe ser mayor al inicial')
      return
    }
    setSaving(true)
    const result = await updateProjectClassification(project.id, {
      name:           name.trim(),
      frente:         frente.trim() || null,
      project_type:   projectType.trim() || null,
      chainage_start: chStart,
      chainage_end:   chEnd,
    })
    setSaving(false)
    if (result?.error) { setError(result.error); return }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-[#1A2744]">Editar proyecto</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Nombre *</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50" />
          </div>

          {/* Frente */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Frente</label>
            <input value={frente} onChange={e => setFrente(e.target.value)}
              placeholder="Ej: Frente 12"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50" />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Tipo de proyecto</label>
            <input value={projectType} onChange={e => setProjectType(e.target.value)}
              placeholder="Ej: Estructura, Terraplén, Drenaje..."
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50" />
          </div>

          {/* Cadenamiento */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
              <Milestone className="w-3.5 h-3.5 text-[#00C2FF]" />
              Cadenamiento del proyecto
            </label>
            <div className="space-y-2">
              {/* Inicio */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 w-12 flex-shrink-0">Inicio</span>
                <div className="flex items-center gap-1 flex-1">
                  <input
                    type="number" min="0" value={startKm} onChange={e => setStartKm(e.target.value)}
                    placeholder="KM"
                    className="w-20 px-2.5 py-2 rounded-lg border border-slate-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50" />
                  <span className="text-slate-400 font-bold">+</span>
                  <input
                    type="number" min="0" max="999" value={startM} onChange={e => setStartM(e.target.value)}
                    placeholder="000"
                    className="w-20 px-2.5 py-2 rounded-lg border border-slate-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50" />
                  {startKm && <span className="text-xs text-slate-400 font-mono">{startKm}+{String(parseInt(startM)||0).padStart(3,'0')}</span>}
                </div>
              </div>
              {/* Fin */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 w-12 flex-shrink-0">Fin</span>
                <div className="flex items-center gap-1 flex-1">
                  <input
                    type="number" min="0" value={endKm} onChange={e => setEndKm(e.target.value)}
                    placeholder="KM"
                    className="w-20 px-2.5 py-2 rounded-lg border border-slate-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50" />
                  <span className="text-slate-400 font-bold">+</span>
                  <input
                    type="number" min="0" max="999" value={endM} onChange={e => setEndM(e.target.value)}
                    placeholder="000"
                    className="w-20 px-2.5 py-2 rounded-lg border border-slate-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50" />
                  {endKm && <span className="text-xs text-slate-400 font-mono">{endKm}+{String(parseInt(endM)||0).padStart(3,'0')}</span>}
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-1.5">Formato KM+metro · Ej: KM 208, metro 800 → 208+800</p>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Cancelar
            </button>
            <button onClick={handleSave} disabled={saving || !name.trim()}
              className="flex-1 py-2.5 rounded-lg bg-[#1A2744] text-white text-sm font-bold hover:bg-[#243660] disabled:opacity-60 flex items-center justify-center gap-2">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProjectCard({ project, docCount, disciplines, lastUpload, workspaceId, isAdmin, onSelect, onEdit }: {
  project: Project
  docCount: number
  disciplines: number
  lastUpload: string | null
  workspaceId: string
  isAdmin: boolean
  onSelect: (id: string) => void
  onEdit: (project: Project) => void
}) {
  const [coverKey, setCoverKey] = useState<string | null>(project.cover_image_url)
  const hasChainage = project.chainage_start != null || project.chainage_end != null

  return (
    <div className="bg-white border border-slate-100 rounded-xl overflow-hidden hover:shadow-md hover:border-[#00C2FF]/30 transition-all group">
      {/* Cover image area */}
      <div
        onClick={() => onSelect(project.id)}
        className="relative h-36 bg-[#1A2744]/5 flex items-center justify-center overflow-hidden cursor-pointer">
        {coverKey ? (
          <img src={`/api/projects/${project.id}/cover`} alt={project.name} className="w-full h-full object-cover" />
        ) : (
          <FolderOpen className="w-10 h-10 text-[#1A2744]/20" />
        )}
        {isAdmin && (
          <ProjectCoverUploader project={project} workspaceId={workspaceId} onUploaded={key => setCoverKey(key)} />
        )}
        {/* Botón editar — top-left */}
        {isAdmin && (
          <button
            onClick={e => { e.stopPropagation(); onEdit(project) }}
            title="Editar proyecto"
            className="absolute top-2 left-2 w-7 h-7 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10 opacity-0 group-hover:opacity-100">
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Card body */}
      <div onClick={() => onSelect(project.id)} className="p-4 cursor-pointer">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-[#1A2744] text-sm leading-tight">{project.name}</h3>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#00C2FF] transition-colors flex-shrink-0 mt-0.5" />
        </div>
        {(project.frente || project.project_type) && (
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {project.frente && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#00C2FF]/10 text-[#0099CC]">
                {project.frente}
              </span>
            )}
            {project.project_type && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                {project.project_type}
              </span>
            )}
          </div>
        )}

        {/* Cadenamiento */}
        {hasChainage && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <Milestone className="w-3 h-3 text-[#00C2FF] flex-shrink-0" />
            <span className="text-[10px] font-mono text-slate-500">
              {project.chainage_start != null ? formatChainage(project.chainage_start) : '—'}
              {' — '}
              {project.chainage_end != null ? formatChainage(project.chainage_end) : '—'}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
          <span>{docCount} documento{docCount !== 1 ? 's' : ''}</span>
          {disciplines > 0 && (
            <><span>·</span><span>{disciplines} disciplina{disciplines !== 1 ? 's' : ''}</span></>
          )}
        </div>
        {lastUpload && (
          <p className="text-xs text-slate-300 mt-1">
            Última subida:{' '}
            {new Date(lastUpload).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        )}
      </div>
    </div>
  )
}

function ProjectCoverUploader({ project, workspaceId, onUploaded }: {
  project: Project
  workspaceId: string
  onUploaded: (key: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      // Borrar portada anterior de R2 si existe
      if (project.cover_image_url) {
        await fetch(`/api/projects/${project.id}/cover`, { method: 'DELETE' })
      }
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      const res = await fetch('/api/projects/presign-cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, workspaceId, contentType: file.type, extension: ext }),
      })
      const { uploadUrl, storageKey } = await res.json()
      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
      await updateProjectCover(project.id, storageKey)
      onUploaded(storageKey)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} onClick={e => e.stopPropagation()} />
      <button
        onClick={e => { e.stopPropagation(); inputRef.current?.click() }}
        disabled={uploading}
        title="Subir foto de portada"
        className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors disabled:opacity-60 z-10">
        {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
      </button>
    </>
  )
}

function ProjectsView({
  projects, documents, onSelect, userRole, workspaceId,
}: {
  projects: Project[]
  documents: Doc[]
  onSelect: (projectId: string) => void
  userRole: string
  workspaceId: string
}) {
  const [filterFrente, setFilterFrente] = useState('all')
  const [filterType,   setFilterType]   = useState('all')
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const isAdmin = userRole === 'owner' || userRole === 'admin'

  // Solo proyectos raíz (sin padre)
  const rootProjects = projects.filter(p => !p.parent_project_id)

  const frentes      = [...new Set(rootProjects.map(p => p.frente).filter(Boolean))] as string[]
  const projectTypes = [...new Set(rootProjects.map(p => p.project_type).filter(Boolean))] as string[]

  const filtered = rootProjects.filter(p => {
    if (filterFrente !== 'all' && p.frente !== filterFrente) return false
    if (filterType   !== 'all' && p.project_type !== filterType) return false
    return true
  })

  if (rootProjects.length === 0) {
    return (
      <div className="bg-white border border-slate-100 rounded-xl p-16 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FolderOpen className="w-8 h-8 text-slate-300" />
        </div>
        <h2 className="text-lg font-bold text-[#1A2744] mb-2">Sin proyectos activos</h2>
        <p className="text-slate-400 text-sm max-w-xs mx-auto">
          Crea un proyecto en Admin para comenzar a subir documentos.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Filtros — solo se muestran si hay valores distintos */}
      {(frentes.length > 0 || projectTypes.length > 0) && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {frentes.length > 0 && (
            <select value={filterFrente} onChange={e => setFilterFrente(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40">
              <option value="all">Todos los frentes</option>
              {frentes.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          )}
          {projectTypes.length > 0 && (
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40">
              <option value="all">Todos los tipos</option>
              {projectTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
          {(filterFrente !== 'all' || filterType !== 'all') && (
            <button onClick={() => { setFilterFrente('all'); setFilterType('all') }}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 flex items-center gap-1">
              <X className="w-3 h-3" />
              Limpiar
            </button>
          )}
          <span className="text-xs text-slate-400 ml-1">
            {filtered.length} proyecto{filtered.length !== 1 ? 's' : ''} raíz
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(project => {
          const projectDocs = documents.filter(d =>
            d.project_id === project.id &&
            d.is_current !== false &&
            d.doc_status !== 'archived' &&
            d.doc_status !== 'deleted'
          )
          const disciplines = new Set(projectDocs.filter(d => d.specialty?.code).map(d => d.specialty!.code)).size
          const lastUpload = projectDocs.length > 0
            ? projectDocs.reduce((latest, d) => d.created_at > latest ? d.created_at : latest, projectDocs[0].created_at)
            : null

          return (
            <ProjectCard
              key={project.id}
              project={project}
              docCount={projectDocs.length}
              disciplines={disciplines}
              lastUpload={lastUpload}
              workspaceId={workspaceId}
              isAdmin={isAdmin}
              onSelect={onSelect}
              onEdit={setEditingProject}
            />
          )
        })}
      </div>

      {editingProject && (
        <QuickEditProjectModal
          project={editingProject}
          onClose={() => setEditingProject(null)}
        />
      )}
    </div>
  )
}

// ── Vista detalle: documentos de un proyecto agrupados por disciplina ──────────

function ProjectDetailView({
  project, documents, specialties, workspaceId, userRole, deleteRequests, currentUserId,
  subprojects, parentProject, onBack, onUpload, onSelectSub,
}: {
  project: Project
  documents: Doc[]
  specialties: Specialty[]
  workspaceId: string
  userRole: string
  deleteRequests: DeleteRequest[]
  currentUserId: string
  subprojects: Project[]
  parentProject: Project | null
  onBack: () => void
  onUpload: () => void
  onSelectSub: (id: string) => void
}) {
  const [selected,         setSelected]         = useState<Set<string>>(new Set())
  const [filterStatus,     setFilterStatus]     = useState('all')
  const [filterSpecialty,  setFilterSpecialty]  = useState('all')
  const [viewingDoc,       setViewingDoc]       = useState<{ id: string; name: string } | null>(null)
  const [slideDoc,         setSlideDoc]         = useState<Doc | null>(null)
  const [replaceDoc,       setReplaceDoc]       = useState<Doc | null>(null)
  const [downloading,      setDownloading]      = useState(false)
  const [expandedHistory,  setExpandedHistory]  = useState<Set<string>>(new Set())
  const [showCreateSub,    setShowCreateSub]    = useState(false)
  const [newSubName,       setNewSubName]       = useState('')
  const [newSubDesc,       setNewSubDesc]       = useState('')
  const [newSubType,       setNewSubType]       = useState('')
  const [creatingSub,      setCreatingSub]      = useState(false)
  const isAdmin = userRole === 'owner' || userRole === 'admin'

  async function handleCreateSubproject() {
    if (!newSubName.trim()) return
    setCreatingSub(true)
    await createSubproject({
      workspace_id:      workspaceId,
      parent_project_id: project.id,
      name:              newSubName.trim(),
      description:       newSubDesc.trim() || null,
      project_type:      newSubType.trim() || null,
    })
    setCreatingSub(false)
    setShowCreateSub(false)
    setNewSubName('')
    setNewSubDesc('')
    setNewSubType('')
  }

  // Todos los docs del proyecto (para historial de versiones)
  const projectDocs = documents.filter(d => d.project_id === project.id)
  // Solo docs vigentes/activos (para la tabla principal y conteos)
  const currentDocs = projectDocs.filter(d => d.is_current !== false && d.doc_status !== 'archived' && d.doc_status !== 'deleted')

  // Versiones archivadas agrupadas por doc_key
  const archivedByDocKey = projectDocs.reduce<Record<string, Doc[]>>((acc, d) => {
    if (d.doc_key && d.is_current === false) {
      if (!acc[d.doc_key]) acc[d.doc_key] = []
      acc[d.doc_key].push(d)
    }
    return acc
  }, {})

  // Especialidades usadas en este proyecto (solo docs vigentes)
  const usedSpecialties = [...new Map(
    currentDocs.filter(d => d.specialty).map(d => [d.specialty!.code, d.specialty!])
  ).values()].sort((a, b) => a.code.localeCompare(b.code))

  let filtered = currentDocs
  if (filterStatus !== 'all')    filtered = filtered.filter(d => d.status === filterStatus)
  if (filterSpecialty !== 'all') filtered = filtered.filter(d =>
    filterSpecialty === 'none' ? !d.specialty : d.specialty?.code === filterSpecialty
  )

  // Agrupar por disciplina (solo versiones vigentes)
  const grouped: Record<string, Doc[]> = {}
  filtered.filter(d => d.is_current !== false).forEach(doc => {
    const key = doc.specialty
      ? `[${doc.specialty.code}] ${doc.specialty.name}`
      : 'Sin disciplina'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(doc)
  })

  function toggleDoc(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected(selected.size === filtered.length && filtered.length > 0
      ? new Set()
      : new Set(filtered.map(d => d.id))
    )
  }

  async function handleDownloadZip() {
    setDownloading(true)
    try {
      const res = await fetch('/api/documents/download-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docIds: Array.from(selected), projectName: project.name }),
      })
      if (!res.ok) { alert('Error al generar el ZIP'); return }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `${project.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_')}_documentos.zip`
      a.click()
      URL.revokeObjectURL(url)
      setSelected(new Set())
    } finally {
      setDownloading(false)
    }
  }

  async function handleDelete(doc: Doc) {
    const name = doc.display_name || doc.file_name || doc.name
    const pendingReq = deleteRequests.find(r => r.document_id === doc.id)
    if (isAdmin) {
      if (!confirm(`¿Eliminar "${name}" permanentemente?`)) return
      if (pendingReq) await approveDeleteRequest(pendingReq.id, doc.id)
      else await deleteDocument(doc.id)
    } else {
      if (!confirm('¿Solicitar eliminación de este documento? Un administrador deberá aprobarlo.')) return
      await requestDeleteDocument(doc.id)
    }
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-[#1A2744] transition-colors">
          <ArrowLeft className="w-4 h-4" />
          {parentProject ? parentProject.name : 'Proyectos'}
        </button>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-semibold text-[#1A2744]">{project.name}</span>
        {parentProject && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-600 flex items-center gap-1">
            <Layers className="w-2.5 h-2.5" /> Subproyecto
          </span>
        )}
        {project.frente && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#00C2FF]/10 text-[#0099CC]">
            {project.frente}
          </span>
        )}
        {project.project_type && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
            {project.project_type}
          </span>
        )}
        <span className="text-xs text-slate-400 ml-1">
          ({currentDocs.length} documento{currentDocs.length !== 1 ? 's' : ''})
        </span>
      </div>

      {/* ── Sección de Subproyectos (solo si el proyecto es raíz y tiene/puede tener subproyectos) ── */}
      {!parentProject && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-violet-500" />
              <span className="text-sm font-bold text-[#1A2744]">Subproyectos</span>
              {subprojects.length > 0 && (
                <span className="text-xs bg-violet-100 text-violet-600 font-semibold px-2 py-0.5 rounded-full">
                  {subprojects.length}
                </span>
              )}
            </div>
            {isAdmin && (
              <button onClick={() => setShowCreateSub(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-violet-200 text-xs font-semibold text-violet-600 hover:bg-violet-50 transition-colors">
                <Plus className="w-3.5 h-3.5" />
                Nuevo subproyecto
              </button>
            )}
          </div>

          {/* Formulario crear subproyecto */}
          {showCreateSub && (
            <div className="mb-3 bg-violet-50 border border-violet-200 rounded-xl p-4 space-y-3">
              <input value={newSubName} onChange={e => setNewSubName(e.target.value)}
                placeholder="Nombre del subproyecto *"
                onKeyDown={e => { if (e.key === 'Enter') handleCreateSubproject(); if (e.key === 'Escape') setShowCreateSub(false) }}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/50" />
              <div className="grid grid-cols-2 gap-2">
                <input value={newSubDesc} onChange={e => setNewSubDesc(e.target.value)}
                  placeholder="Descripción (opcional)"
                  className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/50" />
                <input value={newSubType} onChange={e => setNewSubType(e.target.value)}
                  placeholder="Tipo (Estructura, Drenaje...)"
                  className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/50" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setShowCreateSub(false); setNewSubName(''); setNewSubDesc(''); setNewSubType('') }}
                  className="flex-1 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                  Cancelar
                </button>
                <button onClick={handleCreateSubproject} disabled={!newSubName.trim() || creatingSub}
                  className="flex-1 py-2 rounded-lg bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 disabled:opacity-60 flex items-center justify-center gap-2">
                  {creatingSub ? <><Loader2 className="w-4 h-4 animate-spin" /> Creando...</> : 'Crear'}
                </button>
              </div>
            </div>
          )}

          {/* Cards de subproyectos */}
          {subprojects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {subprojects.map(sub => {
                const subDocs = documents.filter(d =>
                  d.project_id === sub.id && d.is_current !== false &&
                  d.doc_status !== 'archived' && d.doc_status !== 'deleted'
                )
                return (
                  <button key={sub.id} onClick={() => onSelectSub(sub.id)}
                    className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-xl hover:border-violet-200 hover:shadow-sm transition-all text-left group">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-100 transition-colors">
                      <Layers className="w-5 h-5 text-violet-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1A2744] truncate">{sub.name}</p>
                      {sub.description && (
                        <p className="text-xs text-slate-400 truncate mt-0.5">{sub.description}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-0.5">
                        {subDocs.length} documento{subDocs.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-violet-400 transition-colors flex-shrink-0" />
                  </button>
                )
              })}
            </div>
          ) : (
            !showCreateSub && (
              <div className="bg-white border border-dashed border-slate-200 rounded-xl p-6 text-center">
                <Layers className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Sin subproyectos aún.</p>
                {isAdmin && (
                  <button onClick={() => setShowCreateSub(true)}
                    className="text-xs text-violet-500 hover:text-violet-700 font-medium mt-1">
                    Crear el primero →
                  </button>
                )}
              </div>
            )
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Seleccionar todos */}
          <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:border-slate-300 select-none">
            <input type="checkbox"
              checked={selected.size === filtered.length && filtered.length > 0}
              onChange={toggleAll}
              className="w-3.5 h-3.5 accent-[#1A2744]" />
            Seleccionar todos
          </label>

          {/* Filtro de especialidad */}
          {usedSpecialties.length > 0 && (
            <select value={filterSpecialty} onChange={e => setFilterSpecialty(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40">
              <option value="all">Todas las disciplinas</option>
              {usedSpecialties.map(s => (
                <option key={s.code} value={s.code}>[{s.code}] {s.name}</option>
              ))}
              {currentDocs.some(d => !d.specialty) && (
                <option value="none">Sin disciplina</option>
              )}
            </select>
          )}

          {/* Filtros de estado */}
          {(['all', 'draft', 'review', 'approved'] as const).map(f => (
            <button key={f} onClick={() => setFilterStatus(f)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                filterStatus === f
                  ? 'bg-[#1A2744] text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
              }`}>
              {f === 'all' ? 'Todos' : STATUS_CONFIG[f]?.label}
              {f !== 'all' && (
                <span className="ml-1.5 opacity-70">
                  {currentDocs.filter(d => d.status === f).length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Botón ZIP */}
          {selected.size > 0 && (
            <button onClick={handleDownloadZip} disabled={downloading}
              className="flex items-center gap-2 bg-[#00C2FF] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#00a8d6] disabled:opacity-60 transition-colors">
              <Package className="w-3.5 h-3.5" />
              {downloading ? 'Generando ZIP...' : `Descargar ZIP (${selected.size})`}
            </button>
          )}

          {/* Subir */}
          <button onClick={onUpload}
            className="flex items-center gap-2 bg-[#1A2744] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#243660] transition-colors">
            <Upload className="w-3.5 h-3.5" />
            Subir documento
          </button>
        </div>
      </div>

      {/* Contenido */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-xl p-12 text-center">
          <FolderOpen className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-[#1A2744] mb-1">Sin documentos</p>
          <p className="text-slate-400 text-sm">Sube el primer documento de este proyecto con el botón de arriba.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([group, docs]) => (
            <div key={group}>
              {/* Encabezado de disciplina */}
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{group}</span>
                <span className="text-xs text-slate-300">{docs.length}</span>
              </div>

              <div className="bg-white rounded-xl border border-slate-100">
                {/* Header columnas */}
                <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wide rounded-t-xl">
                  <span className="w-5" />
                  <span className="w-5" />
                  <span className="flex-1">Documento</span>
                  <span className="hidden lg:block w-28">Autor</span>
                  <span className="hidden lg:block w-24">Versión</span>
                  <span className="w-28">Flujo</span>
                  <span className="w-28 text-right">Acciones</span>
                </div>

                {docs.map((doc, idx) => {
                  const fileIcon = FILE_ICONS[doc.file_type || 'other'] || '📁'
                  const isPendingDelete = doc.doc_status === 'pending_delete'
                  const isLast = idx === docs.length - 1
                  const docName = doc.display_name || doc.file_name || doc.name

                  return (
                    <React.Fragment key={doc.id}>
                    <div
                      className={`flex items-center gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50 group ${isPendingDelete ? 'opacity-60' : ''} ${isLast && !(doc.doc_key && expandedHistory.has(doc.doc_key) && archivedByDocKey[doc.doc_key]?.length) ? 'rounded-b-xl border-b-0' : ''}`}>
                      {/* Checkbox */}
                      <input type="checkbox"
                        checked={selected.has(doc.id)}
                        onChange={() => toggleDoc(doc.id)}
                        className="w-3.5 h-3.5 accent-[#1A2744] flex-shrink-0" />

                      {/* Icono */}
                      <span className="text-base w-5 flex-shrink-0">{fileIcon}</span>

                      {/* Nombre */}
                      <div className="flex-1 min-w-0">
                        {doc.file_type === 'pdf' ? (
                          <button
                            onClick={() => setViewingDoc({ id: doc.id, name: docName })}
                            className="text-sm font-medium text-slate-700 truncate block w-full text-left hover:text-[#00C2FF] transition-colors">
                            {docName}
                          </button>
                        ) : (
                          <p className="text-sm font-medium text-slate-700 truncate">{docName}</p>
                        )}
                        <p className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
                          {doc.version_number !== null
                            ? <span className="font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">v{String(doc.version_number).padStart(4, '0')}</span>
                            : <span>v{doc.version}</span>
                          }
                          <span>·</span>
                          <span>{doc.file_type?.toUpperCase() || '—'}</span>
                          <span>·</span>
                          <span>{formatSize(doc.file_size)}</span>
                          {isPendingDelete && <span className="text-amber-500 font-medium">· Borrado pendiente</span>}
                          {doc.doc_key && archivedByDocKey[doc.doc_key]?.length > 0 && (
                            <button
                              onClick={() => setExpandedHistory(prev => {
                                const next = new Set(prev)
                                next.has(doc.doc_key!) ? next.delete(doc.doc_key!) : next.add(doc.doc_key!)
                                return next
                              })}
                              className="flex items-center gap-1 text-slate-400 hover:text-[#00C2FF] transition-colors ml-1">
                              <History className="w-3 h-3" />
                              {expandedHistory.has(doc.doc_key)
                                ? 'Ocultar historial'
                                : `${archivedByDocKey[doc.doc_key].length} versión${archivedByDocKey[doc.doc_key].length !== 1 ? 'es' : ''} anterior${archivedByDocKey[doc.doc_key].length !== 1 ? 'es' : ''}`
                              }
                            </button>
                          )}
                        </p>
                      </div>

                      {/* Autor */}
                      <span className="hidden lg:block text-xs text-slate-500 w-28 truncate">
                        {doc.author || '—'}
                      </span>

                      {/* Fecha de versión */}
                      <span className="hidden lg:block text-xs text-slate-400 w-24">
                        {doc.emission_date ? new Date(doc.emission_date).toLocaleDateString('es-MX') : '—'}
                      </span>

                      {/* Estado — Flujo ELAB → REV → APR */}
                      <div className="w-28">
                        <WorkflowBadge doc={doc} userRole={userRole} />
                      </div>

                      {/* Acciones */}
                      <div className="flex items-center gap-0.5 w-28 justify-end">
                        <button onClick={() => setSlideDoc(doc)} title="Ver detalles y comentarios"
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#00C2FF]/10 text-slate-400 hover:text-[#00C2FF] transition-colors">
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setReplaceDoc(doc)} title="Reemplazar con nueva versión"
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors">
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        {doc.storage_key && (
                          <a href={`/api/documents/download/${doc.id}`} target="_blank" rel="noopener noreferrer"
                            title="Descargar"
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600">
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {(isAdmin || !isPendingDelete) && (
                          <button onClick={() => handleDelete(doc)} title={isAdmin ? 'Eliminar' : 'Solicitar eliminación'}
                            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
                              isAdmin
                                ? 'hover:bg-red-50 text-slate-400 hover:text-red-500'
                                : 'hover:bg-amber-50 text-slate-400 hover:text-amber-500'
                            }`}>
                            {isAdmin ? <Trash2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Historial de versiones anteriores */}
                    {doc.doc_key && expandedHistory.has(doc.doc_key) && archivedByDocKey[doc.doc_key]?.map(archived => (
                      <div key={archived.id}
                        className="flex items-center gap-3 px-4 py-2.5 bg-slate-50/70 border-b border-slate-50 text-slate-400">
                        <span className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="text-sm w-5 flex-shrink-0 opacity-40">{FILE_ICONS[archived.file_type || 'other'] || '📁'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-500 truncate italic">
                            {archived.display_name || archived.file_name || archived.name}
                          </p>
                          <p className="text-xs text-slate-400 flex items-center gap-1.5">
                            <span className="font-mono bg-slate-200 text-slate-400 px-1 py-0.5 rounded text-[10px]">
                              v{String(archived.version_number ?? archived.version).padStart(4, '0')}
                            </span>
                            <span>Archivado</span>
                            {archived.emission_date && <><span>·</span><span>{new Date(archived.emission_date).toLocaleDateString('es-MX')}</span></>}
                          </p>
                        </div>
                        <span className="hidden lg:block text-xs text-slate-400 w-28 truncate italic">{archived.author || '—'}</span>
                        <span className="hidden lg:block text-xs text-slate-300 w-24">
                          {archived.emission_date ? new Date(archived.emission_date).toLocaleDateString('es-MX') : '—'}
                        </span>
                        <div className="w-28">
                          <span className="text-[10px] px-2 py-1 rounded-full bg-slate-100 text-slate-400 font-medium">Archivado</span>
                        </div>
                        <div className="flex items-center gap-0.5 w-20 justify-end">
                          {archived.storage_key && (
                            <a href={`/api/documents/download/${archived.id}`} target="_blank" rel="noopener noreferrer"
                              title="Descargar versión archivada"
                              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-300 hover:text-slate-500">
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                    </React.Fragment>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {viewingDoc && (
        <PdfViewerModal
          docId={viewingDoc.id}
          docName={viewingDoc.name}
          onClose={() => setViewingDoc(null)}
        />
      )}

      {slideDoc && (
        <DocumentSlideOver
          doc={slideDoc}
          workspaceId={workspaceId}
          currentUserId={currentUserId}
          onClose={() => setSlideDoc(null)}
        />
      )}

      {replaceDoc && (
        <ReplaceDocModal
          doc={replaceDoc}
          workspaceId={workspaceId}
          onClose={() => setReplaceDoc(null)}
        />
      )}
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────────────────

export default function DocumentsPanel({
  documents, projects, specialties, workspaceId, userRole, deleteRequests, currentUserId
}: {
  documents: Doc[]
  projects: Project[]
  specialties: Specialty[]
  workspaceId: string
  userRole: string
  deleteRequests: DeleteRequest[]
  currentUserId: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedProjectId = searchParams.get('project')
  const [showUpload, setShowUpload] = useState(false)
  const isAdmin = userRole === 'owner' || userRole === 'admin'

  const selectedProject  = projects.find(p => p.id === selectedProjectId) ?? null
  const parentProject    = selectedProject?.parent_project_id
    ? (projects.find(p => p.id === selectedProject.parent_project_id) ?? null)
    : null
  const subprojects      = selectedProject
    ? projects.filter(p => p.parent_project_id === selectedProject.id)
    : []

  function selectProject(id: string) {
    router.push(`/documents?project=${id}`)
  }

  function goBack() {
    if (parentProject) {
      router.push(`/documents?project=${parentProject.id}`)
    } else {
      router.push('/documents')
    }
  }

  return (
    <div>
      {/* Solicitudes de borrado — solo admin/owner */}
      {isAdmin && <DeleteRequestsPanel requests={deleteRequests} />}

      {/* Vista raíz: selector de proyectos */}
      {!selectedProject && (
        <>
          {/* Subtítulo informativo */}
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <p className="text-sm text-slate-500 max-w-xl">
              Selecciona un proyecto para ver y descargar sus documentos organizados por disciplina.
              Siempre encontrarás aquí la versión más actualizada de cada entregable.
            </p>
            <button onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 bg-[#1A2744] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#243660] transition-colors">
              <Upload className="w-3.5 h-3.5" />
              Subir documento
            </button>
          </div>

          <ProjectsView
            projects={projects}
            documents={documents}
            onSelect={selectProject}
            userRole={userRole}
            workspaceId={workspaceId}
          />
        </>
      )}

      {/* Vista detalle: documentos del proyecto seleccionado */}
      {selectedProject && (
        <ProjectDetailView
          project={selectedProject}
          documents={documents}
          specialties={specialties}
          workspaceId={workspaceId}
          userRole={userRole}
          deleteRequests={deleteRequests}
          currentUserId={currentUserId}
          subprojects={subprojects}
          parentProject={parentProject}
          onBack={goBack}
          onUpload={() => setShowUpload(true)}
          onSelectSub={selectProject}
        />
      )}

      {/* Modal de subida */}
      {showUpload && (
        <UploadModal
          projects={projects}
          specialties={specialties}
          workspaceId={workspaceId}
          defaultProjectId={selectedProjectId ?? undefined}
          existingDocs={documents}
          onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  )
}
