'use client'

import React, { useState, useRef } from 'react'
import { saveDesignSpec, updateSpecStatus, deleteDesignSpec } from './actions'
import {
  Plus, X, Upload, FileText, ChevronDown, Loader2, Trash2,
  Eye, AlertTriangle, CheckCircle2, Clock, ArrowLeft, Folder,
} from 'lucide-react'

// ── Mesas fijas ───────────────────────────────────────────────────────────────

const MESAS = [
  { code: 'EEST', name: 'Mesa Estructuras'     },
  { code: 'GEO',  name: 'Mesa Geotecnia'       },
  { code: 'CAR',  name: 'Mesa de Carreteras'   },
  { code: 'ARQ',  name: 'Mesa de Arquitectura' },
  { code: 'HID',  name: 'Mesa de Hidráulica'   },
  { code: 'DDV',  name: 'Mesa de DDV'          },
  { code: 'TOP',  name: 'Mesa de Topografía'   },
]

// Colors mapped 1:1 by index to MESAS
const MESA_PALETTE = [
  { iconBg: 'bg-blue-50',   iconColor: 'text-blue-500',   gradient: 'from-blue-600 to-blue-800',     badgeBg: 'bg-blue-500/20',   badgeText: 'text-blue-100'   },
  { iconBg: 'bg-amber-50',  iconColor: 'text-amber-600',  gradient: 'from-amber-500 to-amber-700',   badgeBg: 'bg-amber-500/20',  badgeText: 'text-amber-100'  },
  { iconBg: 'bg-slate-100', iconColor: 'text-slate-500',  gradient: 'from-slate-600 to-slate-800',   badgeBg: 'bg-slate-500/20',  badgeText: 'text-slate-100'  },
  { iconBg: 'bg-violet-50', iconColor: 'text-violet-500', gradient: 'from-violet-600 to-violet-800', badgeBg: 'bg-violet-500/20', badgeText: 'text-violet-100' },
  { iconBg: 'bg-cyan-50',   iconColor: 'text-cyan-500',   gradient: 'from-cyan-600 to-cyan-800',     badgeBg: 'bg-cyan-500/20',   badgeText: 'text-cyan-100'   },
  { iconBg: 'bg-orange-50', iconColor: 'text-orange-500', gradient: 'from-orange-500 to-orange-700', badgeBg: 'bg-orange-500/20', badgeText: 'text-orange-100' },
  { iconBg: 'bg-green-50',  iconColor: 'text-green-600',  gradient: 'from-green-600 to-green-800',   badgeBg: 'bg-green-500/20',  badgeText: 'text-green-100'  },
]

function getMesaPalette(code: string) {
  const idx = MESAS.findIndex(m => m.code === code)
  return MESA_PALETTE[idx >= 0 ? idx : 0]
}

// ── Tipos ─────────────────────────────────────────────────────────────────────

type Mesa    = { code: string; name: string }
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

// ── Helpers ───────────────────────────────────────────────────────────────────

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
  workspaceId, companies, oficios, defaultMesaCode, onClose,
}: {
  workspaceId:     string
  companies:       Company[]
  oficios:         Oficio[]
  defaultMesaCode: string
  onClose:         () => void
}) {
  const [title,      setTitle]      = useState('')
  const [specCode,   setSpecCode]   = useState('')
  const [version,    setVersion]    = useState('V1')
  const [mesaCode,   setMesaCode]   = useState(defaultMesaCode)
  const [issuedBy,   setIssuedBy]   = useState('')
  const [companyId,  setCompanyId]  = useState('')
  const [oficioId,   setOficioId]   = useState('')
  const [issuedDate, setIssuedDate] = useState('')
  const [notes,      setNotes]      = useState('')
  const [file,       setFile]       = useState<File | null>(null)
  const [uploading,  setUploading]  = useState(false)
  const [uploadPct,  setUploadPct]  = useState(0)
  const [error,      setError]      = useState<string | null>(null)
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
              {MESAS.map(m => <option key={m.code} value={m.code}>{m.name}</option>)}
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
  mesa, specs, userRole, workspaceId, companies, oficios, onBack,
}: {
  mesa:        Mesa
  specs:       DesignSpec[]
  userRole:    string
  workspaceId: string
  companies:   Company[]
  oficios:     Oficio[]
  onBack:      () => void
}) {
  const [showUpload,    setShowUpload]    = useState(false)
  const [filterStatus,  setFilterStatus]  = useState('all')
  const canUpload = ['owner', 'admin', 'manager', 'engineer'].includes(userRole)
  const isAdmin   = ['owner', 'admin'].includes(userRole)
  const palette   = getMesaPalette(mesa.code)

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

  const vigentes    = specs.filter(s => s.status === 'vigente').length
  const enRevision  = specs.filter(s => s.status === 'en_revision').length

  return (
    <div>
      {/* Header */}
      <div className={`relative rounded-2xl bg-gradient-to-br ${palette.gradient} p-6 mb-6 overflow-hidden`}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 60%)' }} />
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-white/70 hover:text-white text-xs font-medium mb-4 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Todas las mesas
        </button>
        <div className="flex items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <Folder className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">{mesa.code}</p>
              <h2 className="text-xl font-bold text-white leading-tight">{mesa.name}</h2>
            </div>
          </div>
          <div className="flex items-center gap-4 text-right flex-shrink-0">
            <div>
              <p className="text-2xl font-bold text-white tabular-nums">{specs.length}</p>
              <p className="text-white/60 text-xs">total</p>
            </div>
            {vigentes > 0 && (
              <div>
                <p className="text-2xl font-bold text-white tabular-nums">{vigentes}</p>
                <p className="text-white/60 text-xs">vigentes</p>
              </div>
            )}
            {enRevision > 0 && (
              <div>
                <p className="text-2xl font-bold text-white tabular-nums">{enRevision}</p>
                <p className="text-white/60 text-xs">en revisión</p>
              </div>
            )}
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

      {/* Lista de specs */}
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
            const emisor = spec.company?.short_name || spec.company?.name || spec.issued_by || '—'
            return (
              <div key={spec.id}
                className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50 group last:border-b-0">
                <span className="text-base w-5 flex-shrink-0">
                  {spec.storage_key ? '📄' : '📋'}
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
                <span className="hidden md:block text-xs text-slate-500 w-32 truncate">{emisor}</span>
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
          workspaceId={workspaceId} companies={companies} oficios={oficios}
          defaultMesaCode={mesa.code} onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  )
}

// ── Card de mesa (estilo carpeta) ─────────────────────────────────────────────

function MesaCard({
  mesa, specs, onSelect,
}: {
  mesa:     Mesa
  specs:    DesignSpec[]
  onSelect: () => void
}) {
  const palette  = getMesaPalette(mesa.code)
  const vigentes = specs.filter(s => s.status === 'vigente').length
  const revision = specs.filter(s => s.status === 'en_revision').length

  return (
    <button onClick={onSelect}
      className="group bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-slate-300 transition-all text-left w-full flex flex-col items-start gap-3">
      {/* Folder icon */}
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${palette.iconBg}`}>
        <Folder className={`w-5 h-5 ${palette.iconColor}`} strokeWidth={2} />
      </div>

      {/* Nombre */}
      <div className="flex-1 min-w-0 w-full">
        <h3 className="text-sm font-semibold text-[#1A2744] group-hover:text-[#007ACC] transition-colors leading-snug">
          {mesa.name}
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          {specs.length === 0
            ? 'Sin especificaciones'
            : `${specs.length} especificación${specs.length !== 1 ? 'es' : ''}`}
        </p>
      </div>

      {/* Stats */}
      {specs.length > 0 && (
        <div className="flex items-center gap-2 w-full pt-2 border-t border-slate-100">
          {vigentes > 0 && (
            <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              {vigentes} vigente{vigentes !== 1 ? 's' : ''}
            </span>
          )}
          {revision > 0 && (
            <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              {revision} en revisión
            </span>
          )}
        </div>
      )}
    </button>
  )
}

// ── Panel principal ───────────────────────────────────────────────────────────

export default function EspecificacionesPanel({
  specs, companies, oficios, workspaceId, userRole,
}: {
  specs:       DesignSpec[]
  companies:   Company[]
  oficios:     Oficio[]
  workspaceId: string
  userRole:    string
}) {
  const [selectedMesaCode, setSelectedMesaCode] = useState<string | null>(null)
  const [showUpload,        setShowUpload]        = useState(false)
  const canUpload = ['owner', 'admin', 'manager', 'engineer'].includes(userRole)

  const selectedMesa = selectedMesaCode ? MESAS.find(m => m.code === selectedMesaCode) ?? null : null

  if (selectedMesa) {
    return (
      <MesaDetailView
        mesa={selectedMesa}
        specs={specs.filter(s => s.specialty_code === selectedMesa.code)}
        userRole={userRole}
        workspaceId={workspaceId}
        companies={companies}
        oficios={oficios}
        onBack={() => setSelectedMesaCode(null)}
      />
    )
  }

  const totalSpecs = specs.length

  return (
    <div>
      {/* Sub-header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-slate-500">
          {MESAS.length} mesas · {totalSpecs} especificación{totalSpecs !== 1 ? 'es' : ''} en total
        </p>
        {canUpload && (
          <button onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1A2744] text-white text-sm font-semibold rounded-lg hover:bg-[#243560]">
            <Plus className="w-4 h-4" /> Nueva especificación
          </button>
        )}
      </div>

      {/* Grid de carpetas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {MESAS.map(mesa => (
          <MesaCard
            key={mesa.code}
            mesa={mesa}
            specs={specs.filter(s => s.specialty_code === mesa.code)}
            onSelect={() => setSelectedMesaCode(mesa.code)}
          />
        ))}
      </div>

      {/* Specs sin mesa asignada */}
      {specs.some(s => !s.specialty_code || !MESAS.find(m => m.code === s.specialty_code)) && (
        <div className="mt-3">
          <button
            onClick={() => setSelectedMesaCode('__other__')}
            className="w-full text-left p-4 bg-white border border-dashed border-slate-200 rounded-xl hover:border-slate-300 transition-colors flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Folder className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-500">
              Otras · {specs.filter(s => !s.specialty_code || !MESAS.find(m => m.code === s.specialty_code)).length} especificaciones
            </p>
          </button>
        </div>
      )}

      {showUpload && (
        <UploadModal
          workspaceId={workspaceId} companies={companies} oficios={oficios}
          defaultMesaCode={MESAS[0].code} onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  )
}
