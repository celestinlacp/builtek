import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BookOpen } from 'lucide-react'
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

  const [specsRes, mesasRes, companiesRes, oficiosModalRes, oficiosRefRes, projectsRes] = await Promise.all([
    // Especificaciones de diseño
    supabase
      .from('design_specs')
      .select('*, company:companies(name, short_name), oficio:oficios(no_oficio, asunto)')
      .eq('workspace_id', wsId)
      .order('created_at', { ascending: false }),
    // Mesas = nomenclaturas ESPECIALIDAD del workspace (fuente de verdad)
    supabase
      .from('mic_nomenclatures')
      .select('id, code, name, sort_order')
      .eq('workspace_id', wsId)
      .eq('segment', 'ESPECIALIDAD')
      .eq('is_active', true)
      .order('sort_order')
      .order('name'),
    // Empresas para modal de nueva spec
    supabase
      .from('companies')
      .select('id, name, short_name')
      .eq('workspace_id', wsId)
      .eq('is_active', true)
      .order('name'),
    // Oficios entrada para vincular a una spec (modal upload)
    supabase
      .from('oficios')
      .select('id, no_oficio, asunto, remitente')
      .eq('workspace_id', wsId)
      .eq('tipo', 'entrada')
      .order('created_at', { ascending: false })
      .limit(200),
    // Todos los oficios con especialidad asignada (para mostrar en carpetas de mesa)
    supabase
      .from('oficios')
      .select('id, tipo, no_oficio, asunto, especialidad, tema, estado, fecha_documento, remitente, destinatario, storage_key, proyecto_id')
      .eq('workspace_id', wsId)
      .not('especialidad', 'is', null)
      .order('fecha_documento', { ascending: false }),
    // Proyectos activos (para filtro en sección de oficios por mesa)
    supabase
      .from('projects')
      .select('id, name')
      .eq('workspace_id', wsId)
      .eq('status', 'active')
      .order('name'),
  ])

  const specs       = specsRes.data       || []
  const mesas       = mesasRes.data       || []
  const companies   = companiesRes.data   || []
  const oficios     = oficiosModalRes.data || []
  const oficiosRef  = oficiosRefRes.data  || []
  const projects    = projectsRes.data    || []

  // Anexos para oficiosRef
  const oficioRefIds = oficiosRef.map((o: any) => o.id)
  const anexosRes = oficioRefIds.length > 0
    ? await supabase
        .from('oficio_anexos')
        .select('id, oficio_id, tipo, nombre, url, storage_key, file_name, file_size')
        .in('oficio_id', oficioRefIds)
    : { data: [] }
  const anexos = anexosRes.data || []

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2744] flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#00C2FF]" />
            Especificaciones de Diseño
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Documentos técnicos y oficios por mesa de especialistas
          </p>
        </div>
      </div>

      <EspecificacionesPanel
        specs={specs as any}
        mesas={mesas as any}
        companies={companies as any}
        oficios={oficios as any}
        oficiosRef={oficiosRef as any}
        projects={projects as any}
        anexos={anexos as any}
        workspaceId={wsId}
        userRole={userRole}
      />
    </div>
  )
}
