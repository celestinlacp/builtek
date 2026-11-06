'use client'

import { useState } from 'react'
import { Camera, Upload, Filter } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Photo, PhotoTag, Project } from '@/types'
import PhotoTimeline from './components/PhotoTimeline'
import PhotoDetailModal from './components/PhotoDetailModal'
import PhotoUploadModal from './components/PhotoUploadModal'
import MultiSelectToolbar from './components/MultiSelectToolbar'

interface Props {
  photos: Photo[]
  heroPhoto: Photo | null
  workspaceId: string
  workspaceTags: PhotoTag[]
  workspaceProjects: Project[]
  activeProjectFilter: string | null
}

export default function BitacoraClient({
  photos,
  heroPhoto,
  workspaceId,
  workspaceTags,
  workspaceProjects,
  activeProjectFilter,
}: Props) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [detailPhoto, setDetailPhoto] = useState<Photo | null>(null)
  const [showUpload, setShowUpload] = useState(false)

  function handleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleSelectAll() {
    setSelectedIds(new Set(photos.map(p => p.id)))
  }

  function handleClearSelection() {
    setSelectedIds(new Set())
  }

  function handleProjectFilter(projectId: string | null) {
    const params = new URLSearchParams()
    if (projectId) params.set('project', projectId)
    router.push(`/bitacora${params.toString() ? '?' + params.toString() : ''}`)
  }

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Bitácora Visual</h1>
          <p className="text-sm text-slate-500 mt-0.5">Registro fotográfico de avance de obra</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Project filter */}
          <select
            value={activeProjectFilter ?? ''}
            onChange={e => handleProjectFilter(e.target.value || null)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los proyectos</option>
            {workspaceProjects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Subir fotos
          </button>
        </div>
      </div>

      {/* Hero image */}
      {heroPhoto && (
        <div
          className="relative h-56 rounded-2xl overflow-hidden mb-8 cursor-pointer group"
          onClick={() => setDetailPhoto(heroPhoto)}
        >
          <img
            src={`/api/photos/thumb/${heroPhoto.id}`}
            alt={heroPhoto.name ?? 'Foto destacada'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4">
            <p className="text-white text-sm font-medium">
              {heroPhoto.is_favorite ? 'Foto destacada' : 'Foto más reciente'}
            </p>
            {heroPhoto.name && (
              <p className="text-white/70 text-xs mt-0.5">{heroPhoto.name}</p>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {photos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Camera className="w-16 h-16 text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-600 mb-2">Sin fotos aún</h3>
          <p className="text-sm text-slate-400 mb-6 max-w-xs">
            Documenta el avance de tu obra subiendo las primeras fotos al registro visual.
          </p>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Subir primera foto
          </button>
        </div>
      )}

      {/* Timeline */}
      {photos.length > 0 && (
        <PhotoTimeline
          photos={photos}
          selectedIds={selectedIds}
          onSelect={handleSelect}
          onSelectAll={handleSelectAll}
          onClearSelection={handleClearSelection}
          onPhotoClick={setDetailPhoto}
        />
      )}

      {/* Multi-select toolbar */}
      <MultiSelectToolbar
        selectedIds={selectedIds}
        totalCount={photos.length}
        workspaceId={workspaceId}
        onSelectAll={handleSelectAll}
        onClearSelection={handleClearSelection}
        onDeleted={handleClearSelection}
      />

      {/* Detail modal */}
      {detailPhoto && (
        <PhotoDetailModal
          photo={detailPhoto}
          photos={photos}
          workspaceProjects={workspaceProjects}
          workspaceTags={workspaceTags}
          onClose={() => setDetailPhoto(null)}
          onUpdate={updated => setDetailPhoto(updated)}
        />
      )}

      {/* Upload modal */}
      {showUpload && (
        <PhotoUploadModal
          workspaceId={workspaceId}
          projectId={activeProjectFilter ?? undefined}
          onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  )
}
