'use client'

import { useState } from 'react'
import { Star, MapPin } from 'lucide-react'
import type { Photo } from '@/types'
import { toggleFavorite } from '../actions'

interface Props {
  photo: Photo
  isSelected: boolean
  onSelect: (id: string) => void
  onClick: (photo: Photo) => void
}

export default function PhotoCard({ photo, isSelected, onSelect, onClick }: Props) {
  const [isFav, setIsFav] = useState(photo.is_favorite)
  const [isTogglingFav, setIsTogglingFav] = useState(false)

  const tags = photo.tags ?? []
  const visibleTags = tags.slice(0, 2)
  const extraCount = tags.length - 2

  const capturedDate = new Date(photo.captured_at).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  async function handleToggleFav(e: React.MouseEvent) {
    e.stopPropagation()
    if (isTogglingFav) return
    setIsTogglingFav(true)
    const newVal = !isFav
    setIsFav(newVal)
    const result = await toggleFavorite(photo.id, newVal)
    if (result?.error) {
      setIsFav(!newVal) // revert on error
    }
    setIsTogglingFav(false)
  }

  function handleCheckbox(e: React.MouseEvent) {
    e.stopPropagation()
    onSelect(photo.id)
  }

  return (
    <div
      className={`relative rounded-xl overflow-hidden cursor-pointer group aspect-square bg-slate-100 ${
        isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''
      }`}
      onClick={() => onClick(photo)}
    >
      {/* Thumbnail */}
      <img
        src={`/api/photos/thumb/${photo.id}`}
        alt={photo.name ?? capturedDate}
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />

      {/* Overlay — visible on hover or when selected */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 transition-opacity duration-200 ${
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      />

      {/* Top-left: Checkbox */}
      <div
        className={`absolute top-2 left-2 transition-opacity duration-200 ${
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
        onClick={handleCheckbox}
      >
        <div
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            isSelected
              ? 'bg-blue-500 border-blue-500'
              : 'bg-white/80 border-white/60 hover:border-blue-400'
          }`}
        >
          {isSelected && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>

      {/* Top-right: Star favorite */}
      <button
        onClick={handleToggleFav}
        className={`absolute top-2 right-2 transition-opacity duration-200 ${
          isFav ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
        aria-label={isFav ? 'Quitar de favoritas' : 'Marcar como favorita'}
      >
        <Star
          className={`w-5 h-5 transition-colors ${
            isFav ? 'fill-yellow-400 stroke-yellow-400' : 'fill-transparent stroke-white'
          }`}
        />
      </button>

      {/* Pin indicator — always visible when pinned */}
      {photo.pin_data && (
        <div className="absolute bottom-2 left-2 z-10 pointer-events-none">
          <div className="flex items-center gap-1 bg-indigo-600/80 backdrop-blur-sm rounded-full px-1.5 py-0.5">
            <MapPin className="w-3 h-3 text-white" />
          </div>
        </div>
      )}

      {/* Bottom: tags + date */}
      <div
        className={`absolute bottom-0 left-0 right-0 px-2 pb-2 transition-opacity duration-200 ${
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      >
        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1">
            {visibleTags.map(tag => (
              <span
                key={tag.id}
                className="text-[10px] font-medium px-1.5 py-0.5 rounded-full text-white"
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
              </span>
            ))}
            {extraCount > 0 && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-black/40 text-white">
                +{extraCount}
              </span>
            )}
          </div>
        )}
        {/* Date */}
        <p className="text-[10px] text-white/80">{capturedDate}</p>
      </div>
    </div>
  )
}
