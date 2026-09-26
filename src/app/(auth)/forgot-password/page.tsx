'use client'

import { useState } from 'react'
import Link from 'next/link'
import { forgotPassword } from '../actions'

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await forgotPassword(email)
    setLoading(false)
    if (result?.error) {
      setError(result.error)
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">✉️</span>
        </div>
        <h1 className="text-2xl font-bold text-[#1A2744] mb-2">Revisa tu correo</h1>
        <p className="text-slate-500 text-sm mb-6">
          Te enviamos un link a <span className="font-semibold text-slate-700">{email}</span> para restablecer tu contraseña.
        </p>
        <p className="text-xs text-slate-400 mb-6">
          Si no ves el correo, revisa tu carpeta de spam.
        </p>
        <Link href="/login" className="text-[#00C2FF] font-semibold text-sm hover:underline">
          Volver al login
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1A2744] mb-1">¿Olvidaste tu contraseña?</h1>
      <p className="text-slate-500 text-sm mb-8">
        Ingresa tu correo y te enviaremos un link para restablecerla.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
            Correo electrónico
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="tu@correo.com"
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
          disabled={loading || !email}
          className="w-full bg-[#1A2744] text-white py-3 rounded-lg font-semibold text-sm hover:bg-[#243660] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Enviando...' : 'Enviar link de recuperación'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        <Link href="/login" className="text-[#00C2FF] font-semibold hover:underline">
          Volver al login
        </Link>
      </p>
    </div>
  )
}
