'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { addComment, deleteComment, linkDocument, unlinkDocument, reprogramTask, uploadEntregable, approveEntregable, rejectEntregable, linkOficioToTask, unlinkOficioFromTask } from './actions'
import { Task, Project } from '@/types'
import {
  X, MessageSquare, Send, Trash2, Paperclip,
  FileText, HardDrive, ChevronDown, Calendar,
  AlertCircle, Clock, CheckCircle2, XCircle,
  Eye, Download, Plus, Loader2, User, Timer,
  Upload, Package, ThumbsUp, ThumbsDown, Mail
} from 'lucide-react'

// ── Tipos ────────────────────────────────────────────────────────────────────

type Comment = {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles?: { full_name: string | null; avatar_url: string | null } | null
}

type TaskDoc = {
  id: string
  document_id: string | null
  drive_file_id: string | null
  created_at: string
  documents?: { id: string; name: string; file_name: string | null; file_type: string } | null
  drive_files?: { id: string; name: string; file_type: string } | null
}

type Member = { user_id: string; full_name: string | null }

type Entregable = {
  id: string
  file_name: string
  file_type: string | null
  file_size: number | null
  status: 'pending' | 'approved' | 'rejected'
  review_note: string | null
  created_at: string
  uploaded_by: string
  uploader_name?: string | null
}

type AvailableDoc = {
  id: string
  name: string
  file_type: string
  source: 'document' | 'drive'
}

type LinkedOficio = {
  id: string
  no_oficio: string | null
  asunto: string
  tipo: 'entrada' | 'salida'
  estado: string
  fecha_documento: string | null
}

function getCountdown(due_date: string): { label: string; color: string; urgent: boolean } {
  const now = new Date()
  const due = new Date(due_date + 'T00:00:00')
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0)  return { label: `Vencida hace ${Math.abs(diffDays)}d`, color: 'bg-red-100 text-red-600',     urgent: true }
  if (diffDays === 0) return { label: 'Vence hoy',                           color: 'bg-orange-100 text-orange-600', urgent: true }
  if (diffDays === 1) return { label: 'Vence mañana',                        color: 'bg-orange-100 text-orange-500', urgent: true }
  if (diffDays <= 7)  return { label: `${diffDays} días`,                    color: 'bg-amber-100 text-amber-600',   urgent: false }
  return               { label: `${diffDays} días`,                          color: 'bg-slate-100 text-slate-500',   urgent: false }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending:     { label: 'Pendiente',    color: 'bg-slate-100 text-slate-500',   icon: Clock },
  in_progress: { label: 'En curso',     color: 'bg-blue-100 text-blue-700',     icon: AlertCircle },
  review:      { label: 'En revisión',  color: 'bg-amber-100 text-amber-700',   icon: Eye },
  done:        { label: 'Hecho',        color: 'bg-green-100 text-green-700',   icon: CheckCircle2 },
  blocked:     { label: 'Bloqueado',    color: 'bg-red-100 text-red-600',       icon: XCircle },
}

const PRIORITY_CONFIG = {
  low:    { label: 'Baja',     color: 'text-slate-400' },
  medium: { label: 'Media',    color: 'text-amber-500' },
  high:   { label: 'Alta',     color: 'text-orange-500' },
  urgent: { label: 'Urgente',  color: 'text-red-500' },
}

const FILE_ICONS: Record<string, string> = {
  pdf: '📄', dwg: '📐', dxf: '📐', xlsx: '📊', docx: '📝', img: '🖼️', other: '📁'
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffH   = Math.floor(diffMin / 60)
  const diffD   = Math.floor(diffH / 24)

  if (diffMin < 1)  return 'ahora'
  if (diffMin < 60) return `hace ${diffMin} min`
  if (diffH < 24)   return `hace ${diffH} h`
  if (diffD < 7)    return `hace ${diffD} día${diffD > 1 ? 's' : ''}`

  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

function getInitials(name: string | null | undefined) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

function Avatar({ name, size = 'md' }: { name: string | null | undefined; size?: 'sm' | 'md' }) {
  const colors = ['bg-[#00C2FF]', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500']
  const color  = colors[(name?.charCodeAt(0) || 0) % colors.length]
  const sz     = size === 'sm' ? 'w-6 h-6 text-[9px]' : 'w-8 h-8 text-xs'
  return (
    <div className={`${sz} ${color} rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white`}>
      {getInitials(name)}
    </div>
  )
}

// ── Link Document Modal ───────────────────────────────────────────────────────

function LinkDocModal({
  taskId, available, onClose
}: {
  taskId:    string
  available: AvailableDoc[]
  onClose:   () => void
}) {
  const [search,  setSearch]  = useState('')
  const [linking, setLinking] = useState<string | null>(null)

  const filtered = available.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase())
  )

  async function handleLink(doc: AvailableDoc) {
    setLinking(doc.id)
    await linkDocument({
      task_id:       taskId,
      document_id:   doc.source === 'document' ? doc.id : undefined,
      drive_file_id: doc.source === 'drive'    ? doc.id : undefined,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-[#1A2744]">Vincular documento</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
        <div className="p-4">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar documento..."
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40" />

          <div className="space-y-1 max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-6">Sin resultados</p>
            ) : filtered.map(doc => (
              <button key={doc.id} onClick={() => handleLink(doc)} disabled={linking === doc.id}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 text-left transition-colors">
                <span className="text-lg">{FILE_ICONS[doc.file_type] || '📁'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{doc.name}</p>
                  <p className="text-xs text-slate-400">
                    {doc.source === 'drive' ? 'Drive' : 'Documentos'} · {doc.file_type?.toUpperCase()}
                  </p>
                </div>
                {linking === doc.id
                  ? <Loader2 className="w-4 h-4 text-[#00C2FF] animate-spin flex-shrink-0" />
                  : <Plus className="w-4 h-4 text-slate-300 flex-shrink-0" />
                }
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── TaskSlideOver ─────────────────────────────────────────────────────────────

const CAN_REPROGRAM_ROLES = ['owner', 'admin', 'manager']

export default function TaskSlideOver({
  task, project, availableDocs, currentUserId, currentUserRole, members, workspaceId, onClose
}: {
  task:             Task & { project?: { name: string } }
  project?:         Project
  availableDocs:    AvailableDoc[]
  currentUserId:    string
  currentUserRole?: string
  members?:         Member[]
  workspaceId?:     string
  onClose:          () => void
}) {
  const supabase = createClient()

  const [comments,     setComments]     = useState<Comment[]>([])
  const [taskDocs,     setTaskDocs]     = useState<TaskDoc[]>([])
  const [loadingData,  setLoadingData]  = useState(true)
  const [newComment,   setNewComment]   = useState('')
  const [sending,      setSending]      = useState(false)
  const [entregables,     setEntregables]     = useState<Entregable[]>([])
  const [uploadingEnt,   setUploadingEnt]    = useState(false)
  const [entError,       setEntError]        = useState<string | null>(null)
  const [rejectingId,    setRejectingId]     = useState<string | null>(null)
  const [rejectNote,     setRejectNote]      = useState('')
  const [approvingId,    setApprovingId]     = useState<string | null>(null)
  const [showLinkModal,   setShowLinkModal]   = useState(false)
  const [unlinking,       setUnlinking]       = useState<string | null>(null)
  const [deleting,        setDeleting]        = useState<string | null>(null)
  const [commentError,    setCommentError]    = useState<string | null>(null)
  const [showReprogram,   setShowReprogram]   = useState(false)
  const [newDate,         setNewDate]         = useState('')
  const [reprogramReason, setReprogramReason] = useState('')
  const [reprogramming,   setReprogramming]   = useState(false)
  const [reprogramError,  setReprogramError]  = useState<string | null>(null)
  const [linkedOficios,      setLinkedOficios]      = useState<LinkedOficio[]>([])
  const [showOficioSelector, setShowOficioSelector] = useState(false)
  const [availableOficios,   setAvailableOficios]   = useState<LinkedOficio[]>([])
  const [loadingOficios,     setLoadingOficios]     = useState(false)
  const [unlinkingOficio,    setUnlinkingOficio]    = useState<string | null>(null)
  const commentsEndRef = useRef<HTMLDivElement>(null)
  const inputRef       = useRef<HTMLTextAreaElement>(null)

  const status   = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending
  const priority = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.medium
  const StatusIcon = status.icon

  const assignee = members?.find(m => m.user_id === task.assignee_id)
  const countdown = task.due_date && task.status !== 'done' ? getCountdown(task.due_date) : null
  const isOverdue = task.due_date && task.status !== 'done' && new Date(task.due_date + 'T00:00:00') < new Date()
  const canReprogram = isOverdue && currentUserRole && CAN_REPROGRAM_ROLES.includes(currentUserRole)

  async function handleEntregableUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !workspaceId) return
    setUploadingEnt(true)
    setEntError(null)
    try {
      // 1. Obtener presigned URL
      const presignRes = await fetch('/api/entregables/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId, taskId: task.id,
          fileName: file.name, contentType: file.type, fileSize: file.size,
        }),
      })
      if (!presignRes.ok) throw new Error('No se pudo preparar la subida')
      const { uploadUrl, storageKey, fileType } = await presignRes.json()

      // 2. Subir a R2
      const r2Res = await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
      if (!r2Res.ok) throw new Error('Error al subir el archivo')

      // 3. Guardar en DB + mover tarea a review
      const result = await uploadEntregable({
        taskId: task.id, workspaceId, storageKey,
        fileName: file.name, fileType, fileSize: file.size,
      })
      if (result?.error) throw new Error(result.error)
      await loadData()
    } catch (err: any) {
      setEntError(err.message || 'Error al subir entregable')
    } finally {
      setUploadingEnt(false)
      e.target.value = ''
    }
  }

  async function handleApprove(entId: string) {
    setApprovingId(entId)
    try {
      const result = await approveEntregable(entId, task.id)
      if (result?.error) setEntError(result.error)
      else await loadData()
    } finally {
      setApprovingId(null)
    }
  }

  async function handleReject(entId: string) {
    if (!rejectNote.trim()) { setEntError('Escribe el motivo del rechazo.'); return }
    setApprovingId(entId)
    try {
      const result = await rejectEntregable(entId, task.id, rejectNote.trim())
      if (result?.error) setEntError(result.error)
      else { setRejectingId(null); setRejectNote(''); await loadData() }
    } finally {
      setApprovingId(null)
    }
  }

  async function handleReprogram() {
    if (!newDate || !reprogramReason.trim()) {
      setReprogramError('Completa la nueva fecha y el motivo.')
      return
    }
    setReprogramming(true)
    setReprogramError(null)
    try {
      const result = await reprogramTask(task.id, newDate, reprogramReason.trim())
      if (result?.error) {
        setReprogramError(result.error)
      } else {
        setShowReprogram(false)
        setNewDate('')
        setReprogramReason('')
        await loadData()
      }
    } catch {
      setReprogramError('No se pudo reprogramar. Intenta de nuevo.')
    } finally {
      setReprogramming(false)
    }
  }

  const loadData = useCallback(async () => {
    const [commentsRes, taskDocsRes] = await Promise.all([
      supabase
        .from('comments')
        .select('id, content, created_at, user_id')
        .eq('task_id', task.id)
        .order('created_at', { ascending: true }),
      supabase
        .from('task_documents')
        .select('id, document_id, drive_file_id, created_at, documents(id, name, file_name, file_type), drive_files(id, name, file_type)')
        .eq('task_id', task.id),
    ])

    const rawComments = commentsRes.data ?? []

    // Fetch profiles separately to avoid indirect FK join issue
    const userIds = [...new Set(rawComments.map((c: any) => c.user_id).filter(Boolean))]
    const profilesRes = userIds.length > 0
      ? await supabase.from('profiles').select('id, full_name, avatar_url').in('id', userIds)
      : { data: [] }
    const profileMap = Object.fromEntries((profilesRes.data ?? []).map((p: any) => [p.id, p]))

    const commentsWithProfiles = rawComments.map((c: any) => ({
      ...c,
      profiles: profileMap[c.user_id] ?? null,
    }))

    setComments(commentsWithProfiles as unknown as Comment[])
    setTaskDocs((taskDocsRes.data ?? []) as unknown as TaskDoc[])

    // Fetch entregables
    const { data: rawEnts } = await supabase
      .from('entregables')
      .select('id, file_name, file_type, file_size, status, review_note, created_at, uploaded_by')
      .eq('task_id', task.id)
      .order('created_at', { ascending: false })

    const entUploaderIds = [...new Set((rawEnts ?? []).map((e: any) => e.uploaded_by))]
    const entProfilesRes = entUploaderIds.length > 0
      ? await supabase.from('profiles').select('id, full_name').in('id', entUploaderIds)
      : { data: [] }
    const entProfileMap = Object.fromEntries((entProfilesRes.data ?? []).map((p: any) => [p.id, p.full_name]))
    setEntregables((rawEnts ?? []).map((e: any) => ({ ...e, uploader_name: entProfileMap[e.uploaded_by] ?? null })))

    // Fetch oficios linked to this task
    const { data: rawOficios } = await supabase
      .from('oficios')
      .select('id, no_oficio, asunto, tipo, estado, fecha_documento')
      .eq('task_id', task.id)
    setLinkedOficios((rawOficios ?? []) as LinkedOficio[])

    setLoadingData(false)
  }, [task.id, supabase])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  async function handleSend() {
    if (!newComment.trim()) return
    setSending(true)
    setCommentError(null)
    try {
      const result = await addComment(task.id, newComment)
      if (result?.error) {
        setCommentError(result.error)
      } else {
        setNewComment('')
        await loadData()
      }
    } catch {
      setCommentError('No se pudo enviar el comentario. Intenta de nuevo.')
    } finally {
      setSending(false)
    }
  }

  async function handleDeleteComment(commentId: string) {
    setDeleting(commentId)
    await deleteComment(commentId)
    setComments(prev => prev.filter(c => c.id !== commentId))
    setDeleting(null)
  }

  async function handleUnlink(taskDocId: string) {
    setUnlinking(taskDocId)
    await unlinkDocument(taskDocId)
    setTaskDocs(prev => prev.filter(d => d.id !== taskDocId))
    setUnlinking(null)
  }

  async function handleOpenOficioSelector() {
    setLoadingOficios(true)
    setShowOficioSelector(true)
    const { data } = await supabase
      .from('oficios')
      .select('id, no_oficio, asunto, tipo, estado, fecha_documento')
      .is('task_id', null)
      .order('created_at', { ascending: false })
      .limit(50)
    setAvailableOficios((data ?? []) as LinkedOficio[])
    setLoadingOficios(false)
  }

  async function handleLinkOficio(oficioId: string) {
    const result = await linkOficioToTask(oficioId, task.id)
    if (!result?.error) {
      setShowOficioSelector(false)
      await loadData()
    }
  }

  async function handleUnlinkOficio(oficioId: string) {
    setUnlinkingOficio(oficioId)
    await unlinkOficioFromTask(oficioId)
    setLinkedOficios(prev => prev.filter(o => o.id !== oficioId))
    setUnlinkingOficio(null)
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />

      {/* Slide-over panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100 flex-shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold ${status.color}`}>
                <StatusIcon className="w-3 h-3" />
                {status.label}
              </span>
              <span className={`text-xs font-semibold ${priority.color}`}>
                ● {priority.label}
              </span>
              {task.specialty && (
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{task.specialty}</span>
              )}
            </div>
            <h2 className="text-lg font-bold text-[#1A2744] leading-snug">{task.name}</h2>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {task.project?.name && (
                <p className="text-xs text-slate-400">{task.project.name}</p>
              )}
              {assignee?.full_name && (
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" />
                  {assignee.full_name}
                </p>
              )}
              {countdown && (
                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${countdown.color}`}>
                  <Timer className="w-3 h-3" />
                  {countdown.label}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 flex-shrink-0">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Meta info */}
        <div className="px-6 py-3 border-b border-slate-50 flex items-center gap-4 flex-wrap flex-shrink-0">
          {task.due_date && (
            <div className={`flex items-center gap-1.5 text-xs font-medium ${isOverdue ? 'text-red-500' : 'text-slate-500'}`}>
              <Calendar className="w-3.5 h-3.5" />
              {isOverdue ? 'Vencida · ' : ''}
              {new Date(task.due_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          )}
          {task.description && (
            <p className="text-xs text-slate-400 flex-1">{task.description}</p>
          )}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">

          {/* Reprogramar — solo si vencida y tiene permiso */}
          {canReprogram && (
            <div className="px-6 py-4 border-b border-red-50 bg-red-50/40">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-red-600 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Tarea vencida — acción requerida
                </p>
                {!showReprogram && (
                  <button
                    onClick={() => setShowReprogram(true)}
                    className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Calendar className="w-3 h-3" />
                    Reprogramar
                  </button>
                )}
              </div>

              {showReprogram && (
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
                      Nueva fecha límite
                    </label>
                    <input
                      type="date"
                      value={newDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => setNewDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-300/50 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
                      Motivo del retraso
                    </label>
                    <textarea
                      value={reprogramReason}
                      onChange={e => setReprogramReason(e.target.value)}
                      placeholder="Ej: Retraso por proveedor, cambio de alcance..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300/50 bg-white"
                    />
                  </div>
                  {reprogramError && (
                    <p className="text-xs text-red-500">{reprogramError}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={handleReprogram}
                      disabled={reprogramming || !newDate || !reprogramReason.trim()}
                      className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      {reprogramming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Calendar className="w-3.5 h-3.5" />}
                      Confirmar reprogramación
                    </button>
                    <button
                      onClick={() => { setShowReprogram(false); setReprogramError(null) }}
                      className="px-3 py-2 text-xs text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Entregables */}
          <div className="px-6 py-4 border-b border-slate-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" />
                Entregables
                {entregables.length > 0 && (
                  <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full text-[10px]">{entregables.length}</span>
                )}
              </h3>
              {/* Solo miembros pueden subir, no cuando ya hay uno pending/approved */}
              {workspaceId && task.status !== 'done' && (
                <label className={`flex items-center gap-1 text-xs font-semibold cursor-pointer transition-opacity ${uploadingEnt ? 'opacity-50 pointer-events-none' : 'text-[#00C2FF] hover:opacity-80'}`}>
                  {uploadingEnt
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Upload className="w-3.5 h-3.5" />
                  }
                  {uploadingEnt ? 'Subiendo...' : 'Subir'}
                  <input type="file" className="hidden" onChange={handleEntregableUpload}
                    accept=".pdf,.dwg,.dxf,.docx,.xlsx,.png,.jpg,.jpeg,.zip" />
                </label>
              )}
            </div>

            {entError && <p className="text-xs text-red-500 mb-2">{entError}</p>}

            {loadingData ? (
              <div className="flex justify-center py-3"><Loader2 className="w-4 h-4 text-slate-300 animate-spin" /></div>
            ) : entregables.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">Sin entregables aún</p>
            ) : (
              <div className="space-y-2">
                {entregables.map(ent => {
                  const statusConfig = {
                    pending:  { label: 'En revisión', color: 'bg-amber-100 text-amber-700' },
                    approved: { label: 'Aprobado',    color: 'bg-green-100 text-green-700' },
                    rejected: { label: 'Rechazado',   color: 'bg-red-100 text-red-600' },
                  }[ent.status]

                  const canReview = currentUserRole && ['owner','admin','manager'].includes(currentUserRole)

                  return (
                    <div key={ent.id} className="bg-slate-50 rounded-lg px-3 py-2.5 space-y-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-700 truncate">{ent.file_name}</p>
                          <p className="text-[10px] text-slate-400">{ent.uploader_name || 'Usuario'} · {new Date(ent.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</p>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                        <a href={`/api/entregables/view/${ent.id}`} target="_blank" rel="noopener noreferrer"
                          className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-200 text-slate-400 flex-shrink-0">
                          <Eye className="w-3 h-3" />
                        </a>
                      </div>

                      {/* Nota de rechazo */}
                      {ent.status === 'rejected' && ent.review_note && (
                        <p className="text-[10px] text-red-500 bg-red-50 rounded px-2 py-1">
                          Motivo: {ent.review_note}
                        </p>
                      )}

                      {/* Botones de revisión — solo para managers+ y entregables pending */}
                      {canReview && ent.status === 'pending' && (
                        rejectingId === ent.id ? (
                          <div className="space-y-1.5">
                            <textarea
                              value={rejectNote}
                              onChange={e => setRejectNote(e.target.value)}
                              placeholder="Motivo del rechazo..."
                              rows={2}
                              className="w-full text-xs px-2 py-1.5 rounded border border-slate-200 resize-none focus:outline-none focus:ring-1 focus:ring-red-300"
                            />
                            <div className="flex gap-2">
                              <button onClick={() => handleReject(ent.id)} disabled={approvingId === ent.id}
                                className="flex-1 text-xs font-semibold bg-red-500 text-white py-1.5 rounded-lg hover:bg-red-600 disabled:opacity-50">
                                {approvingId === ent.id ? 'Enviando...' : 'Confirmar rechazo'}
                              </button>
                              <button onClick={() => { setRejectingId(null); setRejectNote('') }}
                                className="text-xs text-slate-500 px-3 py-1.5 rounded-lg hover:bg-slate-200">
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button onClick={() => handleApprove(ent.id)} disabled={!!approvingId}
                              className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold bg-green-500 text-white py-1.5 rounded-lg hover:bg-green-600 disabled:opacity-50">
                              <ThumbsUp className="w-3 h-3" />
                              {approvingId === ent.id ? 'Aprobando...' : 'Aprobar'}
                            </button>
                            <button onClick={() => setRejectingId(ent.id)} disabled={!!approvingId}
                              className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold bg-red-100 text-red-600 py-1.5 rounded-lg hover:bg-red-200 disabled:opacity-50">
                              <ThumbsDown className="w-3 h-3" />
                              Rechazar
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Documentos vinculados */}
          <div className="px-6 py-4 border-b border-slate-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5" />
                Entregables vinculados
                {taskDocs.length > 0 && (
                  <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full text-[10px]">{taskDocs.length}</span>
                )}
              </h3>
              <button onClick={() => setShowLinkModal(true)}
                className="flex items-center gap-1 text-xs text-[#00C2FF] font-semibold hover:opacity-80">
                <Plus className="w-3.5 h-3.5" /> Vincular
              </button>
            </div>

            {loadingData ? (
              <div className="flex justify-center py-3"><Loader2 className="w-4 h-4 text-slate-300 animate-spin" /></div>
            ) : taskDocs.length === 0 ? (
              <button onClick={() => setShowLinkModal(true)}
                className="w-full border border-dashed border-slate-200 rounded-lg py-4 text-center hover:border-[#00C2FF]/40 hover:bg-[#00C2FF]/5 transition-colors group">
                <Paperclip className="w-4 h-4 text-slate-300 group-hover:text-[#00C2FF] mx-auto mb-1" />
                <p className="text-xs text-slate-400 group-hover:text-[#00C2FF]">Vincular documento o archivo</p>
              </button>
            ) : (
              <div className="space-y-2">
                {taskDocs.map(td => {
                  const isDoc  = !!td.documents
                  const file   = isDoc ? td.documents : td.drive_files
                  const fileId = isDoc ? td.document_id : td.drive_file_id
                  const viewUrl = isDoc
                    ? `/api/documents/view/${fileId}`
                    : `/api/drive/view/${fileId}`
                  const dlUrl = isDoc
                    ? `/api/documents/download/${fileId}`
                    : `/api/drive/download/${fileId}`

                  return (
                    <div key={td.id} className="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2.5 group">
                      <span className="text-base">{FILE_ICONS[(file as any)?.file_type || 'other']}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-700 truncate">{(file as any)?.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {isDoc ? <span className="flex items-center gap-1"><FileText className="w-2.5 h-2.5" /> Documentos</span>
                                 : <span className="flex items-center gap-1"><HardDrive className="w-2.5 h-2.5" /> Drive</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {(file as any)?.file_type === 'pdf' && (
                          <a href={viewUrl} target="_blank" rel="noopener noreferrer"
                            className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600">
                            <Eye className="w-3 h-3" />
                          </a>
                        )}
                        <a href={dlUrl} target="_blank" rel="noopener noreferrer"
                          className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600">
                          <Download className="w-3 h-3" />
                        </a>
                        <button onClick={() => handleUnlink(td.id)} disabled={unlinking === td.id}
                          className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 text-slate-400 hover:text-red-500">
                          {unlinking === td.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Oficios vinculados */}
          <div className="px-6 py-4 border-b border-slate-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                Oficios vinculados
                {linkedOficios.length > 0 && (
                  <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full text-[10px]">{linkedOficios.length}</span>
                )}
              </h3>
              <button onClick={handleOpenOficioSelector}
                className="flex items-center gap-1 text-xs text-[#00C2FF] font-semibold hover:opacity-80">
                <Plus className="w-3.5 h-3.5" /> Vincular
              </button>
            </div>

            {loadingData ? (
              <div className="flex justify-center py-3"><Loader2 className="w-4 h-4 text-slate-300 animate-spin" /></div>
            ) : linkedOficios.length === 0 ? (
              <button onClick={handleOpenOficioSelector}
                className="w-full border border-dashed border-slate-200 rounded-lg py-4 text-center hover:border-[#00C2FF]/40 hover:bg-[#00C2FF]/5 transition-colors group">
                <Mail className="w-4 h-4 text-slate-300 group-hover:text-[#00C2FF] mx-auto mb-1" />
                <p className="text-xs text-slate-400 group-hover:text-[#00C2FF]">Vincular oficio a esta tarea</p>
              </button>
            ) : (
              <div className="space-y-2">
                {linkedOficios.map(oficio => (
                  <div key={oficio.id} className="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2.5 group">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${oficio.tipo === 'entrada' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                      {oficio.tipo === 'entrada' ? 'ENT' : 'SAL'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">{oficio.asunto}</p>
                      <p className="text-[10px] text-slate-400">
                        {oficio.no_oficio ? `${oficio.no_oficio} · ` : ''}{oficio.estado}
                        {oficio.fecha_documento ? ` · ${new Date(oficio.fecha_documento).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a href={`/api/oficios/view/${oficio.id}`} target="_blank" rel="noopener noreferrer"
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600">
                        <Eye className="w-3 h-3" />
                      </a>
                      <button onClick={() => handleUnlinkOficio(oficio.id)} disabled={unlinkingOficio === oficio.id}
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 text-slate-400 hover:text-red-500">
                        {unlinkingOficio === oficio.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comentarios */}
          <div className="px-6 py-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5 mb-4">
              <MessageSquare className="w-3.5 h-3.5" />
              Comentarios
              {comments.length > 0 && (
                <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full text-[10px]">{comments.length}</span>
              )}
            </h3>

            {loadingData ? (
              <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-slate-300 animate-spin" /></div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Sin comentarios aún</p>
                <p className="text-xs text-slate-300 mt-1">Sé el primero en comentar</p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map(comment => {
                  const isOwn = comment.user_id === currentUserId
                  const name  = (comment.profiles as any)?.full_name || 'Usuario'
                  return (
                    <div key={comment.id} className="flex gap-3 group">
                      <Avatar name={name} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-xs font-bold text-slate-700">{name}</span>
                          <span className="text-[10px] text-slate-400">{formatDateTime(comment.created_at)}</span>
                        </div>
                        <div className="bg-slate-50 rounded-xl rounded-tl-sm px-3 py-2.5">
                          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      </div>
                      {isOwn && (
                        <button onClick={() => handleDeleteComment(comment.id)} disabled={deleting === comment.id}
                          className="w-6 h-6 flex items-center justify-center rounded text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 mt-5">
                          {deleting === comment.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  )
                })}
                <div ref={commentsEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input comentario */}
        <div className="px-6 py-4 border-t border-slate-100 flex-shrink-0 bg-white">
          <div className="flex gap-3 items-end">
            <Avatar name="Tú" size="sm" />
            <div className="flex-1 flex items-end gap-2 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-200 focus-within:border-[#00C2FF]/50 focus-within:ring-2 focus-within:ring-[#00C2FF]/20 transition-all">
              <textarea
                ref={inputRef}
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder="Escribe un comentario... (Enter para enviar)"
                rows={1}
                className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none resize-none max-h-28 leading-relaxed"
              />
              <button
                onClick={handleSend}
                disabled={sending || !newComment.trim()}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#1A2744] text-white disabled:opacity-40 hover:bg-[#243660] transition-colors flex-shrink-0">
                {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          {commentError
            ? <p className="text-[10px] text-red-400 mt-1.5 ml-9">{commentError}</p>
            : <p className="text-[10px] text-slate-300 mt-1.5 ml-9">Enter para enviar · Shift+Enter para nueva línea</p>
          }
        </div>
      </div>

      {/* Modal vincular documento */}
      {showLinkModal && (
        <LinkDocModal
          taskId={task.id}
          available={availableDocs}
          onClose={() => { setShowLinkModal(false); loadData() }}
        />
      )}

      {/* Modal vincular oficio */}
      {showOficioSelector && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowOficioSelector(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold text-[#1A2744]">Vincular oficio</h3>
              <button onClick={() => setShowOficioSelector(false)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="p-4">
              {loadingOficios ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-slate-300 animate-spin" /></div>
              ) : availableOficios.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-6">No hay oficios sin asignar a tarea</p>
              ) : (
                <div className="space-y-1 max-h-72 overflow-y-auto">
                  {availableOficios.map(oficio => (
                    <button key={oficio.id} onClick={() => handleLinkOficio(oficio.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 text-left transition-colors">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${oficio.tipo === 'entrada' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                        {oficio.tipo === 'entrada' ? 'ENT' : 'SAL'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{oficio.asunto}</p>
                        <p className="text-xs text-slate-400">{oficio.no_oficio || 'Sin número'} · {oficio.estado}</p>
                      </div>
                      <Plus className="w-4 h-4 text-slate-300 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
