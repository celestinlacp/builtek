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
    .select('role, workspace_id')
    .eq('user_id', user.id)
    .single()

  const isOwner = membership?.role === 'owner'

  if (!isOwner) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1A2744] flex items-center gap-2">
            <Bot className="w-6 h-6 text-[#00C2FF]" />
            Cota
            <span className="text-[10px] bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full font-bold ml-1">PRÓXIMAMENTE</span>
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Motor de conocimiento técnico por proyecto
          </p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-16 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-[#1A2744] to-[#00C2FF]/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-[#00C2FF]" />
          </div>
          <h2 className="text-xl font-bold text-[#1A2744] mb-2">Cota · Próximamente</h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
            Extracción de metrados, motor RAG de conocimiento técnico y análisis de inconsistencias.
            Disponible pronto para todos los usuarios.
          </p>
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-300">
            <Lock className="w-3.5 h-3.5" />
            Acceso restringido durante el periodo de pruebas
          </div>
        </div>
      </div>
    )
  }

  const wsId = membership.workspace_id

  // Proyectos del workspace (solo raíz)
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, builtek_id')
    .eq('workspace_id', wsId)
    .is('parent_project_id', null)
    .order('name')

  // Documentos PDF con archivo en R2
  const { data: documents } = await supabase
    .from('documents')
    .select('id, doc_key, file_name, project_id, doc_type, mic_version, specialty:specialties(code, name)')
    .eq('workspace_id', wsId)
    .eq('is_current', true)
    .not('storage_key', 'is', null)
    .order('doc_key')

  const pdfDocs = (documents ?? []).filter(d =>
    d.file_name?.toLowerCase().endsWith('.pdf') || d.doc_type
  )

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A2744] flex items-center gap-2">
          <Bot className="w-6 h-6 text-[#00C2FF]" />
          Cota
          <span className="text-[10px] bg-[#00C2FF] text-[#1A2744] px-2 py-0.5 rounded-full font-bold ml-1">AI</span>
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Agente de inteligencia artificial especializado en proyectos de construcción AEC
        </p>
      </div>

      {/* ── Intro card ── */}
      <div className="bg-gradient-to-br from-[#1A2744] to-[#243660] rounded-2xl p-6 mb-6 text-white">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-[#00C2FF]/20 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-[#00C2FF]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-white mb-1">¿Qué es Cota?</p>
            <p className="text-sm text-white/70 leading-relaxed mb-4">
              Cota lee los planos técnicos de tus proyectos y extrae automáticamente los metrados —
              cantidades, materiales y especificaciones — acumulando conocimiento que mejora con cada revisión.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { num: '01', title: 'Extracción', desc: 'Lee planos PDF y extrae metrados por especialidad automáticamente.' },
                { num: '02', title: 'Aprende', desc: 'Cada corrección aprobada entrena a Cota para ser más preciso en tu proyecto.' },
                { num: '03', title: 'Consultar', desc: 'Pregunta en lenguaje natural sobre las cantidades acumuladas del proyecto.' },
              ].map(f => (
                <div key={f.num} className="bg-white/10 rounded-xl px-4 py-3">
                  <span className="text-[10px] font-black text-[#00C2FF] tracking-widest">{f.num}</span>
                  <p className="text-sm font-bold text-white mt-0.5">{f.title}</p>
                  <p className="text-[11px] text-white/60 mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AiAgentPanel
        projects={projects ?? []}
        documents={pdfDocs as any}
        workspaceId={wsId}
      />
    </div>
  )
}
