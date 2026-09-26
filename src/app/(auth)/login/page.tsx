'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { login } from '../actions'

const STORAGE_KEY = 'builtek_saved_credentials'
const DEFAULT_EMAIL = 'celestinlacp@gmail.com'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState(DEFAULT_EMAIL)
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)

  // Cargar credenciales guardadas al montar
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const { email: savedEmail, password: savedPassword } = JSON.parse(saved)
        if (savedEmail) setEmail(savedEmail)
        if (savedPassword) setPassword(savedPassword)
        setRemember(true)
      }
    } catch {}
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (remember) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ email, password }))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }

    // Dev bypass — revertir cuando Supabase vuelva
    if (process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') {
      router.push('/dashboard')
      return
    }

    const formData = new FormData()
    formData.set('email', email)
    formData.set('password', password)

    const result = await login(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1A2744] mb-1">Iniciar sesión</h1>
      <p className="text-slate-500 text-sm mb-8">Accede a tu workspace de Builtek</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
            Correo electrónico
          </label>
          <input
            name="email"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
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
            required={process.env.NEXT_PUBLIC_BYPASS_AUTH !== 'true'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF] focus:border-transparent transition-all"
          />
        </div>

        <div className="flex items-center justify-between">
          <Link href="/forgot-password" className="text-xs text-[#00C2FF] hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="remember"
            type="checkbox"
            checked={remember}
            onChange={e => setRemember(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-[#00C2FF] accent-[#1A2744] cursor-pointer"
          />
          <label htmlFor="remember" className="text-sm text-slate-500 cursor-pointer select-none">
            Recordar mis datos
          </label>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
            {error === 'Invalid login credentials'
              ? 'Correo o contraseña incorrectos'
              : error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#1A2744] text-white py-3 rounded-lg font-semibold text-sm hover:bg-[#243660] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        ¿No tienes cuenta?{' '}
        <Link href="/register" className="text-[#00C2FF] font-semibold hover:underline">
          Regístrate gratis
        </Link>
      </p>
    </div>
  )
}
