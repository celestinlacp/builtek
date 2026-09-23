'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { register } from '../actions'

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    if (formData.get('password') !== formData.get('confirm_password')) {
      setError('Las contraseñas no coinciden')
      setLoading(false)
      return
    }
    const result = await register(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else if (result?.needsConfirmation) {
      setNeedsConfirmation(true)
      setLoading(false)
    } else {
      router.push(next || '/onboarding')
      router.refresh()
    }
  }

  if (needsConfirmation) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 bg-[#1A2744] rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-white font-bold text-xl">B</span>
        </div>
        <h1 className="text-2xl font-bold text-[#1A2744] mb-2">Revisa tu correo</h1>
        <p className="text-slate-500 text-sm">
          Te enviamos un link de confirmación. Al hacer clic en él serás redirigido automáticamente para completar tu registro.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1A2744] mb-1">Crear cuenta</h1>
      <p className="text-slate-500 text-sm mb-8">Comienza gratis — sin tarjeta de crédito</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="hidden" name="next" value={next || '/onboarding'} />
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
            Nombre completo
          </label>
          <input
            name="full_name"
            type="text"
            required
            placeholder="Juan Pérez"
            className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF] focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
            Correo electrónico
          </label>
          <input
            name="email"
            type="email"
            required
            placeholder="tu@empresa.com"
            className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF] focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
            Contraseña
          </label>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="Mínimo 8 caracteres"
            className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF] focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
            Confirmar contraseña
          </label>
          <input
            name="confirm_password"
            type="password"
            required
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF] focus:border-transparent transition-all"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#1A2744] text-white py-3 rounded-lg font-semibold text-sm hover:bg-[#243660] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Creando cuenta...' : 'Crear cuenta gratis'}
        </button>
      </form>

      <p className="text-center text-xs text-slate-400 mt-4">
        Al registrarte aceptas nuestros{' '}
        <span className="text-slate-500 underline cursor-pointer">Términos de uso</span>
      </p>

      <p className="text-center text-sm text-slate-500 mt-4">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="text-[#00C2FF] font-semibold hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  )
}
