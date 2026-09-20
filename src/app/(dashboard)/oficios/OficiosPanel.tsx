'use client'

import { useState, useMemo } from 'react'
import {
  Plus, X, Pencil, Trash2, Eye, Upload, Loader2,
  FileText, Filter, ChevronDown, Check, ArrowDownToLine,
  ArrowUpFromLine, Search
} from 'lucide-react'
import { createOficio, updateOficio, deleteOficio, updateOficioStatus } from './actions'

// ── Tipos ─────────────────────────────────────────────────────────────────────

type Oficio = {
  id: string
  tipo: 'entrada' | 'salida'
  no_oficio: string | null
  asunto: string
  fecha_documento: string | null
  proyecto_id: string | null
  especialidad: string | null
  estado: 'pendiente' | 'en_atencion' | 'respondido' | 'archivado'
  remitente: string | null
  destinatario: string | null
  assignee_id: string | null
  storage_key: string | null
  file_name: string | null
  file_type: string | null
  file_size: number | null
  notas: string | null
  created_at: string
  proyecto?: { id: string; name: string } | null
  assignee?: { id: string; full_name: string; initials: string | null } | null
}

type Project = { id: string; name: string }

type Member = {
  user_id: string
  role: string
  user?: { id: string; full_name: string; initials: string | null } | null
}

// ── Config ────────────────────────────────────────────────────────────────────

const ESTADO_CONFIG = {
  pendiente:   { label: 'Pendiente',   color: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-400' },
  en_atencion: { label: 'En atención', color: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500' },
  respondido:  { label: 'Respondido',  color: 'bg-green-100 text-green-700',   dot: 'bg-green-500' },
  archivado:   { label: 'Archivado',   color: 'bg-slate-100 text-slate-500',   dot: 'bg-slate-400' },
}

const FILE_TYPE_COLORS: Record<string, string> = {
  pdf:   'bg-red-50 text-red-500 border-red-100',
  docx:  'bg-indigo-50 text-indigo-500 border-indigo-100',
  doc:   'bg-indigo-50 text-indigo-500 border-indigo-100',
  xlsx:  'bg-green-50 text-green-600 border-green-100',
  other: 'bg-slate-50 text-slate-400 border-slate-100',
}

const ESPECIALIDADES = [
  'Estructuras', 'Arquitectura', 'Instalaciones', 'Civil', 'Topografía',
  'Mecánica', 'Eléctrica', 'Hidráulica', 'Sanitaria', 'General',
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatSize(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getInitials(name: string | null | undefined, fallback?: string | null): string {
  if (fallback) return fallback
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 4)
}

// ── EstadoBadge ───────────────────────────────────────────────────────────────

function EstadoBadge({ estado, small }: { estado: string; small?: boolean }) {
  const cfg = ESTADO_CONFIG[estado as keyof typeof ESTADO_CONFIG] || ESTADO_CONFIG.pendiente
  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full ${small ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'} ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

// ── FileChip ──────────────────────────────────────────────────────────────────

function FileChip({ fileType, fileName }: { fileType: string | null; fileName: string | null }) {
  if (!fileName) return null
  const type = fileType || 'other'
  const color = FILE_TYPE_COLORS[type] || FILE_TYPE_COLORS.other
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${color}`}>
      {type}
    </span>
  )
}

// ── AssigneeBadge ─────────────────────────────────────────────────────────────

function AssigneeBadge({ assignee }: { assignee: Oficio['assignee'] }) {
  if (!assignee) return <span className="text-slate-300 text-xs">—</span>
  const initials = getInitials(assignee.full_name, assignee.initials)
  return (
    <span
      title={assignee.full_name}
      className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#1A2744]/10 text-[#1A2744] text-[10px] font-bold"
    >
      {initials}
    </span>
  )
}

// ── Subida de archivo ─────────────────────────────────────────────────────────

async function uploadFile(file: File, workspaceId: string, tipo: string): Promise<{
  storageKey: string; fileType: string; error?: string
} | null> {
  const presignRes = await fetch('/api/oficios/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workspaceId,
      tipo,
      fileName:    file.name,
      contentType: file.type || 'application/octet-stream',
      fileSize:    file.size,
    }),
  })
  const presignData = await presignRes.json()
  if (!presignRes.ok) return null

  const ok = await new Promise<boolean>((resolve) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', presignData.uploadUrl)
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
    xhr.onload  = () => resolve(xhr.status >= 200 && xhr.status < 300)
    xhr.onerror = () => resolve(false)
    xhr.send(file)
  })

  if (!ok) return null
  return { storageKey: presignData.storageKey, fileType: presignData.fileType }
}

// ── OficioModal ───────────────────────────────────────────────────────────────

function OficioModal({
  oficio, tipo, projects, members, workspaceId, onClose,
}: {
  oficio?: Oficio | null
  tipo: 'entrada' | 'salida'
  projects: Project[]
  members: Member[]
  workspaceId: string
  onClose: () => void
}) {
  const isEdit = !!oficio
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [file,      setFile]      = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true); setError(null)
    const fd = new FormData(e.currentTarget)

    let storageKey = oficio?.storage_key || null
    let fileType   = oficio?.file_type   || null
    let fileSize   = oficio?.file_size   || null
    let fileName   = oficio?.file_name   || null

    if (file) {
      setUploading(true)
      const uploaded = await uploadFile(file, workspaceId, tipo)
      setUploading(false)
      if (!uploaded) { setError('Error al subir el archivo'); setLoading(false); return }
      storageKey = uploaded.storageKey
      fileType   = uploaded.fileType
      fileSize   = file.size
      fileName   = file.name
    }

    const payload = {
      tipo,
      asunto:          fd.get('asunto') as string,
      no_oficio:       (fd.get('no_oficio') as string) || null,
      fecha_documento: (fd.get('fecha_documento') as string) || null,
      proyecto_id:     (fd.get('proyecto_id') as string) || null,
      especialidad:    (fd.get('especialidad') as string) || null,
      remitente:       (fd.get('remitente') as string) || null,
      destinatario:    (fd.get('destinatario') as string) || null,
      assignee_id:     (fd.get('assignee_id') as string) || null,
      notas:           (fd.get('notas') as string) || null,
      storage_key:     storageKey,
      file_name:       fileName,
      file_type:       fileType,
      file_size:       fileSize,
    }

    const result = isEdit
      ? await updateOficio(oficio!.id, payload)
      : await createOficio(payload as any)

    setLoading(false)
    if (result?.error) { setError(result.error); return }
    onClose()
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50 focus:border-[#00C2FF]'
  const labelCls = 'block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="text-base font-bold text-[#1A2744]">
            {isEdit ? 'Editar oficio' : `Nuevo oficio de ${tipo}`}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* No. oficio + Fecha */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>No. oficio</label>
              <input name="no_oficio" defaultValue={oficio?.no_oficio || ''} placeholder="Ej: OF-001-2026" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Fecha del documento</label>
              <input name="fecha_documento" type="date" defaultValue={oficio?.fecha_documento?.slice(0, 10) || ''} className={inputCls} />
            </div>
          </div>

          {/* Asunto */}
          <div>
            <label className={labelCls}>Asunto *</label>
            <input name="asunto" required defaultValue={oficio?.asunto || ''} placeholder="Descripción del asunto..." className={inputCls} />
          </div>

          {/* Remitente / Destinatario */}
          <div>
            <label className={labelCls}>{tipo === 'entrada' ? 'Remitente' : 'Destinatario'}</label>
            {tipo === 'entrada'
              ? <input name="remitente"    defaultValue={oficio?.remitente    || ''} placeholder="Empresa o dependencia que lo envía" className={inputCls} />
              : <input name="destinatario" defaultValue={oficio?.destinatario || ''} placeholder="A quién va dirigido" className={inputCls} />
            }
          </div>

          {/* Proyecto + Especialidad */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Proyecto</label>
              <select name="proyecto_id" defaultValue={oficio?.proyecto_id || ''} className={inputCls}>
                <option value="">— Sin proyecto —</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Especialidad</label>
              <select name="especialidad" defaultValue={oficio?.especialidad || ''} className={inputCls}>
                <option value="">— Sin especialidad —</option>
                {ESPECIALIDADES.map(e => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Asignado (solo entrada) */}
          {tipo === 'entrada' && (
            <div>
              <label className={labelCls}>Asignar a</label>
              <select name="assignee_id" defaultValue={oficio?.assignee_id || ''} className={inputCls}>
                <option value="">— Sin asignar —</option>
                {members.map(m => {
                  const name     = m.user?.full_name || m.user_id
                  const initials = getInitials(m.user?.full_name, m.user?.initials)
                  return (
                    <option key={m.user_id} value={m.user_id}>
                      {initials} — {name}
                    </option>
                  )
                })}
              </select>
            </div>
          )}

          {/* Archivo adjunto */}
          <div>
            <label className={labelCls}>
              Archivo {tipo === 'entrada' ? '(PDF o anexo)' : '(PDF o Word)'}
            </label>
            {oficio?.file_name && !file && (
              <div className="flex items-center gap-2 mb-2 text-xs text-slate-500">
                <FileChip fileType={oficio.file_type} fileName={oficio.file_name} />
                <span className="truncate">{oficio.file_name}</span>
                <span className="text-slate-300">{formatSize(oficio.file_size)}</span>
              </div>
            )}
            <label className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors text-sm text-slate-500">
              <Upload className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{file ? file.name : 'Seleccionar archivo...'}</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.xlsx,.xls,.png,.jpg,.jpeg,.zip"
                className="hidden"
                onChange={e => setFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          {/* Notas */}
          <div>
            <label className={labelCls}>Notas internas</label>
            <textarea name="notas" rows={2} defaultValue={oficio?.notas || ''} placeholder="Observaciones..." className={`${inputCls} resize-none`} />
          </div>

          {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">{error}</div>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || uploading}
              className="flex-1 py-2.5 rounded-lg bg-[#1A2744] text-white text-sm font-bold hover:bg-[#243660] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {(loading || uploading) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {uploading ? 'Subiendo...' : loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear oficio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── EstadoDropdown ────────────────────────────────────────────────────────────

function EstadoDropdown({ oficio }: { oficio: Oficio }) {
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleChange(estado: string) {
    setLoading(true); setOpen(false)
    await updateOficioStatus(oficio.id, estado)
    setLoading(false)
  }

  const cfg = ESTADO_CONFIG[oficio.estado] || ESTADO_CONFIG.pendiente

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-opacity disabled:opacity-50 ${cfg.color}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        {cfg.label}
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 bg-white rounded-xl shadow-lg border border-slate-100 py-1 min-w-[150px]">
            {Object.entries(ESTADO_CONFIG).map(([key, c]) => (
              <button
                key={key}
                onClick={() => handleChange(key)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50 text-slate-700"
              >
                <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                {c.label}
                {key === oficio.estado && <Check className="w-3 h-3 ml-auto text-[#00C2FF]" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── OficioRow ─────────────────────────────────────────────────────────────────

function OficioRow({
  oficio, projects, members, workspaceId, canEdit,
  onEdit,
}: {
  oficio: Oficio
  projects: Project[]
  members: Member[]
  workspaceId: string
  canEdit: boolean
  onEdit: (o: Oficio) => void
}) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm(`¿Eliminar el oficio "${oficio.asunto}"?`)) return
    setDeleting(true)
    await deleteOficio(oficio.id)
  }

  return (
    <tr className="hover:bg-slate-50 transition-colors group">
      {/* No. oficio */}
      <td className="px-4 py-3 text-xs font-mono text-slate-500 whitespace-nowrap">
        {oficio.no_oficio || <span className="text-slate-300">—</span>}
      </td>

      {/* Asunto */}
      <td className="px-4 py-3">
        <div className="flex items-start gap-2 min-w-0">
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#1A2744] truncate max-w-[260px]">{oficio.asunto}</p>
            {(oficio.remitente || oficio.destinatario) && (
              <p className="text-xs text-slate-400 truncate max-w-[260px]">
                {oficio.tipo === 'entrada' ? oficio.remitente : oficio.destinatario}
              </p>
            )}
          </div>
          {oficio.storage_key && (
            <a
              href={`/api/oficios/view/${oficio.id}`}
              target="_blank"
              rel="noopener noreferrer"
              title={oficio.file_name || 'Ver archivo'}
              className="flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <FileChip fileType={oficio.file_type} fileName={oficio.file_name} />
            </a>
          )}
        </div>
      </td>

      {/* Fecha */}
      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
        {formatDate(oficio.fecha_documento)}
      </td>

      {/* Proyecto / Especialidad */}
      <td className="px-4 py-3">
        <div className="space-y-0.5">
          {oficio.proyecto?.name && (
            <p className="text-xs font-medium text-slate-600 truncate max-w-[140px]">{oficio.proyecto.name}</p>
          )}
          {oficio.especialidad && (
            <p className="text-[10px] text-slate-400">{oficio.especialidad}</p>
          )}
          {!oficio.proyecto && !oficio.especialidad && (
            <span className="text-slate-300 text-xs">—</span>
          )}
        </div>
      </td>

      {/* Estado (solo entrada) / vacío para salida */}
      <td className="px-4 py-3">
        {oficio.tipo === 'entrada'
          ? <EstadoDropdown oficio={oficio} />
          : <span className="text-slate-300 text-xs">—</span>
        }
      </td>

      {/* Asignado */}
      <td className="px-4 py-3">
        <AssigneeBadge assignee={oficio.assignee} />
      </td>

      {/* Acciones */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {oficio.storage_key && (
            <a
              href={`/api/oficios/view/${oficio.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#00C2FF]/10 text-slate-400 hover:text-[#00C2FF] transition-colors"
              title="Ver archivo"
            >
              <Eye className="w-3.5 h-3.5" />
            </a>
          )}
          {canEdit && (
            <>
              <button
                onClick={() => onEdit(oficio)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                title="Editar"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors disabled:opacity-40"
                title="Eliminar"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}

// ── Panel principal ───────────────────────────────────────────────────────────

type Tab = 'entrada' | 'salida'

export default function OficiosPanel({
  oficios, projects, members, workspaceId, currentUserId, currentUserRole,
}: {
  oficios: Oficio[]
  projects: Project[]
  members: Member[]
  workspaceId: string
  currentUserId: string
  currentUserRole: string
}) {
  const [tab,        setTab]        = useState<Tab>('entrada')
  const [showModal,  setShowModal]  = useState(false)
  const [editOficio, setEditOficio] = useState<Oficio | null>(null)

  // Filtros
  const [search,        setSearch]        = useState('')
  const [filterFrom,    setFilterFrom]    = useState('')
  const [filterTo,      setFilterTo]      = useState('')
  const [filterProject, setFilterProject] = useState('')
  const [filterEsp,     setFilterEsp]     = useState('')

  const canEdit = ['owner', 'admin', 'manager'].includes(currentUserRole)

  const filtered = useMemo(() => {
    return oficios.filter(o => {
      if (o.tipo !== tab) return false
      if (search) {
        const q = search.toLowerCase()
        if (!o.asunto.toLowerCase().includes(q) &&
            !(o.no_oficio?.toLowerCase().includes(q)) &&
            !(o.remitente?.toLowerCase().includes(q)) &&
            !(o.destinatario?.toLowerCase().includes(q))) return false
      }
      if (filterProject && o.proyecto_id !== filterProject) return false
      if (filterEsp && o.especialidad !== filterEsp) return false
      if (filterFrom && o.fecha_documento && o.fecha_documento < filterFrom) return false
      if (filterTo   && o.fecha_documento && o.fecha_documento > filterTo)   return false
      return true
    })
  }, [oficios, tab, search, filterProject, filterEsp, filterFrom, filterTo])

  const countEntrada = oficios.filter(o => o.tipo === 'entrada').length
  const countSalida  = oficios.filter(o => o.tipo === 'salida').length

  function openNew() {
    setEditOficio(null)
    setShowModal(true)
  }
  function openEdit(o: Oficio) {
    setEditOficio(o)
    setShowModal(true)
  }
  function closeModal() {
    setShowModal(false)
    setEditOficio(null)
  }

  const inputCls = 'px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40 bg-white'

  return (
    <div>
      {/* Tabs: Entrada / Salida */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-0.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setTab('entrada')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === 'entrada' ? 'bg-white text-[#1A2744] shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <ArrowDownToLine className="w-4 h-4" />
            Entrada
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === 'entrada' ? 'bg-[#1A2744] text-white' : 'bg-slate-300 text-slate-600'}`}>
              {countEntrada}
            </span>
          </button>
          <button
            onClick={() => setTab('salida')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === 'salida' ? 'bg-white text-[#1A2744] shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <ArrowUpFromLine className="w-4 h-4" />
            Salida
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === 'salida' ? 'bg-[#1A2744] text-white' : 'bg-slate-300 text-slate-600'}`}>
              {countSalida}
            </span>
          </button>
        </div>

        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-[#1A2744] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#243660] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo oficio
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por asunto, No., remitente..."
            className={`${inputCls} pl-8 w-64`}
          />
        </div>

        <input
          type="date"
          value={filterFrom}
          onChange={e => setFilterFrom(e.target.value)}
          title="Desde"
          className={inputCls}
        />
        <input
          type="date"
          value={filterTo}
          onChange={e => setFilterTo(e.target.value)}
          title="Hasta"
          className={inputCls}
        />

        <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className={inputCls}>
          <option value="">Todos los proyectos</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        <select value={filterEsp} onChange={e => setFilterEsp(e.target.value)} className={inputCls}>
          <option value="">Todas las especialidades</option>
          {ESPECIALIDADES.map(e => <option key={e} value={e}>{e}</option>)}
        </select>

        {(search || filterFrom || filterTo || filterProject || filterEsp) && (
          <button
            onClick={() => { setSearch(''); setFilterFrom(''); setFilterTo(''); setFilterProject(''); setFilterEsp('') }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-red-500 hover:bg-red-50 border border-slate-200 transition-colors"
          >
            <X className="w-3 h-3" />
            Limpiar
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
              {tab === 'entrada'
                ? <ArrowDownToLine className="w-7 h-7 text-slate-300" />
                : <ArrowUpFromLine className="w-7 h-7 text-slate-300" />
              }
            </div>
            <p className="text-sm font-semibold text-[#1A2744] mb-1">
              Sin oficios de {tab === 'entrada' ? 'entrada' : 'salida'}
            </p>
            <p className="text-xs text-slate-400 mb-4">
              {search || filterFrom || filterTo || filterProject || filterEsp
                ? 'No hay resultados con los filtros aplicados.'
                : `Registra el primer oficio de ${tab} con el botón "Nuevo oficio".`
              }
            </p>
            {!search && !filterFrom && !filterTo && !filterProject && !filterEsp && (
              <button
                onClick={openNew}
                className="flex items-center gap-2 bg-[#1A2744] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#243660] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nuevo oficio
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">No. oficio</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Asunto</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Fecha doc.</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Proyecto / Especialidad</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Asignado</th>
                  <th className="px-4 py-3 w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(o => (
                  <OficioRow
                    key={o.id}
                    oficio={o}
                    projects={projects}
                    members={members}
                    workspaceId={workspaceId}
                    canEdit={canEdit}
                    onEdit={openEdit}
                  />
                ))}
              </tbody>
            </table>
            <div className="px-4 py-2.5 border-t border-slate-50 bg-slate-50/50">
              <p className="text-xs text-slate-400">
                {filtered.length} oficio{filtered.length !== 1 ? 's' : ''} de {tab}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <OficioModal
          oficio={editOficio}
          tipo={editOficio ? editOficio.tipo : tab}
          projects={projects}
          members={members}
          workspaceId={workspaceId}
          onClose={closeModal}
        />
      )}
    </div>
  )
}
