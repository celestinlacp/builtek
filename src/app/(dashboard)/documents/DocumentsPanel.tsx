'use client'

import { useState, useRef } from 'react'
import { Project } from '@/types'
import { saveDocument, updateDocumentStatus, requestDeleteDocument, approveDeleteRequest, rejectDeleteRequest, deleteDocument } from './actions'
import {
  Upload, Download, Trash2, ChevronDown,
  FolderOpen, CheckCircle2, Clock, XCircle, Eye, AlertTriangle, ShieldCheck, ShieldX
} from 'lucide-react'

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
  storage_key: string | null
  file_type: string | null
  file_size: number | null
  status: string
  doc_status: string
  version: number
  emission_date: string | null
  created_at: string
  project?: { name: string } | null
  specialty?: { name: string; code: string; category: string } | null
}

function formatSize(bytes: number | null) {
  if (!bytes) return '—'
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function StatusBadge({ docId, status }: { docId: string; status: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.draft

  async function change(s: string) {
    setLoading(true); setOpen(false)
    await updateDocumentStatus(docId, s)
    setLoading(false)
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} disabled={loading}
        className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 ${cfg.color} hover:opacity-80`}>
        {loading ? '...' : cfg.label}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-7 left-0 z-20 bg-white rounded-lg shadow-lg border border-slate-100 py-1 w-36">
            {Object.entries(STATUS_CONFIG).map(([val, c]) => (
              <button key={val} onClick={() => change(val)}
                className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-slate-50 ${val === status ? 'opacity-40' : ''}`}>
                <span className={`inline-block px-2 py-0.5 rounded-full ${c.color}`}>{c.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function UploadModal({
  projects, specialties, workspaceId, onClose
}: {
  projects: Project[]
  specialties: Specialty[]
  workspaceId: string
  onClose: () => void
}) {
  const [projectId,    setProjectId]    = useState('')
  const [specialtyId,  setSpecialtyId]  = useState('')
  const [displayName,  setDisplayName]  = useState('')
  const [emissionDate, setEmissionDate] = useState('')
  const [file,         setFile]         = useState<File | null>(null)
  const [uploading,    setUploading]    = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [step,         setStep]         = useState('')   // texto del paso actual
  const [uploadPct,    setUploadPct]    = useState(0)    // 0-100 porcentaje real de subida
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedSpecialty = specialties.find(s => s.id === specialtyId)

  // Agrupar especialidades por categoría
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
    setUploading(true); setError(null); setUploadPct(0)

    // Paso 1: Obtener URL pre-firmada de R2
    setStep('Preparando subida...')
    const presignRes = await fetch('/api/documents/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceId,
        projectId,
        specialtyCode: selectedSpecialty?.code || 'GEN',
        fileName:    file.name,
        contentType: file.type || 'application/octet-stream',
        fileSize:    file.size,
      }),
    })
    const presignData = await presignRes.json()
    if (!presignRes.ok) {
      setError(presignData.error || 'Error al preparar subida')
      setUploading(false); setStep(''); return
    }

    // Paso 2: Subir directo a R2 con XMLHttpRequest para progreso real
    setStep('Subiendo archivo...')
    const uploadOk = await new Promise<boolean>((resolve) => {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', presignData.uploadUrl)
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setUploadPct(Math.round((e.loaded / e.total) * 100))
      }
      xhr.onload  = () => {
        if (xhr.status < 200 || xhr.status >= 300) {
          console.error('[R2 Upload] Status:', xhr.status, xhr.responseText)
        }
        resolve(xhr.status >= 200 && xhr.status < 300)
      }
      xhr.onerror = () => {
        console.error('[R2 Upload] Network error')
        resolve(false)
      }
      xhr.send(file)
    })

    if (!uploadOk) {
      setError('Error al subir el archivo a R2')
      setUploading(false); setStep(''); return
    }

    // Paso 3: Guardar metadatos en Supabase
    setStep('Guardando metadatos...')
    setUploadPct(100)
    const result = await saveDocument({
      project_id:    projectId,
      workspace_id:  workspaceId,
      specialty_id:  specialtyId || null,
      file_name:     file.name,
      display_name:  displayName.trim() || null,
      emission_date: emissionDate || null,
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
            <span className="text-slate-400 text-lg leading-none">×</span>
          </button>
        </div>

        <div className="p-6 space-y-4">

          {/* Proyecto */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Proyecto <span className="text-red-400">*</span>
            </label>
            <select value={projectId} onChange={e => setProjectId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50">
              <option value="">Seleccionar proyecto...</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {/* Disciplina */}
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

          {/* Archivo */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Archivo <span className="text-red-400">*</span>
            </label>
            <input ref={inputRef} type="file" className="hidden"
              accept=".pdf,.dwg,.dxf,.xlsx,.xls,.docx,.doc,.png,.jpg,.jpeg,.zip"
              onChange={e => setFile(e.target.files?.[0] || null)} />
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

          {/* Nombre de display (opcional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Nombre descriptivo <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder={file?.name || 'Ej: Plano de cimentación Frente 3'}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50"
            />
          </div>

          {/* Fecha de emisión (opcional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Fecha de emisión del documento <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <input
              type="date"
              value={emissionDate}
              onChange={e => setEmissionDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">{error}</div>
          )}

          {uploading && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-700 font-medium">{step}</span>
                <span className="text-blue-500 font-bold tabular-nums">{uploadPct}%</span>
              </div>
              <div className="w-full bg-blue-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#00C2FF] h-2 rounded-full transition-all duration-200"
                  style={{ width: `${uploadPct}%` }}
                />
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
            <button onClick={handleUpload} disabled={uploading || !file || !projectId}
              className="flex-1 py-2.5 rounded-lg bg-[#1A2744] text-white text-sm font-bold hover:bg-[#243660] disabled:opacity-60">
              {uploading ? 'Subiendo...' : 'Subir a R2'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function DeleteRequestsPanel({ requests }: { requests: DeleteRequest[] }) {
  const [loading, setLoading] = useState<string | null>(null)
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({})
  const [rejectOpen, setRejectOpen] = useState<string | null>(null)

  async function handleApprove(req: DeleteRequest) {
    if (!confirm(`¿Aprobar eliminación de "${req.document?.display_name || req.document?.file_name || req.document?.name}"? Esta acción no se puede deshacer.`)) return
    setLoading(req.id)
    await approveDeleteRequest(req.id, req.document_id)
    setLoading(null)
  }

  async function handleReject(req: DeleteRequest) {
    const note = rejectNotes[req.id] || ''
    setLoading(req.id)
    await rejectDeleteRequest(req.id, req.document_id, note)
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
                    <input
                      type="text"
                      placeholder="Motivo del rechazo (opcional)"
                      value={rejectNotes[req.id] || ''}
                      onChange={e => setRejectNotes(prev => ({ ...prev, [req.id]: e.target.value }))}
                      className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-300"
                    />
                    <button
                      onClick={() => handleReject(req)}
                      disabled={isLoading}
                      className="text-xs px-3 py-1.5 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 disabled:opacity-60">
                      {isLoading ? '...' : 'Confirmar'}
                    </button>
                    <button onClick={() => setRejectOpen(null)} className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100">
                      Cancelar
                    </button>
                  </div>
                )}
              </div>

              {!showRejectInput && (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleApprove(req)}
                    disabled={isLoading}
                    title="Aprobar eliminación"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-xs font-semibold hover:bg-red-200 disabled:opacity-60">
                    <ShieldX className="w-3.5 h-3.5" />
                    Aprobar borrado
                  </button>
                  <button
                    onClick={() => setRejectOpen(req.id)}
                    disabled={isLoading}
                    title="Rechazar solicitud"
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

export default function DocumentsPanel({
  documents, projects, specialties, workspaceId, userRole, deleteRequests
}: {
  documents: Doc[]
  projects: Project[]
  specialties: Specialty[]
  workspaceId: string
  userRole: string
  deleteRequests: DeleteRequest[]
}) {
  const [showUpload, setShowUpload] = useState(false)
  const [filter,     setFilter]     = useState('all')
  const isAdmin = userRole === 'owner' || userRole === 'admin'

  const filtered = filter === 'all' ? documents : documents.filter(d => d.status === filter)

  async function handleDelete(id: string, name: string) {
    if (isAdmin) {
      if (!confirm(`¿Eliminar "${name}" permanentemente? Esta acción no se puede deshacer.`)) return
      await deleteDocument(id)
    } else {
      if (!confirm('¿Solicitar eliminación de este documento? Un administrador deberá aprobarlo.')) return
      await requestDeleteDocument(id)
    }
  }

  return (
    <div>
      {/* Panel de solicitudes de borrado — solo visible para admin/owner */}
      {isAdmin && <DeleteRequestsPanel requests={deleteRequests} />}

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          {['all', 'draft', 'review', 'approved'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                filter === f ? 'bg-[#1A2744] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
              }`}>
              {f === 'all' ? 'Todos' : STATUS_CONFIG[f as keyof typeof STATUS_CONFIG]?.label}
              {f !== 'all' && (
                <span className="ml-1.5 opacity-70">
                  {documents.filter(d => d.status === f).length}
                </span>
              )}
            </button>
          ))}
        </div>

        <button onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 bg-[#1A2744] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#243660] transition-colors">
          <Upload className="w-3.5 h-3.5" />
          Subir documento
        </button>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-xl p-16 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-8 h-8 text-slate-300" />
          </div>
          <h2 className="text-lg font-bold text-[#1A2744] mb-2">Sin documentos aún</h2>
          <p className="text-slate-400 text-sm max-w-xs mx-auto">Sube tu primer documento con el botón de arriba.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wide rounded-t-xl">
            <span className="w-6" />
            <span className="flex-1">Documento</span>
            <span className="hidden sm:block w-32">Proyecto</span>
            <span className="hidden md:block w-28">Disciplina</span>
            <span className="hidden lg:block w-24">Emisión</span>
            <span className="w-28">Estado</span>
            <span className="w-20 text-right">Acciones</span>
          </div>

          {filtered.map((doc, idx) => {
            const fileIcon = FILE_ICONS[doc.file_type || 'other'] || '📁'
            const isPendingDelete = doc.doc_status === 'pending_delete'
            const isLast = idx === filtered.length - 1
            const pendingRequest = isPendingDelete ? deleteRequests.find(r => r.document_id === doc.id) : null

            return (
              <div key={doc.id}
                className={`flex items-center gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50 group ${isPendingDelete ? 'opacity-60' : ''} ${isLast ? 'rounded-b-xl border-b-0' : ''}`}>
                <span className="text-lg w-6 flex-shrink-0">{fileIcon}</span>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {doc.display_name || doc.file_name || doc.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {doc.file_name && doc.display_name ? doc.file_name + ' · ' : ''}
                    v{doc.version} · {doc.file_type?.toUpperCase() || '—'} · {formatSize(doc.file_size)}
                    {isPendingDelete && <span className="ml-2 text-amber-500 font-medium">· Borrado pendiente</span>}
                  </p>
                </div>

                <span className="hidden sm:block text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded w-32 truncate">
                  {(doc.project as any)?.name || '—'}
                </span>

                <span className="hidden md:block text-xs text-slate-500 w-28 truncate">
                  {doc.specialty ? `[${doc.specialty.code}] ${doc.specialty.name}` : '—'}
                </span>

                <span className="hidden lg:block text-xs text-slate-400 w-24">
                  {doc.emission_date ? new Date(doc.emission_date).toLocaleDateString('es-MX') : '—'}
                </span>

                <div className="w-28">
                  <StatusBadge docId={doc.id} status={doc.status} />
                </div>

                <div className="flex items-center gap-1 w-20 justify-end">
                  {doc.storage_key && (
                    <a href={`/api/documents/download/${doc.id}`} target="_blank" rel="noopener noreferrer"
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600"
                      title="Descargar">
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {isPendingDelete && isAdmin && pendingRequest && (
                    <button
                      onClick={() => {
                        if (confirm(`¿Confirmar eliminación de "${doc.display_name || doc.file_name || doc.name}"?`))
                          approveDeleteRequest(pendingRequest.id, doc.id)
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-amber-500 hover:text-red-500 transition-colors"
                      title="Aprobar borrado">
                      <ShieldX className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {!isPendingDelete && (
                    <button
                      onClick={() => handleDelete(doc.id, doc.display_name || doc.file_name || doc.name)}
                      className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors text-slate-400 ${
                        isAdmin
                          ? 'hover:bg-red-50 hover:text-red-500'
                          : 'hover:bg-amber-50 hover:text-amber-500'
                      }`}
                      title={isAdmin ? 'Eliminar' : 'Solicitar eliminación'}>
                      {isAdmin ? <Trash2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showUpload && (
        <UploadModal
          projects={projects}
          specialties={specialties}
          workspaceId={workspaceId}
          onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  )
}
