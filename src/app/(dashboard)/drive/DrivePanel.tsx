'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createFolder, saveDriveFile, replaceFile, deleteFolder, deleteDriveFile, renameFolder, createShare, revokeShare, revokeShares, getWorkspaceShares, getWorkspaceProjectShares, getWorkspaceOficiosSalida, updateShare, moveFileToFolder } from './actions'
import { FileTypeIcon } from '@/components/ui/FileTypeIcon'
import QRCode from 'react-qr-code'
import {
  FolderOpen, Upload, LayoutGrid, List,
  ChevronRight, Home, Trash2, Download, Eye,
  FolderPlus, Loader2, X, Pencil, Check, HardDrive, Link2,
  Share2, Copy, CheckCheck, ExternalLink, ShieldOff,
  RefreshCw, Filter, UserRound, FileText
} from 'lucide-react'

// ── Tipos ────────────────────────────────────────────────────────────────────

type DriveFolder = {
  id: string
  name: string
  parent_folder_id: string | null
  created_by: string
  created_at: string
  is_system: boolean
}

type DriveFile = {
  id: string
  name: string
  file_name: string
  file_type: string
  file_size: number
  folder_id: string | null
  uploaded_by: string
  created_at: string
}

type BreadcrumbEntry = { id: string | null; name: string }

// ── Helpers ──────────────────────────────────────────────────────────────────

const FILE_COLORS: Record<string, string> = {
  pdf:   'bg-red-50 text-red-500 border-red-100',
  dwg:   'bg-blue-50 text-blue-500 border-blue-100',
  dxf:   'bg-blue-50 text-blue-500 border-blue-100',
  xlsx:  'bg-green-50 text-green-600 border-green-100',
  xls:   'bg-green-50 text-green-600 border-green-100',
  docx:  'bg-indigo-50 text-indigo-500 border-indigo-100',
  doc:   'bg-indigo-50 text-indigo-500 border-indigo-100',
  pptx:  'bg-orange-50 text-orange-600 border-orange-100',
  ppt:   'bg-orange-50 text-orange-600 border-orange-100',
  img:   'bg-purple-50 text-purple-500 border-purple-100',
  zip:   'bg-yellow-50 text-yellow-600 border-yellow-100',
  rar:   'bg-yellow-50 text-yellow-600 border-yellow-100',
  other: 'bg-slate-50 text-slate-400 border-slate-100',
}

function formatSize(bytes: number) {
  if (!bytes) return '—'
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Share Modal ───────────────────────────────────────────────────────────────

type OficioOption = { id: string; no_oficio: string | null; asunto: string }

function ShareModal({ fileId, fileName, workspaceId, onClose }: {
  fileId:      string
  fileName:    string
  workspaceId: string
  onClose:     () => void
}) {
  const [label,          setLabel]          = useState('')
  const [expiresAt,      setExpiresAt]      = useState('')
  const [oficioId,       setOficioId]       = useState('')
  const [oficiosSalida,  setOficiosSalida]  = useState<OficioOption[]>([])
  const [loading,        setLoading]        = useState(false)
  const [token,          setToken]          = useState<string | null>(null)
  const [copied,         setCopied]         = useState(false)
  const qrRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getWorkspaceOficiosSalida(workspaceId).then(res => {
      if ('oficios' in res) setOficiosSalida(res.oficios ?? [])
    })
  }, [workspaceId])

  const appUrl  = process.env.NEXT_PUBLIC_APP_URL || 'https://builtek.app'
  const shareUrl = token ? `${appUrl}/share/drive/${token}` : ''

  function downloadQR() {
    const svg = qrRef.current?.querySelector('svg')
    if (!svg) return
    const svgData  = new XMLSerializer().serializeToString(svg)
    const canvas   = document.createElement('canvas')
    const size     = 400
    canvas.width   = size
    canvas.height  = size
    const ctx      = canvas.getContext('2d')!
    const img      = new Image()
    img.onload = () => {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, size, size)
      ctx.drawImage(img, 0, 0, size, size)
      const a   = document.createElement('a')
      a.href     = canvas.toDataURL('image/png')
      a.download = `qr-${fileName.replace(/\s+/g, '-')}.png`
      a.click()
    }
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`
  }

  async function handleCreate() {
    setLoading(true)
    const result = await createShare({
      workspace_id: workspaceId,
      file_id:      fileId,
      label:        label || fileName,
      expires_at:   expiresAt || null,
      oficio_id:    oficioId || null,
    })
    setLoading(false)
    if (result.token) setToken(result.token)
  }

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-[#1A2744]">Compartir archivo</h2>
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[280px]">{fileName}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {!token ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Etiqueta del link <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <input value={label} onChange={e => setLabel(e.target.value)}
                  placeholder={fileName}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Expira el <span className="text-slate-400 font-normal">(opcional — sin fecha = nunca expira)</span>
                </label>
                <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50" />
              </div>
              {oficiosSalida.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                    Oficio de salida <span className="text-slate-400 font-normal">(opcional)</span>
                  </label>
                  <select value={oficioId} onChange={e => setOficioId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50 bg-white">
                    <option value="">Sin oficio</option>
                    {oficiosSalida.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.no_oficio ? `${o.no_oficio} — ` : ''}{o.asunto}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex gap-3 pt-1">
                <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                  Cancelar
                </button>
                <button onClick={handleCreate} disabled={loading}
                  className="flex-1 py-2.5 rounded-lg bg-[#1A2744] text-white text-sm font-bold hover:bg-[#243660] disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                  {loading ? 'Generando...' : 'Generar link'}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* QR */}
              <div className="flex flex-col items-center gap-2 p-4 bg-white border border-slate-100 rounded-xl">
                <div ref={qrRef}>
                  <QRCode value={shareUrl} size={160} />
                </div>
                <button onClick={downloadQR}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                  <Download className="w-3.5 h-3.5" />
                  Descargar QR
                </button>
              </div>

              {/* Link */}
              <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2.5">
                <span className="flex-1 text-xs text-slate-600 truncate font-mono">{shareUrl}</span>
                <button onClick={handleCopy}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1A2744] text-white text-xs font-semibold hover:bg-[#243660] flex-shrink-0">
                  {copied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? '¡Copiado!' : 'Copiar'}
                </button>
              </div>

              <div className="flex gap-3">
                <a href={shareUrl} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                  <ExternalLink className="w-4 h-4" /> Abrir link
                </a>
                <button onClick={onClose}
                  className="flex-1 py-2.5 rounded-lg bg-[#1A2744] text-white text-sm font-bold hover:bg-[#243660]">
                  Listo
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Folder Share Modal ────────────────────────────────────────────────────────

function FolderShareModal({ folderId, folderName, workspaceId, onClose }: {
  folderId:    string
  folderName:  string
  workspaceId: string
  onClose:     () => void
}) {
  const [label,         setLabel]         = useState('')
  const [expiresAt,     setExpiresAt]     = useState('')
  const [oficioId,      setOficioId]      = useState('')
  const [oficiosSalida, setOficiosSalida] = useState<OficioOption[]>([])
  const [loading,       setLoading]       = useState(false)
  const [token,         setToken]         = useState<string | null>(null)
  const [copied,        setCopied]        = useState(false)
  const [error,         setError]         = useState<string | null>(null)
  const qrRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getWorkspaceOficiosSalida(workspaceId).then(res => {
      if ('oficios' in res) setOficiosSalida(res.oficios ?? [])
    })
  }, [workspaceId])

  const appUrl   = process.env.NEXT_PUBLIC_APP_URL || 'https://builtek.app'
  const shareUrl = token ? `${appUrl}/share/drive/folder/${token}` : ''

  function downloadQR() {
    const svg = qrRef.current?.querySelector('svg')
    if (!svg) return
    const svgData  = new XMLSerializer().serializeToString(svg)
    const canvas   = document.createElement('canvas')
    const size     = 400
    canvas.width   = size
    canvas.height  = size
    const ctx      = canvas.getContext('2d')!
    const img      = new Image()
    img.onload = () => {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, size, size)
      ctx.drawImage(img, 0, 0, size, size)
      const a   = document.createElement('a')
      a.href     = canvas.toDataURL('image/png')
      a.download = `qr-carpeta-${folderName.replace(/\s+/g, '-')}.png`
      a.click()
    }
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`
  }

  async function handleCreate() {
    setLoading(true)
    setError(null)
    try {
      const result = await createShare({
        workspace_id: workspaceId,
        folder_id:    folderId,
        label:        label || folderName,
        expires_at:   expiresAt || null,
        oficio_id:    oficioId || null,
      })
      if ('error' in result && result.error) {
        setError(result.error)
      } else if ('token' in result && result.token) {
        setToken(result.token)
      }
    } catch (e: any) {
      setError(e?.message ?? 'Error al generar el link. Verifica que la migración SQL esté aplicada en Supabase.')
    } finally {
      setLoading(false)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#1A2744]">Compartir carpeta</h2>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#00C2FF]/10 text-[#00C2FF]">Carpeta</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[280px]">{folderName}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {!token ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Etiqueta del link <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <input value={label} onChange={e => setLabel(e.target.value)}
                  placeholder={folderName}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Expira el <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50" />
              </div>
              {oficiosSalida.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                    Oficio de salida <span className="text-slate-400 font-normal">(opcional)</span>
                  </label>
                  <select value={oficioId} onChange={e => setOficioId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50 bg-white">
                    <option value="">Sin oficio</option>
                    {oficiosSalida.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.no_oficio ? `${o.no_oficio} — ` : ''}{o.asunto}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <p className="text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-2.5">
                El link permitirá ver y descargar todos los archivos dentro de <strong className="text-slate-600">{folderName}</strong>.
              </p>
              {error && (
                <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2.5">{error}</p>
              )}
              <div className="flex gap-3 pt-1">
                <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                  Cancelar
                </button>
                <button onClick={handleCreate} disabled={loading}
                  className="flex-1 py-2.5 rounded-lg bg-[#1A2744] text-white text-sm font-bold hover:bg-[#243660] disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                  {loading ? 'Generando...' : 'Generar link'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center gap-2 p-4 bg-white border border-slate-100 rounded-xl">
                <div ref={qrRef}>
                  <QRCode value={shareUrl} size={160} />
                </div>
                <button onClick={downloadQR}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                  <Download className="w-3.5 h-3.5" />
                  Descargar QR
                </button>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2.5">
                <span className="flex-1 text-xs text-slate-600 truncate font-mono">{shareUrl}</span>
                <button onClick={handleCopy}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1A2744] text-white text-xs font-semibold hover:bg-[#243660] flex-shrink-0">
                  {copied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? '¡Copiado!' : 'Copiar'}
                </button>
              </div>
              <div className="flex gap-3">
                <a href={shareUrl} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                  <ExternalLink className="w-4 h-4" /> Abrir link
                </a>
                <button onClick={onClose}
                  className="flex-1 py-2.5 rounded-lg bg-[#1A2744] text-white text-sm font-bold hover:bg-[#243660]">
                  Listo
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Upload Modal ─────────────────────────────────────────────────────────────

function UploadModal({
  workspaceId, folderId, folderName, onClose, initialFiles
}: {
  workspaceId:   string
  folderId:      string | null
  folderName:    string
  onClose:       () => void
  initialFiles?: File[]
}) {
  const [files,     setFiles]     = useState<File[]>(initialFiles ?? [])
  const [uploading, setUploading] = useState(false)
  const [progress,  setProgress]  = useState<Record<string, number>>({})
  const [errors,    setErrors]    = useState<Record<string, string>>({})
  const [done,      setDone]      = useState<Set<string>>(new Set())
  const [dragOver,  setDragOver]  = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function addFiles(incoming: FileList | File[]) {
    const arr = Array.from(incoming)
    setFiles(prev => {
      const names = new Set(prev.map(f => f.name))
      return [...prev, ...arr.filter(f => !names.has(f.name))]
    })
  }

  async function uploadOne(file: File): Promise<boolean> {
    const key = file.name
    setProgress(p => ({ ...p, [key]: 0 }))

    const presignRes = await fetch('/api/drive/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceId, folderId,
        fileName: file.name, contentType: file.type || 'application/octet-stream', fileSize: file.size,
      }),
    })
    const presignData = await presignRes.json()
    if (!presignRes.ok) {
      setErrors(e => ({ ...e, [key]: presignData.error || 'Error al preparar' }))
      return false
    }

    const ok = await new Promise<boolean>((resolve) => {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', presignData.uploadUrl)
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress(p => ({ ...p, [key]: Math.round((e.loaded / e.total) * 90) }))
      }
      xhr.onload  = () => resolve(xhr.status >= 200 && xhr.status < 300)
      xhr.onerror = () => resolve(false)
      xhr.send(file)
    })

    if (!ok) { setErrors(e => ({ ...e, [key]: 'Error al subir' })); return false }

    const result = await saveDriveFile({
      workspace_id: workspaceId, folder_id: folderId,
      name: file.name, file_name: file.name,
      storage_key: presignData.storageKey, file_type: presignData.fileType, file_size: file.size,
    })
    if (result?.error) { setErrors(e => ({ ...e, [key]: result.error! })); return false }

    setProgress(p => ({ ...p, [key]: 100 }))
    setDone(d => new Set([...d, key]))
    return true
  }

  async function handleUpload() {
    if (!files.length) return
    setUploading(true)
    const results = await Promise.all(files.map(f => uploadOne(f)))
    setUploading(false)
    if (results.every(Boolean)) onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={!uploading ? onClose : undefined} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-[#1A2744]">Subir archivos</h2>
            <p className="text-xs text-slate-400 mt-0.5">en {folderName}</p>
          </div>
          {!uploading && (
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>

        <div className="p-6 space-y-4">
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files) }}
            onClick={() => inputRef.current?.click()}
            className={`w-full border-2 border-dashed rounded-xl py-6 text-center cursor-pointer transition-colors ${
              dragOver ? 'border-[#00C2FF] bg-[#00C2FF]/10' :
              files.length ? 'border-[#00C2FF] bg-[#00C2FF]/5' : 'border-slate-200 hover:border-slate-300'
            }`}>
            <Upload className={`w-6 h-6 mx-auto mb-2 ${files.length || dragOver ? 'text-[#00C2FF]' : 'text-slate-300'}`} />
            <p className="text-sm font-medium text-slate-600">
              {dragOver ? 'Suelta aquí' : 'Arrastra archivos o clic para seleccionar'}
            </p>
            <p className="text-xs text-slate-400 mt-1">Puedes seleccionar varios a la vez</p>
            <input ref={inputRef} type="file" multiple className="hidden"
              onChange={e => e.target.files && addFiles(e.target.files)} />
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-1.5 max-h-52 overflow-y-auto">
              {files.map(file => {
                const pct   = progress[file.name] ?? null
                const err   = errors[file.name]
                const isDone = done.has(file.name)
                return (
                  <div key={file.name} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                    <FileTypeIcon fileType={file.name.split('.').pop()?.toLowerCase() ?? 'other'} size={28} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">{file.name}</p>
                      {pct !== null && !err && (
                        <div className="w-full bg-slate-200 rounded-full h-1 mt-1 overflow-hidden">
                          <div className={`h-1 rounded-full transition-all duration-200 ${isDone ? 'bg-green-400' : 'bg-[#00C2FF]'}`} style={{ width: `${pct}%` }} />
                        </div>
                      )}
                      {err && <p className="text-[10px] text-red-500 mt-0.5">{err}</p>}
                    </div>
                    {pct === null && !uploading && (
                      <button onClick={() => setFiles(prev => prev.filter(f => f.name !== file.name))}
                        className="w-5 h-5 flex items-center justify-center rounded text-slate-300 hover:text-red-400">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    {isDone && <span className="text-[10px] text-green-500 font-bold flex-shrink-0">✓</span>}
                    {pct !== null && !isDone && !err && (
                      <span className="text-[10px] text-[#00C2FF] font-bold tabular-nums flex-shrink-0">{pct}%</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} disabled={uploading}
              className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40">
              Cancelar
            </button>
            <button onClick={handleUpload} disabled={uploading || !files.length}
              className="flex-1 py-2.5 rounded-lg bg-[#1A2744] text-white text-sm font-bold hover:bg-[#243660] disabled:opacity-60 flex items-center justify-center gap-2">
              {uploading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Subiendo...</>
                : <><Upload className="w-4 h-4" /> {files.length > 1 ? `Subir ${files.length} archivos` : 'Subir'}</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Replace Modal ─────────────────────────────────────────────────────────────

function ReplaceModal({ fileId, workspaceId, folderId, currentName, onClose }: {
  fileId:      string
  workspaceId: string
  folderId:    string | null
  currentName: string
  onClose:     () => void
}) {
  const [file,      setFile]      = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress,  setProgress]  = useState(0)
  const [error,     setError]     = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleReplace() {
    if (!file) return
    setUploading(true)
    setError(null)
    setProgress(0)

    const presignRes = await fetch('/api/drive/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceId, folderId,
        fileName: file.name, contentType: file.type || 'application/octet-stream', fileSize: file.size,
      }),
    })
    const presignData = await presignRes.json()
    if (!presignRes.ok) { setError(presignData.error || 'Error al preparar'); setUploading(false); return }

    const ok = await new Promise<boolean>((resolve) => {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', presignData.uploadUrl)
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 90))
      }
      xhr.onload  = () => resolve(xhr.status >= 200 && xhr.status < 300)
      xhr.onerror = () => resolve(false)
      xhr.send(file)
    })

    if (!ok) { setError('Error al subir el archivo'); setUploading(false); return }

    const result = await replaceFile({
      file_id:      fileId,
      workspace_id: workspaceId,
      file_name:    file.name,
      storage_key:  presignData.storageKey,
      file_type:    presignData.fileType,
      file_size:    file.size,
    })

    setUploading(false)
    if (result?.error) { setError(result.error); return }
    setProgress(100)
    setTimeout(() => onClose(), 400)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={!uploading ? onClose : undefined} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-[#1A2744]">Reemplazar archivo</h2>
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[280px]">{currentName}</p>
          </div>
          {!uploading && (
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>
        <div className="p-6 space-y-4">
          <div
            onClick={() => inputRef.current?.click()}
            className={`w-full border-2 border-dashed rounded-xl py-6 text-center cursor-pointer transition-colors ${
              file ? 'border-[#00C2FF] bg-[#00C2FF]/5' : 'border-slate-200 hover:border-slate-300'
            }`}>
            <RefreshCw className={`w-6 h-6 mx-auto mb-2 ${file ? 'text-[#00C2FF]' : 'text-slate-300'}`} />
            <p className="text-sm font-medium text-slate-600">
              {file ? file.name : 'Selecciona el archivo de reemplazo'}
            </p>
            {file && <p className="text-xs text-slate-400 mt-1">{(file.size / 1024 / 1024).toFixed(1)} MB</p>}
            <input ref={inputRef} type="file" className="hidden"
              onChange={e => e.target.files?.[0] && setFile(e.target.files[0])} />
          </div>

          {uploading && (
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className="h-1.5 rounded-full bg-[#00C2FF] transition-all duration-200" style={{ width: `${progress}%` }} />
            </div>
          )}

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2.5 text-xs text-amber-700">
            El archivo anterior dejará de estar disponible. Esta acción queda registrada en el historial de uploads.
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} disabled={uploading}
              className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40">
              Cancelar
            </button>
            <button onClick={handleReplace} disabled={uploading || !file}
              className="flex-1 py-2.5 rounded-lg bg-[#1A2744] text-white text-sm font-bold hover:bg-[#243660] disabled:opacity-60 flex items-center justify-center gap-2">
              {uploading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Reemplazando...</>
                : <><RefreshCw className="w-4 h-4" /> Reemplazar</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── PDF Viewer Modal ──────────────────────────────────────────────────────────

function PdfViewerModal({ fileId, fileName, onClose }: { fileId: string; fileName: string; onClose: () => void }) {
  const [loading, setLoading] = useState(true)
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90">
      <div className="flex items-center justify-between px-4 py-3 bg-[#1A2744] flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-lg">📄</span>
          <span className="text-white text-sm font-semibold truncate">{fileName}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <a href={`/api/drive/download/${fileId}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs font-medium hover:bg-white/20">
            <Download className="w-3.5 h-3.5" /> Descargar
          </a>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <Loader2 className="w-8 h-8 text-[#00C2FF] animate-spin" />
          </div>
        )}
        <iframe src={`/api/drive/view/${fileId}`} className="w-full h-full border-0" onLoad={() => setLoading(false)} title={fileName} />
      </div>
    </div>
  )
}

// ── Folder Card ───────────────────────────────────────────────────────────────

function FolderCard({ folder, onOpen, onDelete, onRename, onShare, onDrop, isAdmin, viewMode }: {
  folder:     DriveFolder
  onOpen:     () => void
  onDelete:   () => void
  onRename:   (name: string) => void
  onShare:    () => void
  onDrop:     () => void
  isAdmin:    boolean
  viewMode:   'grid' | 'list'
}) {
  const [editing,    setEditing]    = useState(false)
  const [editName,   setEditName]   = useState(folder.name)
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  function handleRename() {
    if (editName.trim() && editName.trim() !== folder.name) onRename(editName.trim())
    setEditing(false)
  }

  if (viewMode === 'list') {
    return (
      <div className={`flex items-center gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50 group transition-colors ${isDragOver ? 'bg-[#00C2FF]/8 ring-2 ring-inset ring-[#00C2FF]/40' : ''}`}
        onDragEnter={() => setIsDragOver(true)}
        onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragOver(false) }}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); setIsDragOver(false); onDrop() }}
      >
        <FolderOpen className={`w-5 h-5 flex-shrink-0 ${isDragOver ? 'text-[#00C2FF] scale-110' : 'text-[#00C2FF]'} transition-transform`} />
        <div className="flex-1 min-w-0">
          {editing ? (
            <input ref={inputRef} value={editName}
              onChange={e => setEditName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setEditing(false) }}
              onBlur={handleRename}
              className="text-sm font-medium text-slate-700 border-b border-[#00C2FF] outline-none bg-transparent w-full" />
          ) : (
            <button onClick={onOpen} className="text-sm font-medium text-slate-700 hover:text-[#00C2FF] text-left truncate block w-full">
              {folder.name}
            </button>
          )}
        </div>
        <span className="text-xs text-slate-400 w-28 hidden md:block">{formatDate(folder.created_at)}</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={e => { e.stopPropagation(); onShare() }} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#00C2FF]/10 text-slate-400 hover:text-[#00C2FF]" title="Compartir carpeta">
            <Share2 className="w-3.5 h-3.5" />
          </button>
          {isAdmin && (
            <button onClick={() => setEditing(true)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {isAdmin && (
            <button onClick={onDelete} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={onOpen} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-400">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`group relative bg-white border rounded-xl p-4 hover:shadow-sm transition-all cursor-pointer ${isDragOver ? 'border-[#00C2FF] bg-[#00C2FF]/5 shadow-md' : 'border-slate-100 hover:border-[#00C2FF]/40'}`}
      onClick={onOpen}
      onDragEnter={() => setIsDragOver(true)}
      onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragOver(false) }}
      onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); setIsDragOver(false); onDrop() }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-12 h-12 bg-[#00C2FF]/10 rounded-xl flex items-center justify-center">
          <FolderOpen className="w-6 h-6 text-[#00C2FF]" />
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
          <button onClick={onShare} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#00C2FF]/10 text-slate-400 hover:text-[#00C2FF]" title="Compartir">
            <Share2 className="w-3.5 h-3.5" />
          </button>
          {isAdmin && (
            <button onClick={() => setEditing(true)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {isAdmin && (
            <button onClick={onDelete} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      {editing ? (
        <input ref={inputRef} value={editName}
          onChange={e => setEditName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setEditing(false) }}
          onBlur={handleRename}
          onClick={e => e.stopPropagation()}
          className="text-sm font-semibold text-slate-700 border-b border-[#00C2FF] outline-none bg-transparent w-full" />
      ) : (
        <p className="text-sm font-semibold text-slate-700 truncate">{folder.name}</p>
      )}
      <p className="text-xs text-slate-400 mt-1">{formatDate(folder.created_at)}</p>
    </div>
  )
}

// ── Links activos panel ───────────────────────────────────────────────────────

type DriveShare = {
  id: string
  token: string
  label: string | null
  expires_at: string | null
  access_count: number
  last_accessed: string | null
  created_at: string
  created_by_name: string | null
  folder_id: string | null
  folder_name: string | null
  file_folder_name: string | null
  oficio_id: string | null
  oficio_no: string | null
  oficio_asunto: string | null
  drive_files: { name: string; file_type: string } | null
  drive_folders: { name: string } | null
}

type ProjectShare = {
  id: string
  token: string
  expires_at: string
  created_at: string
  created_by: string | null
  created_by_name: string | null
  project_id: string
  project_name: string
}

function LinksPanel({ workspaceId, isAdmin }: { workspaceId: string; isAdmin: boolean }) {
  const [shares,         setShares]         = useState<DriveShare[]>([])
  const [projectShares,  setProjectShares]  = useState<ProjectShare[]>([])
  const [loading,        setLoading]        = useState(true)
  const [revoking,       setRevoking]       = useState<string | null>(null)
  const [bulkRevoking,   setBulkRevoking]   = useState(false)
  const [selectedIds,    setSelectedIds]    = useState<Set<string>>(new Set())
  const [copied,         setCopied]         = useState<string | null>(null)
  const [editingId,      setEditingId]      = useState<string | null>(null)
  const [editOficioId,   setEditOficioId]   = useState('')
  const [savingOficio,   setSavingOficio]   = useState(false)
  const [oficiosSalida,  setOficiosSalida]  = useState<OficioOption[]>([])

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://builtek.app'

  useEffect(() => {
    Promise.all([
      getWorkspaceShares(workspaceId),
      getWorkspaceProjectShares(workspaceId),
      getWorkspaceOficiosSalida(workspaceId),
    ]).then(([sharesRes, projectSharesRes, oficiosRes]) => {
      setShares((sharesRes.shares as unknown as DriveShare[]) ?? [])
      if ('shares' in projectSharesRes) setProjectShares(projectSharesRes.shares as ProjectShare[])
      if ('oficios' in oficiosRes) setOficiosSalida(oficiosRes.oficios ?? [])
      setLoading(false)
    })
  }, [workspaceId])

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selectedIds.size === shares.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(shares.map(s => s.id)))
    }
  }

  async function handleBulkRevoke() {
    if (!confirm(`¿Revocar ${selectedIds.size} link(s)? Dejarán de funcionar inmediatamente.`)) return
    setBulkRevoking(true)
    await revokeShares([...selectedIds])
    setShares(prev => prev.filter(s => !selectedIds.has(s.id)))
    setSelectedIds(new Set())
    setBulkRevoking(false)
  }

  async function handleRevoke(shareId: string) {
    if (!confirm('¿Revocar este link? Dejará de funcionar inmediatamente.')) return
    setRevoking(shareId)
    await revokeShare(shareId)
    setShares(prev => prev.filter(s => s.id !== shareId))
    setSelectedIds(prev => { const next = new Set(prev); next.delete(shareId); return next })
    setRevoking(null)
  }

  function handleCopy(token: string, isFolder: boolean) {
    const url = isFolder
      ? `${appUrl}/share/drive/folder/${token}`
      : `${appUrl}/share/drive/${token}`
    navigator.clipboard.writeText(url)
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
  }

  function startEditOficio(share: DriveShare) {
    setEditingId(share.id)
    setEditOficioId(share.oficio_id ?? '')
  }

  async function handleSaveOficio(shareId: string) {
    setSavingOficio(true)
    const result = await updateShare(shareId, { oficio_id: editOficioId || null })
    if (!result.error) {
      const chosen = oficiosSalida.find(o => o.id === editOficioId) ?? null
      setShares(prev => prev.map(s => s.id === shareId ? {
        ...s,
        oficio_id:    chosen?.id ?? null,
        oficio_no:    chosen?.no_oficio ?? null,
        oficio_asunto: chosen?.asunto ?? null,
      } : s))
      setEditingId(null)
    }
    setSavingOficio(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <Loader2 className="w-6 h-6 text-[#00C2FF] animate-spin" />
    </div>
  )

  if (shares.length === 0 && projectShares.length === 0) return (
    <div className="bg-white border border-slate-100 rounded-xl p-12 text-center">
      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Link2 className="w-7 h-7 text-slate-300" />
      </div>
      <h2 className="text-base font-bold text-[#1A2744] mb-1">Sin links activos</h2>
      <p className="text-sm text-slate-400">Comparte un archivo desde el Drive para generar un link público.</p>
    </div>
  )

  return (
    <div className="space-y-4">
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wide">
        {isAdmin && (
          <input
            type="checkbox"
            className="w-3.5 h-3.5 rounded accent-[#1A2744] flex-shrink-0 cursor-pointer"
            checked={shares.length > 0 && selectedIds.size === shares.length}
            onChange={toggleSelectAll}
            title="Seleccionar todos"
          />
        )}
        <span className="flex-1">Archivo</span>
        <span className="hidden md:block w-20 text-center">Accesos</span>
        <span className="hidden lg:block w-28">Por</span>
        <span className="hidden lg:block w-32">Creado</span>
        <span className="hidden lg:block w-28">Expira</span>
        <div className="flex items-center gap-2 flex-shrink-0 justify-end w-32">
          {isAdmin && selectedIds.size > 0 && (
            <button
              onClick={handleBulkRevoke}
              disabled={bulkRevoking}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 text-[10px] font-bold transition-colors disabled:opacity-50"
            >
              {bulkRevoking ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldOff className="w-3 h-3" />}
              Revocar ({selectedIds.size})
            </button>
          )}
          {(!isAdmin || selectedIds.size === 0) && <span className="text-right w-full">Acciones</span>}
        </div>
      </div>

      {shares.map(share => {
        const isExpired  = share.expires_at && new Date(share.expires_at) < new Date()
        const isFolder   = !!share.folder_id
        const fileType   = share.drive_files?.file_type || 'other'
        const displayName = share.label || (isFolder ? share.folder_name : share.drive_files?.name) || '—'
        const shareUrl   = isFolder
          ? `${appUrl}/share/drive/folder/${share.token}`
          : `${appUrl}/share/drive/${share.token}`
        const locationLabel = isFolder
          ? null
          : (share.file_folder_name ? `Carpeta: ${share.file_folder_name}` : 'Raíz del Drive')

        return (
          <div key={share.id} className={`border-b border-slate-50 last:border-b-0 ${isExpired ? 'opacity-50' : ''}`}>
            <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
              {isAdmin && (
                <input
                  type="checkbox"
                  className="w-3.5 h-3.5 rounded accent-[#1A2744] flex-shrink-0 cursor-pointer"
                  checked={selectedIds.has(share.id)}
                  onChange={() => toggleSelect(share.id)}
                />
              )}
              {isFolder
                ? <span className="text-lg flex-shrink-0">📁</span>
                : <FileTypeIcon fileType={fileType} size={28} />
              }
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-slate-700 truncate">{displayName}</p>
                  {isFolder && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#00C2FF]/10 text-[#00C2FF] flex-shrink-0">Carpeta</span>
                  )}
                  {share.oficio_no && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 flex-shrink-0">
                      OF: {share.oficio_no}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                  {share.created_by_name && (
                    <span className="text-xs text-slate-400">
                      <span className="text-slate-600 font-medium">{share.created_by_name}</span>
                      <span className="lg:hidden">
                        {' · '}
                        {new Date(share.created_at).toLocaleString('es-MX', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </span>
                  )}
                  {locationLabel && (
                    <span className="text-[11px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{locationLabel}</span>
                  )}
                  {share.oficio_asunto && !share.oficio_no && (
                    <span className="text-[11px] text-indigo-400 bg-indigo-50 px-1.5 py-0.5 rounded truncate max-w-[160px]">
                      {share.oficio_asunto}
                    </span>
                  )}
                </div>
              </div>
              <div className="hidden md:flex flex-col items-center w-16 flex-shrink-0">
                <span className="text-sm text-slate-500">{share.access_count}</span>
                {share.last_accessed && (
                  <span className="text-[10px] text-slate-400 leading-tight text-center">
                    {new Date(share.last_accessed).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
              <span className="hidden lg:block w-28 text-xs text-slate-600 font-medium flex-shrink-0 truncate">
                {share.created_by_name || '—'}
              </span>
              <span className="hidden lg:block w-32 text-xs text-slate-400 flex-shrink-0">
                {new Date(share.created_at).toLocaleString('es-MX', {
                  day: '2-digit', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </span>
              <span className="hidden lg:block w-28 text-xs text-slate-400 flex-shrink-0">
                {share.expires_at
                  ? isExpired
                    ? <span className="text-red-400 font-medium">Expirado</span>
                    : new Date(share.expires_at).toLocaleDateString('es-MX')
                  : 'Nunca'}
              </span>
              <div className="flex items-center gap-1 flex-shrink-0 justify-end">
                <button onClick={() => handleCopy(share.token, isFolder)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600" title="Copiar link">
                  {copied === share.token ? <CheckCheck className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <a href={shareUrl} target="_blank" rel="noopener noreferrer"
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600" title="Abrir link">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => editingId === share.id ? setEditingId(null) : startEditOficio(share)}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-400 hover:text-indigo-500 ${editingId === share.id ? 'bg-indigo-50 text-indigo-500' : ''}`}
                  title="Vincular oficio"
                >
                  <FileText className="w-3.5 h-3.5" />
                </button>
                {isAdmin && (
                  <button onClick={() => handleRevoke(share.id)} disabled={revoking === share.id}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500" title="Revocar">
                    {revoking === share.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldOff className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>

            {/* Inline oficio edit row */}
            {editingId === share.id && (
              <div className="flex items-center gap-2 px-4 pb-3 bg-indigo-50/50">
                <FileText className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                <select
                  value={editOficioId}
                  onChange={e => setEditOficioId(e.target.value)}
                  className="flex-1 text-xs rounded-lg border border-slate-200 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                >
                  <option value="">Sin oficio</option>
                  {oficiosSalida.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.no_oficio ? `${o.no_oficio} — ` : ''}{o.asunto}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleSaveOficio(share.id)}
                  disabled={savingOficio}
                  className="px-3 py-1.5 rounded-lg bg-[#1A2744] text-white text-xs font-bold hover:bg-[#243660] disabled:opacity-60 flex items-center gap-1.5"
                >
                  {savingOficio ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  Guardar
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-white"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>

    {/* Sección de links de proyectos (24h) */}
    {projectShares.length > 0 && (
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wide">
          <span className="flex-1">Proyecto (link 24h)</span>
          <span className="hidden lg:block w-28">Compartido por</span>
          <span className="hidden lg:block w-32">Creado</span>
          <span className="hidden lg:block w-28">Expira</span>
          <span className="w-20 text-right">Copiar</span>
        </div>
        {projectShares.map(share => {
          const projectUrl = `${appUrl}/share/${share.token}`
          return (
            <div key={share.token} className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 last:border-b-0 hover:bg-slate-50">
              <span className="text-lg flex-shrink-0">📂</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{share.project_name}</p>
                {share.created_by_name && (
                  <span className="text-xs text-slate-400 lg:hidden">
                    <span className="text-slate-600 font-medium">{share.created_by_name}</span>
                    {' · '}
                    {new Date(share.created_at).toLocaleString('es-MX', {
                      day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                )}
              </div>
              <span className="hidden lg:block w-28 text-xs text-slate-600 font-medium flex-shrink-0 truncate">
                {share.created_by_name || '—'}
              </span>
              <span className="hidden lg:block w-32 text-xs text-slate-400 flex-shrink-0">
                {new Date(share.created_at).toLocaleString('es-MX', {
                  day: '2-digit', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </span>
              <span className="hidden lg:block w-28 text-xs text-slate-400 flex-shrink-0">
                {new Date(share.expires_at).toLocaleDateString('es-MX')}
              </span>
              <div className="flex items-center gap-1 flex-shrink-0 justify-end w-20">
                <button
                  onClick={() => { navigator.clipboard.writeText(projectUrl); setCopied(share.token) }}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600"
                  title="Copiar link"
                >
                  {copied === share.token ? <CheckCheck className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <a href={projectUrl} target="_blank" rel="noopener noreferrer"
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600"
                  title="Abrir link"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )
        })}
      </div>
    )}
    </div>
  )
}

// ── File Card ─────────────────────────────────────────────────────────────────

function FileCard({ file, onView, onDelete, onShare, onReplace, uploaderName, isAdmin, viewMode }: {
  file:         DriveFile
  onView:       () => void
  onDelete:     () => void
  onShare:      () => void
  onReplace:    () => void
  uploaderName: string
  isAdmin:      boolean
  viewMode:     'grid' | 'list'
}) {
  const colorClass = FILE_COLORS[file.file_type] || FILE_COLORS.other
  const isPdf      = file.file_type === 'pdf'

  if (viewMode === 'list') {
    return (
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50 group">
        <FileTypeIcon fileType={file.file_type} size={28} />
        <div className="flex-1 min-w-0">
          {isPdf ? (
            <button onClick={onView} className="text-sm font-medium text-slate-700 hover:text-[#00C2FF] text-left truncate block w-full">
              {file.name}
            </button>
          ) : (
            <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
          )}
          <p className="text-xs text-slate-400">{file.file_type?.toUpperCase()} · {formatSize(file.file_size)}</p>
        </div>
        <div className="hidden md:flex items-center gap-1 w-32 text-xs text-slate-500 flex-shrink-0">
          <UserRound className="w-3 h-3 text-slate-300 flex-shrink-0" />
          <span className="truncate">{uploaderName}</span>
        </div>
        <span className="text-xs text-slate-400 w-24 hidden lg:block flex-shrink-0">{formatDate(file.created_at)}</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {isPdf && (
            <button onClick={onView} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600" title="Ver">
              <Eye className="w-3.5 h-3.5" />
            </button>
          )}
          <a href={`/api/drive/download/${file.id}`} target="_blank" rel="noopener noreferrer"
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600" title="Descargar">
            <Download className="w-3.5 h-3.5" />
          </a>
          <button onClick={onShare} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#00C2FF]/10 text-slate-400 hover:text-[#00C2FF]" title="Compartir">
            <Share2 className="w-3.5 h-3.5" />
          </button>
          {isAdmin && (
            <button onClick={onReplace} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-500" title="Reemplazar">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
          {isAdmin && (
            <button onClick={onDelete} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500" title="Eliminar">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`group relative bg-white border rounded-xl overflow-hidden hover:shadow-sm transition-all ${colorClass}`}>
      {/* Preview area */}
      <div className={`h-32 flex items-center justify-center border-b ${colorClass}`}
        onClick={isPdf ? onView : undefined}
        style={{ cursor: isPdf ? 'pointer' : 'default' }}>
        <FileTypeIcon fileType={file.file_type} size={52} />
      </div>

      {/* Info */}
      <div className="p-3 bg-white">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {isPdf ? (
              <button onClick={onView} className="text-sm font-semibold text-slate-700 hover:text-[#00C2FF] text-left truncate block w-full">
                {file.name}
              </button>
            ) : (
              <p className="text-sm font-semibold text-slate-700 truncate">{file.name}</p>
            )}
            <p className="text-xs text-slate-400 mt-0.5">{file.file_type?.toUpperCase()} · {formatSize(file.file_size)}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <UserRound className="w-3 h-3 text-slate-300 flex-shrink-0" />
              <span className="text-xs text-slate-400 truncate">{uploaderName}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {isPdf && (
            <button onClick={onView} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200">
              <Eye className="w-3 h-3" /> Ver
            </button>
          )}
          <a href={`/api/drive/download/${file.id}`} target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200">
            <Download className="w-3 h-3" /> Descargar
          </a>
          <button onClick={onShare} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-[#00C2FF]/10 text-[#00C2FF] text-xs font-medium hover:bg-[#00C2FF]/20">
            <Share2 className="w-3 h-3" /> Compartir
          </button>
          {isAdmin && (
            <button onClick={onReplace} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-500" title="Reemplazar">
              <RefreshCw className="w-3 h-3" />
            </button>
          )}
          {isAdmin && (
            <button onClick={onDelete} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500">
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── DrivePanel principal ──────────────────────────────────────────────────────

export default function DrivePanel({ workspaceId, userRole, currentUserId }: {
  workspaceId:   string
  userRole:      string
  currentUserId: string
}) {
  const supabase = createClient()
  const isAdmin  = userRole === 'owner' || userRole === 'admin'

  const [folders,       setFolders]       = useState<DriveFolder[]>([])
  const [files,         setFiles]         = useState<DriveFile[]>([])
  const [loading,       setLoading]       = useState(true)
  const [memberNames,   setMemberNames]   = useState<Record<string, string>>({})
  const [breadcrumb,    setBreadcrumb]    = useState<BreadcrumbEntry[]>([{ id: null, name: 'Drive' }])
  const [viewMode,      setViewMode]      = useState<'grid' | 'list'>('list')
  const [showUpload,    setShowUpload]    = useState(false)
  const [dropFiles,     setDropFiles]     = useState<File[] | undefined>(undefined)
  const [dragOverPanel, setDragOverPanel] = useState(false)
  const [draggingFileId,  setDraggingFileId]  = useState<string | null>(null)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [folderError,    setFolderError]    = useState<string | null>(null)
  const [viewingFile,   setViewingFile]   = useState<{ id: string; name: string } | null>(null)
  const [sharingFile,   setSharingFile]   = useState<{ id: string; name: string } | null>(null)
  const [sharingFolder, setSharingFolder] = useState<{ id: string; name: string } | null>(null)
  const [replacingFile, setReplacingFile] = useState<{ id: string; name: string } | null>(null)
  const [activeTab,     setActiveTab]     = useState<'drive' | 'links'>('drive')

  // Filtros de trazabilidad
  const [filterUploader, setFilterUploader] = useState<string>('')
  const [filterDateFrom, setFilterDateFrom] = useState<string>('')
  const [filterDateTo,   setFilterDateTo]   = useState<string>('')
  const hasActiveFilters = !!(filterUploader || filterDateFrom || filterDateTo)
  const newFolderInputRef = useRef<HTMLInputElement>(null)

  const currentFolder = breadcrumb[breadcrumb.length - 1]
  const isRoot = currentFolder.id === null
  const currentFolderObj = folders.find(f => f.id === currentFolder.id)
  const isSystemFolder = currentFolderObj?.is_system ?? false

  // Load workspace member names for folder grouping
  useEffect(() => {
    async function loadMembers() {
      const { data: members } = await supabase
        .from('workspace_members')
        .select('user_id')
        .eq('workspace_id', workspaceId)
      if (!members?.length) return
      const ids = members.map((m: any) => m.user_id)
      const { data: profiles } = await supabase
        .from('profiles').select('id, full_name').in('id', ids)
      const map: Record<string, string> = {}
      profiles?.forEach((p: any) => { map[p.id] = p.full_name || 'Usuario' })
      setMemberNames(map)
    }
    loadMembers()
  }, [workspaceId, supabase])

  const loadContents = useCallback(async (folderId: string | null) => {
    setLoading(true)

    const foldersQuery = supabase.from('drive_folders').select('*').eq('workspace_id', workspaceId).order('name')
    const filesQuery   = supabase.from('drive_files').select('*').eq('workspace_id', workspaceId).order('name')

    const [foldersRes, filesRes] = await Promise.all([
      folderId ? foldersQuery.eq('parent_folder_id', folderId) : foldersQuery.is('parent_folder_id', null),
      folderId ? filesQuery.eq('folder_id', folderId)          : filesQuery.is('folder_id', null),
    ])

    setFolders(foldersRes.data ?? [])
    setFiles(filesRes.data ?? [])
    setLoading(false)
  }, [workspaceId, supabase])

  useEffect(() => { loadContents(currentFolder.id) }, [currentFolder.id, loadContents])

  function openFolder(folder: DriveFolder) {
    setBreadcrumb(prev => [...prev, { id: folder.id, name: folder.name }])
  }

  function navigateTo(index: number) {
    setBreadcrumb(prev => prev.slice(0, index + 1))
  }

  useEffect(() => {
    if (showNewFolder) setTimeout(() => newFolderInputRef.current?.focus(), 50)
  }, [showNewFolder])

  async function handleCreateFolder() {
    if (!newFolderName.trim()) return
    setCreatingFolder(true)
    setFolderError(null)
    const result = await createFolder({ workspace_id: workspaceId, parent_folder_id: currentFolder.id, name: newFolderName })
    setCreatingFolder(false)
    if (result?.error) {
      setFolderError(result.error)
      return
    }
    setNewFolderName('')
    setShowNewFolder(false)
    loadContents(currentFolder.id)
  }

  async function handleDeleteFolder(folderId: string, name: string) {
    if (!confirm(`¿Eliminar carpeta "${name}" y todo su contenido?`)) return
    await deleteFolder(folderId)
    loadContents(currentFolder.id)
  }

  async function handleRenameFolder(folderId: string, name: string) {
    await renameFolder(folderId, name)
    loadContents(currentFolder.id)
  }

  async function handleDeleteFile(fileId: string, name: string) {
    if (!confirm(`¿Eliminar "${name}"?`)) return
    await deleteDriveFile(fileId)
    loadContents(currentFolder.id)
  }

  const filteredFiles = files.filter(f => {
    if (filterUploader && f.uploaded_by !== filterUploader) return false
    if (filterDateFrom && f.created_at < filterDateFrom) return false
    if (filterDateTo   && f.created_at > filterDateTo + 'T23:59:59Z') return false
    return true
  })

  const isEmpty = !loading && folders.length === 0 && filteredFiles.length === 0

  async function handleMoveFileToFolder(fileId: string, folderId: string) {
    setDraggingFileId(null)
    await moveFileToFolder(fileId, folderId)
    await loadContents(currentFolder.id)
  }

  // Uploaders únicos en el conjunto actual de archivos (para el filtro)
  const uploaderOptions = Array.from(new Set(files.map(f => f.uploaded_by)))
    .map(id => ({ id, name: memberNames[id] || 'Usuario' }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="flex gap-6 h-full">

      {/* Mini sidebar */}
      <div className="w-48 flex-shrink-0">
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <button
            onClick={() => { setBreadcrumb([{ id: null, name: 'Mi Drive' }]); setActiveTab('drive') }}
            className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm font-semibold transition-colors ${
              activeTab === 'drive' ? 'bg-[#00C2FF]/10 text-[#00C2FF]' : 'text-slate-600 hover:bg-slate-50'
            }`}>
            <HardDrive className="w-4 h-4 flex-shrink-0" />
            Mi Drive
          </button>
          <button
            onClick={() => setActiveTab('links')}
            className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm font-semibold transition-colors border-t border-slate-50 ${
              activeTab === 'links' ? 'bg-[#00C2FF]/10 text-[#00C2FF]' : 'text-slate-600 hover:bg-slate-50'
            }`}>
            <Link2 className="w-4 h-4 flex-shrink-0" />
            Links activos
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 min-w-0">

        {/* Breadcrumb + Toolbar */}
        <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-sm">
            {breadcrumb.map((entry, idx) => (
              <span key={idx} className="flex items-center gap-1">
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300" />}
                {idx === breadcrumb.length - 1 ? (
                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                    {idx === 0 && <Home className="w-3.5 h-3.5" />}
                    {entry.name}
                  </span>
                ) : (
                  <button onClick={() => navigateTo(idx)}
                    className="text-slate-400 hover:text-[#00C2FF] transition-colors flex items-center gap-1">
                    {idx === 0 && <Home className="w-3.5 h-3.5" />}
                    {entry.name}
                  </button>
                )}
              </span>
            ))}
          </nav>

          {/* Toolbar */}
          <div className="flex items-center gap-2">
            <button onClick={() => setShowNewFolder(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              <FolderPlus className="w-3.5 h-3.5" />
              Nueva carpeta
            </button>
            <button onClick={() => { setDropFiles(undefined); setShowUpload(true) }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1A2744] text-white text-xs font-bold hover:bg-[#243660] transition-colors">
              <Upload className="w-3.5 h-3.5" />
              Subir archivos
            </button>
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
              <button onClick={() => setViewMode('list')}
                className={`w-8 h-8 flex items-center justify-center transition-colors ${viewMode === 'list' ? 'bg-[#1A2744] text-white' : 'text-slate-400 hover:bg-slate-50'}`}>
                <List className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setViewMode('grid')}
                className={`w-8 h-8 flex items-center justify-center transition-colors ${viewMode === 'grid' ? 'bg-[#1A2744] text-white' : 'text-slate-400 hover:bg-slate-50'}`}>
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Nueva carpeta inline */}
        {showNewFolder && (
          <div className="mb-4 space-y-1">
            <div className="flex items-center gap-2 bg-white border border-[#00C2FF]/40 rounded-xl px-4 py-3">
              <FolderPlus className="w-4 h-4 text-[#00C2FF] flex-shrink-0" />
              <input
                ref={newFolderInputRef}
                value={newFolderName}
                onChange={e => { setNewFolderName(e.target.value); setFolderError(null) }}
                onKeyDown={e => { if (e.key === 'Enter') handleCreateFolder(); if (e.key === 'Escape') { setShowNewFolder(false); setNewFolderName(''); setFolderError(null) } }}
                placeholder="Nombre de la carpeta..."
                className="flex-1 text-sm outline-none text-slate-700 placeholder:text-slate-400"
              />
              <button onClick={handleCreateFolder} disabled={!newFolderName.trim() || creatingFolder}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#00C2FF] text-white disabled:opacity-50">
                {creatingFolder ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => { setShowNewFolder(false); setNewFolderName(''); setFolderError(null) }}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {folderError && (
              <p className="text-xs text-red-600 px-4">{folderError}</p>
            )}
          </div>
        )}

        {/* Barra de filtros de trazabilidad */}
        {activeTab === 'drive' && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
              <Filter className="w-3.5 h-3.5" /> Filtrar:
            </div>
            <select
              value={filterUploader}
              onChange={e => setFilterUploader(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40">
              <option value="">Todos los usuarios</option>
              {uploaderOptions.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            <input
              type="date"
              value={filterDateFrom}
              onChange={e => setFilterDateFrom(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40"
              title="Desde"
            />
            <span className="text-xs text-slate-300">—</span>
            <input
              type="date"
              value={filterDateTo}
              onChange={e => setFilterDateTo(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40"
              title="Hasta"
            />
            {hasActiveFilters && (
              <button
                onClick={() => { setFilterUploader(''); setFilterDateFrom(''); setFilterDateTo('') }}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-500 hover:bg-slate-50 hover:text-red-400 transition-colors">
                Limpiar
              </button>
            )}
            {hasActiveFilters && (
              <span className="text-xs text-[#00C2FF] font-semibold">
                {filteredFiles.length} de {files.length} archivos
              </span>
            )}
          </div>
        )}

        {/* Panel Links activos */}
        {activeTab === 'links' && (
          <LinksPanel workspaceId={workspaceId} isAdmin={isAdmin} />
        )}

        {/* Contenido Drive — con drag & drop */}
        {activeTab === 'drive' && (
          <div
            onDragOver={e => { e.preventDefault(); setDragOverPanel(true) }}
            onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverPanel(false) }}
            onDrop={e => {
              e.preventDefault(); setDragOverPanel(false)
              if (e.dataTransfer.files.length) {
                setDropFiles(Array.from(e.dataTransfer.files))
                setShowUpload(true)
              }
            }}
            className={`relative min-h-[200px] rounded-xl transition-all ${dragOverPanel ? 'ring-2 ring-[#00C2FF] ring-offset-2' : ''}`}
          >
            {dragOverPanel && (
              <div className="absolute inset-0 z-10 bg-[#00C2FF]/10 rounded-xl border-2 border-dashed border-[#00C2FF] flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <Upload className="w-10 h-10 text-[#00C2FF] mx-auto mb-2" />
                  <p className="text-sm font-bold text-[#00C2FF]">Suelta para subir</p>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-6 h-6 text-[#00C2FF] animate-spin" />
              </div>
            ) : isEmpty ? (
              <div className="bg-white border border-slate-100 rounded-xl p-16 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FolderOpen className="w-8 h-8 text-slate-300" />
                </div>
                <h2 className="text-lg font-bold text-[#1A2744] mb-2">Carpeta vacía</h2>
                <p className="text-slate-400 text-sm max-w-xs mx-auto mb-6">Arrastra archivos aquí o usa los botones para subir.</p>
                <div className="flex items-center justify-center gap-3">
                  <button onClick={() => setShowNewFolder(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                    <FolderPlus className="w-4 h-4" /> Nueva carpeta
                  </button>
                  <button onClick={() => { setDropFiles(undefined); setShowUpload(true) }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1A2744] text-white text-sm font-bold hover:bg-[#243660]">
                    <Upload className="w-4 h-4" /> Subir archivos
                  </button>
                </div>
              </div>
            ) : viewMode === 'list' ? (
              (() => {
                const myFolders    = isRoot ? folders.filter(f => f.created_by === currentUserId) : folders
                const otherFolders = isRoot ? folders.filter(f => f.created_by !== currentUserId) : []
                const othersByOwner: Record<string, DriveFolder[]> = {}
                otherFolders.forEach(f => {
                  if (!othersByOwner[f.created_by]) othersByOwner[f.created_by] = []
                  othersByOwner[f.created_by].push(f)
                })
                return (
                  <div className="bg-white rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wide rounded-t-xl">
                      <span className="w-5" />
                      <span className="flex-1">Nombre</span>
                      <span className="hidden md:block w-32">Subido por</span>
                      <span className="hidden lg:block w-24">Fecha</span>
                      <span className="w-28 text-right">Acciones</span>
                    </div>
                    {isRoot && myFolders.length > 0 && (
                      <div className="px-4 py-1.5 bg-slate-50/60 border-b border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mis carpetas</span>
                      </div>
                    )}
                    {myFolders.map(f => (
                      <FolderCard key={f.id} folder={f} viewMode="list"
                        onOpen={() => openFolder(f)}
                        onDelete={() => handleDeleteFolder(f.id, f.name)}
                        onRename={name => handleRenameFolder(f.id, name)}
                        onShare={() => setSharingFolder({ id: f.id, name: f.name })}
                        onDrop={() => { if (draggingFileId) handleMoveFileToFolder(draggingFileId, f.id) }}
                        isAdmin={true} />
                    ))}
                    {Object.entries(othersByOwner).map(([ownerId, ownerFolders]) => (
                      <div key={ownerId}>
                        <div className="px-4 py-1.5 bg-slate-50/60 border-b border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {memberNames[ownerId] || 'Compañero'}
                          </span>
                        </div>
                        {ownerFolders.map(f => (
                          <FolderCard key={f.id} folder={f} viewMode="list"
                            onOpen={() => openFolder(f)}
                            onDelete={() => handleDeleteFolder(f.id, f.name)}
                            onRename={name => handleRenameFolder(f.id, name)}
                            onShare={() => setSharingFolder({ id: f.id, name: f.name })}
                            onDrop={() => { if (draggingFileId) handleMoveFileToFolder(draggingFileId, f.id) }}
                            isAdmin={isAdmin} />
                        ))}
                      </div>
                    ))}
                    {filteredFiles.map(f => (
                      <div key={f.id}
                        draggable
                        onDragStart={() => setDraggingFileId(f.id)}
                        onDragEnd={() => setDraggingFileId(null)}
                        className="cursor-grab active:cursor-grabbing"
                      >
                        <FileCard file={f} viewMode="list"
                          onView={() => setViewingFile({ id: f.id, name: f.name })}
                          onDelete={() => handleDeleteFile(f.id, f.name)}
                          onShare={() => setSharingFile({ id: f.id, name: f.name })}
                          onReplace={() => setReplacingFile({ id: f.id, name: f.name })}
                          uploaderName={memberNames[f.uploaded_by] || 'Usuario'}
                          isAdmin={isSystemFolder ? isAdmin : (f.uploaded_by === currentUserId || isAdmin)} />
                      </div>
                    ))}
                  </div>
                )
              })()
            ) : (
              (() => {
                const myFolders    = isRoot ? folders.filter(f => f.created_by === currentUserId) : folders
                const otherFolders = isRoot ? folders.filter(f => f.created_by !== currentUserId) : []
                const othersByOwner: Record<string, DriveFolder[]> = {}
                otherFolders.forEach(f => {
                  if (!othersByOwner[f.created_by]) othersByOwner[f.created_by] = []
                  othersByOwner[f.created_by].push(f)
                })
                return (
                  <div className="space-y-4">
                    {isRoot && myFolders.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Mis carpetas</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                          {myFolders.map(f => (
                            <FolderCard key={f.id} folder={f} viewMode="grid"
                              onOpen={() => openFolder(f)}
                              onDelete={() => handleDeleteFolder(f.id, f.name)}
                              onRename={name => handleRenameFolder(f.id, name)}
                              onShare={() => setSharingFolder({ id: f.id, name: f.name })}
                              onDrop={() => { if (draggingFileId) handleMoveFileToFolder(draggingFileId, f.id) }}
                              isAdmin={true} />
                          ))}
                        </div>
                      </div>
                    )}
                    {Object.entries(othersByOwner).map(([ownerId, ownerFolders]) => (
                      <div key={ownerId}>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                          {memberNames[ownerId] || 'Compañero'}
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                          {ownerFolders.map(f => (
                            <FolderCard key={f.id} folder={f} viewMode="grid"
                              onOpen={() => openFolder(f)}
                              onDelete={() => handleDeleteFolder(f.id, f.name)}
                              onRename={name => handleRenameFolder(f.id, name)}
                              onShare={() => setSharingFolder({ id: f.id, name: f.name })}
                              onDrop={() => { if (draggingFileId) handleMoveFileToFolder(draggingFileId, f.id) }}
                              isAdmin={isAdmin} />
                          ))}
                        </div>
                      </div>
                    ))}
                    {!isRoot && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {folders.map(f => (
                          <FolderCard key={f.id} folder={f} viewMode="grid"
                            onOpen={() => openFolder(f)}
                            onDelete={() => handleDeleteFolder(f.id, f.name)}
                            onRename={name => handleRenameFolder(f.id, name)}
                            onShare={() => setSharingFolder({ id: f.id, name: f.name })}
                            onDrop={() => { if (draggingFileId) handleMoveFileToFolder(draggingFileId, f.id) }}
                            isAdmin={f.created_by === currentUserId || isAdmin} />
                        ))}
                      </div>
                    )}
                    {filteredFiles.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {filteredFiles.map(f => (
                          <FileCard key={f.id} file={f} viewMode="grid"
                            onView={() => setViewingFile({ id: f.id, name: f.name })}
                            onDelete={() => handleDeleteFile(f.id, f.name)}
                            onShare={() => setSharingFile({ id: f.id, name: f.name })}
                            onReplace={() => setReplacingFile({ id: f.id, name: f.name })}
                            uploaderName={memberNames[f.uploaded_by] || 'Usuario'}
                            isAdmin={f.uploaded_by === currentUserId || isAdmin} />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })()
            )}
          </div>
        )}
      </div>

      {/* Modales */}
      {showUpload && (
        <UploadModal
          workspaceId={workspaceId}
          folderId={currentFolder.id}
          folderName={currentFolder.name}
          initialFiles={dropFiles}
          onClose={() => { setShowUpload(false); setDropFiles(undefined); loadContents(currentFolder.id) }}
        />
      )}

      {viewingFile && (
        <PdfViewerModal
          fileId={viewingFile.id}
          fileName={viewingFile.name}
          onClose={() => setViewingFile(null)}
        />
      )}

      {sharingFile && (
        <ShareModal
          fileId={sharingFile.id}
          fileName={sharingFile.name}
          workspaceId={workspaceId}
          onClose={() => setSharingFile(null)}
        />
      )}

      {sharingFolder && (
        <FolderShareModal
          folderId={sharingFolder.id}
          folderName={sharingFolder.name}
          workspaceId={workspaceId}
          onClose={() => setSharingFolder(null)}
        />
      )}

      {replacingFile && (
        <ReplaceModal
          fileId={replacingFile.id}
          workspaceId={workspaceId}
          folderId={currentFolder.id}
          currentName={replacingFile.name}
          onClose={() => { setReplacingFile(null); loadContents(currentFolder.id) }}
        />
      )}
    </div>
  )
}
