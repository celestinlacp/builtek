'use client'

import { useState, useEffect } from 'react'
import { X, Link2, Copy, Check, RefreshCw, Loader2, Clock, AlertTriangle } from 'lucide-react'
import { getProjectShare, upsertProjectShare } from './actions'

interface ShareData {
  token: string
  expires_at: string
  created_at: string
}

export function ShareProjectModal({
  projectId,
  projectName,
  onClose,
}: {
  projectId: string
  projectName: string
  onClose: () => void
}) {
  const [share, setShare]         = useState<ShareData | null>(null)
  const [loading, setLoading]     = useState(true)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied]       = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : 'https://builtek.app'

  useEffect(() => {
    getProjectShare(projectId).then(data => {
      setShare(data)
      setLoading(false)
    })
  }, [projectId])

  const shareUrl  = share ? `${baseUrl}/share/${share.token}` : null
  const expiresAt = share ? new Date(share.expires_at) : null
  const isExpired = expiresAt ? expiresAt < new Date() : false

  async function handleGenerate() {
    setGenerating(true)
    setError(null)
    const result = await upsertProjectShare(projectId)
    setGenerating(false)
    if ('error' in result) {
      setError(result.error ?? null)
    } else {
      setShare({ token: result.token, expires_at: result.expiresAt, created_at: new Date().toISOString() })
    }
  }

  async function handleCopy() {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatDate = (d: Date) =>
    d.toLocaleString('es-MX', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#00C2FF]/10 rounded-xl flex items-center justify-center">
              <Link2 className="w-5 h-5 text-[#00C2FF]" />
            </div>
            <div>
              <h3 className="font-bold text-[#1A2744] text-sm">Compartir proyecto</h3>
              <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[220px]">{projectName}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">

            {share && !isExpired ? (
              <>
                {/* Link activo */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Link activo</p>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={shareUrl || ''}
                      className="flex-1 text-xs text-slate-600 bg-transparent outline-none truncate font-mono min-w-0"
                    />
                    <button onClick={handleCopy}
                      className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 hover:border-[#00C2FF] transition-colors">
                      {copied
                        ? <Check className="w-3.5 h-3.5 text-green-500" />
                        : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    </button>
                  </div>
                </div>

                {/* Expiración */}
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  <span>Expira el <strong className="text-slate-700">{formatDate(expiresAt!)}</strong></span>
                </div>

                {/* Regenerar */}
                <button onClick={handleGenerate} disabled={generating}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50">
                  {generating
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <RefreshCw className="w-3.5 h-3.5" />}
                  Regenerar link (cancela el actual)
                </button>
              </>
            ) : (
              <>
                {share && isExpired && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100 text-xs text-amber-700">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    Link expiró el {formatDate(expiresAt!)}
                  </div>
                )}

                {!share && (
                  <div className="text-center py-2">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Link2 className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-sm text-slate-500 font-medium">Sin link activo</p>
                    <p className="text-xs text-slate-400 mt-1">Genera uno para compartir los archivos del proyecto</p>
                  </div>
                )}

                <button onClick={handleGenerate} disabled={generating}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1A2744] text-white text-sm font-bold hover:bg-[#243660] transition-colors disabled:opacity-50">
                  {generating
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Link2 className="w-4 h-4" />}
                  Generar link (válido 24h)
                </button>
              </>
            )}

            {error && (
              <p className="text-xs text-red-500 text-center">{error}</p>
            )}

            <p className="text-[10px] text-slate-400 text-center leading-relaxed">
              El link da acceso de solo lectura a los archivos del proyecto.<br />
              No requiere cuenta. Cualquier persona con el link puede ver y descargar.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
