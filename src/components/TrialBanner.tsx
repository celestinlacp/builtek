'use client'

import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

interface Props {
  daysLeft?: number | null
}

export default function TrialBanner({ daysLeft }: Props) {
  return (
    <div className="sticky top-0 z-50 bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <p className="text-amber-900 text-sm font-medium">
          Tu período de prueba venció — elige un plan para continuar creando.
          {daysLeft !== undefined && daysLeft !== null && daysLeft > 0 && (
            <span className="font-normal ml-1">
              (te {daysLeft === 1 ? 'queda 1 día' : `quedan ${daysLeft} días`})
            </span>
          )}
        </p>
      </div>
      <Link
        href="/pricing"
        className="flex-shrink-0 bg-amber-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-amber-700 transition-colors"
      >
        Ver planes
      </Link>
    </div>
  )
}
