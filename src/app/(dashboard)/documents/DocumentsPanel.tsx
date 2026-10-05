'use client'

import React, { useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Project, Company } from '@/types'
import { saveDocument, updateDocumentStatus, requestDeleteDocument, approveDeleteRequest, rejectDeleteRequest, deleteDocument, submitForReview, approveDocument, rejectDocument, replaceDocument, updateProjectCover, createSubproject, updateProjectClassification } from './actions'
import { createOficio } from '../oficios/actions'
import {
  Upload, Download, Trash2, ChevronDown, ChevronRight, ArrowLeft, Package,
  FolderOpen, CheckCircle2, Clock, XCircle, Eye, AlertTriangle, ShieldCheck, ShieldX, X, Loader2, History, GitBranch, SlidersHorizontal, Info, RefreshCw, Camera, Plus, Layers, Pencil, Milestone, LayoutList, AlignJustify, Share2,
} from 'lucide-react'
import { parseDocKey, TIPO_PLANO_DEFAULT, TIPO_DOC_DEFAULT, detectFileFormat } from './utils'
import DocumentSlideOver from './DocumentSlideOver'
import { ShareProjectModal } from '../admin/ShareProjectModal'

type OfiEntry    = { id: string; no_oficio: string | null; asunto: string; tipo: string; proyecto_id: string | null; especialidad: string | null }
type MesaTecnica = { id: string; nombre: string; codigo: string | null; especialidad: string | null }

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
  project_id: string | null
  storage_key: string | null
  file_type: string | null
  file_size: number | null
  status: string
  doc_status: string
  version: number
  version_number: number | null
  doc_key: string | null
  specialty_id: string | null
  is_current: boolean
  emission_date: string | null
  author: string | null
  notes: string | null
  created_at: string
  approved_by: string | null
  approved_at: string | null
  review_requested_by: string | null
  review_requested_at: string | null
  rejection_note: string | null
  doc_view:    string | null
  doc_element: string | null
  mic_version: string | null
  doc_type:    string | null
  project?: { name: string } | null
  specialty?: { name: string; code: string; category: string } | null
  uploader?: { full_name: string | null; initials: string | null } | null
}

type MicNomenclature = { id: string; segment: string; code: string; name: string; sort_order: number }

function formatSize(bytes: number | null) {
  if (!bytes) return '—'
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Convierte metros totales → formato 208+800
function formatChainage(meters: number): string {
  const km = Math.floor(meters / 1000)
  const m  = meters % 1000
  return `${km}+${String(m).padStart(3, '0')}`
}

// Convierte km + metros → entero total (ej: 208, 800 → 208800)
function parseChainage(km: string, m: string): number | null {
  const kmN = parseInt(km)
  if (isNaN(kmN) || km.trim() === '') return null
  const mN = Math.min(parseInt(m) || 0, 999)
  return kmN * 1000 + mN
}

// ── Workflow AEC: ELAB → REV → APR → APC ─────────────────────────────────────

const WORKFLOW_CONFIG = {
  draft:    { label: 'ELAB', color: 'bg-slate-100 text-slate-600',   title: 'Elaboración'              },
  review:   { label: 'REV',  color: 'bg-amber-100 text-amber-700',   title: 'En Revisión'              },
  approved: { label: 'APR',  color: 'bg-green-100 text-green-700',   title: 'Aprobado'                 },
  rejected: { label: 'OBS',  color: 'bg-red-100   text-red-600',     title: 'Observado'                },
  apc:      { label: 'APC',  color: 'bg-blue-100  text-blue-700',    title: 'Aprobado Para Construcción' },
}

function WorkflowBadge({ doc, userRole }: { doc: Doc; userRole: string }) {
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)
  const cfg     = WORKFLOW_CONFIG[doc.status as keyof typeof WORKFLOW_CONFIG] ?? WORKFLOW_CONFIG.draft
  const isAdmin = ['owner', 'admin', 'manager'].includes(userRole)

  // Transiciones disponibles según rol y estado
  const transitions: { label: string; action: () => Promise<void>; color: string }[] = []

  if (doc.status === 'draft') {
    transitions.push({
      label: 'Enviar a REV →',
      color: 'text-amber-700 hover:bg-amber-50',
      action: async () => { await submitForReview(doc.id) },
    })
  }
  if (doc.status === 'review' && isAdmin) {
    transitions.push({
      label: '✓ Aprobar (APR)',
      color: 'text-green-700 hover:bg-green-50',
      action: async () => { await approveDocument(doc.id) },
    })
    transitions.push({
      label: '✗ Observar (OBS)',
      color: 'text-red-600 hover:bg-red-50',
      action: async () => {
        const note = window.prompt('Motivo de la observación (opcional):') ?? ''
        await rejectDocument(doc.id, note)
      },
    })
  }
  if (doc.status === 'rejected') {
    transitions.push({
      label: '↺ Reactivar (ELAB)',
      color: 'text-slate-600 hover:bg-slate-50',
      action: async () => { await updateDocumentStatus(doc.id, 'draft') },
    })
  }
  if (doc.status === 'approved' && ['owner', 'admin'].includes(userRole)) {
    transitions.push({
      label: '✦ Promover a APC',
      color: 'text-blue-700 hover:bg-blue-50',
      action: async () => { await updateDocumentStatus(doc.id, 'apc') },
    })
    transitions.push({
      label: '↺ Revertir a ELAB',
      color: 'text-slate-500 hover:bg-slate-50',
      action: async () => { await updateDocumentStatus(doc.id, 'draft') },
    })
  }
  if (doc.status === 'apc' && ['owner', 'admin'].includes(userRole)) {
    transitions.push({
      label: '↺ Revertir a APR',
      color: 'text-slate-500 hover:bg-slate-50',
      action: async () => { await updateDocumentStatus(doc.id, 'approved') },
    })
  }

  async function run(action: () => Promise<void>) {
    setLoading(true); setOpen(false)
    await action()
    setLoading(false)
  }

  return (
    <div className="relative">
      <button onClick={() => transitions.length > 0 && setOpen(v => !v)} disabled={loading}
        title={cfg.title}
        className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 ${cfg.color} ${transitions.length > 0 ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'}`}>
        {loading ? '...' : cfg.label}
        {transitions.length > 0 && <ChevronDown className="w-3 h-3" />}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-7 left-0 z-20 bg-white rounded-lg shadow-lg border border-slate-100 py-1 w-44">
            {transitions.map(t => (
              <button key={t.label} onClick={() => run(t.action)}
                className={`w-full text-left px-3 py-2 text-xs font-medium ${t.color}`}>
                {t.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

type Member = { user_id: string; full_name: string | null; initials: string | null }

type LastUploadConfig = {
  projectId:     string
  specialtyCode: string
  emissionDate:  string
  authorSel:     string
  docType:       string
  docView:       string
  docViewNum:    string
  docElement:    string
  micVersion:    'V0' | 'V1'
  identificador: string
}

function UploadModal({
  projects, workspaceId, defaultProjectId, existingDocs, companies, members, micNomenclatures, userRole, workspaceOficios, mesasTecnicas, lastConfig, onClose, onSaved
}: {
  projects: Project[]
  workspaceId: string
  defaultProjectId?: string
  existingDocs: Doc[]
  companies: Company[]
  members: Member[]
  micNomenclatures: MicNomenclature[]
  userRole: string
  workspaceOficios: OfiEntry[]
  mesasTecnicas: MesaTecnica[]
  lastConfig: LastUploadConfig | null
  onClose: () => void
  onSaved: (config: LastUploadConfig) => void
}) {
  const [projectId,      setProjectId]      = useState(lastConfig?.projectId || defaultProjectId || '')
  const [specialtyCode,  setSpecialtyCode]  = useState(lastConfig?.specialtyCode || '')
  const [displayName,    setDisplayName]    = useState('')
  const [emissionDate,   setEmissionDate]   = useState(lastConfig?.emissionDate || '')
  const [authorSel,      setAuthorSel]      = useState(lastConfig?.authorSel || '')
  const [notes,          setNotes]          = useState('')
  const [file,           setFile]           = useState<File | null>(null)
  const [uploading,      setUploading]      = useState(false)
  const [error,          setError]          = useState<string | null>(null)
  const [step,           setStep]           = useState('')
  const [uploadPct,      setUploadPct]      = useState(0)
  const [versionWarning, setVersionWarning] = useState<{ prevVersion: number; newVersion: number } | null>(null)
  const [docView,        setDocView]        = useState(lastConfig?.docView || '')
  const [docViewNum,     setDocViewNum]     = useState(lastConfig?.docViewNum || '')
  const [docElement,     setDocElement]     = useState(lastConfig?.docElement || '')
  const [docType,        setDocType]        = useState(lastConfig?.docType || '')
  const [micVersion,     setMicVersion]     = useState<'V0' | 'V1'>(lastConfig?.micVersion || 'V0')
  const [fileFormat,     setFileFormat]     = useState<string | null>(null)
  const [identificador,  setIdentificador]  = useState(() => {
    // Siempre priorizar el proyecto actual de la página
    if (defaultProjectId) {
      const proj   = projects.find(p => p.id === defaultProjectId)
      const parent = proj?.parent_project_id ? projects.find(p => p.id === proj.parent_project_id) : null
      const derived = proj?.mic_identifier || parent?.mic_identifier || ''
      if (derived) return derived
    }
    // Solo usar lastConfig si no hay proyecto de contexto
    return lastConfig?.identificador || ''
  })
  const [registrarOficio,    setRegistrarOficio]    = useState(false)
  const [oficioTipo,         setOficioTipo]         = useState<'entrada' | 'salida'>('salida')
  const [oficioNumero,       setOficioNumero]       = useState('')
  const [oficioAsunto,       setOficioAsunto]       = useState('')
  const [oficioContacto,     setOficioContacto]     = useState('')
  const [oficioRespondeA,    setOficioRespondeA]    = useState('')
  const [oficioTema,         setOficioTema]         = useState('')
  const [oficioMesaId,       setOficioMesaId]       = useState('')
  const [oficioCopiaA,       setOficioCopiaA]       = useState('')
  const [oficioParaConoc,    setOficioParaConoc]    = useState('')
  const [oficioExtractando,  setOficioExtractando]  = useState(false)
  const [oficioExtractMsg,   setOficioExtractMsg]   = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Catálogo TIPO_PLANO: preferir valores del workspace, si vacío usar defaults
  const tipoPlanoOptions = micNomenclatures.filter(n => n.segment === 'TIPO_PLANO').length > 0
    ? micNomenclatures.filter(n => n.segment === 'TIPO_PLANO')
    : TIPO_PLANO_DEFAULT.map((t, i) => ({ id: t.code, segment: 'TIPO_PLANO', code: t.code, name: t.name, sort_order: i }))

  // Catálogo TIPO_DOC: preferir valores del workspace, si vacío usar defaults
  const tipoDocOptions = micNomenclatures.filter(n => n.segment === 'TIPO_DOC').length > 0
    ? micNomenclatures.filter(n => n.segment === 'TIPO_DOC')
    : TIPO_DOC_DEFAULT.map((t, i) => ({ id: t.code, segment: 'TIPO_DOC', code: t.code, name: t.name, sort_order: i }))

  // Autocomplete para elemento estructural: valores únicos usados en este workspace
  const docElementSuggestions = Array.from(
    new Set(existingDocs.map(d => d.doc_element).filter((v): v is string => !!v))
  ).sort()

  async function handleFileChange(f: File | null) {
    setFile(f)
    setVersionWarning(null)
    if (!f) { setFileFormat(null); return }
    // Auto-detectar formato de archivo
    setFileFormat(detectFileFormat(f.name))
    // Solo usar el filename para detectar si es una versión nueva de un documento existente
    const parsed = parseDocKey(f.name)
    if (parsed) {
      const existing = existingDocs.find(d => d.doc_key === parsed.doc_key && d.is_current)
      if (existing && existing.version_number !== null && existing.version_number !== parsed.version_number) {
        setVersionWarning({ prevVersion: existing.version_number, newVersion: parsed.version_number })
      }
    }
    // Si es PDF y el oficio está activado, intentar extracción AI
    if (registrarOficio && f.type === 'application/pdf') {
      setOficioExtractando(true)
      setOficioExtractMsg('Analizando con IA...')
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload  = () => resolve((reader.result as string).split(',')[1])
          reader.onerror = reject
          reader.readAsDataURL(f)
        })
        const res = await fetch('/api/oficios/extract', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pdfBase64: base64, fileName: f.name }),
        })
        if (res.ok) {
          const ext = await res.json()
          if (ext.asunto && !oficioAsunto)    setOficioAsunto(ext.asunto)
          if (ext.no_oficio && !oficioNumero) setOficioNumero(ext.no_oficio)
          if (ext.fecha_documento && !emissionDate) setEmissionDate(ext.fecha_documento)
          if (ext.remitente && oficioTipo === 'entrada' && !oficioContacto) setOficioContacto(ext.remitente)
          if (ext.copia_a)           setOficioCopiaA(ext.copia_a)
          if (ext.para_conocimiento) setOficioParaConoc(ext.para_conocimiento)
          setOficioExtractMsg(ext.source === 'ai' ? '✓ Datos extraídos con IA' : '✓ Datos del nombre del archivo')
        }
      } catch {
        setOficioExtractMsg(null)
      } finally {
        setOficioExtractando(false)
      }
    }
  }

  // Catálogo ESPECIALIDAD desde mic_nomenclatures (fuente de verdad del workspace)
  const especialidadOptions  = micNomenclatures.filter(n => n.segment === 'ESPECIALIDAD')
  // IDENTIFICADOR: derivado directo de projects para no depender del sync de mic_nomenclatures
  const identificadorOptions = projects
    .filter(p => p.mic_identifier)
    .map(p => ({ code: p.mic_identifier!, name: p.name }))
    .sort((a, b) => a.code.localeCompare(b.code))

  // Decodificar selección de autor
  let authorText   = ''
  let authorCompId: string | null = null
  if (authorSel.startsWith('user:')) {
    const uid = authorSel.replace('user:', '')
    const m   = members.find(m => m.user_id === uid)
    authorText = m?.full_name || m?.initials || ''
  } else if (authorSel.startsWith('company:')) {
    const cid = authorSel.replace('company:', '')
    const c   = companies.find(c => c.id === cid)
    authorText   = c?.name || ''
    authorCompId = cid
  }

  async function handleUpload() {
    if (!file || !projectId) { setError('Selecciona proyecto y archivo'); return }
    if (!identificador) { setError('Selecciona el identificador'); return }
    if (!specialtyCode) { setError('Selecciona la disciplina / especialidad'); return }
    if (!docType) { setError('Selecciona el tipo de documento'); return }
    if (docType === 'PLA' && !docView) { setError('Selecciona el tipo de plano'); return }
    if (!authorSel) { setError('Selecciona el autor o empresa'); return }
    setUploading(true); setError(null); setUploadPct(0)

    setStep('Preparando subida...')
    const presignRes = await fetch('/api/documents/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceId, projectId,
        specialtyCode: specialtyCode || 'GEN',
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
        fileSize: file.size,
      }),
    })
    const presignData = await presignRes.json()
    if (!presignRes.ok) {
      setError(presignData.error || 'Error al preparar subida')
      setUploading(false); setStep(''); return
    }

    setStep('Subiendo archivo...')
    const uploadOk = await new Promise<boolean>((resolve) => {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', presignData.uploadUrl)
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setUploadPct(Math.round((e.loaded / e.total) * 100))
      }
      xhr.onload  = () => resolve(xhr.status >= 200 && xhr.status < 300)
      xhr.onerror = () => resolve(false)
      xhr.send(file)
    })

    if (!uploadOk) {
      setError('Error al subir el archivo a R2')
      setUploading(false); setStep(''); return
    }

    setStep('Guardando metadatos...')
    setUploadPct(100)
    const result = await saveDocument({
      project_id:     projectId,
      workspace_id:   workspaceId,
      specialty_id:   null,
      specialty_code: specialtyCode || null,
      identificador:  identificador || null,
      file_name:      file.name,
      display_name:  displayName.trim() || null,
      emission_date: emissionDate || null,
      author:        authorText,
      company_id:    authorCompId,
      notes:         notes.trim() || null,
      storage_key:   presignData.storageKey,
      file_type:     presignData.fileType,
      file_size:     file.size,
      doc_view:      docView ? (docView + docViewNum).trim() : null,
      doc_element:   docElement.trim() || null,
      doc_type:      docType.trim() || null,
      mic_version:   micVersion,
    })

    if (result?.error) { setError(result.error); setUploading(false); setStep(''); return }

    onSaved({ projectId, specialtyCode, emissionDate, authorSel, docType, docView, docViewNum, docElement, micVersion, identificador })

    if (registrarOficio && oficioAsunto.trim()) {
      setStep('Registrando oficio...')
      await createOficio({
        tipo:              oficioTipo,
        asunto:            oficioAsunto.trim(),
        no_oficio:         oficioNumero.trim()   || null,
        tema:              oficioTema.trim()      || null,
        proyecto_id:       projectId             || null,
        especialidad:      specialtyCode         || null,
        mesa_id:           oficioMesaId          || null,
        fecha_documento:   emissionDate          || null,
        remitente:         oficioTipo === 'entrada' ? (oficioContacto.trim() || null) : null,
        destinatario:      oficioTipo === 'salida'  ? (oficioContacto.trim() || null) : null,
        copia_a:           oficioCopiaA.trim()   || null,
        para_conocimiento: oficioParaConoc.trim() || null,
        responde_a_id:     oficioRespondeA       || null,
        storage_key:       presignData.storageKey,
        file_name:         file.name,
        file_type:         presignData.fileType,
        file_size:         file.size,
      })
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="text-base font-bold text-[#1A2744]">Subir documento</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Proyecto <span className="text-red-400">*</span>
            </label>
            <select value={projectId} onChange={e => {
                setProjectId(e.target.value)
                const proj   = projects.find(p => p.id === e.target.value)
                const parent = proj?.parent_project_id ? projects.find(p => p.id === proj.parent_project_id) : null
                const mic    = proj?.mic_identifier || parent?.mic_identifier || ''
                if (mic) setIdentificador(mic)
              }}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50">
              <option value="">Seleccionar proyecto...</option>
              {projects.filter(p => !p.parent_project_id).map(p => {
                const subs = projects.filter(s => s.parent_project_id === p.id)
                return (
                  <React.Fragment key={p.id}>
                    <option value={p.id}>{p.name}</option>
                    {subs.map(s => (
                      <option key={s.id} value={s.id}>{'  ↳ '}{s.name}</option>
                    ))}
                  </React.Fragment>
                )
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Identificador <span className="text-red-400">*</span>
            </label>
            <select value={identificador} onChange={e => setIdentificador(e.target.value)}
              className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50 ${!identificador ? 'border-slate-300' : 'border-[#00C2FF]'}`}>
              <option value="">Seleccionar identificador...</option>
              {identificadorOptions.map(o => (
                <option key={o.code} value={o.code}>{o.code} — {o.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Disciplina / Especialidad <span className="text-red-400">*</span>
            </label>
            <select value={specialtyCode} onChange={e => setSpecialtyCode(e.target.value)}
              className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50 ${!specialtyCode ? 'border-slate-300' : 'border-[#00C2FF]'}`}>
              <option value="">Seleccionar disciplina...</option>
              {especialidadOptions.map(s => (
                <option key={s.code} value={s.code}>[{s.code}] {s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Tipo de documento
            </label>
            <select value={docType} onChange={e => {
                const val = e.target.value
                setDocType(val)
                if (val !== 'PLA') { setDocView('NA'); setDocViewNum('') }
                else { setDocView(''); setDocViewNum('') }
                if (val !== 'OFI') setRegistrarOficio(false)
              }}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50">
              <option value="">Sin tipo</option>
              {tipoDocOptions.map(t => (
                <option key={t.code} value={t.code}>[{t.code}] {t.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Tipo de plano
              </label>
              {docType !== 'PLA' ? (
                <div className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-400 font-mono">
                  NA
                </div>
              ) : (
                <div className="flex gap-2">
                  <select value={docView} onChange={e => { setDocView(e.target.value); setDocViewNum('') }}
                    className="flex-1 px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50">
                    <option value="">Sin tipo</option>
                    {tipoPlanoOptions.map(t => (
                      <option key={t.code} value={t.code}>[{t.code}] {t.name}</option>
                    ))}
                  </select>
                  {docView && (
                    <input
                      type="number" min="1" max="99" value={docViewNum}
                      onChange={e => setDocViewNum(e.target.value.replace(/\D/g, ''))}
                      placeholder="#"
                      className="w-16 px-2 py-2.5 rounded-lg border border-slate-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50"
                    />
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                Versión
                <div className="relative group">
                  <Info className="w-3 h-3 text-slate-400 cursor-help" />
                  <div className="absolute right-0 bottom-full mb-2 z-50 hidden group-hover:block w-48 bg-white border border-slate-200 text-slate-600 text-[11px] rounded-lg p-2.5 shadow-lg">
                    <div className="flex items-start gap-2 mb-2">
                      <span className="font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded flex-shrink-0">V0</span>
                      <span className="text-slate-500">Diseño y análisis — fase de elaboración</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-mono font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded flex-shrink-0">V1</span>
                      <span className="text-slate-500">Liberado para ejecución en campo</span>
                    </div>
                  </div>
                </div>
              </label>
              <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                <button type="button" onClick={() => setMicVersion('V0')}
                  className={`flex-1 py-2.5 text-xs font-bold transition-colors ${micVersion === 'V0' ? 'bg-slate-700 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                  V0 Proyecto
                </button>
                <button type="button" onClick={() => setMicVersion('V1')}
                  className={`flex-1 py-2.5 text-xs font-bold transition-colors ${micVersion === 'V1' ? 'bg-green-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                  V1 Construc.
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Elemento estructural <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <input type="text" list="doc-element-suggestions" value={docElement} onChange={e => setDocElement(e.target.value)}
              placeholder="Ej: Zapata, Pilote, Trabe, Losa, Columna..."
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50" />
            <datalist id="doc-element-suggestions">
              {docElementSuggestions.map(v => <option key={v} value={v} />)}
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Archivo <span className="text-red-400">*</span>
            </label>
            <input ref={inputRef} type="file" className="hidden"
              accept=".pdf,.dwg,.dxf,.xlsx,.xls,.docx,.doc,.png,.jpg,.jpeg,.zip"
              onChange={e => handleFileChange(e.target.files?.[0] || null)} />
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
              {fileFormat && (
                <span className="inline-block mt-2 px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-[#1A2744] text-white">
                  {fileFormat}
                </span>
              )}
            </button>
          </div>

          {versionWarning && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-3">
              <GitBranch className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Nueva versión detectada</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  La versión <span className="font-mono font-bold">{String(versionWarning.prevVersion).padStart(4, '0')}</span> ya existe.
                  Este archivo se guardará como versión <span className="font-mono font-bold">{String(versionWarning.newVersion).padStart(4, '0')}</span> y la anterior quedará archivada automáticamente.
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Autor / Empresa <span className="text-red-400">*</span>
            </label>
            <select value={authorSel} onChange={e => setAuthorSel(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50">
              <option value="">Seleccionar autor o empresa...</option>
              {members.length > 0 && (
                <optgroup label="👤 Usuarios del workspace">
                  {members.map(m => (
                    <option key={m.user_id} value={`user:${m.user_id}`}>
                      {m.full_name || m.initials || m.user_id}
                      {m.initials ? ` (${m.initials})` : ''}
                    </option>
                  ))}
                </optgroup>
              )}
              {companies.length > 0 && (
                <optgroup label="🏢 Empresas">
                  {companies.map(c => (
                    <option key={c.id} value={`company:${c.id}`}>
                      {c.name}{c.short_name ? ` (${c.short_name})` : ''}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Fecha de versión <span className="text-red-400">*</span>
            </label>
            <input type="date" value={emissionDate} onChange={e => setEmissionDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50" />
            <p className="text-xs text-slate-400 mt-1">Fecha de emisión o versión del documento original</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Nombre descriptivo <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
              placeholder={file?.name || 'Ej: Plano de cimentación Frente 3'}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Nota <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="Observaciones, contexto o instrucciones sobre este documento..."
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50 resize-none" />
          </div>

          {/* Registrar como oficio — solo visible cuando tipo = OFI */}
          {docType === 'OFI' && <div className="border border-slate-200 rounded-xl overflow-hidden">
            <label className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors">
              <input
                type="checkbox"
                checked={registrarOficio}
                onChange={e => setRegistrarOficio(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#1A2744] focus:ring-[#00C2FF]"
              />
              <div>
                <p className="text-sm font-semibold text-[#1A2744]">Registrar como oficio</p>
                <p className="text-xs text-slate-400">Aparece en Trazabilidad de revisión</p>
              </div>
            </label>

            {registrarOficio && (
              <div className="border-t border-slate-100 px-4 py-4 space-y-3 bg-slate-50/50">
                <div className="flex gap-2">
                  <button type="button" onClick={() => setOficioTipo('salida')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border-2 transition-all ${oficioTipo === 'salida' ? 'border-[#1A2744] bg-[#1A2744] text-white' : 'border-slate-200 text-slate-500'}`}>
                    ↑ Envío (Salida)
                  </button>
                  <button type="button" onClick={() => setOficioTipo('entrada')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border-2 transition-all ${oficioTipo === 'entrada' ? 'border-[#00C2FF] bg-[#00C2FF]/10 text-[#1A2744]' : 'border-slate-200 text-slate-500'}`}>
                    ↓ Respuesta (Entrada)
                  </button>
                </div>
                {/* Estado extracción AI */}
                {(oficioExtractando || oficioExtractMsg) && (
                  <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${oficioExtractando ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-700'}`}>
                    {oficioExtractando
                      ? <><span className="inline-block w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />{oficioExtractMsg}</>
                      : <span>{oficioExtractMsg}</span>
                    }
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">No. Oficio</label>
                    <input value={oficioNumero} onChange={e => setOficioNumero(e.target.value)}
                      placeholder="Ej: OF-4589"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Tema <span className="text-slate-400 font-normal">(distingue oficios del mismo número)</span></label>
                    <input value={oficioTema} onChange={e => setOficioTema(e.target.value)}
                      placeholder="Ej: Geometría, Señalética"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Asunto <span className="text-red-400">*</span></label>
                  <input value={oficioAsunto} onChange={e => setOficioAsunto(e.target.value)}
                    placeholder="Descripción del oficio"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    {oficioTipo === 'salida' ? 'Destinatario' : 'Remitente'}
                  </label>
                  <input value={oficioContacto} onChange={e => setOficioContacto(e.target.value)}
                    placeholder="Empresa o persona"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50" />
                </div>

                {/* Mesa técnica */}
                {mesasTecnicas.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Mesa técnica</label>
                    <select value={oficioMesaId} onChange={e => setOficioMesaId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50">
                      <option value="">— Sin mesa —</option>
                      {mesasTecnicas.map(m => (
                        <option key={m.id} value={m.id}>{m.codigo ? `[${m.codigo}] ` : ''}{m.nombre}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Copia a / Para conocimiento */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Con copia a <span className="text-slate-400 font-normal">(opcional)</span></label>
                  <input value={oficioCopiaA} onChange={e => setOficioCopiaA(e.target.value)}
                    placeholder="Nombre o cargo"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Para efectos y conocimiento de <span className="text-slate-400 font-normal">(opcional)</span></label>
                  <input value={oficioParaConoc} onChange={e => setOficioParaConoc(e.target.value)}
                    placeholder="Nombre o cargo"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50" />
                </div>

                {oficioTipo === 'entrada' && workspaceOficios.filter(o => o.proyecto_id === projectId && o.tipo === 'salida').length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Responde al oficio</label>
                    <select value={oficioRespondeA} onChange={e => setOficioRespondeA(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50">
                      <option value="">Sin vincular</option>
                      {workspaceOficios.filter(o => o.proyecto_id === projectId && o.tipo === 'salida').map(o => (
                        <option key={o.id} value={o.id}>{o.no_oficio ? 'OF-' + o.no_oficio + ' — ' : ''}{o.asunto}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>}

          {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">{error}</div>}

          {uploading && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-700 font-medium">{step}</span>
                <span className="text-blue-500 font-bold tabular-nums">{uploadPct}%</span>
              </div>
              <div className="w-full bg-blue-100 rounded-full h-2 overflow-hidden">
                <div className="bg-[#00C2FF] h-2 rounded-full transition-all duration-200" style={{ width: `${uploadPct}%` }} />
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
            <button onClick={handleUpload} disabled={uploading || !file || !projectId || !authorSel || !emissionDate}
              className="flex-1 py-2.5 rounded-lg bg-[#1A2744] text-white text-sm font-bold hover:bg-[#243660] disabled:opacity-60">
              {uploading ? 'Subiendo...' : 'Subir a R2'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ReplaceDocModal({
  doc, workspaceId, onClose,
}: {
  doc: Doc
  workspaceId: string
  onClose: () => void
}) {
  const [file,         setFile]         = useState<File | null>(null)
  const [author,       setAuthor]       = useState(doc.author || '')
  const [emissionDate, setEmissionDate] = useState('')
  const [displayName,  setDisplayName]  = useState(doc.display_name || '')
  const [notes,        setNotes]        = useState('')
  const [uploading,    setUploading]    = useState(false)
  const [step,         setStep]         = useState('')
  const [uploadPct,    setUploadPct]    = useState(0)
  const [error,        setError]        = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const docName = doc.display_name || doc.file_name || doc.name

  async function handleReplace() {
    if (!file) { setError('Selecciona un archivo'); return }
    if (!author.trim()) { setError('El campo Autor es requerido'); return }
    if (!emissionDate) { setError('Selecciona la fecha de versión'); return }
    setUploading(true); setError(null); setUploadPct(0)

    setStep('Preparando subida...')
    const presignRes = await fetch('/api/documents/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceId,
        projectId: doc.project_id,
        specialtyCode: doc.specialty?.code || 'GEN',
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
        fileSize: file.size,
      }),
    })
    const presignData = await presignRes.json()
    if (!presignRes.ok) {
      setError(presignData.error || 'Error al preparar subida')
      setUploading(false); setStep(''); return
    }

    setStep('Subiendo archivo...')
    const uploadOk = await new Promise<boolean>((resolve) => {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', presignData.uploadUrl)
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setUploadPct(Math.round((e.loaded / e.total) * 100))
      }
      xhr.onload  = () => resolve(xhr.status >= 200 && xhr.status < 300)
      xhr.onerror = () => resolve(false)
      xhr.send(file)
    })

    if (!uploadOk) {
      setError('Error al subir el archivo a R2')
      setUploading(false); setStep(''); return
    }

    setStep('Registrando reemplazo...')
    setUploadPct(100)
    const result = await replaceDocument({
      old_doc_id:    doc.id,
      workspace_id:  workspaceId,
      project_id:    doc.project_id!,
      specialty_id:  doc.specialty_id ?? null,
      file_name:     file.name,
      display_name:  displayName.trim() || null,
      emission_date: emissionDate,
      author:        author.trim(),
      company_id:    null,
      notes:         notes.trim() || null,
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
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-bold text-[#1A2744] flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-[#00C2FF]" />
              Reemplazar documento
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[300px]">{docName}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-800">
            La versión actual quedará archivada y podrá consultarse en el historial de versiones.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Nuevo archivo <span className="text-red-400">*</span>
            </label>
            <input ref={inputRef} type="file" className="hidden"
              accept=".pdf,.dwg,.dxf,.xlsx,.xls,.docx,.doc,.png,.jpg,.jpeg,.zip"
              onChange={e => setFile(e.target.files?.[0] || null)} />
            <button onClick={() => inputRef.current?.click()}
              className={`w-full border-2 border-dashed rounded-lg py-5 text-center transition-colors ${
                file ? 'border-[#00C2FF] bg-[#00C2FF]/5' : 'border-slate-200 hover:border-slate-300'
              }`}>
              <Upload className={`w-5 h-5 mx-auto mb-1.5 ${file ? 'text-[#00C2FF]' : 'text-slate-300'}`} />
              <p className="text-sm font-medium text-slate-600">
                {file ? file.name : 'Clic para seleccionar archivo'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {file ? formatSize(file.size) : 'PDF, DWG, DXF, Excel, Word, imágenes'}
              </p>
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Autor <span className="text-red-400">*</span>
            </label>
            <input type="text" value={author} onChange={e => setAuthor(e.target.value)}
              placeholder="Nombre del autor"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Fecha de versión <span className="text-red-400">*</span>
            </label>
            <input type="date" value={emissionDate} onChange={e => setEmissionDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Nombre descriptivo <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
              placeholder={file?.name || docName}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Nota <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="Cambios o motivo del reemplazo..."
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50 resize-none" />
          </div>

          {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">{error}</div>}

          {uploading && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-700 font-medium">{step}</span>
                <span className="text-blue-500 font-bold tabular-nums">{uploadPct}%</span>
              </div>
              <div className="w-full bg-blue-100 rounded-full h-2 overflow-hidden">
                <div className="bg-[#00C2FF] h-2 rounded-full transition-all duration-200" style={{ width: `${uploadPct}%` }} />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Cancelar
            </button>
            <button onClick={handleReplace} disabled={uploading || !file || !author.trim() || !emissionDate}
              className="flex-1 py-2.5 rounded-lg bg-[#1A2744] text-white text-sm font-bold hover:bg-[#243660] disabled:opacity-60 flex items-center justify-center gap-2">
              <RefreshCw className="w-3.5 h-3.5" />
              {uploading ? 'Subiendo...' : 'Reemplazar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function PdfViewerModal({ docId, docName, onClose }: { docId: string; docName: string; onClose: () => void }) {
  const [loading, setLoading] = useState(true)

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90">
      <div className="flex items-center justify-between px-4 py-3 bg-[#1A2744] flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-lg">📄</span>
          <span className="text-white text-sm font-semibold truncate">{docName}</span>
          <span className="text-xs text-slate-400 uppercase font-medium flex-shrink-0">PDF</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <a href={`/api/documents/download/${docId}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs font-medium hover:bg-white/20 transition-colors">
            <Download className="w-3.5 h-3.5" />
            Descargar
          </a>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-[#00C2FF] animate-spin" />
              <p className="text-slate-400 text-sm">Cargando documento...</p>
            </div>
          </div>
        )}
        <iframe src={`/api/documents/view/${docId}`} className="w-full h-full border-0"
          onLoad={() => setLoading(false)} title={docName} />
      </div>
    </div>
  )
}

function DeleteRequestsPanel({ requests }: { requests: DeleteRequest[] }) {
  const [loading, setLoading]       = useState<string | null>(null)
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({})
  const [rejectOpen, setRejectOpen]  = useState<string | null>(null)

  async function handleApprove(req: DeleteRequest) {
    if (!confirm(`¿Aprobar eliminación de "${req.document?.display_name || req.document?.file_name || req.document?.name}"? Esta acción no se puede deshacer.`)) return
    setLoading(req.id)
    await approveDeleteRequest(req.id, req.document_id)
    setLoading(null)
  }

  async function handleReject(req: DeleteRequest) {
    setLoading(req.id)
    await rejectDeleteRequest(req.id, req.document_id, rejectNotes[req.id] || '')
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
                    <input type="text" placeholder="Motivo del rechazo (opcional)"
                      value={rejectNotes[req.id] || ''}
                      onChange={e => setRejectNotes(prev => ({ ...prev, [req.id]: e.target.value }))}
                      className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-300" />
                    <button onClick={() => handleReject(req)} disabled={isLoading}
                      className="text-xs px-3 py-1.5 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 disabled:opacity-60">
                      {isLoading ? '...' : 'Confirmar'}
                    </button>
                    <button onClick={() => setRejectOpen(null)}
                      className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100">
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
              {!showRejectInput && (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => handleApprove(req)} disabled={isLoading} title="Aprobar eliminación"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-xs font-semibold hover:bg-red-200 disabled:opacity-60">
                    <ShieldX className="w-3.5 h-3.5" />
                    Aprobar borrado
                  </button>
                  <button onClick={() => setRejectOpen(req.id)} disabled={isLoading} title="Rechazar solicitud"
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

// ── Popover de trazabilidad ────────────────────────────────────────────────────

function DocInfoPopover({ doc }: { doc: Doc }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)}
        title="Ver información del documento"
        className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
          open ? 'bg-[#00C2FF]/10 text-[#00C2FF]' : 'hover:bg-slate-100 text-slate-400 hover:text-[#00C2FF]'
        }`}>
        <Info className="w-3.5 h-3.5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-30 bg-white border border-slate-200 rounded-xl shadow-xl p-4 w-72 space-y-2.5 text-xs">
            <p className="font-bold text-[#1A2744] text-sm mb-1">Trazabilidad del documento</p>

            <div className="space-y-2 divide-y divide-slate-100">
              <div className="space-y-1.5 pb-2">
                <Row label="Autor" value={doc.author || '—'} />
                <Row label="Versión" value={`v${doc.version}`} />
                <Row label="Fecha de versión"
                  value={doc.emission_date
                    ? new Date(doc.emission_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
                    : '—'} />
                <Row label="Subido el"
                  value={new Date(doc.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })} />
              </div>

              <div className="space-y-1.5 pt-2 pb-2">
                <Row label="Tipo" value={doc.file_type?.toUpperCase() || '—'} />
                <Row label="Tamaño" value={formatSize(doc.file_size)} />
                <Row label="Disciplina"
                  value={doc.specialty
                    ? `[${doc.specialty.code}] ${doc.specialty.name}`
                    : doc.doc_key?.split('-')[3] || '—'} />
                {doc.doc_view    && <Row label="Tipo de plano" value={doc.doc_view} />}
                {doc.doc_element && <Row label="Elemento" value={doc.doc_element} />}
                {doc.mic_version && <Row label="Versión MIC"
                  value={doc.mic_version === 'V1' ? 'V1 — Para Construcción' : 'V0 — Proyecto'} />}
              </div>

              {doc.notes && (
                <div className="pt-2">
                  <p className="text-slate-400 mb-1">Nota</p>
                  <p className="text-slate-600 italic leading-relaxed">{doc.notes}</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-slate-400 flex-shrink-0">{label}</span>
      <span className="font-medium text-slate-700 text-right">{value}</span>
    </div>
  )
}

// ── Vista raíz: selector de proyectos ─────────────────────────────────────────

// ── Quick Edit Project Modal ──────────────────────────────────────────────────

function QuickEditProjectModal({ project, onClose }: {
  project: Project
  onClose: () => void
}) {
  const [name,         setName]         = useState(project.name)
  const [frente,       setFrente]       = useState(project.frente || '')
  const [projectType,  setProjectType]  = useState(project.project_type || '')
  const [startKm,      setStartKm]      = useState(project.chainage_start != null ? String(Math.floor(project.chainage_start / 1000)) : '')
  const [startM,       setStartM]       = useState(project.chainage_start != null ? String(project.chainage_start % 1000) : '')
  const [endKm,        setEndKm]        = useState(project.chainage_end   != null ? String(Math.floor(project.chainage_end   / 1000)) : '')
  const [endM,         setEndM]         = useState(project.chainage_end   != null ? String(project.chainage_end   % 1000) : '')
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState<string | null>(null)

  async function handleSave() {
    if (!name.trim()) { setError('El nombre es requerido'); return }
    const chStart = parseChainage(startKm, startM)
    const chEnd   = parseChainage(endKm,   endM)
    if (chStart !== null && chEnd !== null && chEnd < chStart) {
      setError('El cadenamiento final debe ser mayor al inicial')
      return
    }
    setSaving(true)
    const result = await updateProjectClassification(project.id, {
      name:           name.trim(),
      frente:         frente.trim() || null,
      project_type:   projectType.trim() || null,
      chainage_start: chStart,
      chainage_end:   chEnd,
    })
    setSaving(false)
    if (result?.error) { setError(result.error); return }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-[#1A2744]">Editar proyecto</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Nombre *</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50" />
          </div>

          {/* Frente */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Frente</label>
            <input value={frente} onChange={e => setFrente(e.target.value)}
              placeholder="Ej: Frente 12"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50" />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Tipo de proyecto</label>
            <input value={projectType} onChange={e => setProjectType(e.target.value)}
              placeholder="Ej: Estructura, Terraplén, Drenaje..."
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50" />
          </div>

          {/* Cadenamiento */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
              <Milestone className="w-3.5 h-3.5 text-[#00C2FF]" />
              Cadenamiento del proyecto
            </label>
            <div className="space-y-2">
              {/* Inicio */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 w-12 flex-shrink-0">Inicio</span>
                <div className="flex items-center gap-1 flex-1">
                  <input
                    type="number" min="0" value={startKm} onChange={e => setStartKm(e.target.value)}
                    placeholder="KM"
                    className="w-20 px-2.5 py-2 rounded-lg border border-slate-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50" />
                  <span className="text-slate-400 font-bold">+</span>
                  <input
                    type="number" min="0" max="999" value={startM} onChange={e => setStartM(e.target.value)}
                    placeholder="000"
                    className="w-20 px-2.5 py-2 rounded-lg border border-slate-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50" />
                  {startKm && <span className="text-xs text-slate-400 font-mono">{startKm}+{String(parseInt(startM)||0).padStart(3,'0')}</span>}
                </div>
              </div>
              {/* Fin */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 w-12 flex-shrink-0">Fin</span>
                <div className="flex items-center gap-1 flex-1">
                  <input
                    type="number" min="0" value={endKm} onChange={e => setEndKm(e.target.value)}
                    placeholder="KM"
                    className="w-20 px-2.5 py-2 rounded-lg border border-slate-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50" />
                  <span className="text-slate-400 font-bold">+</span>
                  <input
                    type="number" min="0" max="999" value={endM} onChange={e => setEndM(e.target.value)}
                    placeholder="000"
                    className="w-20 px-2.5 py-2 rounded-lg border border-slate-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50" />
                  {endKm && <span className="text-xs text-slate-400 font-mono">{endKm}+{String(parseInt(endM)||0).padStart(3,'0')}</span>}
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-1.5">Formato KM+metro · Ej: KM 208, metro 800 → 208+800</p>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Cancelar
            </button>
            <button onClick={handleSave} disabled={saving || !name.trim()}
              className="flex-1 py-2.5 rounded-lg bg-[#1A2744] text-white text-sm font-bold hover:bg-[#243660] disabled:opacity-60 flex items-center justify-center gap-2">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProjectCard({ project, docCount, disciplines, lastUpload, workspaceId, isAdmin, subprojectCount, coverUrl, onSelect, onEdit, onShare }: {
  project: Project
  docCount: number
  disciplines: number
  lastUpload: string | null
  workspaceId: string
  isAdmin: boolean
  subprojectCount: number
  coverUrl: string | null
  onSelect: (id: string) => void
  onEdit: (project: Project) => void
  onShare: (project: Project) => void
}) {
  const [displayCoverUrl, setDisplayCoverUrl] = useState<string | null>(coverUrl)
  const hasChainage = project.chainage_start != null || project.chainage_end != null

  return (
    <div className="bg-white border border-slate-100 rounded-xl overflow-hidden hover:shadow-md hover:border-[#00C2FF]/30 transition-all group">
      {/* Cover image area */}
      <div
        onClick={() => onSelect(project.id)}
        className="relative h-36 bg-[#1A2744]/5 flex items-center justify-center overflow-hidden cursor-pointer">
        {displayCoverUrl ? (
          <img src={displayCoverUrl} alt={project.name} className="w-full h-full object-cover" />
        ) : (
          <FolderOpen className="w-10 h-10 text-[#1A2744]/20" />
        )}
        {isAdmin && (
          <ProjectCoverUploader project={project} workspaceId={workspaceId} onUploaded={() => setDisplayCoverUrl(`/api/projects/${project.id}/cover?t=${Date.now()}`)} />
        )}
        {/* Botones editar + compartir — top-left, visibles al hover */}
        {isAdmin && (
          <div className="absolute top-2 left-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <button
              onClick={e => { e.stopPropagation(); onEdit(project) }}
              title="Editar proyecto"
              className="w-7 h-7 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={e => { e.stopPropagation(); onShare(project) }}
              title="Compartir archivos del proyecto"
              className="w-7 h-7 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-[#00C2FF] transition-colors">
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Card body */}
      <div onClick={() => onSelect(project.id)} className="p-4 cursor-pointer">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-[#1A2744] text-sm leading-tight">{project.name}</h3>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#00C2FF] transition-colors flex-shrink-0 mt-0.5" />
        </div>
        {(project.frente || project.project_type || project.is_inah || project.cauces_federales) && (
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {project.frente && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#00C2FF]/10 text-[#0099CC]">
                {project.frente}
              </span>
            )}
            {project.project_type && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                {project.project_type}
              </span>
            )}
            {project.is_inah && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                INAH
              </span>
            )}
            {project.cauces_federales && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                Cauces Federales
              </span>
            )}
          </div>
        )}

        {/* Cadenamiento */}
        {hasChainage && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <Milestone className="w-3 h-3 text-[#00C2FF] flex-shrink-0" />
            <span className="text-[10px] font-mono text-slate-500">
              {project.chainage_start != null ? formatChainage(project.chainage_start) : '—'}
              {' — '}
              {project.chainage_end != null ? formatChainage(project.chainage_end) : '—'}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
          <span>{docCount} documento{docCount !== 1 ? 's' : ''}</span>
          {disciplines > 0 && (
            <><span>·</span><span>{disciplines} disciplina{disciplines !== 1 ? 's' : ''}</span></>
          )}
          {subprojectCount > 0 && (
            <><span>·</span><span className="flex items-center gap-1"><Layers className="w-3 h-3" />{subprojectCount} subproyecto{subprojectCount !== 1 ? 's' : ''}</span></>
          )}
        </div>
        {lastUpload && (
          <p className="text-xs text-slate-300 mt-1">
            Última subida:{' '}
            {new Date(lastUpload).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        )}

      </div>
    </div>
  )
}

function ProjectCoverUploader({ project, workspaceId, onUploaded }: {
  project: Project
  workspaceId: string
  onUploaded: (key: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      // Borrar portada anterior de R2 si existe
      if (project.cover_image_url) {
        await fetch(`/api/projects/${project.id}/cover`, { method: 'DELETE' })
      }
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      const res = await fetch('/api/projects/presign-cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, workspaceId, contentType: file.type, extension: ext }),
      })
      const { uploadUrl, storageKey } = await res.json()
      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
      await updateProjectCover(project.id, storageKey)
      onUploaded(storageKey)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} onClick={e => e.stopPropagation()} />
      <button
        onClick={e => { e.stopPropagation(); inputRef.current?.click() }}
        disabled={uploading}
        title="Subir foto de portada"
        className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors disabled:opacity-60 z-10">
        {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
      </button>
    </>
  )
}

function ProjectsView({
  projects, documents, onSelect, userRole, workspaceId, coverUrls,
}: {
  projects: Project[]
  documents: Doc[]
  onSelect: (projectId: string) => void
  userRole: string
  workspaceId: string
  coverUrls: Record<string, string>
}) {
  const [filterFrente, setFilterFrente] = useState('all')
  const [filterType,   setFilterType]   = useState('all')
  const [filterBadge,  setFilterBadge]  = useState('all')
  const [filterPK,     setFilterPK]     = useState('all')
  const [sortByPK,     setSortByPK]     = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [shareProject, setShareProject]   = useState<Project | null>(null)
  const isAdmin = ['owner', 'admin', 'manager'].includes(userRole)

  // Solo proyectos raíz (sin padre)
  const rootProjects = projects.filter(p => !p.parent_project_id)

  const frentes      = [...new Set(rootProjects.map(p => p.frente).filter(Boolean))] as string[]
  const projectTypes = [...new Set(rootProjects.map(p => p.project_type).filter(Boolean))] as string[]
  const hasInah      = rootProjects.some(p => p.is_inah)
  const hasCauces    = rootProjects.some(p => p.cauces_federales)
  const pkOptions    = [...new Set(rootProjects.map(p => p.chainage_start).filter(v => v != null))] as number[]
  pkOptions.sort((a, b) => a - b)

  function projectMatchesFilter(p: Project) {
    if (filterFrente !== 'all' && p.frente !== filterFrente) return false
    if (filterType   !== 'all' && p.project_type !== filterType) return false
    if (filterBadge  === 'inah'   && !p.is_inah) return false
    if (filterBadge  === 'cauces' && !p.cauces_federales) return false
    if (filterPK !== 'all' && p.chainage_start !== Number(filterPK)) return false
    return true
  }

  const filtered = rootProjects
    .filter(p => {
      if (projectMatchesFilter(p)) return true
      // Incluir si algún subproyecto cumple el filtro
      const subs = projects.filter(s => s.parent_project_id === p.id)
      return subs.some(s => projectMatchesFilter(s))
    })
    .sort((a, b) => {
      if (!sortByPK) return 0
      const pa = a.chainage_start ?? Infinity
      const pb = b.chainage_start ?? Infinity
      return pa - pb
    })

  if (rootProjects.length === 0) {
    return (
      <div className="bg-white border border-slate-100 rounded-xl p-16 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FolderOpen className="w-8 h-8 text-slate-300" />
        </div>
        <h2 className="text-lg font-bold text-[#1A2744] mb-2">Sin proyectos activos</h2>
        <p className="text-slate-400 text-sm max-w-xs mx-auto">
          Crea un proyecto en Admin para comenzar a subir documentos.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Filtros — solo se muestran si hay valores distintos */}
      {(frentes.length > 0 || projectTypes.length > 0 || hasInah || hasCauces || pkOptions.length > 0) && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {frentes.length > 0 && (
            <select value={filterFrente} onChange={e => setFilterFrente(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40">
              <option value="all">Todos los frentes</option>
              {frentes.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          )}
          {projectTypes.length > 0 && (
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40">
              <option value="all">Todos los tipos</option>
              {projectTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
          {(hasInah || hasCauces) && (
            <select value={filterBadge} onChange={e => setFilterBadge(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40">
              <option value="all">Todos</option>
              {hasInah   && <option value="inah">INAH</option>}
              {hasCauces && <option value="cauces">Cauces Federales</option>}
            </select>
          )}
          {pkOptions.length > 0 && (
            <select value={filterPK} onChange={e => setFilterPK(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40 font-mono">
              <option value="all">PK inicio</option>
              {pkOptions.map(pk => (
                <option key={pk} value={String(pk)}>{formatChainage(pk)}</option>
              ))}
            </select>
          )}
          {pkOptions.length > 0 && (
            <button onClick={() => setSortByPK(v => !v)}
              title="Ordenar por PK"
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                sortByPK
                  ? 'bg-[#1A2744] text-white border-[#1A2744]'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-[#1A2744] hover:text-[#1A2744]'
              }`}>
              <Milestone className="w-3 h-3" />
              Ordenar por PK
            </button>
          )}
          {(filterFrente !== 'all' || filterType !== 'all' || filterBadge !== 'all' || filterPK !== 'all' || sortByPK) && (
            <button onClick={() => { setFilterFrente('all'); setFilterType('all'); setFilterBadge('all'); setFilterPK('all'); setSortByPK(false) }}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 flex items-center gap-1">
              <X className="w-3 h-3" />
              Limpiar
            </button>
          )}
          <span className="text-xs text-slate-400 ml-1">
            {filtered.length} proyecto{filtered.length !== 1 ? 's' : ''} raíz
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(project => {
          const subprojectIds = projects
            .filter(p => p.parent_project_id === project.id)
            .map(p => p.id)
          const subprojectCount = subprojectIds.length

          // Docs del proyecto raíz + sus subproyectos, vigentes y no eliminados
          const projectDocs = documents.filter(d =>
            (d.project_id === project.id || subprojectIds.includes(d.project_id!)) &&
            d.is_current !== false &&
            d.doc_status !== 'archived' &&
            d.doc_status !== 'deleted'
          )
          const disciplines = new Set(projectDocs.filter(d => d.specialty?.code).map(d => d.specialty!.code)).size
          const lastUpload = projectDocs.length > 0
            ? projectDocs.reduce((latest, d) => d.created_at > latest ? d.created_at : latest, projectDocs[0].created_at)
            : null

          return (
            <ProjectCard
              key={project.id}
              project={project}
              docCount={projectDocs.length}
              disciplines={disciplines}
              lastUpload={lastUpload}
              workspaceId={workspaceId}
              isAdmin={isAdmin}
              subprojectCount={subprojectCount}
              coverUrl={coverUrls[project.id] ?? null}
              onSelect={onSelect}
              onEdit={setEditingProject}
              onShare={setShareProject}
            />
          )
        })}
      </div>

      {editingProject && (
        <QuickEditProjectModal
          project={editingProject}
          onClose={() => setEditingProject(null)}
        />
      )}
      {shareProject && (
        <ShareProjectModal
          projectId={shareProject.id}
          projectName={shareProject.name}
          onClose={() => setShareProject(null)}
        />
      )}
    </div>
  )
}

// ── Hero cover del subproyecto ────────────────────────────────────────────────

function SubprojectHero({
  project, workspaceId, initialCoverUrl, canManage,
}: {
  project: Project
  workspaceId: string
  initialCoverUrl: string | null
  canManage: boolean
}) {
  const [coverUrl, setCoverUrl] = useState<string | null>(initialCoverUrl)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      if (project.cover_image_url) {
        await fetch(`/api/projects/${project.id}/cover`, { method: 'DELETE' })
      }
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      const res = await fetch('/api/projects/presign-cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, workspaceId, contentType: file.type, extension: ext }),
      })
      if (!res.ok) return
      const { uploadUrl, storageKey } = await res.json()
      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
      await fetch('/api/projects/presign-cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, workspaceId, save: true, storageKey }),
      })
      await updateProjectCover(project.id, storageKey)
      setCoverUrl(`/api/projects/${project.id}/cover?t=${Date.now()}`)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="relative mb-6 rounded-2xl overflow-hidden h-48 group">
      {/* Fondo: imagen o degradado violet */}
      {coverUrl ? (
        <img src={coverUrl} alt={project.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-violet-600 via-violet-700 to-violet-900 flex flex-col items-center justify-center gap-2">
          <Layers className="w-10 h-10 text-white/30" />
          <p className="text-white/40 text-xs font-medium">Sin imagen representativa</p>
        </div>
      )}

      {/* Overlay sutil al hacer hover */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

      {/* Nombre del subproyecto superpuesto abajo-izquierda */}
      <div className="absolute bottom-0 left-0 right-0 px-5 py-4 bg-gradient-to-t from-black/60 to-transparent">
        <p className="text-white font-bold text-lg leading-tight drop-shadow">{project.name}</p>
      </div>

      {/* Botón cámara — solo admin, esquina inferior derecha */}
      {canManage && (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          title="Cambiar imagen representativa"
          className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100 z-10">
          {uploading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Camera className="w-4 h-4" />}
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}

// ── Vista detalle: documentos de un proyecto agrupados por disciplina ──────────

function ProjectDetailView({
  project, documents, workspaceId, userRole, deleteRequests, currentUserId,
  subprojects, parentProject, onBack, onUpload, onSelectSub, coverUrls,
}: {
  project: Project
  documents: Doc[]
  workspaceId: string
  userRole: string
  deleteRequests: DeleteRequest[]
  currentUserId: string
  subprojects: Project[]
  parentProject: Project | null
  onBack: () => void
  onUpload: () => void
  onSelectSub: (id: string) => void
  coverUrls: Record<string, string>
}) {
  const [selected,         setSelected]         = useState<Set<string>>(new Set())
  const [filterStatus,     setFilterStatus]     = useState('all')
  const [filterSpecialty,  setFilterSpecialty]  = useState('all')
  const [sortMode,         setSortMode]         = useState<'discipline' | 'recent'>('discipline')
  const [viewingDoc,       setViewingDoc]       = useState<{ id: string; name: string } | null>(null)
  const [slideDoc,         setSlideDoc]         = useState<Doc | null>(null)
  const [replaceDoc,       setReplaceDoc]       = useState<Doc | null>(null)
  const [downloading,      setDownloading]      = useState(false)
  const [expandedHistory,  setExpandedHistory]  = useState<Set<string>>(new Set())
  const [showCreateSub,    setShowCreateSub]    = useState(false)
  const [newSubName,       setNewSubName]       = useState('')
  const [newSubDesc,       setNewSubDesc]       = useState('')
  const [newSubType,       setNewSubType]       = useState('')
  const [creatingSub,      setCreatingSub]      = useState(false)
  const isAdmin        = ['owner', 'admin'].includes(userRole)
  const canManageProjects = ['owner', 'admin', 'manager'].includes(userRole)

  async function handleCreateSubproject() {
    if (!newSubName.trim()) return
    setCreatingSub(true)
    await createSubproject({
      workspace_id:      workspaceId,
      parent_project_id: project.id,
      name:              newSubName.trim(),
      description:       newSubDesc.trim() || null,
      project_type:      newSubType.trim() || null,
    })
    setCreatingSub(false)
    setShowCreateSub(false)
    setNewSubName('')
    setNewSubDesc('')
    setNewSubType('')
  }

  // Todos los docs del proyecto (para historial de versiones)
  const projectDocs = documents.filter(d => d.project_id === project.id)
  // Solo docs vigentes/activos (para la tabla principal y conteos)
  const currentDocs = projectDocs.filter(d => d.is_current !== false && d.doc_status !== 'archived' && d.doc_status !== 'deleted')

  // Versiones archivadas agrupadas por doc_key
  const archivedByDocKey = projectDocs.reduce<Record<string, Doc[]>>((acc, d) => {
    if (d.doc_key && d.is_current === false) {
      if (!acc[d.doc_key]) acc[d.doc_key] = []
      acc[d.doc_key].push(d)
    }
    return acc
  }, {})

  // Helper: obtener código de especialidad desde specialty o doc_key
  function getSpecCode(d: Doc): string | null {
    return d.specialty?.code || d.doc_key?.split('-')[3] || null
  }

  // Especialidades usadas en este proyecto (solo docs vigentes)
  const specMap = new Map<string, { code: string; name: string; category: string }>()
  currentDocs.forEach(d => {
    if (d.specialty) {
      specMap.set(d.specialty.code, d.specialty)
    } else {
      const code = d.doc_key?.split('-')[3]
      if (code && !specMap.has(code)) specMap.set(code, { code, name: code, category: '' })
    }
  })
  const usedSpecialties = [...specMap.values()].sort((a, b) => a.code.localeCompare(b.code))

  let filtered = currentDocs
  if (filterStatus !== 'all')    filtered = filtered.filter(d => d.status === filterStatus)
  if (filterSpecialty !== 'all') filtered = filtered.filter(d =>
    filterSpecialty === 'none' ? !getSpecCode(d) : getSpecCode(d) === filterSpecialty
  )

  // Agrupar por disciplina (solo versiones vigentes)
  const grouped: Record<string, Doc[]> = {}
  filtered.filter(d => d.is_current !== false).forEach(doc => {
    const specCode = getSpecCode(doc)
    const key = doc.specialty
      ? `[${doc.specialty.code}] ${doc.specialty.name}`
      : specCode ? `[${specCode}] ${specCode}` : 'Sin disciplina'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(doc)
  })

  // Vista recientes: docs vigentes ordenados por fecha de subida desc
  const recentFlat = filtered
    .filter(d => d.is_current !== false)
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const displayGroups: Record<string, Doc[]> = sortMode === 'recent'
    ? (recentFlat.length > 0 ? { Recientes: recentFlat } : {})
    : grouped

  function toggleDoc(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected(selected.size === filtered.length && filtered.length > 0
      ? new Set()
      : new Set(filtered.map(d => d.id))
    )
  }

  async function handleDownloadZip() {
    setDownloading(true)
    try {
      const res = await fetch('/api/documents/download-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docIds: Array.from(selected), projectName: project.name }),
      })
      if (!res.ok) { alert('Error al generar el ZIP'); return }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `${project.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_')}_documentos.zip`
      a.click()
      URL.revokeObjectURL(url)
      setSelected(new Set())
    } finally {
      setDownloading(false)
    }
  }

  async function handleDelete(doc: Doc) {
    const name = doc.display_name || doc.file_name || doc.name
    const pendingReq = deleteRequests.find(r => r.document_id === doc.id)
    if (isAdmin) {
      if (!confirm(`¿Eliminar "${name}" permanentemente?`)) return
      if (pendingReq) await approveDeleteRequest(pendingReq.id, doc.id)
      else await deleteDocument(doc.id)
    } else {
      if (!confirm('¿Solicitar eliminación de este documento? Un administrador deberá aprobarlo.')) return
      await requestDeleteDocument(doc.id)
    }
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-[#1A2744] transition-colors">
          <ArrowLeft className="w-4 h-4" />
          {parentProject ? parentProject.name : 'Proyectos'}
        </button>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-semibold text-[#1A2744]">{project.name}</span>
        {parentProject && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-600 flex items-center gap-1">
            <Layers className="w-2.5 h-2.5" /> Subproyecto
          </span>
        )}
        {project.frente && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#00C2FF]/10 text-[#0099CC]">
            {project.frente}
          </span>
        )}
        {project.project_type && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
            {project.project_type}
          </span>
        )}
        {project.is_inah && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
            INAH
          </span>
        )}
        {project.cauces_federales && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
            Cauces Federales
          </span>
        )}
        <span className="text-xs text-slate-400 ml-1">
          ({currentDocs.length} documento{currentDocs.length !== 1 ? 's' : ''})
        </span>
      </div>

      {/* ── Hero cover del subproyecto (solo subproyectos) ── */}
      {parentProject && (
        <SubprojectHero
          project={project}
          workspaceId={workspaceId}
          initialCoverUrl={coverUrls[project.id] ?? null}
          canManage={canManageProjects}
        />
      )}

      {/* ── Sección de Subproyectos (solo si el proyecto es raíz y tiene/puede tener subproyectos) ── */}
      {!parentProject && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-violet-500" />
              <span className="text-sm font-bold text-[#1A2744]">Subproyectos</span>
              {subprojects.length > 0 && (
                <span className="text-xs bg-violet-100 text-violet-600 font-semibold px-2 py-0.5 rounded-full">
                  {subprojects.length}
                </span>
              )}
            </div>
            {canManageProjects && (
              <button onClick={() => setShowCreateSub(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-violet-200 text-xs font-semibold text-violet-600 hover:bg-violet-50 transition-colors">
                <Plus className="w-3.5 h-3.5" />
                Nuevo subproyecto
              </button>
            )}
          </div>

          {/* Formulario crear subproyecto */}
          {showCreateSub && (
            <div className="mb-3 bg-violet-50 border border-violet-200 rounded-xl p-4 space-y-3">
              <p className="text-xs text-violet-600 font-medium">
                Se creará como subproyecto de <span className="font-bold">"{project.name}"</span>. Para crear un proyecto raíz, ve a Admin → Proyectos.
              </p>
              <input value={newSubName} onChange={e => setNewSubName(e.target.value)}
                placeholder="Nombre del subproyecto *"
                onKeyDown={e => { if (e.key === 'Enter') handleCreateSubproject(); if (e.key === 'Escape') setShowCreateSub(false) }}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/50" />
              <div className="grid grid-cols-2 gap-2">
                <input value={newSubDesc} onChange={e => setNewSubDesc(e.target.value)}
                  placeholder="Descripción (opcional)"
                  className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/50" />
                <input value={newSubType} onChange={e => setNewSubType(e.target.value)}
                  placeholder="Tipo (Estructura, Drenaje...)"
                  className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/50" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setShowCreateSub(false); setNewSubName(''); setNewSubDesc(''); setNewSubType('') }}
                  className="flex-1 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                  Cancelar
                </button>
                <button onClick={handleCreateSubproject} disabled={!newSubName.trim() || creatingSub}
                  className="flex-1 py-2 rounded-lg bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 disabled:opacity-60 flex items-center justify-center gap-2">
                  {creatingSub ? <><Loader2 className="w-4 h-4 animate-spin" /> Creando...</> : 'Crear'}
                </button>
              </div>
            </div>
          )}

          {/* Cards de subproyectos */}
          {subprojects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {subprojects.map(sub => {
                const subDocs = documents.filter(d =>
                  d.project_id === sub.id && d.doc_status !== 'deleted'
                )
                return (
                  <button key={sub.id} onClick={() => onSelectSub(sub.id)}
                    className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-xl hover:border-violet-200 hover:shadow-sm transition-all text-left group">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-100 transition-colors">
                      <Layers className="w-5 h-5 text-violet-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1A2744] truncate">{sub.name}</p>
                      {sub.description && (
                        <p className="text-xs text-slate-400 truncate mt-0.5">{sub.description}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-0.5">
                        {subDocs.length} documento{subDocs.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-violet-400 transition-colors flex-shrink-0" />
                  </button>
                )
              })}
            </div>
          ) : (
            !showCreateSub && (
              <div className="bg-white border border-dashed border-slate-200 rounded-xl p-6 text-center">
                <Layers className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Sin subproyectos aún.</p>
                {canManageProjects && (
                  <button onClick={() => setShowCreateSub(true)}
                    className="text-xs text-violet-500 hover:text-violet-700 font-medium mt-1">
                    Crear el primero →
                  </button>
                )}
              </div>
            )
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Seleccionar todos */}
          <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:border-slate-300 select-none">
            <input type="checkbox"
              checked={selected.size === filtered.length && filtered.length > 0}
              onChange={toggleAll}
              className="w-3.5 h-3.5 accent-[#1A2744]" />
            Seleccionar todos
          </label>

          {/* Filtro de especialidad */}
          {usedSpecialties.length > 0 && (
            <select value={filterSpecialty} onChange={e => setFilterSpecialty(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40">
              <option value="all">Todas las disciplinas</option>
              {usedSpecialties.map(s => (
                <option key={s.code} value={s.code}>[{s.code}] {s.name}</option>
              ))}
              {currentDocs.some(d => !d.specialty) && (
                <option value="none">Sin disciplina</option>
              )}
            </select>
          )}

          {/* Filtros de estado */}
          {(['all', 'draft', 'review', 'approved'] as const).map(f => (
            <button key={f} onClick={() => setFilterStatus(f)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                filterStatus === f
                  ? 'bg-[#1A2744] text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
              }`}>
              {f === 'all' ? 'Todos' : STATUS_CONFIG[f]?.label}
              {f !== 'all' && (
                <span className="ml-1.5 opacity-70">
                  {currentDocs.filter(d => d.status === f).length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle vista disciplina / recientes */}
          <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden">
            <button onClick={() => setSortMode('discipline')} title="Agrupar por disciplina"
              className={`px-2.5 py-1.5 transition-colors ${sortMode === 'discipline' ? 'bg-[#1A2744] text-white' : 'bg-white text-slate-400 hover:bg-slate-50'}`}>
              <AlignJustify className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setSortMode('recent')} title="Recientes primero"
              className={`px-2.5 py-1.5 transition-colors ${sortMode === 'recent' ? 'bg-[#1A2744] text-white' : 'bg-white text-slate-400 hover:bg-slate-50'}`}>
              <LayoutList className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Botón ZIP */}
          {selected.size > 0 && (
            <button onClick={handleDownloadZip} disabled={downloading}
              className="flex items-center gap-2 bg-[#00C2FF] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#00a8d6] disabled:opacity-60 transition-colors">
              <Package className="w-3.5 h-3.5" />
              {downloading ? 'Generando ZIP...' : `Descargar ZIP (${selected.size})`}
            </button>
          )}

          {/* Subir */}
          <button onClick={onUpload}
            className="flex items-center gap-2 bg-[#1A2744] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#243660] transition-colors">
            <Upload className="w-3.5 h-3.5" />
            Subir documento
          </button>
        </div>
      </div>

      {/* Contenido */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-xl p-12 text-center">
          <FolderOpen className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-[#1A2744] mb-1">Sin documentos</p>
          <p className="text-slate-400 text-sm">Sube el primer documento de este proyecto con el botón de arriba.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(displayGroups).map(([group, docs]) => (
            <div key={group}>
              {/* Encabezado de disciplina / recientes */}
              {sortMode === 'discipline' && (
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{group}</span>
                  <span className="text-xs text-slate-300">{docs.length}</span>
                </div>
              )}
              {sortMode === 'recent' && (
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Recientes</span>
                  <span className="text-xs text-slate-300">{docs.length} documentos</span>
                </div>
              )}

              <div className="bg-white rounded-xl border border-slate-100">
                {/* Header columnas */}
                <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wide rounded-t-xl">
                  <span className="w-5" />
                  <span className="w-5" />
                  <span className="flex-1">Documento</span>
                  <span className="hidden lg:block w-28">Autor</span>
                  <span className="hidden lg:block w-24">{sortMode === 'recent' ? 'Subido' : 'Versión'}</span>
                  <span className="w-28">Flujo</span>
                  <span className="w-28 text-right">Acciones</span>
                </div>

                {docs.map((doc, idx) => {
                  const fileIcon = FILE_ICONS[doc.file_type || 'other'] || '📁'
                  const isPendingDelete = doc.doc_status === 'pending_delete'
                  const isLast = idx === docs.length - 1
                  const docName = doc.display_name || doc.file_name || doc.name

                  return (
                    <React.Fragment key={doc.id}>
                    <div
                      className={`flex items-center gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50 group ${isPendingDelete ? 'opacity-60' : ''} ${isLast && !(doc.doc_key && expandedHistory.has(doc.doc_key) && archivedByDocKey[doc.doc_key]?.length) ? 'rounded-b-xl border-b-0' : ''}`}>
                      {/* Checkbox */}
                      <input type="checkbox"
                        checked={selected.has(doc.id)}
                        onChange={() => toggleDoc(doc.id)}
                        className="w-3.5 h-3.5 accent-[#1A2744] flex-shrink-0" />

                      {/* Icono */}
                      <span className="text-base w-5 flex-shrink-0">{fileIcon}</span>

                      {/* Nombre */}
                      <div className="flex-1 min-w-0">
                        {doc.file_type === 'pdf' ? (
                          <button
                            onClick={() => setViewingDoc({ id: doc.id, name: docName })}
                            className="text-sm font-medium text-slate-700 truncate block w-full text-left hover:text-[#00C2FF] transition-colors">
                            {docName}
                          </button>
                        ) : (
                          <p className="text-sm font-medium text-slate-700 truncate">{docName}</p>
                        )}
                        {doc.file_name && doc.file_name !== docName && (
                          <p className="text-[11px] text-slate-400 truncate font-mono leading-tight mb-0.5" title={doc.file_name}>
                            {doc.file_name}
                          </p>
                        )}
                        <p className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
                          {doc.version_number !== null
                            ? <span className="font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">v{String(doc.version_number).padStart(4, '0')}</span>
                            : <span>v{doc.version}</span>
                          }
                          {doc.doc_view && (
                            <span className="font-mono bg-[#00C2FF]/10 text-[#0099CC] px-1.5 py-0.5 rounded font-bold text-[10px]">{doc.doc_view}</span>
                          )}
                          {doc.mic_version && (
                            <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${doc.mic_version === 'V1' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                              {doc.mic_version}
                            </span>
                          )}
                          {sortMode === 'recent' && doc.specialty && (
                            <span className="font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[10px] font-bold">{doc.specialty.code}</span>
                          )}
                          <span>·</span>
                          <span>{doc.file_type?.toUpperCase() || '—'}</span>
                          <span>·</span>
                          <span>{formatSize(doc.file_size)}</span>
                          {doc.uploader?.initials && (
                            <>
                              <span>·</span>
                              <span
                                title={doc.uploader.full_name || doc.uploader.initials}
                                className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#1A2744] text-white font-bold text-[9px] flex-shrink-0 cursor-default">
                                {doc.uploader.initials}
                              </span>
                            </>
                          )}
                          {isPendingDelete && <span className="text-amber-500 font-medium">· Borrado pendiente</span>}
                          {doc.doc_key && archivedByDocKey[doc.doc_key]?.length > 0 && (
                            <button
                              onClick={() => setExpandedHistory(prev => {
                                const next = new Set(prev)
                                next.has(doc.doc_key!) ? next.delete(doc.doc_key!) : next.add(doc.doc_key!)
                                return next
                              })}
                              className="flex items-center gap-1 text-slate-400 hover:text-[#00C2FF] transition-colors ml-1">
                              <History className="w-3 h-3" />
                              {expandedHistory.has(doc.doc_key)
                                ? 'Ocultar historial'
                                : `${archivedByDocKey[doc.doc_key].length} versión${archivedByDocKey[doc.doc_key].length !== 1 ? 'es' : ''} anterior${archivedByDocKey[doc.doc_key].length !== 1 ? 'es' : ''}`
                              }
                            </button>
                          )}
                        </p>
                      </div>

                      {/* Autor */}
                      <span className="hidden lg:block text-xs text-slate-500 w-28 truncate">
                        {doc.author || '—'}
                      </span>

                      {/* Fecha de versión / subida */}
                      <span className="hidden lg:block text-xs text-slate-400 w-24">
                        {sortMode === 'recent'
                          ? doc.created_at ? new Date(doc.created_at).toLocaleDateString('es-MX') : '—'
                          : doc.emission_date ? new Date(doc.emission_date).toLocaleDateString('es-MX') : '—'
                        }
                      </span>

                      {/* Estado — Flujo ELAB → REV → APR */}
                      <div className="w-28">
                        <WorkflowBadge doc={doc} userRole={userRole} />
                      </div>

                      {/* Acciones */}
                      <div className="flex items-center gap-0.5 w-28 justify-end">
                        <button onClick={() => setSlideDoc(doc)} title="Ver detalles y comentarios"
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#00C2FF]/10 text-slate-400 hover:text-[#00C2FF] transition-colors">
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setReplaceDoc(doc)} title="Reemplazar con nueva versión"
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors">
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        {doc.storage_key && (
                          doc.doc_key ? (
                            <div className="relative group/dl">
                              <button title="Descargar"
                                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors">
                                <Download className="w-3.5 h-3.5" />
                              </button>
                              <div className="absolute right-0 top-8 hidden group-hover/dl:flex flex-col bg-white border border-slate-200 rounded-lg shadow-lg z-20 min-w-max overflow-hidden">
                                <a href={`/api/documents/download/${doc.id}`} target="_blank" rel="noopener noreferrer"
                                  className="px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                                  <Download className="w-3 h-3" />
                                  Nombre original
                                </a>
                                <a href={`/api/documents/download/${doc.id}?builtek=1`} target="_blank" rel="noopener noreferrer"
                                  className="px-3 py-2 text-xs text-[#00C2FF] hover:bg-slate-50 flex items-center gap-2 border-t border-slate-100">
                                  <Download className="w-3 h-3" />
                                  ID Builtek
                                </a>
                              </div>
                            </div>
                          ) : (
                            <a href={`/api/documents/download/${doc.id}`} target="_blank" rel="noopener noreferrer"
                              title="Descargar"
                              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600">
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          )
                        )}
                        {(isAdmin || !isPendingDelete) && (
                          <button onClick={() => handleDelete(doc)} title={isAdmin ? 'Eliminar' : 'Solicitar eliminación'}
                            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
                              isAdmin
                                ? 'hover:bg-red-50 text-slate-400 hover:text-red-500'
                                : 'hover:bg-amber-50 text-slate-400 hover:text-amber-500'
                            }`}>
                            {isAdmin ? <Trash2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Historial de versiones anteriores */}
                    {doc.doc_key && expandedHistory.has(doc.doc_key) && archivedByDocKey[doc.doc_key]?.map(archived => (
                      <div key={archived.id}
                        className="flex items-center gap-3 px-4 py-2.5 bg-slate-50/70 border-b border-slate-50 text-slate-400">
                        <span className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="text-sm w-5 flex-shrink-0 opacity-40">{FILE_ICONS[archived.file_type || 'other'] || '📁'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-500 truncate italic">
                            {archived.display_name || archived.file_name || archived.name}
                          </p>
                          <p className="text-xs text-slate-400 flex items-center gap-1.5">
                            <span className="font-mono bg-slate-200 text-slate-400 px-1 py-0.5 rounded text-[10px]">
                              v{String(archived.version_number ?? archived.version).padStart(4, '0')}
                            </span>
                            <span>Archivado</span>
                            {archived.emission_date && <><span>·</span><span>{new Date(archived.emission_date).toLocaleDateString('es-MX')}</span></>}
                          </p>
                        </div>
                        <span className="hidden lg:block text-xs text-slate-400 w-28 truncate italic">{archived.author || '—'}</span>
                        <span className="hidden lg:block text-xs text-slate-300 w-24">
                          {archived.emission_date ? new Date(archived.emission_date).toLocaleDateString('es-MX') : '—'}
                        </span>
                        <div className="w-28">
                          <span className="text-[10px] px-2 py-1 rounded-full bg-slate-100 text-slate-400 font-medium">Archivado</span>
                        </div>
                        <div className="flex items-center gap-0.5 w-20 justify-end">
                          {archived.storage_key && (
                            <a href={`/api/documents/download/${archived.id}`} target="_blank" rel="noopener noreferrer"
                              title="Descargar versión archivada"
                              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-300 hover:text-slate-500">
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                    </React.Fragment>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {viewingDoc && (
        <PdfViewerModal
          docId={viewingDoc.id}
          docName={viewingDoc.name}
          onClose={() => setViewingDoc(null)}
        />
      )}

      {slideDoc && (
        <DocumentSlideOver
          doc={slideDoc}
          workspaceId={workspaceId}
          currentUserId={currentUserId}
          onClose={() => setSlideDoc(null)}
        />
      )}

      {replaceDoc && (
        <ReplaceDocModal
          doc={replaceDoc}
          workspaceId={workspaceId}
          onClose={() => setReplaceDoc(null)}
        />
      )}
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────────────────

export default function DocumentsPanel({
  documents, projects, workspaceId, userRole, deleteRequests, currentUserId, companies, members, micNomenclatures, workspaceOficios, mesasTecnicas, coverUrls
}: {
  documents: Doc[]
  projects: Project[]
  workspaceId: string
  userRole: string
  deleteRequests: DeleteRequest[]
  currentUserId: string
  companies: Company[]
  members: Member[]
  micNomenclatures: MicNomenclature[]
  workspaceOficios: OfiEntry[]
  mesasTecnicas: MesaTecnica[]
  coverUrls: Record<string, string>
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedProjectId = searchParams.get('project')
  const [showUpload, setShowUpload] = useState(false)
  const [lastUploadConfig, setLastUploadConfig] = useState<LastUploadConfig | null>(null)
  const isAdmin = userRole === 'owner' || userRole === 'admin'

  const selectedProject  = projects.find(p => p.id === selectedProjectId) ?? null
  const parentProject    = selectedProject?.parent_project_id
    ? (projects.find(p => p.id === selectedProject.parent_project_id) ?? null)
    : null
  const subprojects      = selectedProject
    ? projects.filter(p => p.parent_project_id === selectedProject.id)
    : []

  function selectProject(id: string) {
    router.push(`/documents?project=${id}`)
  }

  function goBack() {
    if (parentProject) {
      router.push(`/documents?project=${parentProject.id}`)
    } else {
      router.push('/documents')
    }
  }

  return (
    <div>
      {/* Solicitudes de borrado — solo admin/owner */}
      {isAdmin && <DeleteRequestsPanel requests={deleteRequests} />}

      {/* Vista raíz: selector de proyectos */}
      {!selectedProject && (
        <>
          {/* Subtítulo informativo */}
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <p className="text-sm text-slate-500 max-w-xl">
              Selecciona un proyecto para ver y descargar sus documentos organizados por disciplina.
              Siempre encontrarás aquí la versión más actualizada de cada entregable.
            </p>
            <button onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 bg-[#1A2744] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#243660] transition-colors">
              <Upload className="w-3.5 h-3.5" />
              Subir documento
            </button>
          </div>

          <ProjectsView
            projects={projects}
            documents={documents}
            onSelect={selectProject}
            userRole={userRole}
            workspaceId={workspaceId}
            coverUrls={coverUrls}
          />
        </>
      )}

      {/* Vista detalle: documentos del proyecto seleccionado */}
      {selectedProject && (
        <ProjectDetailView
          project={selectedProject}
          documents={documents}
          workspaceId={workspaceId}
          userRole={userRole}
          deleteRequests={deleteRequests}
          currentUserId={currentUserId}
          subprojects={subprojects}
          parentProject={parentProject}
          onBack={goBack}
          onUpload={() => setShowUpload(true)}
          onSelectSub={selectProject}
          coverUrls={coverUrls}
        />
      )}

      {/* Modal de subida */}
      {showUpload && (
        <UploadModal
          projects={projects}
          workspaceId={workspaceId}
          defaultProjectId={selectedProjectId ?? undefined}
          existingDocs={documents}
          companies={companies}
          members={members}
          micNomenclatures={micNomenclatures}
          userRole={userRole}
          workspaceOficios={workspaceOficios}
          mesasTecnicas={mesasTecnicas}
          lastConfig={lastUploadConfig}
          onClose={() => setShowUpload(false)}
          onSaved={(config) => setLastUploadConfig(config)}
        />
      )}
    </div>
  )
}
