'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createWorkspace } from './actions'

const INDUSTRY_OPTIONS = [
  { value: 'civil', label: '🏗️ Obra Civil e Infraestructura' },
  { value: 'building', label: '🏢 Edificación' },
  { value: 'industrial', label: '🏭 Industrial' },
  { value: 'road', label: '🛣️ Carreteras y Vialidades' },
  { value: 'hydraulic', label: '💧 Obras Hidráulicas' },
  { value: 'other', label: '⚙️ Otro' },
]

const TEAM_SIZE_OPTIONS = [
  { value: '1', label: 'Solo yo' },
  { value: '2-10', label: '2–10 personas' },
  { value: '11-50', label: '11–50 personas' },
  { value: '50+', label: 'Más de 50' },
]

const STEPS = ['Empresa', 'Equipo', 'Listo']

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [workspaceName, setWorkspaceName] = useState('')
  const [industry, setIndustry] = useState('')
  const [teamSize, setTeamSize] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleFinish() {
    setLoading(true)
    setError(null)
    const formData = new FormData()
    formData.set('workspace_name', workspaceName)
    const result = await createWorkspace(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">

      {/* Logo */}
      <div className="flex items-center gap-2 mb-10">
        <div className="w-9 h-9 bg-[#1A2744] rounded-lg flex items-center justify-center">
          <span className="text-[#00C2FF] font-black text-lg">B</span>
        </div>
        <span className="text-[#1A2744] font-bold text-xl">Builtek</span>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-10">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              i < step ? 'bg-[#00C2FF] text-white' :
              i === step ? 'bg-[#1A2744] text-white' :
              'bg-slate-200 text-slate-400'
            }`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`text-xs font-medium ${i === step ? 'text-[#1A2744]' : 'text-slate-400'}`}>
              {s}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`w-8 h-0.5 mx-1 ${i < step ? 'bg-[#00C2FF]' : 'bg-slate-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 w-full max-w-md">

        {/* Step 0 — Nombre del workspace */}
        {step === 0 && (
          <div>
            <h1 className="text-xl font-bold text-[#1A2744] mb-1">¿Cómo se llama tu empresa?</h1>
            <p className="text-slate-500 text-sm mb-6">Este será el nombre de tu workspace en Builtek</p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Nombre de la empresa
              </label>
              <input
                type="text"
                value={workspaceName}
                onChange={e => setWorkspaceName(e.target.value)}
                placeholder="Ej: Constructora Pérez, ARTF Frente 12..."
                className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
                Sector de construcción
              </label>
              <div className="grid grid-cols-2 gap-2">
                {INDUSTRY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setIndustry(opt.value)}
                    className={`text-left px-3 py-2.5 rounded-lg border text-xs font-medium transition-all ${
                      industry === opt.value
                        ? 'border-[#00C2FF] bg-[#00C2FF]/10 text-[#1A2744]'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(1)}
              disabled={!workspaceName.trim() || !industry}
              className="w-full mt-6 bg-[#1A2744] text-white py-3 rounded-lg font-semibold text-sm hover:bg-[#243660] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continuar →
            </button>
          </div>
        )}

        {/* Step 1 — Tamaño del equipo */}
        {step === 1 && (
          <div>
            <h1 className="text-xl font-bold text-[#1A2744] mb-1">¿Cuántas personas en tu equipo?</h1>
            <p className="text-slate-500 text-sm mb-6">Esto nos ayuda a configurar Builtek para ti</p>

            <div className="space-y-2 mb-6">
              {TEAM_SIZE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTeamSize(opt.value)}
                  className={`w-full text-left px-4 py-3.5 rounded-lg border text-sm font-medium transition-all ${
                    teamSize === opt.value
                      ? 'border-[#00C2FF] bg-[#00C2FF]/10 text-[#1A2744]'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(0)}
                className="flex-1 py-3 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                ← Atrás
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!teamSize}
                className="flex-1 bg-[#1A2744] text-white py-3 rounded-lg font-semibold text-sm hover:bg-[#243660] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continuar →
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Confirmación */}
        {step === 2 && (
          <div className="text-center">
            <div className="w-16 h-16 bg-[#00C2FF]/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🏗️</span>
            </div>
            <h1 className="text-xl font-bold text-[#1A2744] mb-1">¡Todo listo!</h1>
            <p className="text-slate-500 text-sm mb-6">
              Vamos a crear el workspace de <span className="font-semibold text-[#1A2744]">{workspaceName}</span>
            </p>

            <div className="bg-slate-50 rounded-xl p-4 text-left mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Workspace</span>
                <span className="font-semibold text-[#1A2744]">{workspaceName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Sector</span>
                <span className="font-medium text-slate-700">
                  {INDUSTRY_OPTIONS.find(o => o.value === industry)?.label}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Equipo</span>
                <span className="font-medium text-slate-700">
                  {TEAM_SIZE_OPTIONS.find(o => o.value === teamSize)?.label}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Plan</span>
                <span className="font-medium text-green-600">Free — gratis</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600 mb-4 text-left">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                ← Atrás
              </button>
              <button
                onClick={handleFinish}
                disabled={loading}
                className="flex-1 bg-[#1A2744] text-white py-3 rounded-lg font-semibold text-sm hover:bg-[#243660] transition-colors disabled:opacity-60"
              >
                {loading ? 'Creando...' : 'Crear workspace'}
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400 mt-6">
        Puedes cambiar estos datos después en Configuración
      </p>
    </div>
  )
}
