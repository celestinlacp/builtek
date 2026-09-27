import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BookOpen } from 'lucide-react'
// mesas are now hardcoded in EspecificacionesPanel — no mic_nomenclatures fetch needed
import EspecificacionesPanel from './EspecificacionesPanel'

export default async function EspecificacionesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id, role')
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/onboarding')
  const wsId     = membership.workspace_id
  const userRole = membership.role as string

  const [specsRes, companiesRes, oficiosRes] = await Promise.all([
    supabase
      .from('design_specs')
      .select('*, company:companies(name, short_name), oficio:oficios(no_oficio, asunto)')
      .eq('workspace_id', wsId)
      .order('created_at', { ascending: false }),
    supabase
      .from('companies')
      .select('id, name, short_name')
      .eq('workspace_id', wsId)
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('oficios')
      .select('id, no_oficio, asunto, remitente')
      .eq('workspace_id', wsId)
      .eq('tipo', 'entrada')
      .order('created_at', { ascending: false })
      .limit(200),
  ])

  const specs     = specsRes.data     || []
  const companies = companiesRes.data || []
  const oficios   = oficiosRes.data   || []

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2744] flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#00C2FF]" />
            Especificaciones de Diseño
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Documentos técnicos emitidos por mesas de especialistas
          </p>
        </div>
      </div>

      <EspecificacionesPanel
        specs={specs as any}
        companies={companies as any}
        oficios={oficios as any}
        workspaceId={wsId}
        userRole={userRole}
      />
    </div>
  )
}
