'use client'

import { useRef, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updateProfile, updatePassword } from './actions'
import { Camera, Check, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react'

type Toast = { type: 'success' | 'error'; message: string }

function useToast() {
  const [toast, setToast] = useState<Toast | null>(null)
  const show = (t: Toast) => {
    setToast(t)
    setTimeout(() => setToast(null), 3500)
  }
  return { toast, show }
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
}

export default function ProfileForm({
  userId,
  email,
  initialName,
  initialPhone,
  initialAvatarUrl,
}: {
  userId: string
  email: string
  initialName: string
  initialPhone: string
  initialAvatarUrl: string
}) {
  const { toast, show } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Profile fields
  const [name, setName]           = useState(initialName)
  const [phone, setPhone]         = useState(initialPhone)
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl)
  const [uploading, setUploading] = useState(false)
  const [profilePending, startProfileTransition] = useTransition()

  // Password fields
  const [newPass, setNewPass]         = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [showNew, setShowNew]         = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [passPending, startPassTransition] = useTransition()

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${userId}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      setAvatarUrl(publicUrl)

      // Persist immediately
      const res = await updateProfile({ full_name: name, phone, avatar_url: publicUrl })
      if (res?.error) throw new Error(res.error)
      show({ type: 'success', message: 'Avatar actualizado' })
    } catch (err: any) {
      show({ type: 'error', message: err?.message ?? 'Error al subir imagen' })
    } finally {
      setUploading(false)
    }
  }

  function handleProfileSave() {
    if (!name.trim()) {
      show({ type: 'error', message: 'El nombre no puede estar vacío' })
      return
    }
    startProfileTransition(async () => {
      const res = await updateProfile({ full_name: name, phone, avatar_url: avatarUrl || undefined })
      if (res?.error) show({ type: 'error', message: res.error })
      else show({ type: 'success', message: 'Perfil actualizado correctamente' })
    })
  }

  function handlePasswordSave() {
    if (newPass.length < 6) {
      show({ type: 'error', message: 'La contraseña debe tener al menos 6 caracteres' })
      return
    }
    if (newPass !== confirmPass) {
      show({ type: 'error', message: 'Las contraseñas no coinciden' })
      return
    }
    startPassTransition(async () => {
      const res = await updatePassword(newPass)
      if (res?.error) show({ type: 'error', message: res.error })
      else {
        show({ type: 'success', message: 'Contraseña actualizada correctamente' })
        setNewPass('')
        setConfirmPass('')
      }
    })
  }

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium border ${
          toast.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {toast.type === 'success'
            ? <Check className="w-4 h-4 flex-shrink-0" />
            : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          {toast.message}
        </div>
      )}

      {/* ── Avatar + Info ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-sm font-bold text-[#1A2744] mb-5">Información personal</h2>

        {/* Avatar */}
        <div className="flex items-center gap-5 mb-6">
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-100"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-[#1A2744] flex items-center justify-center">
                <span className="text-[#00C2FF] text-xl font-bold">{getInitials(name || email)}</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-2 -right-2 w-7 h-7 bg-[#00C2FF] rounded-lg flex items-center justify-center hover:bg-[#00A8E0] transition-colors shadow-sm disabled:opacity-50"
            >
              {uploading
                ? <Loader2 className="w-3.5 h-3.5 text-[#1A2744] animate-spin" />
                : <Camera className="w-3.5 h-3.5 text-[#1A2744]" />}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">{name || 'Sin nombre'}</p>
            <p className="text-xs text-slate-400 mt-0.5">{email}</p>
            <p className="text-[10px] text-slate-400 mt-1">JPG, PNG o WebP · Máx 2 MB</p>
          </div>
        </div>

        {/* Name */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Nombre completo
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Tu nombre completo"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40 focus:border-[#00C2FF] transition-all"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Teléfono celular
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="Ej: +52 442 123 4567"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40 focus:border-[#00C2FF] transition-all"
            />
            <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
              <span className="text-green-500">💬</span>
              Tu número nos permite enviarte recordatorios de tareas por WhatsApp.
            </p>
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-3.5 py-2.5 text-sm bg-slate-100 border border-slate-200 rounded-xl text-slate-400 cursor-not-allowed"
            />
            <p className="text-[10px] text-slate-400 mt-1">El correo no se puede cambiar desde aquí.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleProfileSave}
          disabled={profilePending}
          className="mt-5 px-5 py-2.5 bg-[#1A2744] text-white text-sm font-semibold rounded-xl hover:bg-[#243660] disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {profilePending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Guardar cambios
        </button>
      </div>

      {/* ── Contraseña ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-sm font-bold text-[#1A2744] mb-1">Cambiar contraseña</h2>
        <p className="text-xs text-slate-400 mb-5">Mínimo 6 caracteres</p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nueva contraseña</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 pr-10 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40 focus:border-[#00C2FF] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowNew(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Confirmar contraseña</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPass}
                onChange={e => setConfirmPass(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 pr-10 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40 focus:border-[#00C2FF] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPass && newPass !== confirmPass && (
              <p className="text-[10px] text-red-500 mt-1">Las contraseñas no coinciden</p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handlePasswordSave}
          disabled={passPending || !newPass || !confirmPass}
          className="mt-5 px-5 py-2.5 bg-slate-700 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 disabled:opacity-40 transition-colors flex items-center gap-2"
        >
          {passPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Cambiar contraseña
        </button>
      </div>
    </div>
  )
}
