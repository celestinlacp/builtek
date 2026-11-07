'use client'

import { useState } from 'react'
import { Trash2, CheckSquare, XSquare, Loader2 } from 'lucide-react'
import { deletePhotos } from '../actions'

interface Props {
  selectedIds: Set<string>
  totalCount: number
  workspaceId: string
  onSelectAll: () => void
  onClearSelection: () => void
  onDeleted: () => void
}

export default function MultiSelectToolbar({
  selectedIds,
  totalCount,
  workspaceId,
  onSelectAll,
  onClearSelection,
  onDeleted,
}: Props) {
  const [isDeleting, setIsDeleting] = useState(false)
  const count = selectedIds.size

  if (count === 0) return null

  async function handleDelete() {
    const confirmed = window.confirm(
      `¿Eliminar ${count} foto${count !== 1 ? 's' : ''}? Esta acción no se puede deshacer.`
    )
    if (!confirmed) return

    setIsDeleting(true)
    const result = await deletePhotos(Array.from(selectedIds), workspaceId)
    setIsDeleting(false)

    if (result?.error) {
      alert(`Error al eliminar: ${result.error}`)
      return
    }

    onDeleted()
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center gap-2 bg-slate-900 text-white rounded-2xl px-4 py-3 shadow-2xl border border-white/10">
        {/* Count */}
        <span className="text-sm font-medium tabular-nums">
          {count} seleccionada{count !== 1 ? 's' : ''}
        </span>

        <div className="w-px h-5 bg-white/20 mx-1" />

        {/* Select all */}
        <button
          onClick={onSelectAll}
          disabled={count === totalCount}
          className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white disabled:opacity-40 transition-colors"
        >
          <CheckSquare className="w-4 h-4" />
          <span className="hidden sm:inline">Todas ({totalCount})</span>
        </button>

        {/* Deselect */}
        <button
          onClick={onClearSelection}
          className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors"
        >
          <XSquare className="w-4 h-4" />
          <span className="hidden sm:inline">Deseleccionar</span>
        </button>

        <div className="w-px h-5 bg-white/20 mx-1" />

        {/* Delete */}
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
        >
          {isDeleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
          <span>Eliminar</span>
        </button>
      </div>
    </div>
  )
}
