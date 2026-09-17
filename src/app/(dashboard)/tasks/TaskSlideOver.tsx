'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { addComment, deleteComment, linkDocument, unlinkDocument } from './actions'
import { Task, Project } from '@/types'
import {
  X, MessageSquare, Send, Trash2, Paperclip,
  FileText, HardDrive, ChevronDown, Calendar,
  AlertCircle, Clock, CheckCircle2, XCircle,
  Eye, Download, Plus, Loader2
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

type AvailableDoc = {
  id: string
  name: string
  file_type: string
  source: 'document' | 'drive'
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

export default function TaskSlideOver({
  task, project, availableDocs, currentUserId, onClose
}: {
  task:           Task & { project?: { name: string } }
  project?:       Project
  availableDocs:  AvailableDoc[]
  currentUserId:  string
  onClose:        () => void
}) {
  const supabase = createClient()

  const [comments,     setComments]     = useState<Comment[]>([])
  const [taskDocs,     setTaskDocs]     = useState<TaskDoc[]>([])
  const [loadingData,  setLoadingData]  = useState(true)
  const [newComment,   setNewComment]   = useState('')
  const [sending,      setSending]      = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [unlinking,    setUnlinking]    = useState<string | null>(null)
  const [deleting,     setDeleting]     = useState<string | null>(null)
  const commentsEndRef = useRef<HTMLDivElement>(null)
  const inputRef       = useRef<HTMLTextAreaElement>(null)

  const status   = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending
  const priority = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.medium
  const StatusIcon = status.icon

  const loadData = useCallback(async () => {
    const [commentsRes, taskDocsRes] = await Promise.all([
      supabase
        .from('comments')
        .select('id, content, created_at, user_id, profiles(full_name, avatar_url)')
        .eq('task_id', task.id)
        .order('created_at', { ascending: true }),
      supabase
        .from('task_documents')
        .select('id, document_id, drive_file_id, created_at, documents(id, name, file_name, file_type), drive_files(id, name, file_type)')
        .eq('task_id', task.id),
    ])
    setComments((commentsRes.data ?? []) as unknown as Comment[])
    setTaskDocs((taskDocsRes.data ?? []) as unknown as TaskDoc[])
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
    await addComment(task.id, newComment)
    setNewComment('')
    setSending(false)
    await loadData()
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

  const isOverdue = task.due_date && task.status !== 'done' && new Date(task.due_date) < new Date()

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
            {task.project?.name && (
              <p className="text-xs text-slate-400 mt-1">{task.project.name}</p>
            )}
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
          <p className="text-[10px] text-slate-300 mt-1.5 ml-9">Enter para enviar · Shift+Enter para nueva línea</p>
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
    </>
  )
}
