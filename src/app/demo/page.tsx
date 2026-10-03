'use client'

import { useState } from 'react'
import Link from 'next/link'

const MODULES = [
  { id: 'proyectos',  label: 'Gestión de Proyectos',            emoji: '✅' },
  { id: 'documental', label: 'Control Documental',              emoji: '📄' },
  { id: 'ai',         label: 'Agente AI (extracción de planos)', emoji: '🤖' },
  { id: 'whatsapp',   label: 'Notificaciones WhatsApp',         emoji: '💬' },
  { id: 'drive',      label: 'Drive (almacenamiento)',           emoji: '💾' },
  { id: 'oficios',    label: 'Módulo Oficios',                   emoji: '📋' },
]

const STEPS = ['Contacto', 'Módulos', 'Confirmado']

export default function DemoPage() {
  const [step, setStep] = useState(0)

  // Step 0 fields
  const [name, setName]       = useState('')
  const [phone, setPhone]     = useState('')
  const [email, setEmail]     = useState('')
  const [company, setCompany] = useState('')

  // Step 1 fields — priority per module: 1 | 2 | 3 | null
  const [priorities, setPriorities] = useState<Record<string, number | null>>(
    Object.fromEntries(MODULES.map(m => [m.id, null]))
  )

  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  function togglePriority(id: string, val: number) {
    setPriorities(p => ({ ...p, [id]: p[id] === val ? null : val }))
  }

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, company, priorities }),
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

  const step0Valid = name.trim() && phone.trim() && email.trim() && company.trim()
  const hasPriority = Object.values(priorities).some(v => v !== null)

  return (
    <div className="min-h-screen bg-[#0D1729] flex flex-col items-center justify-center p-6 relative overflow-hidden">
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
              i < step  ? 'bg-[#00C2FF] text-[#0D1729]' :
              i === step ? 'bg-white text-[#0D1729]' :
              'bg-white/10 text-white/30'
            }`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`text-xs font-medium ${i === step ? 'text-white' : 'text-white/30'}`}>{s}</span>
            {i < STEPS.length - 1 && (
              <div className={`w-8 h-0.5 mx-1 ${i < step ? 'bg-[#00C2FF]' : 'bg-white/10'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="bg-[#1A2744] border border-white/10 rounded-2xl p-8 w-full max-w-md relative shadow-2xl shadow-black/40">

        {/* ── Step 0 — Contacto ── */}
        {step === 0 && (
          <div>
            <h1 className="text-xl font-bold text-white mb-1">Solicita tu demo</h1>
            <p className="text-white/40 text-sm mb-6 font-light">Te contactamos en menos de 24 horas</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wide">Nombre completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Nombre completo"
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-[#00C2FF] focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wide">Celular</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+52 55 1234 5678"
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-[#00C2FF] focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wide">Correo electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@empresa.com"
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-[#00C2FF] focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wide">Empresa</label>
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
              disabled={!step0Valid}
              className="w-full mt-6 bg-[#00C2FF] text-[#0D1729] py-3 rounded-lg font-bold text-sm hover:bg-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Continuar →
            </button>

            <p className="text-center text-xs text-white/20 mt-4 font-light">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-[#00C2FF]/70 hover:text-[#00C2FF] underline">Inicia sesión</Link>
            </p>
          </div>
        )}

        {/* ── Step 1 — Módulos ── */}
        {step === 1 && (
          <div>
            <h1 className="text-xl font-bold text-white mb-1">¿Qué te interesa ver?</h1>
            <p className="text-white/40 text-sm mb-6 font-light">
              Asigna prioridad del <span className="text-[#00C2FF] font-semibold">1</span> (más urgente) al <span className="text-white/60 font-semibold">3</span> a los módulos que quieres explorar en la demo
            </p>

            <div className="space-y-2.5 mb-6">
              {MODULES.map(m => (
                <div key={m.id} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white/3 border border-white/8">
                  <span className="text-sm text-white/65 font-light flex items-center gap-2">
                    <span>{m.emoji}</span>
                    {m.label}
                  </span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {[1, 2, 3].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => togglePriority(m.id, val)}
                        className={`w-7 h-7 rounded-full text-xs font-bold transition-all ${
                          priorities[m.id] === val
                            ? val === 1 ? 'bg-[#00C2FF] text-[#0D1729]'
                            : val === 2 ? 'bg-[#00C2FF]/60 text-[#0D1729]'
                            : 'bg-[#00C2FF]/30 text-white'
                            : 'bg-white/8 text-white/25 hover:bg-white/15 hover:text-white/60'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-white/20 text-xs font-light mb-5">Este paso es opcional — puedes continuar sin seleccionar.</p>

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
                disabled={loading}
                className="flex-1 bg-[#00C2FF] text-[#0D1729] py-3 rounded-lg font-bold text-sm hover:bg-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {loading ? 'Enviando...' : 'Solicitar demo →'}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2 — Confirmado ── */}
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
                <span className="text-white font-medium">{company}</span>
              </div>
              {hasPriority && (
                <div className="pt-2 mt-2 border-t border-white/5">
                  <p className="text-white/30 text-xs font-light mb-2">Módulos de interés</p>
                  {MODULES.filter(m => priorities[m.id]).sort((a, b) => (priorities[a.id] ?? 9) - (priorities[b.id] ?? 9)).map(m => (
                    <div key={m.id} className="flex items-center gap-2 text-xs text-white/50 py-0.5">
                      <span className="w-5 h-5 rounded-full bg-[#00C2FF]/20 text-[#00C2FF] flex items-center justify-center font-bold text-[10px]">{priorities[m.id]}</span>
                      {m.label}
                    </div>
                  ))}
                </div>
              )}
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

      <div className="mt-6 relative text-center space-y-1">
        <p className="text-xs text-white/25 font-light">¿Prefieres contactarnos directamente?</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-xs">
          <a href="mailto:hola@menvio.app" className="text-[#00C2FF]/60 hover:text-[#00C2FF] transition-colors font-light">hola@menvio.app</a>
          <span className="text-white/15 hidden sm:block">·</span>
          <a href="tel:+524494481720" className="text-white/35 hover:text-white/60 transition-colors font-light">+52 449 448 1720</a>
        </div>
      </div>
    </div>
  )
}
