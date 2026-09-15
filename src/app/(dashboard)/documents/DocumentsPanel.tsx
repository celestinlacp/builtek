'use client'

import { useState, useRef } from 'react'
import { Project } from '@/types'
import { saveDocument, updateDocumentStatus, deleteDocument } from './actions'
import {
  Upload, FileText, ExternalLink, Trash2, ChevronDown,
  FolderOpen, CloudOff, CheckCircle2, Clock, XCircle, Eye
} from 'lucide-react'

const SPECIALTIES = [
  '📐 Geométrico', '🪨 Geotecnia', '🏗️ Estructuras',
  '💧 Hidráulica', '⚡ Electromecánico', '🏛️ Arquitectura',
  '🌿 Ambiental', '📋 General',
]

const STATUS_CONFIG = {
  draft:    { label: 'Borrador',     color: 'bg-slate-100 text-slate-500',  icon: Clock },
  review:   { label: 'En revisión',  color: 'bg-amber-100 text-amber-700',  icon: Eye },
  approved: { label: 'Aprobado',     color: 'bg-green-100 text-green-700',  icon: CheckCircle2 },
  rejected: { label: 'Rechazado',    color: 'bg-red-100 text-red-600',      icon: XCircle },
}

type Doc = {
  id: string
  name: string
  specialty: string | null
  file_url: string
  file_type: string | null
  status: string
  version: number
  created_at: string
  project?: { name: string } | null
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
            {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
              <button key={val} onClick={() => change(val)}
                className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-slate-50 ${val === status ? 'opacity-40' : ''}`}>
                <span className={`inline-block px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function UploadModal({
  projects, onClose
}: {
  projects: Project[]
  onClose: () => void
}) {
  const [projectId, setProjectId] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleUpload() {
    if (!file || !projectId) { setError('Selecciona proyecto y archivo'); return }
    setUploading(true); setError(null)

    const project = projects.find(p => p.id === projectId)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('project_name', project?.name || 'General')
    fd.append('specialty', specialty || 'General')

    setProgress('Subiendo a Dropbox...')
    const res = await fetch('/api/dropbox/upload', { method: 'POST', body: fd })
    const data = await res.json()

    if (!res.ok || data.error) {
      setError(data.error || 'Error al subir'); setUploading(false); setProgress(''); return
    }

    setProgress('Guardando metadatos...')
    const result = await saveDocument({
      project_id: projectId,
      name: file.name.replace(/\.[^/.]+$/, ''),
      specialty: specialty || '📋 General',
      file_url: data.url,
      dropbox_path: data.path,
      file_type: file.name.split('.').pop() || '',
      version: 1,
    })

    if (result?.error) { setError(result.error); setUploading(false); setProgress(''); return }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-[#1A2744]">Subir documento</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
            <span className="text-slate-400 text-lg leading-none">×</span>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Proyecto *</label>
            <select value={projectId} onChange={e => setProjectId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50">
              <option value="">Seleccionar...</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Disciplina</label>
            <select value={specialty} onChange={e => setSpecialty(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50">
              <option value="">Sin disciplina</option>
              {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Archivo *</label>
            <input ref={inputRef} type="file" className="hidden"
              accept=".pdf,.dwg,.dxf,.xlsx,.xls,.docx,.doc,.png,.jpg,.jpeg"
              onChange={e => setFile(e.target.files?.[0] || null)} />
            <button onClick={() => inputRef.current?.click()}
              className={`w-full border-2 border-dashed rounded-lg py-6 text-center transition-colors ${
                file ? 'border-[#00C2FF] bg-[#00C2FF]/5' : 'border-slate-200 hover:border-slate-300'
              }`}>
              <Upload className={`w-6 h-6 mx-auto mb-2 ${file ? 'text-[#00C2FF]' : 'text-slate-300'}`} />
              <p className="text-sm font-medium text-slate-600">
                {file ? file.name : 'Clic para seleccionar archivo'}
              </p>
              <p className="text-xs text-slate-400 mt-1">PDF, DWG, DXF, Excel, Word, imágenes</p>
            </button>
          </div>

          {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">{error}</div>}
          {progress && <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-600">{progress}</div>}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Cancelar
            </button>
            <button onClick={handleUpload} disabled={uploading || !file || !projectId}
              className="flex-1 py-2.5 rounded-lg bg-[#1A2744] text-white text-sm font-bold hover:bg-[#243660] disabled:opacity-60">
              {uploading ? 'Subiendo...' : 'Subir a Dropbox'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DocumentsPanel({
  documents, projects, dropboxConnected
}: {
  documents: Doc[]
  projects: Project[]
  dropboxConnected: boolean
}) {
  const [showUpload, setShowUpload] = useState(false)
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all' ? documents : documents.filter(d => d.status === filter)

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este documento?')) return
    await deleteDocument(id)
  }

  return (
    <div>
      {/* Dropbox not connected warning */}
      {!dropboxConnected && (
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CloudOff className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Dropbox no conectado</p>
              <p className="text-xs text-amber-600">Conecta Dropbox en Configuración para subir documentos.</p>
            </div>
          </div>
          <a href="/admin" className="text-xs font-bold text-amber-700 hover:underline">Configurar →</a>
        </div>
      )}

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

        <button onClick={() => setShowUpload(true)} disabled={!dropboxConnected}
          className="flex items-center gap-2 bg-[#1A2744] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#243660] disabled:opacity-40 transition-colors">
          <Upload className="w-3.5 h-3.5" />
          Subir documento
        </button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-xl p-16 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-8 h-8 text-slate-300" />
          </div>
          <h2 className="text-lg font-bold text-[#1A2744] mb-2">Sin documentos aún</h2>
          <p className="text-slate-400 text-sm max-w-xs mx-auto">
            {dropboxConnected ? 'Sube tu primer documento.' : 'Conecta Dropbox primero en Configuración.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wide">
            <span className="w-6" />
            <span className="flex-1">Documento</span>
            <span className="hidden sm:block w-32">Proyecto</span>
            <span className="hidden md:block w-28">Disciplina</span>
            <span className="w-28">Estado</span>
            <span className="w-16 text-right">Acciones</span>
          </div>
          {filtered.map(doc => (
            <div key={doc.id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50 group">
              <FileText className="w-5 h-5 text-slate-300 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{doc.name}</p>
                <p className="text-xs text-slate-400">v{doc.version} · {doc.file_type?.toUpperCase()}</p>
              </div>
              <span className="hidden sm:block text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded w-32 truncate">
                {(doc.project as any)?.name || '—'}
              </span>
              <span className="hidden md:block text-xs text-slate-500 w-28 truncate">{doc.specialty || '—'}</span>
              <div className="w-28">
                <StatusBadge docId={doc.id} status={doc.status} />
              </div>
              <div className="flex items-center gap-1 w-16 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button onClick={() => handleDelete(doc.id)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showUpload && <UploadModal projects={projects} onClose={() => setShowUpload(false)} />}
    </div>
  )
}
