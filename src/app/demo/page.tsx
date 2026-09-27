'use client'

import { useState } from 'react'
import Link from 'next/link'

const INDUSTRY_OPTIONS = [
  { value: 'civil',      label: '🏗️ Obra Civil e Infraestructura' },
  { value: 'building',   label: '🏢 Edificación' },
  { value: 'industrial', label: '🏭 Industrial' },
  { value: 'road',       label: '🛣️ Carreteras y Vialidades' },
  { value: 'hydraulic',  label: '💧 Obras Hidráulicas' },
  { value: 'other',      label: '⚙️ Otro' },
]

const TEAM_SIZE_OPTIONS = [
  { value: '1',     label: 'Solo yo' },
  { value: '2-10',  label: '2–10 personas' },
  { value: '11-50', label: '11–50 personas' },
  { value: '50+',   label: 'Más de 50' },
]

const STEPS = ['Contacto', 'Tu obra', 'Confirmado']

export default function DemoPage() {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [sector, setSector] = useState('')
  const [teamSize, setTeamSize] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, company, sector, teamSize }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
        setLoading(false)
      } else {
        setStep(2)
        setLoading(false)
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0D1729] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00C2FF]/6 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,194,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,194,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-10 relative">
        <div className="w-9 h-9 bg-[#00C2FF] rounded-lg flex items-center justify-center">
          <span className="text-[#0D1729] font-black text-lg">B</span>
        </div>
        <span className="text-white font-bold text-xl tracking-tight">Builtek</span>
      </Link>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-10 relative">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              i < step ? 'bg-[#00C2FF] text-[#0D1729]' :
              i === step ? 'bg-white text-[#0D1729]' :
              'bg-white/10 text-white/30'
            }`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`text-xs font-medium ${i === step ? 'text-white' : 'text-white/30'}`}>
              {s}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`w-8 h-0.5 mx-1 ${i < step ? 'bg-[#00C2FF]' : 'bg-white/10'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="bg-[#1A2744] border border-white/10 rounded-2xl p-8 w-full max-w-md relative shadow-2xl shadow-black/40">

        {/* Step 0 — Contacto */}
        {step === 0 && (
          <div>
            <h1 className="text-xl font-bold text-white mb-1">Solicita tu demo</h1>
            <p className="text-white/40 text-sm mb-6 font-light">Te contactamos en menos de 24 horas</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wide">
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Juan Pérez"
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-[#00C2FF] focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wide">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@empresa.com"
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-[#00C2FF] focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wide">
                  Empresa (opcional)
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  placeholder="Constructora XYZ"
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-[#00C2FF] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              onClick={() => setStep(1)}
              disabled={!name.trim() || !email.trim()}
              className="w-full mt-6 bg-[#00C2FF] text-[#0D1729] py-3 rounded-lg font-bold text-sm hover:bg-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Continuar →
            </button>

            <p className="text-center text-xs text-white/20 mt-4 font-light">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-[#00C2FF]/70 hover:text-[#00C2FF] underline">
                Inicia sesión
              </Link>
            </p>
          </div>
        )}

        {/* Step 1 — Sector y equipo */}
        {step === 1 && (
          <div>
            <h1 className="text-xl font-bold text-white mb-1">Cuéntanos sobre tu obra</h1>
            <p className="text-white/40 text-sm mb-6 font-light">Así preparamos una demo relevante para ti</p>

            <div className="mb-5">
              <label className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-wide">
                Sector de construcción
              </label>
              <div className="grid grid-cols-2 gap-2">
                {INDUSTRY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSector(opt.value)}
                    className={`text-left px-3 py-2.5 rounded-lg border text-xs font-medium transition-all ${
                      sector === opt.value
                        ? 'border-[#00C2FF] bg-[#00C2FF]/15 text-white'
                        : 'border-white/10 text-white/50 hover:border-white/25 hover:text-white/70'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-wide">
                Tamaño del equipo
              </label>
              <div className="space-y-2">
                {TEAM_SIZE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTeamSize(opt.value)}
                    className={`w-full text-left px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                      teamSize === opt.value
                        ? 'border-[#00C2FF] bg-[#00C2FF]/15 text-white'
                        : 'border-white/10 text-white/50 hover:border-white/25 hover:text-white/70'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400 mb-4">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(0)}
                className="flex-1 py-3 rounded-lg border border-white/10 text-sm font-semibold text-white/50 hover:text-white hover:border-white/25 transition-colors"
              >
                ← Atrás
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !sector || !teamSize}
                className="flex-1 bg-[#00C2FF] text-[#0D1729] py-3 rounded-lg font-bold text-sm hover:bg-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {loading ? 'Enviando...' : 'Solicitar demo →'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Confirmado */}
        {step === 2 && (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-[#00C2FF]/15 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <span className="text-3xl">🏗️</span>
            </div>
            <h1 className="text-xl font-bold text-white mb-2">¡Solicitud recibida!</h1>
            <p className="text-white/40 text-sm font-light mb-6 leading-relaxed">
              Te contactamos en las próximas <strong className="text-white/60">24 horas</strong> al correo{' '}
              <span className="text-[#00C2FF]">{email}</span> para agendar tu demo personalizada.
            </p>

            <div className="bg-white/5 border border-white/8 rounded-xl p-4 text-left mb-6 space-y-2">
              <p className="text-xs text-white/30 uppercase tracking-wide font-semibold mb-3">Tu solicitud</p>
              <div className="flex justify-between text-sm">
                <span className="text-white/40 font-light">Nombre</span>
                <span className="text-white font-medium">{name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/40 font-light">Empresa</span>
                <span className="text-white font-medium">{company || '—'}</span>
              </div>
            </div>

            <Link
              href="/"
              className="block w-full py-3 rounded-lg border border-white/15 text-white/50 hover:text-white hover:border-white/30 text-sm font-semibold transition-colors"
            >
              Volver al inicio
            </Link>
          </div>
        )}
      </div>

      <p className="text-xs text-white/20 mt-6 relative font-light">
        Builtek · hola@builtek.app
      </p>
    </div>
  )
}
