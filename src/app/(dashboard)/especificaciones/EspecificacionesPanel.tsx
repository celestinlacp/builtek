'use client'

import React, { useState, useRef } from 'react'
import { saveDesignSpec, updateSpecStatus, deleteDesignSpec } from './actions'
import {
  Plus, X, Upload, FileText, ChevronDown, Loader2, Trash2,
  Eye, AlertTriangle, CheckCircle2, Clock, ExternalLink,
} from 'lucide-react'

// ── Tipos ─────────────────────────────────────────────────────────────────────

type Specialty = { id: string; name: string; code: string; category: string }
type Company   = { id: string; name: string; short_name: string | null }
type Oficio    = { id: string; no_oficio: string | null; asunto: string; remitente: string | null }

type DesignSpec = {
  id:           string
  workspace_id: string
  specialty_id: string | null
  title:        string
  spec_code:    string | null
  version:      string
  issued_by:    string | null
  company_id:   string | null
  oficio_id:    string | null
  issued_date:  string | null
  status:       'vigente' | 'en_revision' | 'supersedida'
  storage_key:  string | null
  file_name:    string | null
  file_type:    string | null
  file_size:    number | null
  notes:        string | null
  created_at:   string
  specialty?: { name: string; code: string; category: string } | null
  company?:   { name: string; short_name: string | null } | null
  oficio?:    { no_oficio: string | null; asunto: string } | null
}

// ── Configuración de estado ───────────────────────────────────────────────────

const STATUS_CONFIG = {
  vigente:      { label: 'Vigente',     color: 'bg-green-100 text-green-700',  icon: CheckCircle2 },
  en_revision:  { label: 'En revisión', color: 'bg-amber-100 text-amber-700',  icon: Clock },
  supersedida:  { label: 'Supersedida', color: 'bg-slate-100 text-slate-500',  icon: AlertTriangle },
}

const CATEGORY_LABELS: Record<string, string> = {
  tecnico:        'Técnicas',
  administrativo: 'Administrativas',
  seguridad:      'Seguridad',
  otro:           'Otras',
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

// ── Modal: subir nueva especificación ─────────────────────────────────────────

function UploadModal({
  workspaceId, specialties, companies, oficios, onClose,
}: {
  workspaceId: string
  specialties: Specialty[]
  companies:   Company[]
  oficios:     Oficio[]
  onClose:     () => void
}) {
  const [title,       setTitle]       = useState('')
  const [specCode,    setSpecCode]    = useState('')
  const [version,     setVersion]     = useState('V1')
  const [specialtyId, setSpecialtyId] = useState('')
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

  const selectedSpecialty = specialties.find(s => s.id === specialtyId)

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
          specialtyCode: selectedSpecialty?.code || 'GEN',
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
        workspace_id: workspaceId,
        specialty_id: specialtyId || null,
        title:        title.trim(),
        spec_code:    specCode.trim() || null,
        version:      version.trim() || 'V1',
        issued_by:    issuedBy.trim() || null,
        company_id:   companyId || null,
        oficio_id:    oficioId || null,
        issued_date:  issuedDate || null,
        notes:        notes.trim() || null,
        storage_key:  storageKey,
        file_name:    fileName,
        file_type:    fileType,
        file_size:    fileSize,
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
          {/* Título */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Título *</label>
            <input
              value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Ej: Especificación de cimentaciones profundas"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40" />
          </div>

          {/* Código y Versión */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Código</label>
              <input
                value={specCode} onChange={e => setSpecCode(e.target.value)}
                placeholder="Ej: ET-EST-001"
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Versión</label>
              <input
                value={version} onChange={e => setVersion(e.target.value)}
                placeholder="V1"
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40" />
            </div>
          </div>

          {/* Especialidad */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Especialidad (mesa)</label>
            <select
              value={specialtyId} onChange={e => setSpecialtyId(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40">
              <option value="">Sin especialidad</option>
              {Object.entries(
                specialties.reduce<Record<string, Specialty[]>>((acc, s) => {
                  if (!acc[s.category]) acc[s.category] = []
                  acc[s.category].push(s)
                  return acc
                }, {})
              ).map(([cat, items]) => (
                <optgroup key={cat} label={CATEGORY_LABELS[cat] ?? cat}>
                  {items.map(s => <option key={s.id} value={s.id}>[{s.code}] {s.name}</option>)}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Emitido por */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Mesa / Emitido por</label>
              <input
                value={issuedBy} onChange={e => setIssuedBy(e.target.value)}
                placeholder="Ej: Mesa de Estructuras"
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Empresa</label>
              <select
                value={companyId} onChange={e => setCompanyId(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40">
                <option value="">— ninguna —</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.short_name || c.name}</option>)}
              </select>
            </div>
          </div>

          {/* Oficio vinculado + Fecha */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Oficio de entrada vinculado</label>
              <select
                value={oficioId} onChange={e => setOficioId(e.target.value)}
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
              <input
                type="date" value={issuedDate} onChange={e => setIssuedDate(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40" />
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Notas</label>
            <textarea
              value={notes} onChange={e => setNotes(e.target.value)} rows={2}
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
              <button
                onClick={() => inputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 rounded-lg text-sm text-slate-400 hover:border-[#00C2FF] hover:text-[#00C2FF] transition-colors">
                <Upload className="w-4 h-4" />
                Seleccionar archivo
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

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
          <button onClick={onClose} disabled={uploading}
            className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 font-medium disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={uploading || !title.trim()}
            className="px-5 py-2 bg-[#1A2744] text-white text-sm font-semibold rounded-lg hover:bg-[#243560] disabled:opacity-50 flex items-center gap-2">
            {uploading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Subiendo...</> : 'Guardar especificación'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Badge de estado con menú de transición ────────────────────────────────────

function StatusBadge({ spec, userRole }: { spec: DesignSpec; userRole: string }) {
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)
  const cfg    = STATUS_CONFIG[spec.status]
  const Icon   = cfg.icon
  const isAdmin = ['owner', 'admin', 'manager'].includes(userRole)

  const transitions: { label: string; to: DesignSpec['status'] }[] = []
  if (isAdmin) {
    if (spec.status !== 'vigente')     transitions.push({ label: '✓ Marcar vigente',     to: 'vigente' })
    if (spec.status !== 'en_revision') transitions.push({ label: '◎ Poner en revisión',  to: 'en_revision' })
    if (spec.status !== 'supersedida') transitions.push({ label: '✕ Marcar supersedida', to: 'supersedida' })
  }

  async function change(to: DesignSpec['status']) {
    setLoading(true); setOpen(false)
    await updateSpecStatus(spec.id, to)
    setLoading(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => transitions.length > 0 && setOpen(v => !v)}
        disabled={loading}
        className={`text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1 ${cfg.color} ${transitions.length > 0 ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'}`}>
        <Icon className="w-3 h-3" />
        {loading ? '...' : cfg.label}
        {transitions.length > 0 && <ChevronDown className="w-3 h-3" />}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-7 left-0 z-20 bg-white rounded-lg shadow-lg border border-slate-100 py-1 w-44">
            {transitions.map(t => (
              <button key={t.to} onClick={() => change(t.to)}
                className="w-full text-left px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">
                {t.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Fila de una especificación ────────────────────────────────────────────────

function SpecRow({
  spec, userRole, workspaceId,
}: {
  spec: DesignSpec
  userRole: string
  workspaceId: string
}) {
  const [deleting, setDeleting] = useState(false)
  const isAdmin = ['owner', 'admin'].includes(userRole)

  async function handleDelete() {
    if (!confirm(`¿Eliminar "${spec.title}"?`)) return
    setDeleting(true)
    await deleteDesignSpec(spec.id)
  }

  async function handleView() {
    if (!spec.storage_key) return
    const res = await fetch('/api/documents/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storageKey: spec.storage_key, workspaceId }),
    })
    if (!res.ok) return
    const { url } = await res.json()
    window.open(url, '_blank')
  }

  const mesa = spec.company?.short_name || spec.company?.name || spec.issued_by || '—'

  return (
    <div className={`flex items-center gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50 group ${deleting ? 'opacity-50' : ''}`}>
      {/* Icono */}
      <span className="text-base w-5 flex-shrink-0">{spec.file_type === 'pdf' ? '📄' : spec.storage_key ? '📁' : '📋'}</span>

      {/* Info principal */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700 truncate">{spec.title}</p>
        <p className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap mt-0.5">
          {spec.spec_code && (
            <span className="font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">{spec.spec_code}</span>
          )}
          <span className="font-mono bg-[#00C2FF]/10 text-[#0099CC] px-1.5 py-0.5 rounded font-bold text-[10px]">{spec.version}</span>
          {spec.file_size && <><span>·</span><span>{formatSize(spec.file_size)}</span></>}
          {spec.oficio && (
            <>
              <span>·</span>
              <span className="text-[#1A2744]">
                Oficio: {spec.oficio.no_oficio || spec.oficio.asunto.slice(0, 30)}
              </span>
            </>
          )}
          {spec.notes && <><span>·</span><span className="truncate max-w-[200px]">{spec.notes}</span></>}
        </p>
      </div>

      {/* Mesa */}
      <span className="hidden md:block text-xs text-slate-500 w-32 truncate">{mesa}</span>

      {/* Fecha */}
      <span className="hidden lg:block text-xs text-slate-400 w-28">{formatDate(spec.issued_date)}</span>

      {/* Estado */}
      <div className="w-28">
        <StatusBadge spec={spec} userRole={userRole} />
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity w-16 justify-end">
        {spec.storage_key && (
          <button onClick={handleView} title="Ver archivo"
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#00C2FF] hover:bg-slate-100">
            <Eye className="w-3.5 h-3.5" />
          </button>
        )}
        {isAdmin && (
          <button onClick={handleDelete} disabled={deleting} title="Eliminar"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-50">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

// ── Panel principal ───────────────────────────────────────────────────────────

export default function EspecificacionesPanel({
  specs, specialties, companies, oficios, workspaceId, userRole,
}: {
  specs:       DesignSpec[]
  specialties: Specialty[]
  companies:   Company[]
  oficios:     Oficio[]
  workspaceId: string
  userRole:    string
}) {
  const [showUpload,      setShowUpload]      = useState(false)
  const [filterStatus,    setFilterStatus]    = useState('all')
  const [filterSpecialty, setFilterSpecialty] = useState('all')

  const canUpload = ['owner', 'admin', 'manager', 'engineer'].includes(userRole)

  // Aplicar filtros
  let filtered = specs
  if (filterStatus    !== 'all') filtered = filtered.filter(s => s.status === filterStatus)
  if (filterSpecialty !== 'all') filtered = filtered.filter(s =>
    filterSpecialty === 'none' ? !s.specialty : s.specialty?.code === filterSpecialty
  )

  // Agrupar por categoría → especialidad
  type Group = { specialty: Specialty | null; docs: DesignSpec[] }
  type CategoryGroup = { category: string; groups: Group[] }

  const categoryOrder = ['tecnico', 'administrativo', 'seguridad', 'otro']

  const bySpecialty = filtered.reduce<Record<string, DesignSpec[]>>((acc, s) => {
    const key = s.specialty?.code ?? '__none__'
    if (!acc[key]) acc[key] = []
    acc[key].push(s)
    return acc
  }, {})

  const categoryGroups: CategoryGroup[] = categoryOrder.map(cat => {
    const groups: Group[] = specialties
      .filter(sp => sp.category === cat && bySpecialty[sp.code])
      .map(sp => ({ specialty: sp, docs: bySpecialty[sp.code] }))
    // Sin especialidad asignada va a "otro"
    if (cat === 'otro' && bySpecialty['__none__']) {
      groups.push({ specialty: null, docs: bySpecialty['__none__'] })
    }
    return { category: cat, groups }
  }).filter(cg => cg.groups.length > 0)

  // Especialidades usadas (para filtro)
  const usedSpecialties = [...new Map(
    specs.filter(s => s.specialty).map(s => [s.specialty!.code, s.specialty!])
  ).values()].sort((a, b) => a.code.localeCompare(b.code))

  const totalVigentes = specs.filter(s => s.status === 'vigente').length

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-sm text-slate-500 mt-0.5">
              {specs.length} especificación{specs.length !== 1 ? 'es' : ''} registradas
              {totalVigentes > 0 && ` · ${totalVigentes} vigente${totalVigentes !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        {canUpload && (
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1A2744] text-white text-sm font-semibold rounded-lg hover:bg-[#243560] transition-colors">
            <Plus className="w-4 h-4" />
            Nueva especificación
          </button>
        )}
      </div>

      {/* Filtros */}
      {(usedSpecialties.length > 0 || specs.length > 0) && (
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40">
            <option value="all">Todos los estados</option>
            <option value="vigente">Vigentes</option>
            <option value="en_revision">En revisión</option>
            <option value="supersedida">Supersedidas</option>
          </select>
          {usedSpecialties.length > 1 && (
            <select value={filterSpecialty} onChange={e => setFilterSpecialty(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40">
              <option value="all">Todas las especialidades</option>
              <option value="none">Sin especialidad</option>
              {usedSpecialties.map(s => <option key={s.code} value={s.code}>[{s.code}] {s.name}</option>)}
            </select>
          )}
          {(filterStatus !== 'all' || filterSpecialty !== 'all') && (
            <button onClick={() => { setFilterStatus('all'); setFilterSpecialty('all') }}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 flex items-center gap-1">
              <X className="w-3 h-3" /> Limpiar
            </button>
          )}
          <span className="text-xs text-slate-400 ml-1">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Estado vacío */}
      {specs.length === 0 && (
        <div className="bg-white border border-slate-100 rounded-xl p-16 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-slate-300" />
          </div>
          <h2 className="text-lg font-bold text-[#1A2744] mb-2">Sin especificaciones registradas</h2>
          <p className="text-slate-400 text-sm max-w-xs mx-auto mb-6">
            Registra aquí las especificaciones de diseño que las mesas de especialistas envían por oficio.
          </p>
          {canUpload && (
            <button onClick={() => setShowUpload(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1A2744] text-white text-sm font-semibold rounded-lg hover:bg-[#243560]">
              <Plus className="w-4 h-4" /> Nueva especificación
            </button>
          )}
        </div>
      )}

      {/* Contenido agrupado */}
      {filtered.length === 0 && specs.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-xl p-10 text-center text-slate-400 text-sm">
          Sin resultados con los filtros aplicados.
        </div>
      )}

      <div className="space-y-6">
        {categoryGroups.map(({ category, groups }) => (
          <div key={category}>
            {/* Separador de categoría */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {CATEGORY_LABELS[category] ?? category}
              </span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            <div className="space-y-3">
              {groups.map(({ specialty, docs }) => (
                <SpecialtySection
                  key={specialty?.code ?? '__none__'}
                  specialty={specialty}
                  docs={docs}
                  userRole={userRole}
                  workspaceId={workspaceId}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {showUpload && (
        <UploadModal
          workspaceId={workspaceId}
          specialties={specialties}
          companies={companies}
          oficios={oficios}
          onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  )
}

// ── Sección por especialidad (colapsable) ─────────────────────────────────────

function SpecialtySection({
  specialty, docs, userRole, workspaceId,
}: {
  specialty:   Specialty | null
  docs:        DesignSpec[]
  userRole:    string
  workspaceId: string
}) {
  const [open, setOpen] = useState(true)
  const vigentes = docs.filter(d => d.status === 'vigente').length

  return (
    <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
      {/* Header especialidad */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors">
        <div className="flex items-center gap-3">
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? '' : '-rotate-90'}`} />
          <span className="text-sm font-semibold text-[#1A2744]">
            {specialty ? `[${specialty.code}] ${specialty.name}` : 'Sin especialidad'}
          </span>
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            {docs.length} doc{docs.length !== 1 ? 's' : ''}
          </span>
          {vigentes > 0 && (
            <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full font-medium">
              {vigentes} vigente{vigentes !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </button>

      {open && (
        <>
          {/* Header columnas */}
          <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 border-t border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wide">
            <span className="w-5" />
            <span className="flex-1">Especificación</span>
            <span className="hidden md:block w-32">Mesa / Empresa</span>
            <span className="hidden lg:block w-28">Fecha emisión</span>
            <span className="w-28">Estado</span>
            <span className="w-16" />
          </div>

          {docs.map(spec => (
            <SpecRow key={spec.id} spec={spec} userRole={userRole} workspaceId={workspaceId} />
          ))}
        </>
      )}
    </div>
  )
}
