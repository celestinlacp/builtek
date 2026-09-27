'use client'

import React, { useState, useRef } from 'react'
import { saveDesignSpec, updateSpecStatus, deleteDesignSpec } from './actions'
import {
  Plus, X, Upload, FileText, ChevronDown, Loader2, Trash2,
  Eye, AlertTriangle, CheckCircle2, Clock, ArrowLeft, BookOpen,
} from 'lucide-react'

// ── Tipos ─────────────────────────────────────────────────────────────────────

type Mesa = { id: string; code: string; name: string; description: string | null; sort_order: number }
type Company = { id: string; name: string; short_name: string | null }
type Oficio  = { id: string; no_oficio: string | null; asunto: string; remitente: string | null }

type DesignSpec = {
  id:             string
  workspace_id:   string
  specialty_code: string | null
  title:          string
  spec_code:      string | null
  version:        string
  issued_by:      string | null
  company_id:     string | null
  oficio_id:      string | null
  issued_date:    string | null
  status:         'vigente' | 'en_revision' | 'supersedida'
  storage_key:    string | null
  file_name:      string | null
  file_type:      string | null
  file_size:      number | null
  notes:          string | null
  created_at:     string
  company?:  { name: string; short_name: string | null } | null
  oficio?:   { no_oficio: string | null; asunto: string } | null
}

// ── Colores por mesa (índice rotativo) ────────────────────────────────────────

const MESA_COLORS = [
  { bg: 'from-blue-600 to-blue-800',    text: 'text-blue-100',   badge: 'bg-blue-500/30'   },
  { bg: 'from-violet-600 to-violet-800',text: 'text-violet-100', badge: 'bg-violet-500/30' },
  { bg: 'from-emerald-600 to-emerald-800',text:'text-emerald-100',badge:'bg-emerald-500/30'},
  { bg: 'from-amber-600 to-amber-800',  text: 'text-amber-100',  badge: 'bg-amber-500/30'  },
  { bg: 'from-rose-600 to-rose-800',    text: 'text-rose-100',   badge: 'bg-rose-500/30'   },
  { bg: 'from-cyan-600 to-cyan-800',    text: 'text-cyan-100',   badge: 'bg-cyan-500/30'   },
  { bg: 'from-indigo-600 to-indigo-800',text: 'text-indigo-100', badge: 'bg-indigo-500/30' },
  { bg: 'from-teal-600 to-teal-800',    text: 'text-teal-100',   badge: 'bg-teal-500/30'   },
]

function getMesaColor(idx: number) {
  return MESA_COLORS[idx % MESA_COLORS.length]
}

// ── Configuración de estado ───────────────────────────────────────────────────

const STATUS_CONFIG = {
  vigente:     { label: 'Vigente',     color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  en_revision: { label: 'En revisión', color: 'bg-amber-100 text-amber-700', icon: Clock        },
  supersedida: { label: 'Supersedida', color: 'bg-slate-100 text-slate-500', icon: AlertTriangle},
}

function formatSize(bytes: number | null) {
  if (!bytes) return '—'
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(s: string | null) {
  if (!s) return '—'
  return new Date(s + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Modal: nueva especificación ───────────────────────────────────────────────

function UploadModal({
  workspaceId, mesas, companies, oficios, defaultMesaCode, onClose,
}: {
  workspaceId:     string
  mesas:           Mesa[]
  companies:       Company[]
  oficios:         Oficio[]
  defaultMesaCode: string
  onClose:         () => void
}) {
  const [title,       setTitle]       = useState('')
  const [specCode,    setSpecCode]    = useState('')
  const [version,     setVersion]     = useState('V1')
  const [mesaCode,    setMesaCode]    = useState(defaultMesaCode)
  const [issuedBy,    setIssuedBy]    = useState('')
  const [companyId,   setCompanyId]   = useState('')
  const [oficioId,    setOficioId]    = useState('')
  const [issuedDate,  setIssuedDate]  = useState('')
  const [notes,       setNotes]       = useState('')
  const [file,        setFile]        = useState<File | null>(null)
  const [uploading,   setUploading]   = useState(false)
  const [uploadPct,   setUploadPct]   = useState(0)
  const [error,       setError]       = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit() {
    if (!title.trim()) { setError('El título es requerido'); return }
    setUploading(true); setError(null); setUploadPct(0)

    let storageKey: string | null = null
    let fileType:   string | null = null
    let fileSize:   number | null = null
    let fileName:   string | null = null

    if (file) {
      const presignRes = await fetch('/api/specs/presign', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          specialtyCode: mesaCode || 'GEN',
          fileName:      file.name,
          contentType:   file.type || 'application/octet-stream',
          fileSize:      file.size,
        }),
      })
      const presign = await presignRes.json()
      if (!presignRes.ok) { setError(presign.error || 'Error al preparar subida'); setUploading(false); return }

      const ok = await new Promise<boolean>(resolve => {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', presign.uploadUrl)
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
        xhr.upload.onprogress = e => { if (e.lengthComputable) setUploadPct(Math.round(e.loaded / e.total * 100)) }
        xhr.onload  = () => resolve(xhr.status >= 200 && xhr.status < 300)
        xhr.onerror = () => resolve(false)
        xhr.send(file)
      })
      if (!ok) { setError('Error al subir el archivo'); setUploading(false); return }
      storageKey = presign.storageKey
      fileType   = presign.fileType
      fileSize   = file.size
      fileName   = file.name
    }

    try {
      await saveDesignSpec({
        workspace_id:   workspaceId,
        specialty_code: mesaCode || null,
        title:          title.trim(),
        spec_code:      specCode.trim() || null,
        version:        version.trim() || 'V1',
        issued_by:      issuedBy.trim() || null,
        company_id:     companyId || null,
        oficio_id:      oficioId || null,
        issued_date:    issuedDate || null,
        notes:          notes.trim() || null,
        storage_key:    storageKey,
        file_name:      fileName,
        file_type:      fileType,
        file_size:      fileSize,
      })
      onClose()
    } catch (e: any) {
      setError(e.message || 'Error al guardar')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-[#1A2744]">Nueva especificación de diseño</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Mesa */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Mesa de especialidad *</label>
            <select value={mesaCode} onChange={e => setMesaCode(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40">
              <option value="">Sin asignar</option>
              {mesas.map(m => <option key={m.code} value={m.code}>[{m.code}] {m.name}</option>)}
            </select>
          </div>

          {/* Título */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Título *</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Ej: Especificación de cimentaciones profundas"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40" />
          </div>

          {/* Código y Versión */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Código</label>
              <input value={specCode} onChange={e => setSpecCode(e.target.value)} placeholder="Ej: ET-EST-001"
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Versión</label>
              <input value={version} onChange={e => setVersion(e.target.value)} placeholder="V1"
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40" />
            </div>
          </div>

          {/* Emitido por + Empresa */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Emitido por</label>
              <input value={issuedBy} onChange={e => setIssuedBy(e.target.value)} placeholder="Nombre del firmante"
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Empresa</label>
              <select value={companyId} onChange={e => setCompanyId(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40">
                <option value="">— ninguna —</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.short_name || c.name}</option>)}
              </select>
            </div>
          </div>

          {/* Oficio + Fecha */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Oficio vinculado</label>
              <select value={oficioId} onChange={e => setOficioId(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40">
                <option value="">— ninguno —</option>
                {oficios.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.no_oficio ? `${o.no_oficio} · ` : ''}{o.asunto.slice(0, 40)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Fecha de emisión</label>
              <input type="date" value={issuedDate} onChange={e => setIssuedDate(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40" />
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Notas</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="Alcance, observaciones, áreas de aplicación..."
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40 resize-none" />
          </div>

          {/* Archivo */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Archivo (opcional)</label>
            <input ref={inputRef} type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
            {file ? (
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="text-xs text-slate-600 flex-1 truncate">{file.name}</span>
                <button onClick={() => setFile(null)} className="text-slate-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
              </div>
            ) : (
              <button onClick={() => inputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 rounded-lg text-sm text-slate-400 hover:border-[#00C2FF] hover:text-[#00C2FF] transition-colors">
                <Upload className="w-4 h-4" /> Seleccionar archivo
              </button>
            )}
            {uploading && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                  <div className="bg-[#00C2FF] h-1.5 rounded-full transition-all" style={{ width: `${uploadPct}%` }} />
                </div>
                <span className="text-xs text-[#00C2FF] font-bold tabular-nums">{uploadPct}%</span>
              </div>
            )}
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
          <button onClick={onClose} disabled={uploading} className="px-4 py-2 text-sm text-slate-500 font-medium disabled:opacity-50">Cancelar</button>
          <button onClick={handleSubmit} disabled={uploading || !title.trim()}
            className="px-5 py-2 bg-[#1A2744] text-white text-sm font-semibold rounded-lg hover:bg-[#243560] disabled:opacity-50 flex items-center gap-2">
            {uploading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Subiendo...</> : 'Guardar especificación'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Badge de estado ───────────────────────────────────────────────────────────

function StatusBadge({ spec, userRole }: { spec: DesignSpec; userRole: string }) {
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(false)
  const cfg    = STATUS_CONFIG[spec.status]
  const Icon   = cfg.icon
  const isAdmin = ['owner', 'admin', 'manager'].includes(userRole)
  const transitions: { label: string; to: DesignSpec['status'] }[] = []
  if (isAdmin) {
    if (spec.status !== 'vigente')     transitions.push({ label: '✓ Vigente',      to: 'vigente' })
    if (spec.status !== 'en_revision') transitions.push({ label: '◎ En revisión',  to: 'en_revision' })
    if (spec.status !== 'supersedida') transitions.push({ label: '✕ Supersedida',  to: 'supersedida' })
  }
  async function change(to: DesignSpec['status']) {
    setLoading(true); setOpen(false)
    await updateSpecStatus(spec.id, to)
    setLoading(false)
  }
  return (
    <div className="relative">
      <button onClick={() => transitions.length > 0 && setOpen(v => !v)} disabled={loading}
        className={`text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1 ${cfg.color} ${transitions.length > 0 ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}>
        <Icon className="w-3 h-3" />
        {loading ? '...' : cfg.label}
        {transitions.length > 0 && <ChevronDown className="w-3 h-3" />}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-7 left-0 z-20 bg-white rounded-lg shadow-lg border border-slate-100 py-1 w-40">
            {transitions.map(t => (
              <button key={t.to} onClick={() => change(t.to)}
                className="w-full text-left px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">{t.label}</button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Vista detalle de una mesa ─────────────────────────────────────────────────

function MesaDetailView({
  mesa, specs, userRole, workspaceId, mesas, companies, oficios, colorIdx, onBack,
}: {
  mesa:        Mesa
  specs:       DesignSpec[]
  userRole:    string
  workspaceId: string
  mesas:       Mesa[]
  companies:   Company[]
  oficios:     Oficio[]
  colorIdx:    number
  onBack:      () => void
}) {
  const [showUpload, setShowUpload] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const canUpload = ['owner', 'admin', 'manager', 'engineer'].includes(userRole)
  const isAdmin   = ['owner', 'admin'].includes(userRole)
  const color = getMesaColor(colorIdx)

  const filtered = filterStatus === 'all' ? specs : specs.filter(s => s.status === filterStatus)

  async function handleView(spec: DesignSpec) {
    if (!spec.storage_key) return
    const res = await fetch('/api/documents/download', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storageKey: spec.storage_key, workspaceId }),
    })
    if (!res.ok) return
    const { url } = await res.json()
    window.open(url, '_blank')
  }

  async function handleDelete(spec: DesignSpec) {
    if (!confirm(`¿Eliminar "${spec.title}"?`)) return
    await deleteDesignSpec(spec.id)
  }

  return (
    <div>
      {/* Header degradado de la mesa */}
      <div className={`relative rounded-2xl bg-gradient-to-br ${color.bg} p-6 mb-6 overflow-hidden`}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 60%)' }} />
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-white/70 hover:text-white text-xs font-medium mb-4 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Volver a mesas
        </button>
        <div className="flex items-end justify-between">
          <div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${color.badge} ${color.text} mb-3 inline-block`}>
              {mesa.code}
            </span>
            <h2 className="text-2xl font-bold text-white">{mesa.name}</h2>
            {mesa.description && <p className="text-white/70 text-sm mt-1">{mesa.description}</p>}
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-white">{specs.length}</p>
            <p className="text-white/70 text-xs">especificaciones</p>
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-2">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40">
            <option value="all">Todos los estados</option>
            <option value="vigente">Vigentes</option>
            <option value="en_revision">En revisión</option>
            <option value="supersedida">Supersedidas</option>
          </select>
          <span className="text-xs text-slate-400">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        {canUpload && (
          <button onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1A2744] text-white text-sm font-semibold rounded-lg hover:bg-[#243560]">
            <Plus className="w-4 h-4" /> Nueva especificación
          </button>
        )}
      </div>

      {/* Tabla de specs */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-xl p-12 text-center">
          <FileText className="w-8 h-8 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">
            {specs.length === 0 ? 'No hay especificaciones en esta mesa aún.' : 'Sin resultados con ese filtro.'}
          </p>
          {specs.length === 0 && canUpload && (
            <button onClick={() => setShowUpload(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#1A2744] text-white text-sm font-semibold rounded-lg hover:bg-[#243560]">
              <Plus className="w-4 h-4" /> Agregar la primera
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wide">
            <span className="w-5" />
            <span className="flex-1">Especificación</span>
            <span className="hidden md:block w-32">Emitido por</span>
            <span className="hidden lg:block w-28">Fecha</span>
            <span className="w-28">Estado</span>
            <span className="w-16" />
          </div>
          {filtered.map(spec => {
            const mesa2 = spec.company?.short_name || spec.company?.name || spec.issued_by || '—'
            return (
              <div key={spec.id}
                className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50 group last:border-b-0">
                <span className="text-base w-5 flex-shrink-0">
                  {spec.file_type === 'pdf' ? '📄' : spec.storage_key ? '📁' : '📋'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{spec.title}</p>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap mt-0.5">
                    {spec.spec_code && (
                      <span className="font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">{spec.spec_code}</span>
                    )}
                    <span className="font-mono bg-[#00C2FF]/10 text-[#0099CC] px-1.5 py-0.5 rounded font-bold text-[10px]">{spec.version}</span>
                    {spec.file_size && <><span>·</span><span>{formatSize(spec.file_size)}</span></>}
                    {spec.oficio && <><span>·</span><span className="text-[#1A2744]">Oficio: {spec.oficio.no_oficio || spec.oficio.asunto.slice(0, 25)}</span></>}
                  </p>
                </div>
                <span className="hidden md:block text-xs text-slate-500 w-32 truncate">{mesa2}</span>
                <span className="hidden lg:block text-xs text-slate-400 w-28">{formatDate(spec.issued_date)}</span>
                <div className="w-28"><StatusBadge spec={spec} userRole={userRole} /></div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity w-16 justify-end">
                  {spec.storage_key && (
                    <button onClick={() => handleView(spec)} title="Ver archivo"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-[#00C2FF] hover:bg-slate-100">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {isAdmin && (
                    <button onClick={() => handleDelete(spec)} title="Eliminar"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50">
                      <Trash2 className="w-3.5 h-3.5" />
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
          workspaceId={workspaceId} mesas={mesas} companies={companies} oficios={oficios}
          defaultMesaCode={mesa.code} onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  )
}

// ── Card de mesa ──────────────────────────────────────────────────────────────

function MesaCard({
  mesa, specs, colorIdx, onSelect,
}: {
  mesa:     Mesa
  specs:    DesignSpec[]
  colorIdx: number
  onSelect: () => void
}) {
  const color    = getMesaColor(colorIdx)
  const vigentes = specs.filter(s => s.status === 'vigente').length
  const lastDate = specs.length > 0
    ? specs.reduce((l, s) => s.created_at > l ? s.created_at : l, specs[0].created_at)
    : null

  return (
    <button onClick={onSelect}
      className="group bg-white border border-slate-100 rounded-2xl overflow-hidden hover:shadow-md hover:border-slate-200 transition-all text-left w-full">
      {/* Banda de color superior */}
      <div className={`h-20 bg-gradient-to-br ${color.bg} relative flex items-center px-5`}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 60%)' }} />
        <span className={`text-2xl font-black ${color.text} opacity-30 absolute right-4 bottom-2 leading-none`}>
          {mesa.code}
        </span>
        <div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${color.badge} ${color.text}`}>
            {mesa.code}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="text-sm font-bold text-[#1A2744] mb-1 group-hover:text-[#00C2FF] transition-colors">
          {mesa.name}
        </h3>
        {mesa.description && (
          <p className="text-xs text-slate-400 mb-3 line-clamp-2">{mesa.description}</p>
        )}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{specs.length} especificación{specs.length !== 1 ? 'es' : ''}</span>
          {vigentes > 0 && (
            <span className="text-green-600 font-medium">{vigentes} vigente{vigentes !== 1 ? 's' : ''}</span>
          )}
        </div>
        {lastDate && (
          <p className="text-[10px] text-slate-300 mt-1">
            Última: {formatDate(lastDate)}
          </p>
        )}
      </div>
    </button>
  )
}

// ── Panel principal ───────────────────────────────────────────────────────────

export default function EspecificacionesPanel({
  specs, mesas, companies, oficios, workspaceId, userRole,
}: {
  specs:       DesignSpec[]
  mesas:       Mesa[]
  companies:   Company[]
  oficios:     Oficio[]
  workspaceId: string
  userRole:    string
}) {
  const [selectedMesaCode, setSelectedMesaCode] = useState<string | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const canUpload = ['owner', 'admin', 'manager', 'engineer'].includes(userRole)

  // Mesa seleccionada
  const selectedMesa = mesas.find(m => m.code === selectedMesaCode)
  const selectedIdx  = mesas.findIndex(m => m.code === selectedMesaCode)

  // Si hay una mesa seleccionada, mostrar su detalle
  if (selectedMesa) {
    const mesaSpecs = specs.filter(s => s.specialty_code === selectedMesa.code)
    return (
      <MesaDetailView
        mesa={selectedMesa}
        specs={mesaSpecs}
        userRole={userRole}
        workspaceId={workspaceId}
        mesas={mesas}
        companies={companies}
        oficios={oficios}
        colorIdx={selectedIdx}
        onBack={() => setSelectedMesaCode(null)}
      />
    )
  }

  // Sin mesas configuradas
  if (mesas.length === 0) {
    return (
      <div className="bg-white border border-slate-100 rounded-xl p-16 text-center">
        <BookOpen className="w-10 h-10 text-slate-200 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-[#1A2744] mb-2">Sin mesas de especialidad configuradas</h2>
        <p className="text-slate-400 text-sm max-w-sm mx-auto">
          Ve a <span className="font-semibold text-[#1A2744]">Admin → Nomenclaturas → ESPECIALIDAD</span> y agrega las mesas de tu proyecto (Estructuras, Hidráulica, Vías…).
        </p>
      </div>
    )
  }

  // Vista de cards — una por mesa
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-slate-500">
          {mesas.length} mesa{mesas.length !== 1 ? 's' : ''} · {specs.length} especificación{specs.length !== 1 ? 'es' : ''} en total
        </p>
        {canUpload && (
          <button onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1A2744] text-white text-sm font-semibold rounded-lg hover:bg-[#243560]">
            <Plus className="w-4 h-4" /> Nueva especificación
          </button>
        )}
      </div>

      {/* Grid de cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {mesas.map((mesa, idx) => (
          <MesaCard
            key={mesa.code}
            mesa={mesa}
            specs={specs.filter(s => s.specialty_code === mesa.code)}
            colorIdx={idx}
            onSelect={() => setSelectedMesaCode(mesa.code)}
          />
        ))}
      </div>

      {/* Specs sin mesa asignada */}
      {specs.some(s => !s.specialty_code) && (
        <div className="mt-4">
          <button
            onClick={() => setSelectedMesaCode('__unassigned__')}
            className="w-full text-left p-4 bg-white border border-dashed border-slate-200 rounded-xl hover:border-slate-300 transition-colors">
            <p className="text-sm font-medium text-slate-500">
              Sin mesa asignada · {specs.filter(s => !s.specialty_code).length} especificaciones
            </p>
          </button>
        </div>
      )}

      {showUpload && (
        <UploadModal
          workspaceId={workspaceId} mesas={mesas} companies={companies} oficios={oficios}
          defaultMesaCode={mesas[0]?.code || ''} onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  )
}
