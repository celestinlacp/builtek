'use client'

import { useRouter } from 'next/navigation'
import { X, Lock } from 'lucide-react'

interface Props {
  onClose: () => void
}

export default function TrialExpiredModal({ onClose }: Props) {
  const router = useRouter()

  function handleVerPlanes() {
    router.push('/pricing')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 p-2.5 rounded-xl">
              <Lock className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">
              Esta función requiere un plan activo
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-slate-600 text-sm leading-relaxed mb-6">
          Tu período de prueba ha vencido. Tus datos están seguros — activa un plan para continuar.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleVerPlanes}
            className="flex-1 py-2.5 rounded-xl bg-[#00C2FF] text-[#0D1729] text-sm font-bold hover:bg-cyan-400 transition-colors"
          >
            Ver planes
          </button>
        </div>
      </div>
    </div>
  )
}
