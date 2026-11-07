'use client'

import { useEffect } from 'react'
import { MapPin, X } from 'lucide-react'
import type { Photo, PinData } from '@/types'

interface Props {
  photo: Photo
  pin: PinData
  planDocName: string
  onClose: () => void
}

export default function PlanSplitViewModal({ photo, pin, planDocName, onClose }: Props) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[70] bg-black flex flex-col">
      {/* Header */}
      <div className="h-12 bg-[#1A2744] flex items-center px-4 gap-4 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <MapPin className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <span className="text-white text-sm font-medium truncate">{planDocName}</span>
        </div>
        <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
          <span className="text-white/60 text-sm truncate">{photo.name ?? 'Sin nombre'}</span>
          <button onClick={onClose} className="text-white/60 hover:text-white ml-2" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {/* Left panel: plano PDF con marcador */}
        <div className="relative flex-[3] bg-[#111827]">
          <iframe
            src={`/api/documents/view/${pin.document_id}`}
            className="w-full h-full border-0"
            title={planDocName}
          />
          {/* Overlay del marcador SVG — pointer-events-none no bloquea scroll del iframe */}
          <div className="absolute inset-0 pointer-events-none">
            <svg
              style={{
                position: 'absolute',
                left: `${pin.x}%`,
                top: `${pin.y}%`,
                transform: 'translate(-50%, -100%)',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
              }}
              width="28"
              height="36"
              viewBox="0 0 28 36"
            >
              <ellipse cx="14" cy="34" rx="5" ry="2" fill="rgba(0,0,0,0.25)" />
              <path
                d="M14 2 C6.8 2 2 7.8 2 14 C2 23 14 34 14 34 C14 34 26 23 26 14 C26 7.8 21.2 2 14 2 Z"
                fill="#EF4444"
                stroke="white"
                strokeWidth="1.5"
              />
              <circle cx="14" cy="14" r="4" fill="white" />
            </svg>
          </div>
        </div>

        {/* Right panel: foto */}
        <div className="flex-[2] bg-black flex items-center justify-center border-l border-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/photos/thumb/${photo.id}`}
            alt={photo.name ?? 'Foto'}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      </div>
    </div>
  )
}
