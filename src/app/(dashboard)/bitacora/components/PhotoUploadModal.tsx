'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

interface Props {
  workspaceId: string
  projectId?: string
  onClose: () => void
}

type FileStatus = 'pending' | 'uploading' | 'done' | 'error'

interface FileEntry {
  file: File
  id: string
  status: FileStatus
  progress: number
  error?: string
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp']
const MAX_FILES = 20

export default function PhotoUploadModal({ workspaceId, projectId, onClose }: Props) {
  const router = useRouter()
  const [entries, setEntries] = useState<FileEntry[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function updateEntry(id: string, patch: Partial<FileEntry>) {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e))
  }

  function addFiles(newFiles: File[]) {
    const valid = newFiles.filter(f => ACCEPTED_TYPES.includes(f.type))
    const invalid = newFiles.filter(f => !ACCEPTED_TYPES.includes(f.type))

    if (invalid.length > 0) {
      alert(`${invalid.length} archivo(s) ignorado(s) por tipo no soportado. Solo se aceptan imágenes JPEG, PNG, HEIC, HEIF o WebP.`)
    }

    setEntries(prev => {
      const remaining = MAX_FILES - prev.length
      return [
        ...prev,
        ...valid.slice(0, remaining).map(file => ({
          file,
          id: crypto.randomUUID(),
          status: 'pending' as FileStatus,
          progress: 0,
        })),
      ]
    })
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    addFiles(Array.from(e.dataTransfer.files))
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => setIsDragging(false), [])

  async function uploadOne(entry: FileEntry) {
    updateEntry(entry.id, { status: 'uploading', progress: 5 })

    try {
      // Extract EXIF
      let capturedAt = new Date().toISOString()
      try {
        const exifr = (await import('exifr')).default
        const exif = await exifr.parse(entry.file, ['DateTimeOriginal', 'GPSLatitude', 'GPSLongitude'])
        if (exif?.DateTimeOriginal) {
          capturedAt = new Date(exif.DateTimeOriginal).toISOString()
        }
      } catch {
        // exifr parse failure is non-fatal, use current date
      }

      updateEntry(entry.id, { progress: 15 })

      // Get presigned URL
      const presignRes = await fetch('/api/photos/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          fileName: entry.file.name,
          contentType: entry.file.type,
          fileSize: entry.file.size,
          photoId: entry.id,
        }),
      })

      if (!presignRes.ok) {
        const err = await presignRes.json()
        throw new Error(err.error ?? 'Error al obtener URL de subida')
      }

      const { uploadUrl, storageKeyCold } = await presignRes.json()
      updateEntry(entry.id, { progress: 30 })

      // PUT directly to R2
      const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': entry.file.type },
        body: entry.file,
      })

      if (!putRes.ok) throw new Error('Error al subir archivo a R2')
      updateEntry(entry.id, { progress: 75 })

      // Trigger background processing
      await fetch('/api/photos/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          projectId: projectId ?? null,
          photoId: entry.id,
          name: entry.file.name,
          capturedAt,
          storageKeyCold,
          fileSize: entry.file.size,
          width: null,
          height: null,
          exifData: null,
        }),
      })

      updateEntry(entry.id, { status: 'done', progress: 100 })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      updateEntry(entry.id, { status: 'error', error: msg })
    }
  }

  async function handleUpload() {
    const pending = entries.filter(e => e.status === 'pending')
    if (!pending.length) return

    setIsUploading(true)
    // Upload all in parallel, failures don't block others
    await Promise.allSettled(pending.map(e => uploadOne(e)))
    setIsUploading(false)

    // Refresh page data
    router.refresh()
  }

  const allDone = entries.length > 0 && entries.every(e => e.status === 'done' || e.status === 'error')
  const hasPending = entries.some(e => e.status === 'pending')

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-slate-800">Subir fotos</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`mx-6 my-4 border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${
            isDragging ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-slate-300 bg-slate-50'
          }`}
        >
          <Upload className="w-10 h-10 text-slate-400 mb-3" />
          <p className="text-sm font-medium text-slate-600">
            Arrastra fotos aquí o <span className="text-blue-500">selecciona archivos</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">JPEG, PNG, HEIC, WebP — máx. {MAX_FILES} fotos</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/heic,image/heif,image/webp"
            multiple
            className="hidden"
            onChange={e => {
              if (e.target.files) {
                addFiles(Array.from(e.target.files))
                e.target.value = ''
              }
            }}
          />
        </div>

        {/* File list */}
        {entries.length > 0 && (
          <div className="mx-6 mb-4 space-y-2 max-h-48 overflow-y-auto">
            {entries.map(entry => (
              <div key={entry.id} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">{entry.file.name}</p>
                  {entry.status === 'uploading' && (
                    <div className="mt-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${entry.progress}%` }}
                      />
                    </div>
                  )}
                  {entry.status === 'error' && (
                    <p className="text-xs text-red-500 mt-0.5">{entry.error}</p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  {entry.status === 'pending' && (
                    <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                  )}
                  {entry.status === 'uploading' && (
                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                  )}
                  {entry.status === 'done' && (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  )}
                  {entry.status === 'error' && (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t">
          <p className="text-xs text-slate-400">
            {entries.length}/{MAX_FILES} fotos
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
            >
              {allDone ? 'Cerrar' : 'Cancelar'}
            </button>
            {!allDone && (
              <button
                onClick={handleUpload}
                disabled={!hasPending || isUploading}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                {isUploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Subir {entries.filter(e => e.status === 'pending').length > 0
                  ? `(${entries.filter(e => e.status === 'pending').length})`
                  : ''}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
