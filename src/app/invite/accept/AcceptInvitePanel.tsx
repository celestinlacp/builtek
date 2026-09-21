'use client'

import { useState } from 'react'
import { acceptInvite } from './actions'

interface Props {
  token: string
  workspaceName: string
  role: string
  isLoggedIn: boolean
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  member: 'Miembro',
  viewer: 'Visualizador',
}

export default function AcceptInvitePanel({ token, workspaceName, role, isLoggedIn }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAccept() {
    setLoading(true)
    setError(null)
    const result = await acceptInvite(token)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
    // On success, acceptInvite redirects to /dashboard
  }

  const loginUrl = `/login?next=${encodeURIComponent(`/invite/accept?token=${token}`)}`
  const signupUrl = `/signup?next=${encodeURIComponent(`/invite/accept?token=${token}`)}`

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 max-w-md w-full text-center">
        {/* Logo / brand */}
        <div className="w-14 h-14 bg-[#1A2744] rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-white font-bold text-xl">B</span>
        </div>

        <h1 className="text-2xl font-bold text-[#1A2744] mb-2">Tienes una invitación</h1>
        <p className="text-slate-500 text-sm mb-6">
          Te invitaron a unirte al workspace{' '}
          <span className="font-semibold text-[#1A2744]">{workspaceName}</span>{' '}
          como{' '}
          <span className="font-semibold text-[#00C2FF]">{ROLE_LABELS[role] ?? role}</span>.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        {isLoggedIn ? (
          <button
            onClick={handleAccept}
            disabled={loading}
            className="w-full bg-[#1A2744] hover:bg-[#223366] text-white font-semibold py-3 rounded-xl transition disabled:opacity-60"
          >
            {loading ? 'Aceptando...' : 'Aceptar invitación'}
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-slate-400 text-xs mb-4">
              Necesitas una cuenta para unirte al workspace.
            </p>
            <a
              href={signupUrl}
              className="block w-full bg-[#1A2744] hover:bg-[#223366] text-white font-semibold py-3 rounded-xl transition text-center"
            >
              Crear cuenta
            </a>
            <a
              href={loginUrl}
              className="block w-full border border-slate-200 hover:bg-slate-50 text-[#1A2744] font-semibold py-3 rounded-xl transition text-center"
            >
              Ya tengo cuenta — Iniciar sesión
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
