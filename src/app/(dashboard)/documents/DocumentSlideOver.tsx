'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  X, Send, Trash2, Download, GitBranch, User,
  Calendar, Weight, Tag, FileText, MessageSquare, Loader2, History, CheckCircle2, XCircle, Clock, Eye,
  Share2, Pencil, Check, Upload, Edit2, Zap, Sparkles, ChevronDown, ChevronRight,
} from 'lucide-react'
import { addDocumentComment, deleteDocumentComment, getDocumentVersions, createDocumentShare, renameDocument, updateDocumentMeta, deleteArchivedVersion } from './actions'

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
  doc_type:    string | null
  doc_view:    string | null
  doc_element: string | null
  mic_version: string | null
  sheet_count?: number | null
  specialty?: { name: string; code: string } | null
  project?: { name: string } | null
  project_id?: string | null
  approved_by?: string | null
  approved_at?: string | null
  review_requested_at?: string | null
  rejection_note?: string | null
}

type Comment = {
  id: string
  content: string
  created_at: string
  user_id: string
  document_id: string
  version_number: number | null
  is_current_version: boolean
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

type Elemento = { tipo: string; cantidad: number | null; unidad: string; descripcion?: string }
type Especialidad = { nombre: string; elementos: Elemento[] }
type SavedExtraction = {
  id: string
  document_id: string | null
  doc_hints: Record<string, string>
  raw_extraction: { titulo: string; especialidades: Especialidad[]; notas: string; confianza: 'alta' | 'media' | 'baja' }
  status: 'raw' | 'reviewed' | 'approved'
  confidence: string | null
  created_at: string
}

const CONFIANZA_CONFIG = {
  alta:  { label: 'Alta',  color: 'bg-green-100 text-green-700' },
  media: { label: 'Media', color: 'bg-amber-100 text-amber-700' },
  baja:  { label: 'Baja',  color: 'bg-red-100 text-red-600'    },
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
  doc, workspaceId, currentUserId, userRole, onClose, onUploadNew
}: {
  doc: Doc
  workspaceId: string
  currentUserId: string
  userRole?: string
  onClose: () => void
  onUploadNew?: () => void
}) {
  const [tab,                  setTab]                  = useState<'info' | 'versions' | 'comments' | 'kota'>('info')
  const [comments,             setComments]             = useState<Comment[]>([])
  const [versions,             setVersions]             = useState<VersionRow[]>([])
  const [approverName,         setApproverName]         = useState<string | null>(null)
  const [loadingCmts,          setLoadingCmts]          = useState(false)
  const [loadingVers,          setLoadingVers]          = useState(false)
  const [newComment,           setNewComment]           = useState('')
  const [sending,              setSending]              = useState(false)
  const [versionCommentCounts, setVersionCommentCounts] = useState<Record<string, number>>({})
  // Share
  const [sharing,      setSharing]     = useState(false)
  const [shareToast,   setShareToast]  = useState<string | null>(null)
  // Rename
  const [editingName,  setEditingName] = useState(false)
  const [editName,     setEditName]    = useState('')
  const [savingName,   setSavingName]  = useState(false)
  const [localDocName, setLocalDocName] = useState<string | null>(null)
  const renameRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  // Edit metadata
  const [editingMeta,   setEditingMeta]   = useState(false)
  const [savingMeta,    setSavingMeta]    = useState(false)
  // Kota extraction (legacy button in info tab)
  const [kotaLoading,   setKotaLoading]   = useState(false)
  const [kotaDone,      setKotaDone]      = useState(false)
  const [kotaError,     setKotaError]     = useState<string | null>(null)
  // Kota tab state
  const [kotaExtraction,        setKotaExtraction]        = useState<SavedExtraction | null>(null)
  const [kotaExtractionLoading, setKotaExtractionLoading] = useState(false)
  const [kotaExtractionError,   setKotaExtractionError]   = useState<string | null>(null)
  const [kotaAnalyzing,         setKotaAnalyzing]         = useState(false)
  const [kotaSavingToDatos,     setKotaSavingToDatos]     = useState(false)
  const [kotaSavedToDatos,      setKotaSavedToDatos]      = useState(false)
  const [kotaOpenSections,      setKotaOpenSections]      = useState<Record<number, boolean>>({})
  // PDF preview
  const [pdfZoom,       setPdfZoom]       = useState(1)
  const [metaError,     setMetaError]     = useState<string | null>(null)
  const [metaDocType,   setMetaDocType]   = useState(doc.doc_type    ?? '')
  const [metaDocView,   setMetaDocView]   = useState(doc.doc_view    ?? '')
  const [metaDocEl,     setMetaDocEl]     = useState(doc.doc_element ?? '')
  const [metaVersion,   setMetaVersion]   = useState<'V0'|'V1'>(doc.mic_version === 'V1' ? 'V1' : 'V0')
  const [metaDate,       setMetaDate]       = useState(doc.emission_date?.slice(0,10) ?? '')
  const [metaNotes,      setMetaNotes]      = useState(doc.notes  ?? '')
  const [metaAuthor,     setMetaAuthor]     = useState(doc.author ?? '')
  const [metaSheetCount, setMetaSheetCount] = useState(doc.sheet_count ?? 1)
  const supabase = createClient()

  // Cargar nombre del aprobador si aplica
  useEffect(() => {
    if (doc.approved_by) {
      supabase
        .from('profiles')
        .select('full_name')
        .eq('id', doc.approved_by)
        .single()
        .then(({ data }) => setApproverName(data?.full_name ?? null))
    }
  }, [doc.approved_by])

  const docName = doc.display_name || doc.file_name || doc.name

  // Cargar comentarios — si hay doc_key, carga TODOS los de todas las versiones
  async function loadComments() {
    setLoadingCmts(true)

    if (doc.doc_key) {
      // Paso 1: obtener todos los IDs de versiones de este doc_key
      const { data: allDocs } = await supabase
        .from('documents')
        .select('id, version_number, is_current')
        .eq('workspace_id', workspaceId)
        .eq('doc_key', doc.doc_key)
        .order('version_number', { ascending: false })

      const ids = (allDocs ?? []).map(d => d.id)
      const versionInfo: Record<string, { version_number: number | null; is_current: boolean }> =
        Object.fromEntries((allDocs ?? []).map(d => [d.id, { version_number: d.version_number, is_current: d.is_current }]))

      // Paso 2: comentarios de todas las versiones
      const { data } = await supabase
        .from('document_comments')
        .select('id, content, created_at, user_id, document_id, profiles!document_comments_user_id_fkey(full_name, initials)')
        .in('document_id', ids)
        .order('created_at', { ascending: true })

      const enriched = (data ?? []).map(c => ({
        ...c,
        version_number:     versionInfo[(c as any).document_id]?.version_number ?? null,
        is_current_version: versionInfo[(c as any).document_id]?.is_current ?? false,
      }))

      setComments(enriched as unknown as Comment[])
    } else {
      const { data } = await supabase
        .from('document_comments')
        .select('id, content, created_at, user_id, document_id, profiles!document_comments_user_id_fkey(full_name, initials)')
        .eq('document_id', doc.id)
        .order('created_at', { ascending: true })
      setComments((data as unknown as Comment[]) ?? [])
    }

    setLoadingCmts(false)
  }

  // Cargar versiones + conteo de comentarios por versión
  async function loadVersions() {
    if (!doc.doc_key) return
    setLoadingVers(true)
    const result = await getDocumentVersions(doc.doc_key, workspaceId)
    if (result.data) {
      setVersions(result.data as unknown as VersionRow[])
      const ids = (result.data as unknown as VersionRow[]).map(v => v.id)
      const { data: cmtData } = await supabase
        .from('document_comments')
        .select('document_id')
        .in('document_id', ids)
      const counts: Record<string, number> = {}
      ;(cmtData ?? []).forEach(r => { counts[r.document_id] = (counts[r.document_id] ?? 0) + 1 })
      setVersionCommentCounts(counts)
    }
    setLoadingVers(false)
  }

  useEffect(() => {
    if (tab === 'comments') loadComments()
    if (tab === 'versions') loadVersions()
    if (tab === 'kota') loadKotaExtraction()
  }, [tab])

  // Load kota extraction for this document
  async function loadKotaExtraction() {
    if (!doc.project_id) return
    setKotaExtractionLoading(true)
    setKotaExtractionError(null)
    try {
      const res  = await fetch(`/api/ai-agent?projectId=${doc.project_id}&documentId=${doc.id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al cargar extracción')
      setKotaExtraction(data.extraction ?? null)
    } catch (err: unknown) {
      setKotaExtractionError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setKotaExtractionLoading(false)
    }
  }

  // Analyze with Kota from the Kota tab
  async function analyzeWithKotaTab() {
    if (!doc.project_id) return
    setKotaAnalyzing(true)
    setKotaExtractionError(null)
    try {
      const fd = new FormData()
      fd.append('projectId', doc.project_id)
      fd.append('documentId', doc.id)
      const hints: Record<string, string> = {}
      if (doc.doc_key)         hints.doc_key      = doc.doc_key
      if (doc.doc_type)        hints.tipo_plano   = doc.doc_type
      if (doc.mic_version)     hints.version      = doc.mic_version
      if (doc.specialty?.name) hints.especialidad = doc.specialty.name
      fd.append('docHints', JSON.stringify(hints))
      const res  = await fetch('/api/ai-agent', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al analizar')
      // Reload extraction from DB
      await loadKotaExtraction()
    } catch (err: unknown) {
      setKotaExtractionError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setKotaAnalyzing(false)
    }
  }

  // Save inferrable fields from extraction to kota_data
  async function saveKotaExtractionToDatos() {
    if (!kotaExtraction || !doc.project_id) return
    setKotaSavingToDatos(true)
    try {
      const ext = kotaExtraction.raw_extraction
      const patches: Array<{ field_path: string[]; value: unknown }> = []

      // Infer tipo_estructura from titulo
      if (ext.titulo) {
        patches.push({ field_path: ['campos_comunes', 'tipo_estructura'], value: ext.titulo })
      }

      for (const esp of (ext.especialidades ?? [])) {
        for (const el of (esp.elementos ?? [])) {
          const tipo = el.tipo?.toLowerCase() ?? ''
          if ((tipo.includes('longitud') || tipo.includes('largo')) && el.cantidad !== null) {
            patches.push({ field_path: ['campos_comunes', 'longitud_total_m'], value: el.cantidad })
          }
          if ((tipo.includes('altura') || tipo.includes('alto')) && el.cantidad !== null) {
            patches.push({ field_path: ['campos_comunes', 'altura_maxima_m'], value: el.cantidad })
          }
        }
      }

      for (const patch of patches) {
        await fetch('/api/ai-agent/brief', {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            projectId:  doc.project_id,
            field_path: patch.field_path,
            value:      patch.value,
            source:     'kota',
          }),
        })
      }

      setKotaSavedToDatos(true)
      setTimeout(() => setKotaSavedToDatos(false), 3000)
    } catch { /* ignore */ } finally {
      setKotaSavingToDatos(false)
    }
  }

  async function analyzeWithKota() {
    if (!doc.project_id) return
    setKotaLoading(true)
    setKotaError(null)
    setKotaDone(false)
    try {
      const fd = new FormData()
      fd.append('projectId', doc.project_id)
      fd.append('documentId', doc.id)
      const hints: Record<string, string> = {}
      if (doc.doc_key)          hints.doc_key      = doc.doc_key
      if (doc.doc_type)         hints.tipo_plano   = doc.doc_type
      if (doc.mic_version)      hints.version      = doc.mic_version
      if (doc.specialty?.name)  hints.especialidad = doc.specialty.name
      fd.append('docHints', JSON.stringify(hints))
      const res  = await fetch('/api/ai-agent', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al analizar')
      setKotaDone(true)
    } catch (err: unknown) {
      setKotaError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setKotaLoading(false)
    }
  }

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

  async function handleShare() {
    setSharing(true)
    const result = await createDocumentShare(doc.id, workspaceId)
    setSharing(false)
    if ('error' in result) {
      setShareToast('Error al crear link')
      setTimeout(() => setShareToast(null), 3000)
      return
    }
    const url = `${window.location.origin}/share/doc/${result.token}`
    await navigator.clipboard.writeText(url)
    setShareToast('¡Link copiado! Válido 24 h')
    setTimeout(() => setShareToast(null), 4000)
  }

  function startRename() {
    const current = localDocName ?? docName
    setEditName(current)
    setEditingName(true)
    setTimeout(() => renameRef.current?.select(), 50)
  }

  async function confirmRename() {
    if (!editName.trim() || editName.trim() === (localDocName ?? docName)) {
      setEditingName(false)
      return
    }
    setSavingName(true)
    const result = await renameDocument(doc.id, editName)
    setSavingName(false)
    if (!('error' in result)) {
      setLocalDocName(editName.trim())
    }
    setEditingName(false)
  }

  function handleRenameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); confirmRename() }
    if (e.key === 'Escape') { setEditingName(false) }
  }

  async function saveMeta() {
    setSavingMeta(true)
    setMetaError(null)
    const result = await updateDocumentMeta(doc.id, {
      doc_type:      metaDocType        || null,
      doc_view:      metaDocView.trim() || null,
      doc_element:   metaDocEl.trim()   || null,
      mic_version:   metaVersion,
      emission_date: metaDate           || null,
      notes:         metaNotes.trim()   || null,
      author:        metaAuthor.trim()  || null,
      sheet_count:   metaSheetCount,
    })
    setSavingMeta(false)
    if ('error' in result) { setMetaError(result.error ?? 'Error al guardar'); return }
    setEditingMeta(false)
  }

  const hasPdf   = doc.file_type === 'pdf' || doc.file_name?.toLowerCase().endsWith('.pdf')
  const docViewUrl = `/api/documents/view/${doc.id}`

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Izquierda: PDF preview (si aplica) o backdrop blur */}
      {hasPdf ? (
        <div className="flex-1 flex flex-col bg-[#111827] min-w-0">
          {/* Barra superior del visor */}
          <div className="flex items-center gap-2 px-4 py-2 bg-black/40 flex-shrink-0">
            <button type="button"
              onClick={() => setPdfZoom(z => Math.max(0.5, Math.round((z - 0.25) * 100) / 100))}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-base leading-none">−</button>
            <span className="text-xs font-semibold text-white/60 w-10 text-center">{Math.round(pdfZoom * 100)}%</span>
            <button type="button"
              onClick={() => setPdfZoom(z => Math.min(3, Math.round((z + 0.25) * 100) / 100))}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-base leading-none">+</button>
            <button type="button" onClick={() => setPdfZoom(1)}
              className="text-[10px] text-white/40 hover:text-white/70 ml-1 uppercase tracking-wide">Reset</button>
            <div className="flex-1" />
            <a href={docViewUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/10">
              <Eye className="w-3.5 h-3.5" />
              Abrir en pestaña
            </a>
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white ml-1">
              <X className="w-4 h-4" />
            </button>
          </div>
          {/* Iframe */}
          <div className="flex-1 overflow-auto">
            <iframe
              key={`${doc.id}-${pdfZoom}`}
              src={`${docViewUrl}#zoom=${Math.round(pdfZoom * 100)}`}
              className="block w-full border-0"
              style={{ minHeight: 'calc(100vh - 44px)' }}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      )}

      {/* Panel derecho */}
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

            {/* Nombre editable */}
            {editingName ? (
              <div className="flex items-center gap-1 mt-1">
                <input
                  ref={renameRef}
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={handleRenameKeyDown}
                  onBlur={confirmRename}
                  className="flex-1 text-sm font-bold text-[#1A2744] border-b-2 border-[#00C2FF] outline-none bg-transparent leading-tight"
                  disabled={savingName}
                />
                {savingName
                  ? <Loader2 className="w-3.5 h-3.5 text-[#00C2FF] animate-spin flex-shrink-0" />
                  : <button onClick={confirmRename} className="flex-shrink-0 text-[#00C2FF] hover:text-[#00a8dd]"><Check className="w-3.5 h-3.5" /></button>
                }
              </div>
            ) : (
              <div className="flex items-start gap-1 mt-1 group/name">
                <h2 className="text-sm font-bold text-[#1A2744] leading-tight break-all line-clamp-3">
                  {localDocName ?? docName}
                </h2>
                {['owner', 'admin', 'manager'].includes(userRole ?? '') && (
                  <button
                    onClick={startRename}
                    title="Renombrar"
                    className="flex-shrink-0 mt-0.5 w-5 h-5 flex items-center justify-center rounded hover:bg-slate-100 text-slate-300 hover:text-slate-500 transition-all"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            {doc.specialty && (
              <p className="text-xs text-slate-400 mt-0.5">[{doc.specialty.code}] {doc.specialty.name}</p>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {onUploadNew && ['owner', 'admin', 'manager'].includes(userRole ?? '') && (
              <button
                onClick={() => { onClose(); setTimeout(onUploadNew, 50) }}
                title="Subir nueva versión"
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#00C2FF]/10 text-slate-400 hover:text-[#00C2FF] transition-colors"
              >
                <Upload className="w-4 h-4" />
              </button>
            )}
            {doc.file_name && (
              <a href={`/api/documents/download/${doc.id}`} target="_blank" rel="noopener noreferrer"
                title="Descargar" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                <Download className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={handleShare}
              disabled={sharing}
              title="Compartir con link (24 h)"
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-[#00C2FF] disabled:opacity-40 transition-colors"
            >
              {sharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
            </button>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toast de share */}
        {shareToast && (
          <div className="mx-5 mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1A2744] text-white text-xs font-medium shadow-lg">
            <Check className="w-3.5 h-3.5 text-[#00C2FF] flex-shrink-0" />
            {shareToast}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-slate-100 flex-shrink-0">
          {([
            { key: 'info',     label: 'Información',  icon: FileText },
            { key: 'versions', label: 'Versiones',    icon: History },
            { key: 'comments', label: 'Comentarios',  icon: MessageSquare },
            ...(doc.project_id && userRole === 'owner'
              ? [{ key: 'kota', label: 'Kota', icon: Sparkles }]
              : []
            ),
          ] as { key: 'info' | 'versions' | 'comments' | 'kota'; label: string; icon: React.ElementType }[]).map(t => (
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

              {/* Edit toggle — admin/owner/manager only */}
              {['owner', 'admin', 'manager'].includes(userRole ?? '') && (
                <div className="flex items-center justify-between mb-3">
                  {editingMeta ? (
                    <p className="text-xs font-semibold text-[#1A2744]">Editar metadatos</p>
                  ) : (
                    <p className="text-xs text-slate-400">Datos del documento</p>
                  )}
                  {!editingMeta && (
                    <button onClick={() => setEditingMeta(true)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-[#00C2FF] hover:text-[#00a8dd] transition-colors">
                      <Edit2 className="w-3 h-3" />
                      Editar
                    </button>
                  )}
                </div>
              )}

              {/* ── Edit form ── */}
              {editingMeta ? (
                <div className="space-y-3">
                  {/* Tipo de documento */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">Tipo de documento</label>
                    <select value={metaDocType} onChange={e => setMetaDocType(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40">
                      <option value="">Sin tipo</option>
                      {[
                        ['PLA','Plano'],['OFI','Oficio'],['MEM','Memoria de cálculo'],
                        ['ESP','Especificación'],['INF','Informe'],['PAT','Ficha técnica'],['ACT','Acta'],
                      ].map(([code, name]) => (
                        <option key={code} value={code}>[{code}] {name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Tipo de plano + Versión row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">Tipo de plano</label>
                      <input value={metaDocView} onChange={e => setMetaDocView(e.target.value)}
                        placeholder="Ej: PLT, COR01…"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">Versión</label>
                      <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                        <button type="button" onClick={() => setMetaVersion('V0')}
                          className={`flex-1 py-2 text-xs font-bold transition-colors ${metaVersion === 'V0' ? 'bg-[#1A2744] text-white' : 'bg-white text-slate-400 hover:bg-slate-50'}`}>
                          V0 Proy.
                        </button>
                        <button type="button" onClick={() => setMetaVersion('V1')}
                          className={`flex-1 py-2 text-xs font-bold transition-colors ${metaVersion === 'V1' ? 'bg-green-600 text-white' : 'bg-white text-slate-400 hover:bg-slate-50'}`}>
                          V1 Const.
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Nº de láminas */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">Nº de láminas en este archivo</label>
                    <input
                      type="number" min={1} max={99}
                      value={metaSheetCount}
                      onChange={e => setMetaSheetCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">Un PDF/DWG puede contener varios planos. Por defecto: 1.</p>
                  </div>

                  {/* Elemento estructural */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">Elemento estructural</label>
                    <input value={metaDocEl} onChange={e => setMetaDocEl(e.target.value)}
                      placeholder="Ej: Zapata, Pilote, Trabe…"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40" />
                  </div>

                  {/* Fecha + Autor row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">Fecha versión</label>
                      <input type="date" value={metaDate} onChange={e => setMetaDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">Autor</label>
                      <input value={metaAuthor} onChange={e => setMetaAuthor(e.target.value)}
                        placeholder="Nombre"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40" />
                    </div>
                  </div>

                  {/* Notas */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">Notas</label>
                    <textarea value={metaNotes} onChange={e => setMetaNotes(e.target.value)}
                      rows={2} placeholder="Observaciones o comentarios…"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40 resize-none" />
                  </div>

                  {metaError && <p className="text-xs text-red-500">{metaError}</p>}

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-1">
                    <button onClick={saveMeta} disabled={savingMeta}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#1A2744] text-white text-xs font-bold hover:bg-[#243660] disabled:opacity-50 transition-colors">
                      {savingMeta ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Guardar
                    </button>
                    <button onClick={() => { setEditingMeta(false); setMetaError(null) }} disabled={savingMeta}
                      className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors">
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
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
                  value={doc.specialty
                    ? `[${doc.specialty.code}] ${doc.specialty.name}`
                    : doc.doc_key?.split('-')[3] || '—'} />
                {doc.project && (
                  <MetaRow icon={FileText} label="Proyecto" value={doc.project.name} />
                )}
                {doc.doc_key && (
                  <MetaRow icon={GitBranch} label="Clave AEC" value={doc.doc_key} />
                )}
                {doc.file_name && (
                  <MetaRow icon={FileText} label="Archivo original" value={doc.file_name} />
                )}
                {(doc.sheet_count ?? 1) > 1 && (
                  <MetaRow icon={FileText} label="Láminas en este archivo" value={String(doc.sheet_count)} />
                )}
              </div>
              )}

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
                      {doc.status === 'approved' && (
                        <p className="text-[10px] text-slate-400">
                          {approverName ?? '—'}
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

              {/* ── Analizar con Kota — solo owner, solo PDF ── */}
              {userRole === 'owner' && doc.file_type === 'pdf' && doc.project_id && (
                <div className="mt-2">
                  {kotaDone ? (
                    <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 rounded-xl px-3 py-2.5 border border-green-100">
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                      Extracción enviada a Agente AI
                    </div>
                  ) : (
                    <button
                      onClick={analyzeWithKota}
                      disabled={kotaLoading}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#00C2FF]/10 text-[#007A9E] text-xs font-bold hover:bg-[#00C2FF]/20 transition-colors disabled:opacity-50 border border-[#00C2FF]/20"
                    >
                      {kotaLoading
                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Analizando con Kota...</>
                        : <><Zap className="w-3.5 h-3.5" />Analizar con Kota</>
                      }
                    </button>
                  )}
                  {kotaError && (
                    <p className="text-[11px] text-red-500 mt-1.5 text-center">{kotaError}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Versiones ── */}
          {tab === 'versions' && (
            <div className="px-5 py-4">
              {!doc.doc_key ? (
                <div className="text-center py-12">
                  <GitBranch className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm text-slate-400 font-medium">Sin historial de versiones</p>
                  <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
                    Para subir una nueva versión de este documento, usa el botón <span className="font-semibold text-slate-400">Reemplazar</span> en la lista de documentos.
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
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className={`text-xs font-bold font-mono ${isCurrent ? 'text-[#00C2FF]' : 'text-slate-400'}`}>
                                v{String(v.version_number ?? idx + 1).padStart(4, '0')}
                              </span>
                              <div className="flex items-center gap-1.5">
                                {versionCommentCounts[v.id] > 0 && (
                                  <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-0.5">
                                    <MessageSquare className="w-2.5 h-2.5" />
                                    {versionCommentCounts[v.id]}
                                  </span>
                                )}
                                {isCurrent ? (
                                  <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">
                                    Vigente
                                  </span>
                                ) : (
                                  <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-full">
                                    Archivada
                                  </span>
                                )}
                              </div>
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
                            <div className="flex items-center gap-1 mt-2">
                              <a href={`/api/documents/download/${v.id}?inline=1`} target="_blank" rel="noopener noreferrer"
                                title="Ver / Abrir"
                                className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-slate-100 hover:bg-[#00C2FF]/10 text-slate-500 hover:text-[#00C2FF] transition-colors">
                                <Eye className="w-3 h-3" />
                                Ver
                              </a>
                              <a href={`/api/documents/download/${v.id}`} target="_blank" rel="noopener noreferrer"
                                title="Descargar"
                                className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors">
                                <Download className="w-3 h-3" />
                                Descargar
                              </a>
                              {!isCurrent && ['owner', 'admin'].includes(userRole ?? '') && (
                                <button
                                  onClick={async () => {
                                    if (!confirm(`¿Eliminar la versión v${String(v.version_number ?? idx + 1).padStart(4, '0')} permanentemente? Esta acción no se puede deshacer.`)) return
                                    await deleteArchivedVersion(v.id)
                                    setVersions(prev => prev.filter(x => x.id !== v.id))
                                  }}
                                  title="Eliminar versión archivada"
                                  className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors">
                                  <Trash2 className="w-3 h-3" />
                                  Eliminar
                                </button>
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
              <div className="flex-1 overflow-y-auto px-5 py-4">
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
                ) : (() => {
                  // Agrupar por versión (desc) para mostrar más reciente arriba
                  const groups: Record<string, Comment[]> = {}
                  for (const c of comments) {
                    const key = c.document_id ?? doc.id
                    if (!groups[key]) groups[key] = []
                    groups[key].push(c)
                  }
                  // Ordenar grupos: vigente primero, luego por version_number desc
                  const sortedKeys = Object.keys(groups).sort((a, b) => {
                    const va = groups[a][0]
                    const vb = groups[b][0]
                    if (va.is_current_version) return -1
                    if (vb.is_current_version) return 1
                    return (vb.version_number ?? 0) - (va.version_number ?? 0)
                  })
                  const hasMultipleVersions = sortedKeys.length > 1 || doc.doc_key

                  return (
                    <div className="space-y-5">
                      {sortedKeys.map(docId => {
                        const group = groups[docId]
                        const vn    = group[0].version_number
                        const curr  = group[0].is_current_version
                        return (
                          <div key={docId}>
                            {hasMultipleVersions && (
                              <div className="flex items-center gap-2 mb-3">
                                <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${curr ? 'bg-[#00C2FF]/10 text-[#00C2FF]' : 'bg-slate-100 text-slate-400'}`}>
                                  {vn !== null ? `v${String(vn).padStart(4, '0')}` : 'sin versión'}
                                </span>
                                <span className="text-[10px] text-slate-400">{curr ? 'Vigente' : 'Archivada'}</span>
                                <div className="flex-1 h-px bg-slate-100" />
                              </div>
                            )}
                            <div className="space-y-3">
                              {group.map(c => {
                                const isOwn    = c.user_id === currentUserId
                                const name     = c.profiles?.full_name ?? 'Usuario'
                                const initials = c.profiles?.initials
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
                                    {isOwn && curr && (
                                      <button onClick={() => handleDeleteComment(c.id)}
                                        className="w-6 h-6 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 text-slate-300 hover:text-red-400 transition-all flex-shrink-0 mt-0.5">
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>

              {/* Input — solo para versión vigente */}
              <div className="px-5 py-3 border-t border-slate-100 flex-shrink-0">
                {doc.version_number !== null && doc.doc_key && (
                  <p className="text-[10px] text-slate-400 mb-1.5">
                    Comentando en versión vigente · <span className="font-mono">v{String(doc.version_number).padStart(4, '0')}</span>
                  </p>
                )}
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
          {/* ── Tab: Kota ── */}
          {tab === 'kota' && (
            <div className="px-5 py-4 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#00C2FF]" />
                <h3 className="text-sm font-bold text-[#1A2744]">Extracción Kota</h3>
              </div>

              {kotaExtractionLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-5 h-5 text-[#00C2FF] animate-spin" />
                </div>
              ) : kotaExtractionError ? (
                <div className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  {kotaExtractionError}
                </div>
              ) : kotaExtraction ? (
                <>
                  {/* Extraction header */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-[#1A2744] truncate">
                      {kotaExtraction.raw_extraction.titulo || 'Plano analizado'}
                    </span>
                    {kotaExtraction.raw_extraction.confianza && CONFIANZA_CONFIG[kotaExtraction.raw_extraction.confianza] && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${CONFIANZA_CONFIG[kotaExtraction.raw_extraction.confianza].color}`}>
                        Confianza {CONFIANZA_CONFIG[kotaExtraction.raw_extraction.confianza].label}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 ml-auto">
                      {new Date(kotaExtraction.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Especialidades colapsables */}
                  <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-50">
                    {kotaExtraction.raw_extraction.especialidades?.map((esp, i) => (
                      <div key={i}>
                        <button
                          onClick={() => setKotaOpenSections(prev => ({ ...prev, [i]: !prev[i] }))}
                          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[#1A2744]">{esp.nombre}</span>
                            <span className="text-[10px] text-slate-400">{esp.elementos.length} elem.</span>
                          </div>
                          {kotaOpenSections[i]
                            ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          }
                        </button>
                        {kotaOpenSections[i] && (
                          <div className="px-4 pb-3 bg-slate-50/30">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-[10px] text-slate-400 border-b border-slate-100">
                                  <th className="text-left py-1.5 font-semibold w-[45%]">Elemento</th>
                                  <th className="text-right py-1.5 font-semibold w-[20%]">Cant.</th>
                                  <th className="text-left py-1.5 pl-2 font-semibold">Unidad</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {esp.elementos.map((el, j) => (
                                  <tr key={j}>
                                    <td className="py-1.5 font-medium text-slate-700">{el.tipo}</td>
                                    <td className="py-1.5 text-right tabular-nums text-[#1A2744] font-semibold">
                                      {el.cantidad !== null && el.cantidad !== undefined ? el.cantidad.toLocaleString('es-MX') : '—'}
                                    </td>
                                    <td className="py-1.5 pl-2 text-slate-400">{el.unidad}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {kotaExtraction.raw_extraction.notas && (
                    <p className="text-xs text-slate-500 bg-slate-50 rounded-xl px-3 py-2">
                      <span className="font-semibold">Notas:</span> {kotaExtraction.raw_extraction.notas}
                    </p>
                  )}

                  {/* Guardar en Datos Técnicos */}
                  {kotaSavedToDatos ? (
                    <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 rounded-xl px-3 py-2.5 border border-green-100">
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                      Campos guardados en Datos Técnicos
                    </div>
                  ) : (
                    <button
                      onClick={saveKotaExtractionToDatos}
                      disabled={kotaSavingToDatos}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1A2744] text-white text-xs font-bold hover:bg-[#243660] transition-colors disabled:opacity-50"
                    >
                      {kotaSavingToDatos
                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Guardando...</>
                        : <><Sparkles className="w-3.5 h-3.5" />Guardar en Datos Técnicos</>
                      }
                    </button>
                  )}
                </>
              ) : (
                /* No extraction yet */
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-[#00C2FF]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-6 h-6 text-[#00C2FF]" />
                  </div>
                  <p className="text-sm font-semibold text-[#1A2744] mb-1">Sin extracción para este documento</p>
                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                    Kota puede leer este plano y extraer los metrados automáticamente.
                  </p>
                  <button
                    onClick={analyzeWithKotaTab}
                    disabled={kotaAnalyzing}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#1A2744] to-[#243660] text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {kotaAnalyzing
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Analizando...</>
                      : <><Sparkles className="w-3.5 h-3.5" />Analizar con Kota</>
                    }
                  </button>
                  {kotaExtractionError && (
                    <p className="text-[11px] text-red-500 mt-2">{kotaExtractionError}</p>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
