'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const supabase     = createClient()

  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [loading,   setLoading]   = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const [done,      setDone]      = useState(false)
  const [showPwd,   setShowPwd]   = useState(false)

  // Intercambiar token_hash por sesión activa
  useEffect(() => {
    async function verifyToken() {
      const token_hash = searchParams.get('token_hash')
      const type       = searchParams.get('type')

      if (token_hash && type === 'recovery') {
        const { error } = await supabase.auth.verifyOtp({ token_hash, type: 'recovery' })
        if (error) {
          setError('El link expiró o ya fue usado. Solicita uno nuevo.')
        }
      } else {
        // Supabase puede enviar el token como hash en la URL (#access_token=...)
        // El cliente de Supabase lo procesa automáticamente al cargar
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          setError('Link inválido o expirado. Solicita uno nuevo.')
        }
      }
      setVerifying(false)
    }
    verifyToken()
  }, [searchParams, supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return }
    if (password.length < 6)  { setError('La contraseña debe tener al menos 6 caracteres.'); return }

    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setDone(true)
      setTimeout(() => router.push('/dashboard'), 2500)
    }
  }

  if (verifying) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-2 border-[#00C2FF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-500">Verificando link...</p>
      </div>
    )
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">✅</span>
        </div>
        <h1 className="text-2xl font-bold text-[#1A2744] mb-2">Contraseña actualizada</h1>
        <p className="text-slate-500 text-sm">Redirigiendo a tu workspace...</p>
      </div>
    )
  }

  if (error && !password) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🔗</span>
        </div>
        <h1 className="text-xl font-bold text-[#1A2744] mb-2">Link inválido</h1>
        <p className="text-slate-500 text-sm mb-6">{error}</p>
        <Link href="/forgot-password"
          className="inline-block bg-[#1A2744] text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#243660] transition-colors">
          Solicitar nuevo link
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1A2744] mb-1">Nueva contraseña</h1>
      <p className="text-slate-500 text-sm mb-8">Elige una contraseña segura para tu cuenta.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
            Nueva contraseña
          </label>
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full px-4 py-3 pr-12 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF] focus:border-transparent transition-all"
            />
            <button type="button" onClick={() => setShowPwd(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 px-1">
              {showPwd ? 'Ocultar' : 'Ver'}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
            Confirmar contraseña
          </label>
          <input
            type={showPwd ? 'text' : 'password'}
            required
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Repite la contraseña"
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
          disabled={loading || !password || !confirm}
          className="w-full bg-[#1A2744] text-white py-3 rounded-lg font-semibold text-sm hover:bg-[#243660] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
        </button>
      </form>
    </div>
  )
}
