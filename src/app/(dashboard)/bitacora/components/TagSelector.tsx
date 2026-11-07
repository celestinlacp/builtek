'use client'

import { useRef, useState } from 'react'
import { Plus, ChevronDown } from 'lucide-react'
import type { PhotoTag } from '@/types'
import { createPhotoTag } from '../actions'

const PALETTE = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6',
]

interface Props {
  workspaceId: string
  availableTags: PhotoTag[]
  selectedTagIds: string[]
  onChange: (tagIds: string[]) => void
}

export default function TagSelector({ workspaceId, availableTags, selectedTagIds, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [tags, setTags] = useState<PhotoTag[]>(availableTags)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PALETTE[0])
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  function toggleTag(tagId: string) {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter(id => id !== tagId))
    } else {
      onChange([...selectedTagIds, tagId])
    }
  }

  async function handleCreate() {
    const trimmed = newName.trim()
    if (!trimmed) return

    setIsCreating(true)
    setCreateError(null)

    const result = await createPhotoTag(workspaceId, trimmed, newColor)

    if (result.error) {
      setCreateError(result.error)
      setIsCreating(false)
      return
    }

    if (result.tag) {
      // Add to local list immediately without page reload
      setTags(prev => [...prev, result.tag!])
      onChange([...selectedTagIds, result.tag!.id])
    }

    setNewName('')
    setNewColor(PALETTE[0])
    setIsCreating(false)
  }

  const selectedTags = tags.filter(t => selectedTagIds.includes(t.id))

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white hover:border-slate-300 transition-colors"
      >
        <div className="flex flex-wrap gap-1 flex-1 min-w-0">
          {selectedTags.length === 0 ? (
            <span className="text-slate-400">Sin etiquetas</span>
          ) : (
            selectedTags.map(tag => (
              <span
                key={tag.id}
                className="text-[11px] font-medium px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
              </span>
            ))
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 ml-1 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {/* Tag list */}
          <div className="max-h-48 overflow-y-auto p-1">
            {tags.length === 0 ? (
              <p className="text-xs text-slate-400 px-3 py-2">No hay etiquetas. Crea una abajo.</p>
            ) : (
              tags.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 rounded-lg text-sm transition-colors"
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="flex-1 text-left text-slate-700">{tag.name}</span>
                  {selectedTagIds.includes(tag.id) && (
                    <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Create new tag */}
          <div className="border-t border-slate-100 p-3">
            <p className="text-xs font-medium text-slate-500 mb-2">Nueva etiqueta</p>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Nombre..."
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                className="flex-1 text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={40}
              />
              <button
                type="button"
                onClick={handleCreate}
                disabled={!newName.trim() || isCreating}
                className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Color palette */}
            <div className="flex gap-1.5 flex-wrap">
              {PALETTE.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewColor(color)}
                  className={`w-5 h-5 rounded-full transition-transform ${
                    newColor === color ? 'scale-125 ring-2 ring-offset-1 ring-slate-400' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            {createError && (
              <p className="text-xs text-red-500 mt-1.5">{createError}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
