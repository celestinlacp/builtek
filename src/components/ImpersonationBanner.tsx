'use client'

import { useState } from 'react'
import { Shield, Loader2 } from 'lucide-react'

interface Props {
  workspaceName: string
}

export default function ImpersonationBanner({ workspaceName }: Props) {
  const [exiting, setExiting] = useState(false)

  async function handleExit() {
    setExiting(true)
    try {
      const res = await fetch('/api/super-admin/impersonate/exit', { method: 'POST' })
      if (res.ok) {
        window.location.href = '/super-admin'
      }
    } catch {
      setExiting(false)
    }
  }

  return (
    <div className="sticky top-0 z-[60] bg-red-900 border-b border-red-700 px-4 py-2.5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-red-300 flex-shrink-0" />
        <p className="text-white text-sm font-medium">
          Estás viendo el workspace de <strong>{workspaceName}</strong>
        </p>
      </div>
      <button
        onClick={handleExit}
        disabled={exiting}
        className="flex-shrink-0 flex items-center gap-1.5 bg-red-700 hover:bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
      >
        {exiting && <Loader2 className="w-3 h-3 animate-spin" />}
        Salir
      </button>
    </div>
  )
}
