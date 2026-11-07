'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { Photo, PinData } from '@/types'
import { getPlanosForProject, updatePhotoPin } from '../actions'

interface Props {
  photo: Photo
  workspaceId: string
  onPinned: (pin: PinData, docName: string) => void
  onClose: () => void
}

export default function PinPickerModal({ photo, workspaceId, onPinned, onClose }: Props) {
  const [step, setStep] = useState<1 | 2>(1)
  const [planos, setPlanos] = useState<Array<{ id: string; name: string; display_name: string | null; file_name: string | null }>>([])
  const [loading, setLoading] = useState(false)
  const [selectedPlano, setSelectedPlano] = useState<{ id: string; name: string } | null>(null)
  const [previewPin, setPreviewPin] = useState<{ x: number; y: number } | null>(null)
  const [label, setLabel] = useState('')
  const [saving, setSaving] = useState(false)

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  // Load planos when step 1 mounts and project_id exists
  useEffect(() => {
    if (!photo.project_id) return
    setLoading(true)
    getPlanosForProject(photo.project_id, workspaceId)
      .then(data => setPlanos(data))
      .finally(() => setLoading(false))
  }, [photo.project_id, workspaceId])

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10
    setPreviewPin({ x, y })
  }

  async function handleSavePin() {
    if (!previewPin || !selectedPlano) return
    setSaving(true)
    const pin: PinData = {
      document_id: selectedPlano.id,
      page: 1,
      x: previewPin.x,
      y: previewPin.y,
      ...(label.trim() && { label: label.trim() }),
    }
    await updatePhotoPin(photo.id, pin)
    onPinned(pin, selectedPlano.name)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center">
      <div className="bg-white rounded-2xl w-[90vw] h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-12 flex items-center justify-between px-4 border-b flex-shrink-0">
          <h2 className="text-sm font-semibold text-slate-700">
            {step === 1 ? 'Seleccionar plano' : `Marcar punto en: ${selectedPlano?.name ?? ''}`}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {step === 1 ? (
            <div className="p-4 h-full overflow-y-auto">
              {/* No project assigned */}
              {!photo.project_id ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <p className="text-sm text-slate-500 text-center">
                    Asigna la foto a un proyecto para usar esta función.
                  </p>
                  <button onClick={onClose} className="px-4 py-2 text-sm bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                    Cerrar
                  </button>
                </div>
              ) : loading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-slate-400">Cargando planos...</p>
                </div>
              ) : planos.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-slate-500 text-center max-w-xs">
                    Este proyecto no tiene planos (PLA) cargados. Súbelos en la sección Documentos.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {planos.map(plano => (
                    <button
                      key={plano.id}
                      onClick={() => { setSelectedPlano({ id: plano.id, name: plano.display_name ?? plano.name }); setStep(2) }}
                      className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition-colors text-sm text-slate-700"
                    >
                      {plano.display_name ?? plano.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="relative flex-1 h-full">
              {/* PDF iframe */}
              <iframe
                src={`/api/documents/view/${selectedPlano?.id}`}
                className="w-full h-full border-0"
                title={selectedPlano?.name ?? 'Plano'}
              />
              {/* Transparent overlay to capture click */}
              <div
                className="absolute inset-0 cursor-crosshair z-10"
                onClick={handleOverlayClick}
              />
              {/* Preview pin marker */}
              {previewPin && (
                <div className="absolute pointer-events-none z-20" style={{ left: `${previewPin.x}%`, top: `${previewPin.y}%` }}>
                  <svg
                    style={{ transform: 'translate(-50%, -100%)', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
                    width="28"
                    height="36"
                    viewBox="0 0 28 36"
                  >
                    <ellipse cx="14" cy="34" rx="5" ry="2" fill="rgba(0,0,0,0.25)" />
                    <path
                      d="M14 2 C6.8 2 2 7.8 2 14 C2 23 14 34 14 34 C14 34 26 23 26 14 C26 7.8 21.2 2 14 2 Z"
                      fill="#6366F1"
                      stroke="white"
                      strokeWidth="1.5"
                    />
                    <circle cx="14" cy="14" r="4" fill="white" />
                  </svg>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer — only shown in step 2 */}
        {step === 2 && (
          <div className="h-16 flex items-center gap-3 px-4 border-t flex-shrink-0">
            <button
              onClick={() => { setStep(1); setPreviewPin(null); setLabel('') }}
              className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              Volver
            </button>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="Etiqueta del pin (opcional)"
              className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleSavePin}
              disabled={!previewPin || saving}
              className="px-4 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Guardando...' : 'Guardar pin'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
