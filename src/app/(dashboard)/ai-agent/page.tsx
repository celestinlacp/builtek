import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Bot, Sparkles, Lock } from 'lucide-react'
import AiAgentPanel from './AiAgentPanel'

export default async function AiAgentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('user_id', user.id)
    .single()

  const isOwner = membership?.role === 'owner'

  if (!isOwner) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1A2744] flex items-center gap-2">
            <Bot className="w-6 h-6 text-[#00C2FF]" />
            Agente AI
            <span className="text-[10px] bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full font-bold ml-1">PRÓXIMAMENTE</span>
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Extracción automática de metrados estructurales, geométricos e hidráulicos
          </p>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-16 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-[#1A2744] to-[#00C2FF]/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-[#00C2FF]" />
          </div>
          <h2 className="text-xl font-bold text-[#1A2744] mb-2">Agente AI · Próximamente</h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
            Esta funcionalidad está en desarrollo y estará disponible pronto para todos los usuarios.
            Por ahora solo está habilitada para el equipo de Builtek.
          </p>
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-300">
            <Lock className="w-3.5 h-3.5" />
            Acceso restringido durante el periodo de pruebas
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A2744] flex items-center gap-2">
          <Bot className="w-6 h-6 text-[#00C2FF]" />
          Agente AI
          <span className="text-[10px] bg-[#00C2FF] text-[#1A2744] px-2 py-0.5 rounded-full font-bold ml-1">CLAUDE</span>
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Sube un plano PDF — Claude extrae metrados estructurales, geométricos e hidráulicos automáticamente
        </p>
      </div>

      <AiAgentPanel />
    </div>
  )
}
