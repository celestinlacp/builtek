'use client'

import { useState, useCallback, useMemo } from 'react'
import { Download, Grid3X3, List, Link2, Check, Eye, FolderOpen, Folder, ChevronRight } from 'lucide-react'
import { FileTypeIcon } from '@/components/ui/FileTypeIcon'

export type SubFolder = {
  id: string
  name: string
  parent_folder_id: string | null
}

export type SharedFile = {
  id: string
  name: string
  file_name: string
  file_type: string
  file_size: number
  created_at: string
  folder_id: string
}

type Props = {
  allFolders: SubFolder[]
  rootFolderId: string
  files: SharedFile[]
  token: string
  folderName: string
  wsName?: string
  expiresFormatted?: string | null
}

const TYPE_BG: Record<string, string> = {
  pdf:  'bg-red-50',
  pptx: 'bg-orange-50', ppt: 'bg-orange-50',
  xlsx: 'bg-emerald-50', xls: 'bg-emerald-50',
  docx: 'bg-blue-50',   doc: 'bg-blue-50',
  dwg:  'bg-sky-50',    dxf: 'bg-sky-50',
  img:  'bg-purple-50',
  zip:  'bg-yellow-50', rar: 'bg-amber-50',
}

function formatSize(bytes: number): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

function relativeDate(d: string): string {
  const diff   = Date.now() - new Date(d).getTime()
  const mins   = Math.floor(diff / 60000)
  const hours  = Math.floor(diff / 3600000)
  const days   = Math.floor(diff / 86400000)
  const months = Math.floor(days / 30)
  const years  = Math.floor(days / 365)
  if (mins  < 1)  return 'ahora'
  if (mins  < 60) return `${mins}min`
  if (hours < 24) return `${hours}h`
  if (days  < 30) return `${days}d`
  if (months < 12) return `${months}m`
  return `${years}a`
}

export function FolderShareContent({ allFolders, rootFolderId, files, token, folderName, wsName, expiresFormatted }: Props) {
  const [view, setView]               = useState<'list' | 'grid'>('list')
  const [copied, setCopied]           = useState(false)
  const [currentFolderId, setCurrentFolderId] = useState(rootFolderId)

  const zipUrl   = `/api/drive/share/folder/${token}/zip`
  const shareUrl = `https://builtek.app/share/drive/folder/${token}`
  const totalSize = files.reduce((s, f) => s + (f.file_size ?? 0), 0)

  const copyLink = useCallback(async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [shareUrl])

  // Quick lookup: folder id → folder
  const folderById = useMemo(() => {
    const map: Record<string, SubFolder> = {}
    for (const f of allFolders) map[f.id] = f
    return map
  }, [allFolders])

  // Direct subfolders of current folder
  const currentSubfolders = useMemo(
    () => allFolders.filter(f => f.parent_folder_id === currentFolderId).sort((a, b) => a.name.localeCompare(b.name)),
    [allFolders, currentFolderId]
  )

  // Direct files of current folder
  const currentFiles = useMemo(
    () => files.filter(f => f.folder_id === currentFolderId).sort((a, b) => a.name.localeCompare(b.name)),
    [files, currentFolderId]
  )

  // Total files recursively under a folder
  const getFileCount = useCallback((folderId: string): number => {
    const ids: string[] = []
    const q = [folderId]
    while (q.length > 0) {
      const id = q.shift()!
      ids.push(id)
      allFolders.filter(f => f.parent_folder_id === id).forEach(f => q.push(f.id))
    }
    return files.filter(f => ids.includes(f.folder_id)).length
  }, [allFolders, files])

  // Breadcrumb from root to current folder
  const breadcrumb = useMemo(() => {
    const path: Array<{ id: string; name: string }> = []
    let current: string | null = currentFolderId
    while (current && current !== rootFolderId) {
      const f: SubFolder | undefined = folderById[current]
      if (!f) break
      path.unshift({ id: f.id, name: f.name })
      current = f.parent_folder_id
    }
    path.unshift({ id: rootFolderId, name: folderName })
    return path
  }, [currentFolderId, rootFolderId, folderName, folderById])

  const isRoot = currentFolderId === rootFolderId

  return (
    <>
      {/* ── Folder title + view toggle ─────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight break-words leading-tight">
            {folderName.toUpperCase()}
          </h1>
          {wsName && (
            <p className="text-sm text-slate-400 mt-0.5">
              de <span className="text-slate-600 font-medium">{wsName}</span>
            </p>
          )}
        </div>

        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden shrink-0 mt-0.5">
          <button
            onClick={() => setView('list')}
            className={`flex items-center justify-center w-8 h-8 transition-colors ${
              view === 'list' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
            }`}
            title="Lista"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setView('grid')}
            className={`flex items-center justify-center w-8 h-8 transition-colors ${
              view === 'grid' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
            }`}
            title="Cuadrícula"
          >
            <Grid3X3 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Action buttons ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 mb-6">
        <a
          href={zipUrl}
          download
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          Descargar todo
          {totalSize > 0 && (
            <span className="text-slate-400 text-xs">({formatSize(totalSize)})</span>
          )}
        </a>
        <button
          onClick={copyLink}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Link2 className="w-4 h-4" />}
          {copied ? 'Copiado' : 'Copiar link'}
        </button>
      </div>

      {/* ── Summary ────────────────────────────────────────────────────────── */}
      <p className="text-xs text-slate-400 mb-4">
        {files.length} archivo{files.length !== 1 ? 's' : ''} · {formatSize(totalSize)} en total
      </p>

      {/* ── Breadcrumb ─────────────────────────────────────────────────────── */}
      {!isRoot && (
        <div className="flex items-center gap-1 mb-4 flex-wrap">
          {breadcrumb.map((crumb, i) => (
            <span key={crumb.id} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="w-3 h-3 text-slate-300" />}
              {i < breadcrumb.length - 1 ? (
                <button
                  onClick={() => setCurrentFolderId(crumb.id)}
                  className="text-xs text-blue-500 hover:underline"
                >
                  {crumb.name}
                </button>
              ) : (
                <span className="text-xs font-semibold text-slate-700">{crumb.name}</span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* ── Empty state ────────────────────────────────────────────────────── */}
      {currentSubfolders.length === 0 && currentFiles.length === 0 ? (
        <div className="border border-slate-200 rounded-xl p-12 text-center">
          <FolderOpen className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Esta carpeta no tiene archivos aún.</p>
        </div>

      ) : view === 'list' ? (
        /* ── LIST VIEW ──────────────────────────────────────────────────── */
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="grid grid-cols-[1fr_72px_88px] px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <div>Nombre</div>
            <div>Fecha</div>
            <div className="text-right">Tamaño</div>
          </div>

          {/* Subfolder rows */}
          {currentSubfolders.map(folder => (
            <button
              key={folder.id}
              onClick={() => setCurrentFolderId(folder.id)}
              className="w-full grid grid-cols-[1fr_72px_88px] items-center px-4 py-2.5 border-b border-slate-50 hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3 min-w-0 pr-4">
                <Folder className="w-5 h-5 text-blue-400 shrink-0" />
                <span className="text-sm font-medium text-slate-800 truncate">{folder.name}</span>
              </div>
              <div className="text-xs text-slate-400">—</div>
              <div className="text-xs text-slate-500 text-right">
                {getFileCount(folder.id)} arch.
              </div>
            </button>
          ))}

          {/* File rows */}
          {currentFiles.map(file => {
            const isPdf   = file.file_type?.toLowerCase() === 'pdf'
            const fileUrl = `/api/drive/share/folder/${token}/file/${file.id}`
            return (
              <div
                key={file.id}
                className="grid grid-cols-[1fr_72px_88px] items-center px-4 py-2.5 border-b border-slate-50 last:border-b-0 hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0 pr-4">
                  <FileTypeIcon fileType={file.file_type ?? 'other'} size={26} />
                  <div className="min-w-0">
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-slate-800 hover:text-blue-600 hover:underline truncate block"
                      title={file.name}
                    >
                      {file.name}
                    </a>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wide">
                      {file.file_type}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-500">
                  {file.created_at ? relativeDate(file.created_at) : '—'}
                </div>

                <div className="flex items-center justify-end gap-1">
                  <span className="text-xs text-slate-500">{formatSize(file.file_size ?? 0)}</span>
                  {isPdf && (
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-0.5 w-6 h-6 flex items-center justify-center rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Ver"
                    >
                      <Eye className="w-3 h-3" />
                    </a>
                  )}
                  <a
                    href={fileUrl}
                    download
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Descargar"
                  >
                    <Download className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )
          })}

          {/* Footer */}
          <div className="grid grid-cols-[1fr_72px_88px] px-4 py-2 bg-slate-50 border-t border-slate-200">
            <span className="text-xs text-slate-500 font-medium">
              {currentSubfolders.length > 0 && `${currentSubfolders.length} carpeta${currentSubfolders.length !== 1 ? 's' : ''}`}
              {currentSubfolders.length > 0 && currentFiles.length > 0 && ' · '}
              {currentFiles.length > 0 && `${currentFiles.length} archivo${currentFiles.length !== 1 ? 's' : ''}`}
            </span>
            <span />
            <span className="text-xs text-slate-500 font-medium text-right">
              {formatSize(currentFiles.reduce((s, f) => s + (f.file_size ?? 0), 0))}
            </span>
          </div>
        </div>

      ) : (
        /* ── GRID VIEW ──────────────────────────────────────────────────── */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {/* Folder cards */}
          {currentSubfolders.map(folder => {
            const count = getFileCount(folder.id)
            return (
              <button
                key={folder.id}
                onClick={() => setCurrentFolderId(folder.id)}
                className="group text-left border border-slate-200 rounded-xl overflow-hidden hover:border-blue-200 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-center h-28 bg-slate-50 group-hover:bg-blue-50 transition-colors">
                  <Folder className="w-16 h-16 text-blue-300 group-hover:text-blue-400 transition-colors" strokeWidth={1} fill="currentColor" />
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-semibold text-slate-800 truncate leading-snug" title={folder.name}>
                    {folder.name}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Carpeta · {count} elemento{count !== 1 ? 's' : ''}
                  </p>
                </div>
              </button>
            )
          })}

          {/* File cards */}
          {currentFiles.map(file => {
            const isPdf   = file.file_type?.toLowerCase() === 'pdf'
            const fileUrl = `/api/drive/share/folder/${token}/file/${file.id}`
            const bgClass = TYPE_BG[file.file_type?.toLowerCase() ?? ''] ?? 'bg-slate-50'
            return (
              <div
                key={file.id}
                className="group border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 hover:shadow-md transition-all"
              >
                <div className={`relative flex items-center justify-center h-28 ${bgClass}`}>
                  <FileTypeIcon fileType={file.file_type ?? 'other'} size={52} />
                  <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/5">
                    {isPdf && (
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white shadow text-slate-600 hover:text-slate-900 hover:shadow-md transition-all"
                        title="Ver"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <a
                      href={fileUrl}
                      download
                      onClick={e => e.stopPropagation()}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-white shadow text-slate-600 hover:text-slate-900 hover:shadow-md transition-all"
                      title="Descargar"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-2.5 hover:bg-slate-50 transition-colors"
                >
                  <p className="text-xs font-semibold text-slate-800 truncate leading-snug" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {file.file_type?.toUpperCase()} · {formatSize(file.file_size ?? 0)}
                  </p>
                </a>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Expiry notice ──────────────────────────────────────────────────── */}
      {expiresFormatted && (
        <p className="text-xs text-slate-400 mt-6">
          Link válido hasta el {expiresFormatted}
        </p>
      )}
    </>
  )
}
