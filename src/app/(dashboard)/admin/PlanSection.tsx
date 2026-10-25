'use client'

import { useState } from 'react'
import { CreditCard, Loader2, X, ChevronDown, CheckCircle2 } from 'lucide-react'

const PLANS = [
  { id: 'starter',    label: 'Starter',    desc: 'Para equipos pequeños' },
  { id: 'obra',       label: 'Obra',       desc: 'Plan más popular' },
  { id: 'pro',        label: 'Pro',        desc: 'Control documental completo' },
  { id: 'contractor', label: 'Contractor', desc: 'Para empresas grandes' },
]

const PLAN_COLORS: Record<string, string> = {
  starter:    'bg-blue-100 text-blue-700',
  obra:       'bg-yellow-100 text-yellow-700',
  pro:        'bg-indigo-100 text-indigo-700',
  contractor: 'bg-purple-100 text-purple-700',
}

interface Props {
  currentPlan: string
  currentStatus: string
  trialEndsAt: string | null
  isOwner: boolean
  isImpersonating?: boolean
}

export default function PlanSection({
  currentPlan,
  currentStatus,
  trialEndsAt,
  isOwner,
  isImpersonating = false,
}: Props) {
  const [showModal, setShowModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(currentPlan)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activePlan, setActivePlan] = useState(currentPlan)
  const [activeStatus, setActiveStatus] = useState(currentStatus)

  const daysLeft = trialEndsAt
    ? Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  const isTrial = !!trialEndsAt && activeStatus === 'active'
  const isExpired = activeStatus === 'trial_expired'

  async function handleChangePlan() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/workspace/plan', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan, notes: notes || null }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setActivePlan(data.plan)
        setActiveStatus(data.status)
        setShowModal(false)
        setNotes('')
      }
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-[#00C2FF]" />
          <h2 className="text-base font-bold text-[#1A2744]">Tu plan</h2>
        </div>
        {isOwner && (
          <button
            onClick={() => { setShowModal(true); setSelectedPlan(activePlan) }}
            className="text-sm font-medium text-[#00C2FF] hover:text-cyan-700 transition-colors"
          >
            Cambiar plan
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-4">
        {/* Plan badge */}
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${PLAN_COLORS[activePlan] || 'bg-slate-100 text-slate-600'}`}>
            {activePlan}
          </span>
        </div>

        {/* Status */}
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-medium ${
            isExpired ? 'text-red-600' :
            isTrial   ? 'text-amber-600' :
                        'text-emerald-600'
          }`}>
            {isExpired ? 'Trial vencido' : isTrial ? 'En período de prueba' : 'Activo'}
          </span>
        </div>

        {/* Days left */}
        {isTrial && daysLeft !== null && (
          <div className="text-xs text-slate-500">
            {daysLeft > 0
              ? `${daysLeft} día${daysLeft === 1 ? '' : 's'} restante${daysLeft === 1 ? '' : 's'}`
              : 'Vence hoy'
            }
          </div>
        )}
        {isTrial && trialEndsAt && (
          <div className="text-xs text-slate-400">
            Vence el {new Date(trialEndsAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
        )}
      </div>

      {/* Change Plan Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#1A2744]">Cambiar plan</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 mb-4">
              {PLANS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlan(p.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left ${
                    selectedPlan === p.id
                      ? 'border-[#00C2FF] bg-[#00C2FF]/5'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{p.label}</p>
                    <p className="text-xs text-slate-500">{p.desc}</p>
                  </div>
                  {selectedPlan === p.id && (
                    <CheckCircle2 className="w-5 h-5 text-[#00C2FF] flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {/* Notes — only show when impersonating */}
            {isImpersonating && (
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                  Notas internas (solo visible en impersonation)
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Razón del cambio de plan..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C2FF] resize-none"
                />
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-600 mb-4">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleChangePlan}
                disabled={loading || selectedPlan === activePlan}
                className="flex-1 py-2.5 rounded-xl bg-[#00C2FF] text-[#0D1729] text-sm font-bold hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirmar cambio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
