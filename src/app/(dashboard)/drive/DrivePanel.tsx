'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createFolder, saveDriveFile, deleteFolder, deleteDriveFile, renameFolder, createShare, revokeShare, getWorkspaceShares } from './actions'
import QRCode from 'react-qr-code'
import {
  FolderOpen, Upload, LayoutGrid, List,
  ChevronRight, Home, Trash2, Download, Eye,
  FolderPlus, Loader2, X, Pencil, Check, HardDrive, Link2,
  Share2, Copy, CheckCheck, ExternalLink, ShieldOff
} from 'lucide-react'

// ── Tipos ────────────────────────────────────────────────────────────────────

type DriveFolder = {
  id: string
  name: string
  parent_folder_id: string | null
  created_at: string
}

type DriveFile = {
  id: string
  name: string
  file_name: string
  file_type: string
  file_size: number
  folder_id: string | null
  created_at: string
}

type BreadcrumbEntry = { id: string | null; name: string }

// ── Helpers ──────────────────────────────────────────────────────────────────

const FILE_COLORS: Record<string, string> = {
  pdf:   'bg-red-50 text-red-500 border-red-100',
  dwg:   'bg-blue-50 text-blue-500 border-blue-100',
  dxf:   'bg-blue-50 text-blue-500 border-blue-100',
  xlsx:  'bg-green-50 text-green-600 border-green-100',
  docx:  'bg-indigo-50 text-indigo-500 border-indigo-100',
  img:   'bg-purple-50 text-purple-500 border-purple-100',
  other: 'bg-slate-50 text-slate-400 border-slate-100',
}

const FILE_ICONS: Record<string, string> = {
  pdf: '📄', dwg: '📐', dxf: '📐', xlsx: '📊', docx: '📝', img: '🖼️', other: '📁'
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

function ShareModal({ fileId, fileName, workspaceId, onClose }: {
  fileId:      string
  fileName:    string
  workspaceId: string
  onClose:     () => void
}) {
  const [label,     setLabel]     = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [loading,   setLoading]   = useState(false)
  const [token,     setToken]     = useState<string | null>(null)
  const [copied,    setCopied]    = useState(false)
  const qrRef = useRef<HTMLDivElement>(null)

  const appUrl  = process.env.NEXT_PUBLIC_APP_URL || 'https://builtek.app'
  const shareUrl = token ? `${appUrl}/share/${token}` : ''

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

// ── Upload Modal ─────────────────────────────────────────────────────────────

function UploadModal({
  workspaceId, folderId, folderName, onClose
}: {
  workspaceId: string
  folderId:    string | null
  folderName:  string
  onClose:     () => void
}) {
  const [file,       setFile]       = useState<File | null>(null)
  const [uploading,  setUploading]  = useState(false)
  const [step,       setStep]       = useState('')
  const [uploadPct,  setUploadPct]  = useState(0)
  const [error,      setError]      = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleUpload() {
    if (!file) return
    setUploading(true); setError(null); setUploadPct(0)

    setStep('Preparando subida...')
    const presignRes = await fetch('/api/drive/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceId,
        folderId,
        fileName:    file.name,
        contentType: file.type || 'application/octet-stream',
        fileSize:    file.size,
      }),
    })
    const presignData = await presignRes.json()
    if (!presignRes.ok) { setError(presignData.error || 'Error al preparar subida'); setUploading(false); return }

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

    if (!uploadOk) { setError('Error al subir el archivo'); setUploading(false); return }

    setStep('Guardando...')
    setUploadPct(100)
    const result = await saveDriveFile({
      workspace_id: workspaceId,
      folder_id:    folderId,
      name:         file.name,
      file_name:    file.name,
      storage_key:  presignData.storageKey,
      file_type:    presignData.fileType,
      file_size:    file.size,
    })

    if (result?.error) { setError(result.error); setUploading(false); return }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-[#1A2744]">Subir archivo</h2>
            <p className="text-xs text-slate-400 mt-0.5">en {folderName}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <input ref={inputRef} type="file" className="hidden"
            onChange={e => setFile(e.target.files?.[0] || null)} />
          <button onClick={() => inputRef.current?.click()}
            className={`w-full border-2 border-dashed rounded-xl py-8 text-center transition-colors ${
              file ? 'border-[#00C2FF] bg-[#00C2FF]/5' : 'border-slate-200 hover:border-slate-300'
            }`}>
            <Upload className={`w-7 h-7 mx-auto mb-2 ${file ? 'text-[#00C2FF]' : 'text-slate-300'}`} />
            <p className="text-sm font-medium text-slate-600">{file ? file.name : 'Clic para seleccionar'}</p>
            <p className="text-xs text-slate-400 mt-1">{file ? formatSize(file.size) : 'Cualquier tipo de archivo'}</p>
          </button>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>}

          {uploading && (
            <div className="bg-blue-50 rounded-xl px-4 py-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-700 font-medium">{step}</span>
                <span className="text-blue-500 font-bold tabular-nums">{uploadPct}%</span>
              </div>
              <div className="w-full bg-blue-100 rounded-full h-1.5 overflow-hidden">
                <div className="bg-[#00C2FF] h-1.5 rounded-full transition-all duration-200" style={{ width: `${uploadPct}%` }} />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Cancelar
            </button>
            <button onClick={handleUpload} disabled={uploading || !file}
              className="flex-1 py-2.5 rounded-lg bg-[#1A2744] text-white text-sm font-bold hover:bg-[#243660] disabled:opacity-60">
              {uploading ? 'Subiendo...' : 'Subir'}
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

function FolderCard({ folder, onOpen, onDelete, onRename, isAdmin, viewMode }: {
  folder:   DriveFolder
  onOpen:   () => void
  onDelete: () => void
  onRename: (name: string) => void
  isAdmin:  boolean
  viewMode: 'grid' | 'list'
}) {
  const [editing,   setEditing]   = useState(false)
  const [editName,  setEditName]  = useState(folder.name)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  function handleRename() {
    if (editName.trim() && editName.trim() !== folder.name) onRename(editName.trim())
    setEditing(false)
  }

  if (viewMode === 'list') {
    return (
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50 group">
        <FolderOpen className="w-5 h-5 text-[#00C2FF] flex-shrink-0" />
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
    <div className="group relative bg-white border border-slate-100 rounded-xl p-4 hover:border-[#00C2FF]/40 hover:shadow-sm transition-all cursor-pointer"
      onClick={onOpen}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-12 h-12 bg-[#00C2FF]/10 rounded-xl flex items-center justify-center">
          <FolderOpen className="w-6 h-6 text-[#00C2FF]" />
        </div>
        {isAdmin && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
            <button onClick={() => setEditing(true)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={onDelete} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
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
  drive_files: { name: string; file_type: string } | null
}

function LinksPanel({ workspaceId }: { workspaceId: string }) {
  const [shares,  setShares]  = useState<DriveShare[]>([])
  const [loading, setLoading] = useState(true)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://builtek.app'

  useEffect(() => {
    getWorkspaceShares(workspaceId).then(res => {
      setShares((res.shares as unknown as DriveShare[]) ?? [])
      setLoading(false)
    })
  }, [workspaceId])

  async function handleRevoke(shareId: string) {
    if (!confirm('¿Revocar este link? Dejará de funcionar inmediatamente.')) return
    setRevoking(shareId)
    await revokeShare(shareId)
    setShares(prev => prev.filter(s => s.id !== shareId))
    setRevoking(null)
  }

  function handleCopy(token: string) {
    navigator.clipboard.writeText(`${appUrl}/share/${token}`)
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
  }

  const FILE_ICONS: Record<string, string> = { pdf: '📄', dwg: '📐', dxf: '📐', xlsx: '📊', docx: '📝', img: '🖼️', other: '📁' }

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <Loader2 className="w-6 h-6 text-[#00C2FF] animate-spin" />
    </div>
  )

  if (shares.length === 0) return (
    <div className="bg-white border border-slate-100 rounded-xl p-12 text-center">
      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Link2 className="w-7 h-7 text-slate-300" />
      </div>
      <h2 className="text-base font-bold text-[#1A2744] mb-1">Sin links activos</h2>
      <p className="text-sm text-slate-400">Comparte un archivo desde el Drive para generar un link público.</p>
    </div>
  )

  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wide">
        <span className="flex-1">Archivo</span>
        <span className="hidden md:block w-20 text-center">Accesos</span>
        <span className="hidden lg:block w-28">Expira</span>
        <span className="w-32 text-right">Acciones</span>
      </div>

      {shares.map(share => {
        const isExpired = share.expires_at && new Date(share.expires_at) < new Date()
        const fileType  = share.drive_files?.file_type || 'other'
        return (
          <div key={share.id} className={`flex items-center gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50 ${isExpired ? 'opacity-50' : ''}`}>
            <span className="text-lg">{FILE_ICONS[fileType]}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">{share.label || share.drive_files?.name}</p>
              <p className="text-xs text-slate-400 font-mono truncate">{appUrl}/share/{share.token.slice(0, 8)}...</p>
            </div>
            <span className="hidden md:block w-20 text-center text-sm text-slate-500">{share.access_count}</span>
            <span className="hidden lg:block w-28 text-xs text-slate-400">
              {share.expires_at
                ? isExpired
                  ? <span className="text-red-400 font-medium">Expirado</span>
                  : new Date(share.expires_at).toLocaleDateString('es-MX')
                : 'Nunca'}
            </span>
            <div className="flex items-center gap-1 w-32 justify-end">
              <button onClick={() => handleCopy(share.token)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600" title="Copiar link">
                {copied === share.token ? <CheckCheck className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <a href={`${appUrl}/share/${share.token}`} target="_blank" rel="noopener noreferrer"
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600" title="Abrir link">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button onClick={() => handleRevoke(share.id)} disabled={revoking === share.id}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500" title="Revocar">
                {revoking === share.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldOff className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── File Card ─────────────────────────────────────────────────────────────────

function FileCard({ file, onView, onDelete, onShare, isAdmin, viewMode }: {
  file:     DriveFile
  onView:   () => void
  onDelete: () => void
  onShare:  () => void
  isAdmin:  boolean
  viewMode: 'grid' | 'list'
}) {
  const colorClass = FILE_COLORS[file.file_type] || FILE_COLORS.other
  const icon       = FILE_ICONS[file.file_type]  || '📁'
  const isPdf      = file.file_type === 'pdf'

  if (viewMode === 'list') {
    return (
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50 group">
        <span className="text-lg w-5 flex-shrink-0 text-center">{icon}</span>
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
        <span className="text-xs text-slate-400 w-28 hidden md:block">{formatDate(file.created_at)}</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
        <span className="text-4xl">{icon}</span>
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

export default function DrivePanel({ workspaceId, userRole }: { workspaceId: string; userRole: string }) {
  const supabase = createClient()
  const isAdmin  = userRole === 'owner' || userRole === 'admin'

  const [folders,       setFolders]       = useState<DriveFolder[]>([])
  const [files,         setFiles]         = useState<DriveFile[]>([])
  const [loading,       setLoading]       = useState(true)
  const [breadcrumb,    setBreadcrumb]    = useState<BreadcrumbEntry[]>([{ id: null, name: 'Mi Drive' }])
  const [viewMode,      setViewMode]      = useState<'grid' | 'list'>('list')
  const [showUpload,    setShowUpload]    = useState(false)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [viewingFile,   setViewingFile]   = useState<{ id: string; name: string } | null>(null)
  const [sharingFile,   setSharingFile]   = useState<{ id: string; name: string } | null>(null)
  const [activeTab,     setActiveTab]     = useState<'drive' | 'links'>('drive')
  const newFolderInputRef = useRef<HTMLInputElement>(null)

  const currentFolder = breadcrumb[breadcrumb.length - 1]

  const loadContents = useCallback(async (folderId: string | null) => {
    setLoading(true)

    const [foldersRes, filesRes] = await Promise.all([
      supabase
        .from('drive_folders')
        .select('*')
        .eq('workspace_id', workspaceId)
        .is(folderId ? 'parent_folder_id' : 'parent_folder_id', folderId)
        .order('name'),
      supabase
        .from('drive_files')
        .select('*')
        .eq('workspace_id', workspaceId)
        .is(folderId ? 'folder_id' : 'folder_id', folderId)
        .order('name'),
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
    await createFolder({ workspace_id: workspaceId, parent_folder_id: currentFolder.id, name: newFolderName })
    setNewFolderName('')
    setShowNewFolder(false)
    setCreatingFolder(false)
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

  const isEmpty = !loading && folders.length === 0 && files.length === 0

  return (
    <div className="flex gap-6 h-full">

      {/* Mini sidebar */}
      <div className="w-48 flex-shrink-0">
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <button
            onClick={() => setBreadcrumb([{ id: null, name: 'Mi Drive' }])}
            className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm font-semibold transition-colors ${
              breadcrumb.length === 1 ? 'bg-[#00C2FF]/10 text-[#00C2FF]' : 'text-slate-600 hover:bg-slate-50'
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
            {isAdmin && (
              <button onClick={() => setShowNewFolder(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                <FolderPlus className="w-3.5 h-3.5" />
                Nueva carpeta
              </button>
            )}
            <button onClick={() => setShowUpload(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1A2744] text-white text-xs font-bold hover:bg-[#243660] transition-colors">
              <Upload className="w-3.5 h-3.5" />
              Subir archivo
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
          <div className="mb-4 flex items-center gap-2 bg-white border border-[#00C2FF]/40 rounded-xl px-4 py-3">
            <FolderPlus className="w-4 h-4 text-[#00C2FF] flex-shrink-0" />
            <input
              ref={newFolderInputRef}
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreateFolder(); if (e.key === 'Escape') { setShowNewFolder(false); setNewFolderName('') } }}
              placeholder="Nombre de la carpeta..."
              className="flex-1 text-sm outline-none text-slate-700 placeholder:text-slate-400"
            />
            <button onClick={handleCreateFolder} disabled={!newFolderName.trim() || creatingFolder}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#00C2FF] text-white disabled:opacity-50">
              {creatingFolder ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            </button>
            <button onClick={() => { setShowNewFolder(false); setNewFolderName('') }}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Panel Links activos */}
        {activeTab === 'links' && (
          <LinksPanel workspaceId={workspaceId} />
        )}

      {/* Contenido Drive */}
        {activeTab === 'drive' && loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 text-[#00C2FF] animate-spin" />
          </div>
        ) : activeTab === 'drive' && isEmpty ? (
          <div className="bg-white border border-slate-100 rounded-xl p-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-8 h-8 text-slate-300" />
            </div>
            <h2 className="text-lg font-bold text-[#1A2744] mb-2">Carpeta vacía</h2>
            <p className="text-slate-400 text-sm max-w-xs mx-auto mb-6">Sube archivos o crea carpetas para organizar tu Drive.</p>
            <div className="flex items-center justify-center gap-3">
              {isAdmin && (
                <button onClick={() => setShowNewFolder(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                  <FolderPlus className="w-4 h-4" /> Nueva carpeta
                </button>
              )}
              <button onClick={() => setShowUpload(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1A2744] text-white text-sm font-bold hover:bg-[#243660]">
                <Upload className="w-4 h-4" /> Subir archivo
              </button>
            </div>
          </div>
        ) : activeTab === 'drive' && viewMode === 'list' ? (
          /* Vista lista */
          <div className="bg-white rounded-xl border border-slate-100">
            <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wide rounded-t-xl">
              <span className="w-5" />
              <span className="flex-1">Nombre</span>
              <span className="hidden md:block w-28">Modificado</span>
              <span className="w-24 text-right">Acciones</span>
            </div>
            {folders.map(f => (
              <FolderCard key={f.id} folder={f} viewMode="list"
                onOpen={() => openFolder(f)}
                onDelete={() => handleDeleteFolder(f.id, f.name)}
                onRename={(name) => handleRenameFolder(f.id, name)}
                isAdmin={isAdmin} />
            ))}
            {files.map(f => (
              <FileCard key={f.id} file={f} viewMode="list"
                onView={() => setViewingFile({ id: f.id, name: f.name })}
                onDelete={() => handleDeleteFile(f.id, f.name)}
                onShare={() => setSharingFile({ id: f.id, name: f.name })}
                isAdmin={isAdmin} />
            ))}
          </div>
        ) : activeTab === 'drive' ? (
          /* Vista grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {folders.map(f => (
              <FolderCard key={f.id} folder={f} viewMode="grid"
                onOpen={() => openFolder(f)}
                onDelete={() => handleDeleteFolder(f.id, f.name)}
                onRename={(name) => handleRenameFolder(f.id, name)}
                isAdmin={isAdmin} />
            ))}
            {files.map(f => (
              <FileCard key={f.id} file={f} viewMode="grid"
                onView={() => setViewingFile({ id: f.id, name: f.name })}
                onDelete={() => handleDeleteFile(f.id, f.name)}
                onShare={() => setSharingFile({ id: f.id, name: f.name })}
                isAdmin={isAdmin} />
            ))}
          </div>
        ) : null}
      </div>

      {/* Modales */}
      {showUpload && (
        <UploadModal
          workspaceId={workspaceId}
          folderId={currentFolder.id}
          folderName={currentFolder.name}
          onClose={() => { setShowUpload(false); loadContents(currentFolder.id) }}
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
    </div>
  )
}
