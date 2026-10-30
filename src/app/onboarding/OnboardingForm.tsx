'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
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

const STEPS = ['Empresa', 'Equipo', 'Proyecto', 'Listo']

const slideVariants = {
  enter: { x: 300, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -300, opacity: 0 },
}

function suggestCode(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return ''
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase()
  return words.map(w => w[0]).join('').toUpperCase().slice(0, 5)
}

export default function OnboardingForm() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)

  // Step 0 — Empresa
  const [workspaceName, setWorkspaceName] = useState('')
  const [industry, setIndustry] = useState('')

  // Step 1 — Equipo
  const [teamSize, setTeamSize] = useState('')

  // Step 2 — Proyecto
  const [projectName, setProjectName] = useState('')
  const [projectCode, setProjectCode] = useState('')
  const [projectImageFile, setProjectImageFile] = useState<File | null>(null)
  const [projectImagePreview, setProjectImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Global
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function goTo(nextStep: number) {
    setDirection(nextStep > step ? 1 : -1)
    setStep(nextStep)
  }

  function handleProjectNameChange(val: string) {
    setProjectName(val)
    setProjectCode(suggestCode(val))
  }

  function handleCodeChange(val: string) {
    setProjectCode(val.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5))
  }

  const isCodeValid = /^[A-Z]{3,5}$/.test(projectCode)

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setProjectImageFile(file)
    if (file) {
      const reader = new FileReader()
      reader.onload = ev => setProjectImagePreview(ev.target?.result as string)
      reader.readAsDataURL(file)
    } else {
      setProjectImagePreview(null)
    }
  }

  async function handleFinish() {
    setLoading(true)
    setError(null)

    // Upload image to Supabase Storage if provided
    let coverImageUrl: string | null = null

    if (projectImageFile) {
      try {
        // We need the workspace_id but we don't have it yet. Upload with a temp path
        // and we'll use the workspace_id after creation. Per spec: upload before calling
        // the action. We'll use a temp user-keyed path.
        const ext = projectImageFile.name.split('.').pop() ?? 'jpg'
        const tempPath = `temp/${Date.now()}.${ext}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('project-covers')
          .upload(tempPath, projectImageFile, { upsert: true })

        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage
            .from('project-covers')
            .getPublicUrl(uploadData.path)
          coverImageUrl = urlData.publicUrl
        }
        // If upload fails: continue with coverImageUrl = null (per spec)
      } catch {
        // Non-blocking — bucket may not exist yet
      }
    }

    const formData = new FormData()
    formData.set('workspace_name', workspaceName)
    if (projectName) formData.set('project_name', projectName)
    if (projectCode) formData.set('project_code', projectCode)
    if (coverImageUrl) formData.set('cover_image_url', coverImageUrl)

    try {
      const result = await createWorkspace(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Error inesperado al crear el workspace')
    } finally {
      setLoading(false)
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
      <div className="w-full max-w-md mb-8">
        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-3">
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

        {/* Animated progress bar */}
        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#1A2744] to-[#00C2FF] rounded-full"
            animate={{ width: `${((step) / (STEPS.length - 1)) * 100}%` }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          />
        </div>
      </div>

      {/* Card with animated steps */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 w-full max-w-md overflow-hidden relative">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >

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
                    placeholder="Ej: Constructora Pérez, Grupo Arco Norte..."
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
                  onClick={() => goTo(1)}
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
                    onClick={() => goTo(0)}
                    className="flex-1 py-3 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    ← Atrás
                  </button>
                  <button
                    onClick={() => goTo(2)}
                    disabled={!teamSize}
                    className="flex-1 bg-[#1A2744] text-white py-3 rounded-lg font-semibold text-sm hover:bg-[#243660] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Continuar →
                  </button>
                </div>
              </div>
            )}

            {/* Step 2 — Primer proyecto */}
            {step === 2 && (
              <div>
                <h1 className="text-xl font-bold text-[#1A2744] mb-1">Tu primer proyecto</h1>
                <p className="text-slate-500 text-sm mb-6">Dale nombre a la obra o proyecto que gestionarás</p>

                <div className="space-y-4 mb-6">
                  {/* Nombre del proyecto */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                      Nombre del proyecto <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={e => handleProjectNameChange(e.target.value)}
                      placeholder="Ej: Puente Río Bravo, Torre Reforma Norte..."
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF] focus:border-transparent"
                    />
                  </div>

                  {/* Código corto */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                      Código corto (3–5 letras)
                    </label>
                    <input
                      type="text"
                      value={projectCode}
                      onChange={e => handleCodeChange(e.target.value)}
                      placeholder="PRB"
                      maxLength={5}
                      className={`w-full px-4 py-3 rounded-lg border text-sm font-mono focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                        projectCode && !isCodeValid
                          ? 'border-red-300 focus:ring-red-200 bg-red-50'
                          : 'border-slate-200 focus:ring-[#00C2FF]'
                      }`}
                    />
                    {projectCode && !isCodeValid && (
                      <p className="text-xs text-red-500 mt-1">Solo letras mayúsculas, entre 3 y 5 caracteres</p>
                    )}
                  </div>

                  {/* Imagen de portada */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                      Imagen de portada (opcional)
                    </label>
                    {projectImagePreview ? (
                      <div className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={projectImagePreview}
                          alt="Preview"
                          className="w-full h-32 object-cover rounded-lg border border-slate-200"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setProjectImageFile(null)
                            setProjectImagePreview(null)
                            if (fileInputRef.current) fileInputRef.current.value = ''
                          }}
                          className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-white rounded-full text-xs flex items-center justify-center hover:bg-black/70 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-20 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-[#00C2FF] hover:text-[#00C2FF] transition-colors text-xs font-medium"
                      >
                        <span className="text-2xl">📷</span>
                        <span>Subir foto de la obra</span>
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => goTo(1)}
                    className="flex-1 py-3 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    ← Atrás
                  </button>
                  <button
                    onClick={() => goTo(3)}
                    disabled={!projectName.trim() || (projectCode.length > 0 && !isCodeValid)}
                    className="flex-1 bg-[#1A2744] text-white py-3 rounded-lg font-semibold text-sm hover:bg-[#243660] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Continuar →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3 — Listo */}
            {step === 3 && (
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
                  {projectName && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Proyecto</span>
                      <span className="font-medium text-slate-700">
                        {projectName}{projectCode ? ` (${projectCode})` : ''}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Plan</span>
                    <span className="font-medium text-green-600">Trial 14 días — plan Obra</span>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600 mb-4 text-left">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => goTo(2)}
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

          </motion.div>
        </AnimatePresence>
      </div>

      <p className="text-xs text-slate-400 mt-6">
        Puedes cambiar estos datos después en Configuración
      </p>
    </div>
  )
}
