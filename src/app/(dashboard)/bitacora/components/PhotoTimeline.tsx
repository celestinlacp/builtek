'use client'

import { useEffect, useRef, useState } from 'react'
import type { Photo } from '@/types'
import PhotoCard from './PhotoCard'

interface Props {
  photos: Photo[]
  selectedIds: Set<string>
  onSelect: (id: string) => void
  onSelectAll: () => void
  onClearSelection: () => void
  onPhotoClick: (photo: Photo) => void
}

interface MonthGroup {
  key: string        // YYYY-MM
  label: string      // e.g. "Noviembre 2026"
  photos: Photo[]
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function groupByMonth(photos: Photo[]): MonthGroup[] {
  const map = new Map<string, Photo[]>()
  for (const p of photos) {
    const d = new Date(p.captured_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(p)
  }
  return Array.from(map.entries()).map(([key, photos]) => {
    const [year, month] = key.split('-')
    const label = `${MONTH_NAMES[parseInt(month, 10) - 1]} ${year}`
    return { key, label, photos }
  })
}

export default function PhotoTimeline({
  photos,
  selectedIds,
  onSelect,
  onPhotoClick,
}: Props) {
  const groups = groupByMonth(photos)
  const [activeMonth, setActiveMonth] = useState<string>(groups[0]?.key ?? '')
  const headerRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const containerRef = useRef<HTMLDivElement>(null)

  // IntersectionObserver to track active month
  useEffect(() => {
    if (!containerRef.current) return

    const observers: IntersectionObserver[] = []

    headerRefs.current.forEach((el, key) => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveMonth(key)
          }
        },
        {
          rootMargin: '-64px 0px -80% 0px',
          threshold: 0,
        }
      )
      observer.observe(el)
      observers.push(observer)
    })

    return () => observers.forEach(o => o.disconnect())
  }, [groups.map(g => g.key).join(',')])

  function scrollToMonth(key: string) {
    const el = headerRefs.current.get(key)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Time scrubber — fixed to the right */}
      {groups.length > 1 && (
        <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2 items-center">
          {groups.map(g => (
            <button
              key={g.key}
              onClick={() => scrollToMonth(g.key)}
              title={g.label}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                activeMonth === g.key
                  ? 'bg-blue-500 scale-150'
                  : 'bg-slate-300 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>
      )}

      {/* Month groups */}
      <div className="space-y-8 pr-6">
        {groups.map(group => (
          <section key={group.key}>
            {/* Sticky month header */}
            <div
              ref={el => {
                if (el) headerRefs.current.set(group.key, el)
                else headerRefs.current.delete(group.key)
              }}
              className="sticky top-16 z-10 bg-white/95 backdrop-blur-sm py-2 mb-4 border-b border-slate-100"
            >
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                {group.label}
                <span className="ml-2 text-slate-400 font-normal normal-case">
                  ({group.photos.length} foto{group.photos.length !== 1 ? 's' : ''})
                </span>
              </h2>
            </div>

            {/* Photo grid: 3 col desktop / 2 col tablet / 1 col mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {group.photos.map(photo => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  isSelected={selectedIds.has(photo.id)}
                  onSelect={onSelect}
                  onClick={onPhotoClick}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
