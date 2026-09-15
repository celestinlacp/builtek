import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Bot } from 'lucide-react'
import AiAgentPanel from './AiAgentPanel'

export default async function AiAgentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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
