'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  X, Send, Trash2, Download, GitBranch, User,
  Calendar, Weight, Tag, FileText, MessageSquare, Loader2, History, CheckCircle2, XCircle, Clock,
} from 'lucide-react'
import { addDocumentComment, deleteDocumentComment, getDocumentVersions } from './actions'

type Doc = {
  id: string
  name: string
  file_name: string | null
  display_name: string | null
  file_type: string | null
  file_size: number | null
  status: string
  version: number
  version_number: number | null
  doc_key: string | null
  is_current: boolean
  emission_date: string | null
  author: string | null
  notes: string | null
  created_at: string
  specialty?: { name: string; code: string } | null
  project?: { name: string } | null
  approved_by?: string | null
  approved_at?: string | null
  review_requested_at?: string | null
  rejection_note?: string | null
  approver?: { full_name: string } | null
}

type Comment = {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles?: { full_name: string | null; initials: string | null } | null
}

type VersionRow = {
  id: string
  file_name: string | null
  version_number: number | null
  status: string
  doc_status: string
  is_current: boolean
  emission_date: string | null
  created_at: string
  uploader?: { full_name: string | null; initials: string | null } | null
}

function formatSize(bytes: number | null) {
  if (!bytes) return '—'
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function MetaRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-50 last:border-0">
      <Icon className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
      <span className="text-xs text-slate-400 w-24 flex-shrink-0">{label}</span>
      <span className="text-xs text-slate-700 font-medium flex-1">{value}</span>
    </div>
  )
}

export default function DocumentSlideOver({
  doc, workspaceId, currentUserId, onClose
}: {
  doc: Doc
  workspaceId: string
  currentUserId: string
  onClose: () => void
}) {
  const [tab,         setTab]         = useState<'info' | 'versions' | 'comments'>('info')
  const [comments,    setComments]    = useState<Comment[]>([])
  const [versions,    setVersions]    = useState<VersionRow[]>([])
  const [loadingCmts, setLoadingCmts] = useState(false)
  const [loadingVers, setLoadingVers] = useState(false)
  const [newComment,  setNewComment]  = useState('')
  const [sending,     setSending]     = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient()

  const docName = doc.display_name || doc.file_name || doc.name

  // Cargar comentarios
  async function loadComments() {
    setLoadingCmts(true)
    const { data } = await supabase
      .from('document_comments')
      .select('id, content, created_at, user_id, profiles!document_comments_user_id_fkey(full_name, initials)')
      .eq('document_id', doc.id)
      .order('created_at', { ascending: true })
    setComments((data as unknown as Comment[]) ?? [])
    setLoadingCmts(false)
  }

  // Cargar versiones
  async function loadVersions() {
    if (!doc.doc_key) return
    setLoadingVers(true)
    const result = await getDocumentVersions(doc.doc_key, workspaceId)
    if (result.data) setVersions(result.data as unknown as VersionRow[])
    setLoadingVers(false)
  }

  useEffect(() => {
    if (tab === 'comments') loadComments()
    if (tab === 'versions') loadVersions()
  }, [tab])

  async function handleSend() {
    if (!newComment.trim()) return
    setSending(true)
    await addDocumentComment(doc.id, workspaceId, newComment)
    setNewComment('')
    await loadComments()
    setSending(false)
  }

  async function handleDeleteComment(commentId: string) {
    await deleteDocumentComment(commentId)
    setComments(prev => prev.filter(c => c.id !== commentId))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="w-full max-w-md bg-white shadow-2xl flex flex-col h-full overflow-hidden">

        {/* Header */}
        <div className="flex items-start gap-3 px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">
                {doc.file_type?.toUpperCase() ?? 'DOC'}
              </span>
              {doc.version_number !== null && (
                <span className="text-xs font-mono bg-[#00C2FF]/10 text-[#00C2FF] px-1.5 py-0.5 rounded font-bold">
                  v{String(doc.version_number).padStart(4, '0')}
                </span>
              )}
              {doc.is_current && (
                <span className="text-[10px] font-semibold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                  Vigente
                </span>
              )}
            </div>
            <h2 className="text-sm font-bold text-[#1A2744] mt-1 leading-tight">{docName}</h2>
            {doc.specialty && (
              <p className="text-xs text-slate-400 mt-0.5">[{doc.specialty.code}] {doc.specialty.name}</p>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {doc.file_name && (
              <a href={`/api/documents/download/${doc.id}`} target="_blank" rel="noopener noreferrer"
                title="Descargar" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                <Download className="w-4 h-4" />
              </a>
            )}
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 flex-shrink-0">
          {([
            { key: 'info',     label: 'Información',  icon: FileText },
            { key: 'versions', label: 'Versiones',    icon: History },
            { key: 'comments', label: 'Comentarios',  icon: MessageSquare },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-[#00C2FF] text-[#00C2FF]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}>
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Tab: Información ── */}
          {tab === 'info' && (
            <div className="px-5 py-4">
              <div className="space-y-0">
                <MetaRow icon={User}     label="Autor"         value={doc.author || '—'} />
                <MetaRow icon={Calendar} label="Fecha versión"
                  value={doc.emission_date
                    ? new Date(doc.emission_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
                    : '—'} />
                <MetaRow icon={Calendar} label="Subido el"
                  value={new Date(doc.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })} />
                <MetaRow icon={Weight}   label="Tamaño"        value={formatSize(doc.file_size)} />
                <MetaRow icon={Tag}      label="Disciplina"
                  value={doc.specialty ? `[${doc.specialty.code}] ${doc.specialty.name}` : '—'} />
                {doc.project && (
                  <MetaRow icon={FileText} label="Proyecto" value={doc.project.name} />
                )}
                {doc.doc_key && (
                  <MetaRow icon={GitBranch} label="Clave AEC" value={doc.doc_key} />
                )}
              </div>

              {/* Cadena de aprobación */}
              <div className="mt-4 rounded-xl border border-slate-100 overflow-hidden">
                <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Flujo de aprobación</p>
                </div>
                <div className="divide-y divide-slate-50">
                  {/* ELAB */}
                  <div className="flex items-center gap-2.5 px-3 py-2">
                    <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-[9px] font-bold text-slate-500">E</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] font-semibold text-slate-600">ELAB — Elaboración</p>
                      <p className="text-[10px] text-slate-400">{doc.author || '—'}</p>
                    </div>
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  </div>

                  {/* REV */}
                  <div className="flex items-center gap-2.5 px-3 py-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                      ['review','approved','rejected'].includes(doc.status) ? 'bg-amber-100' : 'bg-slate-100'
                    }`}>
                      <span className={`text-[9px] font-bold ${['review','approved','rejected'].includes(doc.status) ? 'text-amber-600' : 'text-slate-300'}`}>R</span>
                    </div>
                    <div className="flex-1">
                      <p className={`text-[11px] font-semibold ${['review','approved','rejected'].includes(doc.status) ? 'text-slate-600' : 'text-slate-300'}`}>REV — Revisión</p>
                      {doc.review_requested_at && (
                        <p className="text-[10px] text-slate-400">
                          {new Date(doc.review_requested_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                    {['review','approved','rejected'].includes(doc.status) && (
                      doc.status === 'rejected'
                        ? <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                        : <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    )}
                    {doc.status === 'draft' && <Clock className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />}
                  </div>

                  {/* APR */}
                  <div className="flex items-center gap-2.5 px-3 py-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                      doc.status === 'approved' ? 'bg-green-100' : 'bg-slate-100'
                    }`}>
                      <span className={`text-[9px] font-bold ${doc.status === 'approved' ? 'text-green-600' : 'text-slate-300'}`}>A</span>
                    </div>
                    <div className="flex-1">
                      <p className={`text-[11px] font-semibold ${doc.status === 'approved' ? 'text-slate-600' : 'text-slate-300'}`}>APR — Aprobación</p>
                      {doc.status === 'approved' && doc.approver?.full_name && (
                        <p className="text-[10px] text-slate-400">
                          {doc.approver.full_name}
                          {doc.approved_at && ` · ${new Date(doc.approved_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                        </p>
                      )}
                    </div>
                    {doc.status === 'approved'
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      : <Clock className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                    }
                  </div>
                </div>
              </div>

              {/* Nota de observación */}
              {doc.status === 'rejected' && doc.rejection_note && (
                <div className="mt-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  <p className="text-xs font-semibold text-red-600 mb-1">Observación</p>
                  <p className="text-xs text-red-700 leading-relaxed">{doc.rejection_note}</p>
                </div>
              )}

              {doc.notes && (
                <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                  <p className="text-xs font-semibold text-amber-700 mb-1">Nota</p>
                  <p className="text-xs text-amber-800 leading-relaxed">{doc.notes}</p>
                </div>
              )}

              {doc.file_type === 'pdf' && (
                <a href={`/api/documents/view/${doc.id}`} target="_blank" rel="noopener noreferrer"
                  className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1A2744] text-white text-xs font-bold hover:bg-[#243660] transition-colors">
                  <FileText className="w-3.5 h-3.5" />
                  Ver PDF
                </a>
              )}
            </div>
          )}

          {/* ── Tab: Versiones ── */}
          {tab === 'versions' && (
            <div className="px-5 py-4">
              {!doc.doc_key ? (
                <div className="text-center py-12">
                  <GitBranch className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm text-slate-400 font-medium">Sin nomenclatura AEC</p>
                  <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
                    El control de versiones requiere nomenclatura AEC en el nombre del archivo<br/>
                    (ej: TQM-0000-PLA-AARQ-PLT-0004.pdf)
                  </p>
                </div>
              ) : loadingVers ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-5 h-5 text-[#00C2FF] animate-spin" />
                </div>
              ) : versions.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-12">Sin historial de versiones</p>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-[11px] top-4 bottom-4 w-px bg-slate-200" />

                  <div className="space-y-4">
                    {versions.map((v, idx) => {
                      const isCurrent = v.is_current
                      const initials  = v.uploader?.initials || v.uploader?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2) || '?'
                      return (
                        <div key={v.id} className="flex gap-3 relative">
                          {/* Timeline dot */}
                          <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center z-10 ${
                            isCurrent
                              ? 'bg-[#00C2FF] text-white'
                              : 'bg-slate-200 text-slate-400'
                          }`}>
                            <span className="text-[8px] font-bold">
                              {String(v.version_number ?? idx + 1).padStart(2, '0')}
                            </span>
                          </div>

                          <div className={`flex-1 rounded-xl border p-3 ${
                            isCurrent
                              ? 'bg-[#00C2FF]/5 border-[#00C2FF]/20'
                              : 'bg-slate-50 border-slate-100'
                          }`}>
                            <div className="flex items-center justify-between gap-2">
                              <span className={`text-xs font-bold font-mono ${isCurrent ? 'text-[#00C2FF]' : 'text-slate-400'}`}>
                                v{String(v.version_number ?? idx + 1).padStart(4, '0')}
                              </span>
                              {isCurrent && (
                                <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">
                                  Vigente
                                </span>
                              )}
                              {!isCurrent && (
                                <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-full">
                                  Archivada
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1 truncate">{v.file_name}</p>
                            <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                              {v.uploader?.full_name && (
                                <div className="flex items-center gap-1">
                                  <div className="w-4 h-4 rounded-full bg-[#1A2744] text-white flex items-center justify-center text-[8px] font-bold">
                                    {initials}
                                  </div>
                                  <span>{v.uploader.full_name}</span>
                                </div>
                              )}
                              {v.emission_date && (
                                <>
                                  <span>·</span>
                                  <span>{new Date(v.emission_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Comentarios ── */}
          {tab === 'comments' && (
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {loadingCmts ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-5 h-5 text-[#00C2FF] animate-spin" />
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm text-slate-400">Sin comentarios aún</p>
                    <p className="text-xs text-slate-300 mt-1">Agrega notas de revisión o cambios</p>
                  </div>
                ) : (
                  comments.map(c => {
                    const isOwn     = c.user_id === currentUserId
                    const name      = c.profiles?.full_name ?? 'Usuario'
                    const initials  = c.profiles?.initials
                      || c.profiles?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                      || '?'
                    return (
                      <div key={c.id} className="flex gap-2.5 group">
                        <div className="w-7 h-7 rounded-full bg-[#1A2744] text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5">
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-700">{name}</span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(c.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed whitespace-pre-wrap">{c.content}</p>
                        </div>
                        {isOwn && (
                          <button onClick={() => handleDeleteComment(c.id)}
                            className="w-6 h-6 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 text-slate-300 hover:text-red-400 transition-all flex-shrink-0 mt-0.5">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )
                  })
                )}
              </div>

              {/* Input */}
              <div className="px-5 py-3 border-t border-slate-100 flex-shrink-0">
                <div className="flex gap-2 items-end">
                  <textarea
                    ref={inputRef}
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Agrega una nota de cambio... (Enter para enviar)"
                    rows={2}
                    className="flex-1 text-xs px-3 py-2.5 rounded-xl border border-slate-200 resize-none focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40"
                  />
                  <button onClick={handleSend} disabled={sending || !newComment.trim()}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#1A2744] text-white hover:bg-[#243660] disabled:opacity-40 transition-colors flex-shrink-0">
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
