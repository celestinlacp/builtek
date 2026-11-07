'use client'

import { useEffect, useState } from 'react'
import { X, ChevronLeft, ChevronRight, Star, Save, Loader2, Trash2 } from 'lucide-react'
import type { Photo, PhotoTag, Project } from '@/types'
import { toggleFavorite, updatePhotoMeta, updatePhotoTags, deletePhotos } from '../actions'
import TagSelector from './TagSelector'

interface Props {
  photo: Photo
  photos: Photo[]
  workspaceId: string
  workspaceProjects: Project[]
  workspaceTags: PhotoTag[]
  onClose: () => void
  onUpdate: (photo: Photo) => void
  onDelete: () => void
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function PhotoDetailModal({
  photo: initialPhoto,
  photos,
  workspaceId,
  workspaceProjects,
  workspaceTags,
  onClose,
  onUpdate,
  onDelete,
}: Props) {
  const [photo, setPhoto] = useState<Photo>(initialPhoto)
  const [name, setName] = useState(photo.name ?? '')
  const [projectId, setProjectId] = useState<string>(photo.project_id ?? '')
  const [capturedAt, setCapturedAt] = useState(() =>
    new Date(photo.captured_at).toISOString().slice(0, 16)
  )
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>((photo.tags ?? []).map(t => t.id))
  const [isFav, setIsFav] = useState(photo.is_favorite)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  const currentIndex = photos.findIndex(p => p.id === photo.id)
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < photos.length - 1

  function navigateTo(newPhoto: Photo) {
    setPhoto(newPhoto)
    setName(newPhoto.name ?? '')
    setProjectId(newPhoto.project_id ?? '')
    setCapturedAt(new Date(newPhoto.captured_at).toISOString().slice(0, 16))
    setSelectedTagIds((newPhoto.tags ?? []).map(t => t.id))
    setIsFav(newPhoto.is_favorite)
    setIsDirty(false)
    onUpdate(newPhoto)
  }

  function goToPrev() {
    if (hasPrev) navigateTo(photos[currentIndex - 1])
  }

  function goToNext() {
    if (hasNext) navigateTo(photos[currentIndex + 1])
  }

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') goToPrev()
      if (e.key === 'ArrowRight') goToNext()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [currentIndex, photos])

  async function handleSave() {
    setIsSaving(true)
    await Promise.all([
      updatePhotoMeta(photo.id, {
        name: name.trim() || null,
        project_id: projectId || null,
        captured_at: capturedAt ? new Date(capturedAt).toISOString() : undefined,
      }),
      updatePhotoTags(photo.id, selectedTagIds),
    ])
    setIsDirty(false)
    setIsSaving(false)
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar esta foto permanentemente? No se puede deshacer.')) return
    setIsDeleting(true)
    await deletePhotos([photo.id], workspaceId)
    onDelete()
    onClose()
  }

  async function handleToggleFav() {
    const newVal = !isFav
    setIsFav(newVal)
    await toggleFavorite(photo.id, newVal)
  }

  const capturedDate = new Date(photo.captured_at).toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex"
      onClick={onClose}
    >
      {/* Modal content — stop propagation so inner clicks don't close */}
      <div
        className="flex w-full h-full"
        onClick={e => e.stopPropagation()}
      >
        {/* Left: Photo (70%) */}
        <div className="relative flex-1 flex items-center justify-center">
          <img
            src={`/api/photos/thumb/${photo.id}`}
            alt={photo.name ?? capturedDate}
            className="max-w-full max-h-full object-contain"
          />

          {/* Navigation arrows */}
          {hasPrev && (
            <button
              onClick={goToPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
              aria-label="Foto anterior"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          {hasNext && (
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
              aria-label="Foto siguiente"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Photo counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-xs bg-black/40 px-3 py-1 rounded-full">
            {currentIndex + 1} / {photos.length}
          </div>
        </div>

        {/* Right: Details panel (30%) */}
        <div className="w-80 bg-white flex flex-col overflow-y-auto flex-shrink-0">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="text-sm font-semibold text-slate-700">Detalle</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleFav}
                className="transition-colors"
                aria-label={isFav ? 'Quitar de favoritas' : 'Marcar como favorita'}
              >
                <Star
                  className={`w-5 h-5 transition-colors ${
                    isFav ? 'fill-yellow-400 stroke-yellow-400' : 'stroke-slate-400 hover:stroke-yellow-400'
                  }`}
                />
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
                aria-label="Eliminar foto"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Fields */}
          <div className="p-4 space-y-4 flex-1">
            {/* Name */}
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Nombre</label>
              <input
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); setIsDirty(true) }}
                placeholder="Sin nombre"
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Project */}
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Proyecto</label>
              <select
                value={projectId}
                onChange={e => { setProjectId(e.target.value); setIsDirty(true) }}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sin proyecto</option>
                {workspaceProjects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Captured date */}
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Fecha de captura</label>
              <input
                type="datetime-local"
                value={capturedAt}
                onChange={e => { setCapturedAt(e.target.value); setIsDirty(true) }}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Etiquetas</label>
              <TagSelector
                workspaceId={photo.workspace_id}
                availableTags={workspaceTags}
                selectedTagIds={selectedTagIds}
                onChange={ids => { setSelectedTagIds(ids); setIsDirty(true) }}
              />
            </div>

            {/* Save button */}
            {isDirty && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar cambios
              </button>
            )}
          </div>

          {/* Metadata */}
          <div className="px-4 pb-4 border-t pt-4 space-y-2">
            <p className="text-xs font-medium text-slate-500">Información</p>
            <div className="space-y-1.5 text-xs text-slate-600">
              {photo.width && photo.height && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Dimensiones</span>
                  <span className="font-medium">{photo.width} × {photo.height} px</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Tamaño</span>
                <span className="font-medium">{formatBytes(photo.file_size)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Almacenamiento</span>
                <span className={`font-medium capitalize ${photo.tier_storage === 'hot' ? 'text-blue-600' : 'text-orange-500'}`}>
                  {photo.tier_storage}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
